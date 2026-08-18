import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, status: 200 };
};

/* NO window in this process — the whole point of the server entry,
   and the client entry must tolerate it (SSR-safe by design) */
const server = await import("@argusdev/sdk-nextjs/server");
const client = await import("@argusdev/sdk-nextjs/client");

describe("server: onRequestError", () => {
  test("full Next context → tagged envelope; secrets stay out", async () => {
    server.init({
      dsn: "https://pk@argus.test/proj1",
      environment: "production",
      release: "4.2.0",
    });
    const err = Object.assign(new Error("Failed to load user"), { digest: "3163989896" });

    const result = server.onRequestError(
      err,
      {
        path: "/blog/hello-world?ref=x",
        method: "GET",
        headers: {
          "user-agent": ["Mozilla/5.0 (Macintosh)", "extra"] /* repeated header = array */,
          cookie: "session=super-secret-token",
          authorization: "Bearer sk_live_abc123",
        },
      },
      {
        routerKind: "App Router",
        routePath: "/blog/[slug]",
        routeType: "render",
        renderSource: "react-server-components",
        revalidateReason: undefined,
      },
    );
    assert.ok(result instanceof Promise); /* Next awaits it — serverless freeze safety */
    await result;

    const env = sent.at(-1).body;
    assert.deepEqual(env.tags, {
      routerKind: "App Router",
      routeType: "render",
      renderSource: "react-server-components",
      routePath: "/blog/[slug]" /* the PATTERN — stable across requests */,
      digest: "3163989896" /* joins the client half of the same failure */,
    });
    assert.deepEqual(env.request, {
      url: "/blog/hello-world?ref=x",
      method: "GET",
      headers: { "user-agent": "Mozilla/5.0 (Macintosh)" } /* array narrowed to first */,
    });
    const serialized = JSON.stringify(env);
    assert.ok(!serialized.includes("super-secret-token") && !/cookie/i.test(serialized));
    assert.ok(!serialized.includes("sk_live_abc123") && !/authorization/i.test(serialized));
    assert.equal(env.environment, "production");
    assert.equal(env.release, "4.2.0");
    assert.ok(env.exception.stacktrace.frames[0].filename.includes("nextjs.test.mjs"));
  });

  test("minimal call — no request, no context — still reports", async () => {
    const before = sent.length;
    await server.onRequestError(new Error("bare"));
    assert.equal(sent.length, before + 1);
    assert.equal(sent.at(-1).body.exception.value, "bare");
  });

  test("manual captureException from a route handler", async () => {
    await server.captureException(new Error("checkout failed"), {
      tags: { routePath: "/api/checkout" },
      request: { url: "/api/checkout", method: "POST" },
    });
    const env = sent.at(-1).body;
    assert.equal(env.tags.routePath, "/api/checkout");
    assert.equal(env.request.method, "POST");
  });
});

describe("client entry", () => {
  test('"use client" survives tsc emit as line 1 of dist/client.js', () => {
    const firstLine = readFileSync(new URL("../dist/client.js", import.meta.url), "utf8")
      .split("\n", 1)[0];
    assert.equal(firstLine, '"use client";');
  });

  test("source context: attached on the Node runtime (NEXT_RUNTIME=nodejs)", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    try {
      await server.captureException(new Error("node runtime crash"));
      await flush();
      const top = sent.at(-1).body.exception.stacktrace.frames[0];
      assert.ok(top.contextLine.includes("node runtime crash"));
      assert.ok(top.preContext.length > 0 && top.postContext.length > 0);
    } finally {
      delete process.env.NEXT_RUNTIME;
    }
  });

  test("source context: SKIPPED on the edge runtime (NEXT_RUNTIME=edge)", async () => {
    process.env.NEXT_RUNTIME = "edge";
    try {
      await server.captureException(new Error("edge runtime crash"));
      await flush();
      const top = sent.at(-1).body.exception.stacktrace.frames[0];
      assert.equal(top.contextLine, undefined);
      assert.equal(top.preContext, undefined);
    } finally {
      delete process.env.NEXT_RUNTIME;
    }
  });

  test("source context: plain-Node fallback when NEXT_RUNTIME is unset", async () => {
    await server.captureException(new Error("plain node crash"));
    await flush();
    assert.ok(sent.at(-1).body.exception.stacktrace.frames[0].contextLine.includes("plain node crash"));
  });

  test("edge safety: no STATIC import of sdk-node or node:fs in the server entry", () => {
    /* the sdk-node import must stay dynamic inside the NEXT_RUNTIME branch —
       a static one would drag node:fs into every edge bundle */
    const code = readFileSync(new URL("../dist/server.js", import.meta.url), "utf8");
    const staticImports = code.match(/^\s*(?:import|export)[^;]*from\s+"[^"]+"/gm) ?? [];
    assert.ok(staticImports.every((l) => !l.includes("sdk-node") && !l.includes("node:")));
    assert.ok(code.includes('import("@argusdev/sdk-node")'), "dynamic import missing");
  });

  test("server entry graph never imports sdk-browser (server/edge bundle purity)", () => {
    for (const file of ["../dist/server.js", "../dist/stacktrace.js"]) {
      const code = readFileSync(new URL(file, import.meta.url), "utf8");
      const importLines = code.match(/^\s*(?:import|export)[^;]*from\s+"[^"]+"/gm) ?? [];
      assert.ok(
        importLines.every((line) => !line.includes("sdk-browser")),
        `${file} imports sdk-browser`,
      );
    }
  });

  test("captureError tags the digest that joins the server half", async () => {
    client.init({ dsn: "https://pk@argus.test/proj1" }); /* no window — SSR-safe */
    client.captureError(Object.assign(new Error("client half"), { digest: "3163989896" }));
    await flush();
    assert.equal(sent.at(-1).body.tags.digest, "3163989896");
  });

  test("captureError without a digest → untagged", async () => {
    client.captureError(new Error("plain"));
    await flush();
    assert.equal(sent.at(-1).body.tags, undefined);
  });

  /* useArgusError is deliberately untested here: it's useEffect + captureError,
     and calling a hook outside a React render throws by design. captureError
     (the entire body of the effect) is covered above. */
});
