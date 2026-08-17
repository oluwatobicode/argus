/*
 * Cross-SDK integration tests.
 *
 * What makes these different from the per-package unit tests: the envelopes
 * each SDK actually emits are validated against the API's REAL Zod schemas
 * (imported from app/backend/api — Node strips the types), and grouping is
 * checked with the worker's REAL computeFingerprint. No mirrors, no drift.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body), keepalive: opts.keepalive ?? false });
  return { ok: true, status: 200 };
};

/* browser-ish globals for the client-side SDKs */
const listeners = {};
globalThis.window = {
  onerror: null,
  location: { href: "https://app.test/dash", pathname: "/dash" },
  addEventListener(type, fn) {
    (listeners[type] ??= []).push(fn);
  },
};
globalThis.document = {
  visibilityState: "visible",
  addEventListener() {},
};

/* the real backend code — the single source of truth for the wire contract */
const { EventEnvelopeSchema, TransactionEnvelopeSchema } = await import(
  "../../../app/backend/api/src/validators/envelope.validator.ts"
);
const { computeFingerprint } = await import(
  "../../../app/backend/worker/src/utils/fingerprint.util.ts"
);

const DSN = "https://pk@argus.test/proj1";
const PACKAGES = [
  "sdk-core",
  "sdk-node",
  "sdk-browser",
  "sdk-react",
  "sdk-vue",
  "sdk-angular",
  "sdk-nextjs",
  "sdk-svelte",
  "sdk-nestjs",
  "sdk-astro",
];

function assertValidEvent(envelope) {
  const result = EventEnvelopeSchema.safeParse(envelope);
  assert.ok(result.success, `envelope rejected by the API schema: ${JSON.stringify(result.error?.issues)}`);
}

describe("published artifacts", () => {
  test("every package (and both sdk-nextjs entries) loads in plain Node ESM", async () => {
    const entries = [
      ...PACKAGES.filter((p) => !["sdk-nextjs", "sdk-svelte"].includes(p)).map(
        (p) => `@argusdev/${p}`,
      ),
      "@argusdev/sdk-nextjs/server",
      "@argusdev/sdk-nextjs/client",
      "@argusdev/sdk-svelte/server",
      "@argusdev/sdk-svelte/client",
      "@argusdev/sdk-astro/client",
      "@argusdev/sdk-astro/middleware",
    ];
    for (const entry of entries) {
      await assert.doesNotReject(import(entry), `${entry} failed to import`);
    }
  });

  test("every relative import in every dist carries a .js extension (regression: v0.2.1 was unloadable in Node)", () => {
    for (const pkg of PACKAGES) {
      const dir = new URL(`../../${pkg}/dist/`, import.meta.url);
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".js") && !file.endsWith(".d.ts")) continue;
        const code = readFileSync(new URL(file, dir), "utf8");
        for (const match of code.matchAll(/from\s+"(\.[^"]+)"/g)) {
          assert.ok(match[1].endsWith(".js"), `${pkg}/dist/${file}: extensionless import "${match[1]}"`);
        }
      }
    }
  });
});

