import { test, describe } from "node:test";
import assert from "node:assert/strict";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

const { argus } = await import("@argusdev/sdk-astro");
const { onRequest } = await import("@argusdev/sdk-astro/middleware");
/* same module instance the middleware imported — init here arms it there
   (in a real build, vite `define` provides the config instead); relative
   path because dist internals are deliberately not in the exports map */
const { init } = await import("../dist/server-capture.js");

describe("integration: astro:config:setup", () => {
  test("wires the page script, the middleware, and the define constant", () => {
    const calls = { scripts: [], middleware: [], config: [] };
    const integration = argus({
      dsn: "https://pk@argus.test/proj1",
      environment: "production",
      vitals: false,
    });
    assert.equal(integration.name, "@argusdev/sdk-astro");

    integration.hooks["astro:config:setup"]({
      injectScript: (stage, content) => calls.scripts.push({ stage, content }),
      addMiddleware: (mw) => calls.middleware.push(mw),
      updateConfig: (cfg) => calls.config.push(cfg),
    });

    /* 1. browser init on every page — importing OUR package, which resolves
       under pnpm isolation where a transitive sdk-browser import would not */
    assert.equal(calls.scripts.length, 1);
    assert.equal(calls.scripts[0].stage, "page");
    assert.ok(calls.scripts[0].content.includes('from "@argusdev/sdk-astro/client"'));
    assert.ok(calls.scripts[0].content.includes('"vitals":false'));

    /* 2. SSR middleware, pre-ordered so it wraps everything downstream */
    assert.deepEqual(calls.middleware, [
      { entrypoint: "@argusdev/sdk-astro/middleware", order: "pre" },
    ]);

    /* 3. the define constant round-trips to exactly the server config */
    const define = calls.config[0].vite.define.__ARGUS_ASTRO_CONFIG__;
    assert.deepEqual(JSON.parse(define), {
      dsn: "https://pk@argus.test/proj1",
      environment: "production",
    });
  });
});

describe("middleware: onRequest", () => {
  const context = {
    routePattern: "/blog/[slug]",
    url: { pathname: "/blog/hello" },
    request: {
      method: "GET",
      headers: {
        get: (name) =>
          ({ "user-agent": "astro-UA", cookie: "session=astro-secret" })[name] ?? null,
      },
    },
  };

  test("healthy request passes straight through", async () => {
    const response = { status: 200 };
    assert.equal(await onRequest(context, () => Promise.resolve(response)), response);
    assert.equal(sent.length, 0);
  });

  test("uninitialized (plain Node, no vite define) → rethrows without sending", async () => {
    const boom = new Error("ssr exploded");
    await assert.rejects(() => onRequest(context, () => Promise.reject(boom)), boom);
    await flush();
    assert.equal(sent.length, 0); /* golden rule: no config, no crash, no send */
  });

  test("initialized → captures with route tags, then rethrows untouched", async () => {
    init({ dsn: "https://pk@argus.test/proj1", environment: "production" });
    const boom = new Error("frontmatter exploded");
    await assert.rejects(() => onRequest(context, () => { throw boom; }), boom);
    await flush();

    assert.equal(sent.length, 1);
    const env = sent[0];
    assert.equal(env.exception.value, "frontmatter exploded");
    assert.deepEqual(env.tags, { routePattern: "/blog/[slug]" });
    assert.deepEqual(env.request, {
      url: "/blog/hello",
      method: "GET",
      headers: { "user-agent": "astro-UA" },
    });
    assert.ok(!JSON.stringify(env).includes("astro-secret"));
  });

  test("a hostile context can never mask the real error", async () => {
    const boom = new Error("the real bug");
    const hostile = {
      get routePattern() { throw new Error("poisoned getter"); },
    };
    await assert.rejects(() => onRequest(hostile, () => Promise.reject(boom)), boom);
  });
});
