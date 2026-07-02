import { captureException } from "./init";

/* structural types — just the fields we read, so express isn't a dependency */
interface RequestLike {
  method?: string;
  originalUrl?: string;
  url?: string;
}

/*
 * Usage (LAST middleware, after routes):
 *   app.use(argusErrorHandler());
 *
 * Captures the error with request context, then passes it along so the
 * app's own error handler still responds to the user. We observe, never absorb.
 */
export function argusErrorHandler() {
  return (
    err: unknown,
    req: RequestLike,
    _res: unknown,
    next: (err?: unknown) => void,
  ): void => {
    void captureException(err, {
      request: {
        method: req.method,
        url: req.originalUrl ?? req.url,
      },
    });
    next(err);
  };
}
