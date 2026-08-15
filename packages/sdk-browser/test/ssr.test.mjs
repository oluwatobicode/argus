/*
 * SSR behavior — this file runs in its OWN process (node --test isolates
 * files), with NO window/document, deliberately. That's a Next/Nuxt/Angular
 * Universal server render.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

assert.equal(typeof globalThis.window, "undefined", "precondition: this file must run without a window");

const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

const { init, captureException } = await import("@argusdev/sdk-browser");

test("init() without a window does not throw — golden rule inside someone's server render", () => {
  assert.doesNotThrow(() => init({ dsn: "https://pk@argus.test/proj1", environment: "ssr" }));
});

test("manual captureException still reports from the server", async () => {
  await captureException(new Error("server render blew up"));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].exception.value, "server render blew up");
  assert.equal(sent[0].environment, "ssr");
  assert.ok(sent[0].exception.stacktrace.frames.length >= 1); /* Node's V8 stack parsed fine */
  assert.ok(!("request" in sent[0])); /* no page URL to attach — and no crash trying */
});
