import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeAngularError, ArgusErrorHandler, init } from "@argusdev/sdk-angular";
import { parseStack } from "@argusdev/sdk-browser";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

const run = (input) => {
  const { error, tags } = normalizeAngularError(input);
  return { name: error.name, message: error.message, tags };
};

const httpWrapper = (status, url) => ({
  rejection: {
    name: "HttpErrorResponse",
    message: `Http failure response for ${url}: ${status}`,
    status,
    url,
  },
});

describe("normalizeAngularError — unwrapping", () => {
  test("a plain Error passes through as the SAME object (real stack untouched)", () => {
    const err = new Error("kaboom");
    assert.equal(normalizeAngularError(err).error, err);
  });

  test("zone.js { rejection } wrapper", () => {
    assert.deepEqual(run({ rejection: new TypeError("bad json") }), {
      name: "TypeError",
      message: "bad json",
      tags: {},
    });
  });

  test("Angular's ngOriginalError rethrow wrapper", () => {
    assert.deepEqual(run({ message: "wrapper", ngOriginalError: new RangeError("real") }), {
      name: "RangeError",
      message: "real",
      tags: {},
    });
  });

  test("HttpErrorResponse (HTTP-level): keeps the wrapper's message, tags status+url, does NOT unwrap the response body", () => {
    assert.deepEqual(
      run({
        name: "HttpErrorResponse",
        message: "Http failure response for /api/users: 500 Internal Server Error",
        status: 500,
        url: "https://api.test/api/users",
        error: { detail: "db down" } /* response body — not the bug */,
      }),
      {
        name: "HttpErrorResponse",
        message: "Http failure response for /api/users: 500 Internal Server Error",
        tags: { httpStatus: "500", httpUrl: "https://api.test/api/users" },
      },
    );
  });

  test("HttpErrorResponse (network-level): unwraps the inner Error, keeps the tags", () => {
    assert.deepEqual(
      run({
        name: "HttpErrorResponse",
        message: "Http failure response for /api/x: 0 Unknown Error",
        status: 0,
        url: "https://api.test/api/x",
        error: new TypeError("Failed to fetch"),
      }),
      {
        name: "TypeError",
        message: "Failed to fetch",
        tags: { httpStatus: "0", httpUrl: "https://api.test/api/x" },
      },
    );
  });

  test("nested: rejection → HttpErrorResponse → network Error", () => {
    assert.deepEqual(
      run({
        rejection: {
          name: "HttpErrorResponse",
          message: "hm",
          status: 502,
          url: "/api/deep",
          error: new Error("ECONNRESET"),
        },
      }),
      { name: "Error", message: "ECONNRESET", tags: { httpStatus: "502", httpUrl: "/api/deep" } },
    );
  });

  test("thrown string / null / undefined / empty object", () => {
    assert.equal(run("just a string").message, "just a string");
    assert.equal(run(null).message, "null thrown");
    assert.equal(run(undefined).message, "undefined thrown");
    assert.equal(run({}).message, "Non-Error thrown (no message)");
  });

  test("plain object with fields → serialized into the message", () => {
    assert.equal(run({ code: 42, kind: "weird" }).message, 'Non-Error thrown: {"code":42,"kind":"weird"}');
  });

  test("circular object does not throw", () => {
    const circular = { self: null };
    circular.self = circular;
    assert.equal(run(circular).message, "Non-Error thrown (no message)");
  });

  test("a 20-deep wrapper chain terminates at the depth bound", () => {
    let deep = new Error("bottom");
    for (let i = 0; i < 20; i++) deep = { ngOriginalError: deep, message: `layer${i}` };
    assert.ok(run(deep).message.startsWith("layer")); /* stopped at MAX_DEPTH, didn't spin */
  });

  test("httpUrl tag truncated to 200 chars", () => {
    const longUrl = "https://x.test/?q=" + "a".repeat(500);
    assert.equal(run({ message: "m", status: 400, url: longUrl }).tags.httpUrl.length, 200);
  });
});

describe("synthetic stack — fingerprint identity for non-Errors", () => {
  const framesFor = (input) => parseStack(normalizeAngularError(input).error.stack);

  test("one frame carrying endpoint + status; no Argus frames leak in", () => {
    const frames = framesFor(httpWrapper(500, "https://api.test/cart"));
    assert.deepEqual(frames, [
      { filename: "https://api.test/cart", lineno: 500, colno: 1, function: "HttpErrorResponse" },
    ]);
    assert.ok(!frames.some((f) => /sdk-angular|normalize|error-handler/.test(f.filename)));
  });

  test("same endpoint + status → identical frames (one Issue)", () => {
    assert.deepEqual(
      framesFor(httpWrapper(500, "https://api.test/cart")),
      framesFor(httpWrapper(500, "https://api.test/cart")),
    );
  });

  test("different status or endpoint → different frames (separate Issues)", () => {
    assert.notDeepEqual(
      framesFor(httpWrapper(500, "https://api.test/cart")),
      framesFor(httpWrapper(404, "https://api.test/cart")),
    );
    assert.notDeepEqual(
      framesFor(httpWrapper(500, "https://api.test/cart")),
      framesFor(httpWrapper(500, "https://api.test/orders")),
    );
  });

  test("status 0 (network failure) → lineno coerced positive for the validator", () => {
    assert.equal(framesFor(httpWrapper(0, "https://api.test/ping"))[0].lineno, 1);
  });

  test("a wrapper's own serialized stack is preferred over synthesis", () => {
    const carried = "Error: original\n    at realFn (https://app.test/real.js:9:5)";
    const frames = framesFor({ message: "wrapped", stack: carried });
    assert.deepEqual(frames, [
      { filename: "https://app.test/real.js", lineno: 9, colno: 5, function: "realFn" },
    ]);
  });
});

describe("ArgusErrorHandler", () => {
  test("handleError reports the normalized error and re-logs the ORIGINAL (observe, never absorb)", async (t) => {
    const consoleSpy = t.mock.method(console, "error", () => {});
    init({ dsn: "https://pk@argus.test/proj1" });

    const wrapper = httpWrapper(500, "https://api.test/api/cart");
    new ArgusErrorHandler().handleError(wrapper);
    await flush();

    const env = sent.at(-1);
    assert.equal(env.exception.type, "HttpErrorResponse");
    assert.deepEqual(env.tags, { httpStatus: "500", httpUrl: "https://api.test/api/cart" });
    assert.equal(env.exception.stacktrace.frames[0].filename, "https://api.test/api/cart");

    assert.equal(consoleSpy.mock.callCount(), 1);
    assert.equal(consoleSpy.mock.calls[0].arguments[0], wrapper); /* original, not normalized */
  });
});
