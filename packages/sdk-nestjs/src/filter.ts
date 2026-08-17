import { captureException } from "@argusdev/sdk-node";

/*
 * Structural mirrors of the Nest interfaces we touch — just the members we
 * read, so @nestjs/* stays out of package.json entirely (the sdk-node express
 * middleware / sdk-angular ErrorHandler trick, again). Works with both the
 * Express and Fastify adapters.
 */
interface HttpArgumentsHostLike {
  getRequest(): RequestLike;
  getResponse(): ResponseLike;
}

interface ArgumentsHostLike {
  switchToHttp(): HttpArgumentsHostLike;
}

interface RequestLike {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/* express: res.status(c).json(b) — fastify: reply.status(c).send(b) */
interface ResponseLike {
  status(code: number): ResponseLike;
  json?(body: unknown): unknown;
  send?(body: unknown): unknown;
}

/* Nest's HttpException, detected by shape rather than instanceof — instanceof
   breaks the moment two @nestjs/common copies coexist in one node_modules */
interface HttpExceptionLike {
  getStatus(): number;
  getResponse(): string | object;
  message?: string;
}

function isHttpException(exception: unknown): exception is HttpExceptionLike {
  return (
    typeof exception === "object" &&
    exception !== null &&
    typeof (exception as HttpExceptionLike).getStatus === "function" &&
    typeof (exception as HttpExceptionLike).getResponse === "function"
  );
}

/*
 * The Nest hook. Nest catches every route/guard/pipe/interceptor error and
 * resolves it to a response — errors never escape to sdk-node's process
 * handlers, so a global exception filter is the only reliable hook:
 *
 *   // main.ts
 *   import { init, ArgusExceptionFilter } from "@argusdev/sdk-nestjs";
 *
 *   init({ dsn: process.env.ARGUS_DSN!, environment: "production" });
 *
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new ArgusExceptionFilter());
 *
 * Two deliberate choices:
 *   1. No @Catch() decorator, no @nestjs/common import. Nest reads the
 *      catch-scope metadata off the instance's constructor; when there is
 *      none, the filter is treated as catch-all — which is exactly what we
 *      want, without coupling to Nest's decorator machinery.
 *   2. What gets REPORTED is filtered: plain thrown errors always, but
 *      HttpExceptions only at status >= 500. A NotFoundException or a
 *      validation 400 is control flow, not a crash — capturing every 4xx
 *      would bury real Issues in noise.
 *
 * The filter owns the response (that's what a Nest filter is), so it
 * re-implements Nest's small default: HttpException → its own status/body,
 * anything else → 500 { statusCode, message: "Internal server error" }.
 * Behavior your clients see is unchanged.
 */
export class ArgusExceptionFilter {
  catch(exception: unknown, host: ArgumentsHostLike): void {
    const http = host.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    const httpException = isHttpException(exception) ? exception : null;
    const status = httpException ? httpException.getStatus() : 500;

    /* report crashes, not control flow */
    if (!httpException || status >= 500) {
      const tags: Record<string, string> = { httpStatus: String(status) };
      const rawUserAgent = request.headers?.["user-agent"];
      const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;

      void captureException(exception, {
        tags,
        request: {
          method: request.method,
          url: request.url,
          /* cookies/authorization live in the same object — never forwarded */
          ...(userAgent ? { headers: { "user-agent": userAgent } } : {}),
        },
      });

      /* Nest's default handler logs unknown exceptions; providing our own
         silences that. Put it back — we observe, never absorb. */
      console.error(exception);
    }

    /* respond exactly like Nest's default filter would */
    const body = httpException
      ? normalizeBody(httpException.getResponse(), status)
      : { statusCode: 500, message: "Internal server error" };

    const started = response.status(status);
    if (typeof started.json === "function") {
      started.json(body); /* express */
    } else if (typeof started.send === "function") {
      started.send(body); /* fastify */
    }
  }
}

/* Nest convention: a string response becomes { statusCode, message } */
function normalizeBody(raw: string | object, status: number): object {
  return typeof raw === "string" ? { statusCode: status, message: raw } : raw;
}
