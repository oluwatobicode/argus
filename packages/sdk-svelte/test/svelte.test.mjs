import { test, describe } from "node:test";
import assert from "node:assert/strict";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, status: 200 };
};

/* NO window in this process — hooks.server.ts territory, and the client
   entry must tolerate it too (it builds on the SSR-safe sdk-browser) */
const server = await import("@argusdev/sdk-svelte/server");
const client = await import("@argusdev/sdk-svelte/client");

/* what SvelteKit hands handleError on the server */
const serverInput = (overrides = {}) => ({
  error: new Error("load blew up"),
  status: 500,
  message: "Internal Error",
  event: {
    route: { id: "/blog/[slug]" },
    url: { pathname: "/blog/hello" },
    request: {
      method: "GET",
      headers: {
        get: (name) =>
          ({ "user-agent": "kit-test-UA", cookie: "session=kit-secret" })[name] ?? null,
      },
    },
  },
  ...overrides,
});

describe("server: handleErrorWithArgus", () => {
  test("captures with route/status tags and request context", async () => {
    server.init({ dsn: "https://pk@argus.test/proj1", environment: "production", release: "1.0.0" });
    await server.handleErrorWithArgus()(serverInput());
    await flush();

    assert.equal(sent.length, 1);
    const env = sent[0].body;
    assert.equal(env.exception.value, "load blew up");
    assert.deepEqual(env.tags, {
      routeId: "/blog/[slug]" /* the PATTERN — stable across requests */,
      status: "500",
      sveltekitMessage: "Internal Error",
    });
    assert.deepEqual(env.request, {
      url: "/blog/hello",
      method: "GET",
      headers: { "user-agent": "kit-test-UA" },
    });
    assert.equal(env.environment, "production");
    assert.ok(env.exception.stacktrace.frames[0].filename.includes("svelte.test.mjs"));
  });

  test("cookies are never forwarded", async () => {
    const serialized = JSON.stringify(sent.at(-1).body);
    assert.ok(!serialized.includes("kit-secret") && !/cookie/i.test(serialized));
  });

  test("404s are skipped — traffic noise, not crashes", async () => {
    const before = sent.length;
    await server.handleErrorWithArgus()(serverInput({ status: 404, message: "Not Found" }));
    await flush();
    assert.equal(sent.length, before);
  });

  test("wraps a user handler and preserves its return (the $page.error shape)", async () => {
    const before = sent.length;
    const seen = [];
    const handler = server.handleErrorWithArgus((input) => {
      seen.push(input.status);
      return { message: "Whoops" };
    });
    const result = await handler(serverInput());
    await flush();
    assert.deepEqual(result, { message: "Whoops" });
    assert.deepEqual(seen, [500]); /* user handler still ran */
    assert.equal(sent.length, before + 1); /* and we still captured */
  });

  test("user handler runs even on skipped 404s (capture policy ≠ their policy)", async () => {
    const before = sent.length;
    const result = await server.handleErrorWithArgus(() => ({ message: "custom 404" }))(
      serverInput({ status: 404 }),
    );
    await flush();
    assert.deepEqual(result, { message: "custom 404" });
    assert.equal(sent.length, before);
  });

  test("non-Error values are normalized", async () => {
    await server.handleErrorWithArgus()(serverInput({ error: "thrown string" }));
    await flush();
    assert.equal(sent.at(-1).body.exception.value, "thrown string");
  });
});

describe("client: handleErrorWithArgus", () => {
  test("captures with route/status tags (browser init is SSR-safe here)", async () => {
    client.init({ dsn: "https://pk@argus.test/proj1" });
    const before = sent.length;
    await client.handleErrorWithArgus()({
      error: new Error("navigation load failed"),
      status: 500,
      message: "Internal Error",
      event: { route: { id: "/dash" }, url: { pathname: "/dash" } },
    });
    await flush();
    assert.equal(sent.length, before + 1);
    const env = sent.at(-1).body;
    assert.equal(env.exception.value, "navigation load failed");
    assert.equal(env.tags.routeId, "/dash");
  });
});
