import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { argusVue, attachVueErrorHandler } from "@argusdev/sdk-vue";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

describe("argusVue plugin", () => {
  test("install() wires browser init + errorHandler in one .use()", async (t) => {
    t.mock.method(console, "error", () => {});
    const app = { config: {} };
    argusVue.install(app, {
      dsn: "https://pk@argus.test/proj1",
      environment: "production",
      vitals: false,
    });
    assert.equal(typeof app.config.errorHandler, "function");

    app.config.errorHandler(new Error("setup exploded"), null, "setup function");
    await flush();
    const env = sent.at(-1);
    assert.equal(env.exception.value, "setup exploded");
    assert.equal(env.environment, "production");
    assert.equal(env.tags.lifecycleHook, "setup function");
  });
});

describe("attachVueErrorHandler", () => {
  test("component name read from the SFC compiler's __name", async (t) => {
    t.mock.method(console, "error", () => {});
    const app = { config: {} };
    attachVueErrorHandler(app);
    app.config.errorHandler(
      new Error("cart total is NaN"),
      { $: { type: { __name: "CheckoutForm" } } },
      "render function",
    );
    await flush();
    assert.deepEqual(sent.at(-1).tags, {
      component: "CheckoutForm",
      lifecycleHook: "render function",
    });
  });

  test("an explicit $options.name wins over __name", async (t) => {
    t.mock.method(console, "error", () => {});
    const app = { config: {} };
    attachVueErrorHandler(app);
    app.config.errorHandler(
      new Error("x"),
      { $options: { name: "NamedOne" }, $: { type: { __name: "file_name" } } },
      "watcher callback",
    );
    await flush();
    assert.equal(sent.at(-1).tags.component, "NamedOne");
  });

  test("null instance → no component tag, still reported", async (t) => {
    t.mock.method(console, "error", () => {});
    const app = { config: {} };
    attachVueErrorHandler(app);
    const before = sent.length;
    app.config.errorHandler(new Error("y"), null, "native event handler");
    await flush();
    assert.equal(sent.length, before + 1);
    assert.deepEqual(sent.at(-1).tags, { lifecycleHook: "native event handler" });
  });

  test("chains a pre-existing handler instead of replacing it — no console fallback", async (t) => {
    const consoleSpy = t.mock.method(console, "error", () => {});
    const seen = [];
    const app = { config: { errorHandler: (err, instance, info) => seen.push(info) } };
    attachVueErrorHandler(app);
    const before = sent.length;
    app.config.errorHandler(new Error("chained"), null, "watcher callback");
    await flush();
    assert.deepEqual(seen, ["watcher callback"]); /* the app's handler still ran */
    assert.equal(sent.length, before + 1); /* and we still captured */
    assert.equal(consoleSpy.mock.callCount(), 0); /* chained ≠ re-logged */
  });

  test("no previous handler → Vue's console.error logging is preserved", async (t) => {
    const consoleSpy = t.mock.method(console, "error", () => {});
    const app = { config: {} };
    attachVueErrorHandler(app);
    const err = new Error("still visible in devtools");
    app.config.errorHandler(err, null, "render function");
    await flush();
    assert.equal(consoleSpy.mock.callCount(), 1);
    assert.equal(consoleSpy.mock.calls[0].arguments[0], err);
  });
});
