import { test, describe } from "node:test";
import assert from "node:assert/strict";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body), keepalive: opts.keepalive ?? false });
  return { ok: true, status: 200 };
};

/* minimal DOM — just what init/vitals touch */
const listeners = {};
globalThis.window = {
  onerror: null,
  location: { href: "https://app.test/checkout", pathname: "/checkout" },
  addEventListener(type, fn) {
    (listeners[type] ??= []).push(fn);
  },
};
globalThis.document = {
  visibilityState: "visible",
  addEventListener(type, fn) {
    (listeners[`document:${type}`] ??= []).push(fn);
  },
};

const { init, captureException, parseStack } = await import("@argusdev/sdk-browser");

describe("parseStack — dual format", () => {
  const chrome =
    "TypeError: x is not a function\n" +
    "    at handleClick (https://app.test/assets/app.js:42:17)\n" +
    "    at https://app.test/assets/app.js:7:3";
  const firefox =
    "handleClick@https://app.test/assets/app.js:42:17\n" +
    "@https://app.test/assets/app.js:7:3";

  test("Chrome format: named + anonymous frames, message line skipped", () => {
    assert.deepEqual(parseStack(chrome), [
      { filename: "https://app.test/assets/app.js", lineno: 42, colno: 17, function: "handleClick" },
      { filename: "https://app.test/assets/app.js", lineno: 7, colno: 3 },
    ]);
  });

  test("Firefox/Safari format parses to IDENTICAL frames — one Issue, not one per browser", () => {
    assert.deepEqual(parseStack(firefox), parseStack(chrome));
  });
});

describe("init + window.onerror", () => {
  test("chains a pre-existing handler and propagates its return value", async () => {
    const prevCalls = [];
    window.onerror = (...args) => {
      prevCalls.push(args);
      return true;
    };
    init({ dsn: "https://pk@argus.test/proj1", environment: "production" });

    const err = new Error("uncaught click handler");
    const ret = window.onerror.call(window, String(err), "https://app.test/app.js", 42, 17, err);
    await flush();

    assert.equal(ret, true); /* the app's handler still decides suppression */
    assert.equal(prevCalls.length, 1);
    const env = sent.at(-1).body;
    assert.equal(env.exception.value, "uncaught click handler");
    assert.equal(env.environment, "production");
    assert.equal(env.request.url, "https://app.test/checkout"); /* page URL auto-attached */
  });

  test("returns false (console error preserved) when there was no previous handler", async () => {
    window.onerror = null;
    init({ dsn: "https://pk@argus.test/proj1" });
    const ret = window.onerror("boom", "https://app.test/a.js", 1, 1, new Error("boom"));
    await flush();
    assert.equal(ret, false);
  });

  test("no Error object (cross-origin script) → frame synthesized from the args", async () => {
    const before = sent.length;
    window.onerror("Script error.", "https://cdn.test/widget.js", 10, 5, undefined);
    await flush();
    assert.equal(sent.length, before + 1);
    const env = sent.at(-1).body;
    assert.equal(env.exception.type, "Error");
    assert.equal(env.exception.value, "Script error.");
    assert.deepEqual(env.exception.stacktrace.frames, [
      { filename: "https://cdn.test/widget.js", lineno: 10, colno: 5 },
    ]);
  });

  test("unhandledrejection captures, normalizing non-Error reasons", async () => {
    const before = sent.length;
    const fire = listeners["unhandledrejection"].at(-1);
    fire({ reason: new TypeError("fetch failed") });
    fire({ reason: "plain string rejection" });
    await flush();
    assert.equal(sent.length, before + 2);
    assert.equal(sent.at(-2).body.exception.type, "TypeError");
    assert.equal(sent.at(-1).body.exception.value, "plain string rejection");
  });
});

describe("captureException", () => {
  test("error without usable stack → one synthesized frame (validator needs ≥1)", async () => {
    const bare = new Error("no trace");
    bare.stack = undefined;
    await captureException(bare);
    assert.deepEqual(sent.at(-1).body.exception.stacktrace.frames, [
      { filename: "<unknown>", lineno: 1 },
    ]);
  });

  test("extra options merge over the defaults", async () => {
    await captureException(new Error("tagged"), { tags: { feature: "checkout" } });
    const env = sent.at(-1).body;
    assert.equal(env.tags.feature, "checkout");
    assert.equal(env.request.url, "https://app.test/checkout");
  });
});

describe("web vitals", () => {
  class FakePO {
    static instances = [];
    constructor(cb) {
      this.cb = cb;
      FakePO.instances.push(this);
    }
    observe(opts) {
      this.type = opts.type;
    }
    disconnect() {
      this.disconnected = true;
    }
  }

  test("one page.load transaction, sent exactly once on pagehide, with keepalive", async () => {
    globalThis.PerformanceObserver = FakePO;
    globalThis.performance = {
      getEntriesByType: (t) =>
        t === "navigation"
          ? [{ responseStart: 123.4, duration: 4567.6, loadEventEnd: 4000 }]
          : [],
    };
    init({ dsn: "https://pk@argus.test/proj1" }); /* vitals on by default */

    const by = {};
    for (const o of FakePO.instances) by[o.type] = o;
    assert.ok(by["largest-contentful-paint"] && by["layout-shift"] && by["paint"]);

    /* LCP: the LAST candidate wins */
    by["largest-contentful-paint"].cb({
      getEntries: () => [{ startTime: 1000.2 }, { startTime: 2400.6 }],
    });
    /* CLS: cumulative, shifts near user input ignored */
    by["layout-shift"].cb({
      getEntries: () => [
        { value: 0.05, hadRecentInput: false },
        { value: 0.2, hadRecentInput: true },
        { value: 0.0123, hadRecentInput: false },
      ],
    });
    by["paint"].cb({
      getEntries: () => [
        { name: "first-paint", startTime: 800 },
        { name: "first-contentful-paint", startTime: 900.4 },
      ],
    });

    const before = sent.length;
    const report = listeners["pagehide"].at(-1);
    report();
    await flush();

    assert.equal(sent.length, before + 1);
    const record = sent.at(-1);
    assert.equal(record.keepalive, true); /* survives the navigation */
    assert.equal(record.body.type, "transaction");
    assert.equal(record.body.name, "page.load /checkout");
    assert.equal(record.body.duration, 4568);
    assert.deepEqual(record.body.vitals, { lcp: 2401, cls: 0.0623, fcp: 900, ttfb: 123 });

    /* second pagehide → nothing; observers disconnected */
    report();
    await flush();
    assert.equal(sent.length, before + 1);
    assert.ok(FakePO.instances.every((o) => o.disconnected));
  });

  test("nothing measured (background tab) → nothing sent", async () => {
    FakePO.instances.length = 0;
    globalThis.performance = { getEntriesByType: () => [] };
    init({ dsn: "https://pk@argus.test/proj1" });
    const before = sent.length;
    listeners["pagehide"].at(-1)();
    await flush();
    assert.equal(sent.length, before);
  });

  test("vitals: false opts out — no observers at all", () => {
    FakePO.instances.length = 0;
    init({ dsn: "https://pk@argus.test/proj1", vitals: false });
    assert.equal(FakePO.instances.length, 0);
  });
});