describe("every SDK's output passes the API's real ingest schema", () => {
  test("sdk-node — express error handler", async () => {
    const sdk = await import("@argusdev/sdk-node");
    sdk.init({ dsn: DSN, environment: "production" });
    sdk.argusErrorHandler()(
      new Error("route died"),
      { method: "GET", originalUrl: "/api/users" },
      {},
      () => {},
    );
    await flush();
    assertValidEvent(sent.at(-1).body);
    assert.equal(sent.at(-1).url, "https://argus.test/api/v1/ingest/proj1/envelope");
  });

  test("sdk-browser — window.onerror", async () => {
    const sdk = await import("@argusdev/sdk-browser");
    sdk.init({ dsn: DSN, environment: "production", release: "1.0.0" });
    window.onerror.call(window, "boom", "https://app.test/a.js", 1, 1, new Error("browser boom"));
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-react — error boundary", async () => {
    const { ArgusErrorBoundary } = await import("@argusdev/sdk-react");
    new ArgusErrorBoundary({}).componentDidCatch(new Error("render boom"), {
      componentStack: "\n    at Broken (https://app.test/a.js:1:1)",
    });
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-vue — plugin error handler", async (t) => {
    t.mock.method(console, "error", () => {});
    const { argusVue } = await import("@argusdev/sdk-vue");
    const app = { config: {} };
    argusVue.install(app, { dsn: DSN, vitals: false });
    app.config.errorHandler(new Error("vue boom"), { $: { type: { __name: "Widget" } } }, "render function");
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-angular — HttpErrorResponse (synthetic frame passes the frame schema)", async (t) => {
    t.mock.method(console, "error", () => {});
    const { ArgusErrorHandler, init } = await import("@argusdev/sdk-angular");
    init({ dsn: DSN });
    new ArgusErrorHandler().handleError({
      rejection: {
        name: "HttpErrorResponse",
        message: "Http failure response for /api/cart: 500",
        status: 500,
        url: "https://api.test/api/cart",
      },
    });
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-nextjs — onRequestError", async () => {
    const sdk = await import("@argusdev/sdk-nextjs/server");
    sdk.init({ dsn: DSN, environment: "production" });
    await sdk.onRequestError(
      Object.assign(new Error("server boom"), { digest: "123456" }),
      { path: "/blog/x", method: "GET", headers: { "user-agent": "UA" } },
      { routerKind: "App Router", routePath: "/blog/[slug]", routeType: "render" },
    );
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-svelte — server handleError", async () => {
    const sdk = await import("@argusdev/sdk-svelte/server");
    sdk.init({ dsn: DSN, environment: "production" });
    await sdk.handleErrorWithArgus()({
      error: new Error("kit load boom"),
      status: 500,
      message: "Internal Error",
      event: {
        route: { id: "/blog/[slug]" },
        url: { pathname: "/blog/x" },
        request: { method: "GET", headers: { get: () => null } },
      },
    });
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-nestjs — exception filter", async (t) => {
    t.mock.method(console, "error", () => {});
    const { init, ArgusExceptionFilter } = await import("@argusdev/sdk-nestjs");
    init({ dsn: DSN });
    const response = { status: () => response, json: () => {} };
    new ArgusExceptionFilter().catch(new Error("nest boom"), {
      switchToHttp: () => ({
        getRequest: () => ({ method: "GET", url: "/api/x", headers: {} }),
        getResponse: () => response,
      }),
    });
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-astro — middleware capture", async () => {
    const { init } = await import("../../sdk-astro/dist/server-capture.js");
    const { onRequest } = await import("@argusdev/sdk-astro/middleware");
    init({ dsn: DSN });
    await onRequest(
      { routePattern: "/x", url: { pathname: "/x" }, request: { method: "GET", headers: { get: () => null } } },
      () => Promise.reject(new Error("astro ssr boom")),
    ).catch(() => {});
    await flush();
    assertValidEvent(sent.at(-1).body);
  });

  test("sdk-browser — page.load transaction passes the transaction schema", async () => {
    class FakePO {
      constructor(cb) {
        this.cb = cb;
        FakePO.instances.push(this);
      }
      observe(opts) {
        this.type = opts.type;
      }
      disconnect() {}
      static instances = [];
    }
    globalThis.PerformanceObserver = FakePO;
    globalThis.performance = {
      getEntriesByType: (t) =>
        t === "navigation" ? [{ responseStart: 100.4, duration: 2000.6, loadEventEnd: 1900 }] : [],
    };
    const sdk = await import("@argusdev/sdk-browser");
    sdk.init({ dsn: DSN }); /* vitals on */
    const lcp = FakePO.instances.find((o) => o.type === "largest-contentful-paint");
    lcp.cb({ getEntries: () => [{ startTime: 1500.2 }] });

    const before = sent.length;
    listeners["pagehide"].at(-1)();
    await flush();
    assert.equal(sent.length, before + 1);
    const record = sent.at(-1);
    assert.equal(record.keepalive, true);
    const result = TransactionEnvelopeSchema.safeParse(record.body);
    assert.ok(result.success, JSON.stringify(result.error?.issues));
  });
});

describe("grouping — the worker's real computeFingerprint", () => {
  test("Chrome and Firefox stacks of the same error → ONE Issue", async () => {
    const { parseStack } = await import("@argusdev/sdk-browser");
    const chrome = parseStack(
      "    at handleClick (https://app.test/app.js:42:17)\n    at https://app.test/app.js:7:3",
    );
    const firefox = parseStack(
      "handleClick@https://app.test/app.js:42:17\n@https://app.test/app.js:7:3",
    );
    assert.equal(computeFingerprint(chrome), computeFingerprint(firefox));
  });

  test("Angular HTTP failures → one Issue per endpoint+status, not one blob", async () => {
    const { normalizeAngularError } = await import("@argusdev/sdk-angular");
    const { parseStack } = await import("@argusdev/sdk-browser");
    const fp = (status, url) =>
      computeFingerprint(
        parseStack(
          normalizeAngularError({
            rejection: { name: "HttpErrorResponse", message: "m", status, url },
          }).error.stack,
        ),
      );
    assert.equal(fp(500, "/api/cart"), fp(500, "/api/cart"));
    assert.notEqual(fp(500, "/api/cart"), fp(404, "/api/cart"));
    assert.notEqual(fp(500, "/api/cart"), fp(500, "/api/orders"));
  });
});
