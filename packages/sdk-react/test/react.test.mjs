import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ArgusErrorBoundary, init } from "@argusdev/sdk-react";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

/* no window in this process — init is SSR-safe, captureException still sends */
init({ dsn: "https://pk@argus.test/proj1" });

describe("ArgusErrorBoundary", () => {
  test("getDerivedStateFromError flips hasError", () => {
    assert.deepEqual(ArgusErrorBoundary.getDerivedStateFromError(), { hasError: true });
  });

  test("renders children until a crash, then fallback (or null without one)", () => {
    const boundary = new ArgusErrorBoundary({ children: "kids", fallback: "fallback ui" });
    assert.equal(boundary.render(), "kids");
    boundary.state = { hasError: true };
    assert.equal(boundary.render(), "fallback ui");

    const bare = new ArgusErrorBoundary({ children: "kids" });
    bare.state = { hasError: true };
    assert.equal(bare.render(), null);
  });

  test("componentDidCatch reports with the crashing component as a tag", async () => {
    const boundary = new ArgusErrorBoundary({});
    boundary.componentDidCatch(new Error("render boom"), {
      componentStack: "\n    at BrokenWidget (https://app.test/app.js:1:1)\n    at App",
    });
    await flush();
    const env = sent.at(-1);
    assert.equal(env.exception.value, "render boom");
    /* first line of componentStack = the component that crashed */
    assert.equal(env.tags.componentStack, "at BrokenWidget (https://app.test/app.js:1:1)");
  });

  test("no componentStack → still reported, just untagged", async () => {
    const before = sent.length;
    new ArgusErrorBoundary({}).componentDidCatch(new Error("no info"), {});
    await flush();
    assert.equal(sent.length, before + 1);
    assert.equal(sent.at(-1).tags, undefined);
  });
});
