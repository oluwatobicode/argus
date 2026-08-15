import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseDsn,
  getIngestUrl,
  buildEnvelope,
  sendEnvelope,
} from "@argusdev/sdk-core";

const flush = () => new Promise((r) => setImmediate(r));
const MS_EPOCH_2020 = 1_577_836_800_000; /* the validator's ms-vs-sec bound */

describe("parseDsn", () => {
  test("splits a valid DSN into its four parts", () => {
    assert.deepEqual(parseDsn("https://pubkey@argus.example.com/proj123"), {
      publicKey: "pubkey",
      host: "argus.example.com",
      projectId: "proj123",
      protocol: "https",
    });
  });

  test("keeps the port as part of host, and getIngestUrl targets the ingest route", () => {
    const parsed = parseDsn("http://k@localhost:3000/p1");
    assert.equal(parsed.host, "localhost:3000");
    assert.equal(
      getIngestUrl(parsed),
      "http://localhost:3000/api/v1/ingest/p1/envelope",
    );
  });

  test("rejects a DSN missing the public key", () => {
    assert.throws(() => parseDsn("https://argus.example.com/proj"), /missing public key/);
  });

  test("rejects a DSN missing the project id", () => {
    assert.throws(() => parseDsn("https://k@argus.example.com/"), /missing project id/);
  });

  test("rejects non-http(s) protocols", () => {
    assert.throws(() => parseDsn("ftp://k@host/proj"), /protocol must be http/);
  });

  test("rejects strings that aren't URLs at all", () => {
    assert.throws(() => parseDsn("not a url"), /not a valid URL/);
  });
});

describe("buildEnvelope", () => {
  test("defaults: level error, ms timestamp, exception nested", () => {
    const before = Date.now();
    const env = buildEnvelope("TypeError", "x is not a function", [
      { filename: "app.js", lineno: 1 },
    ]);
    assert.equal(env.level, "error");
    assert.ok(env.timestamp >= before && env.timestamp <= Date.now());
    assert.ok(env.timestamp >= MS_EPOCH_2020); /* the sec-vs-ms contract */
    assert.deepEqual(env.exception, {
      type: "TypeError",
      value: "x is not a function",
      stacktrace: { frames: [{ filename: "app.js", lineno: 1 }] },
    });
  });

  test("options pass through and level is overridable", () => {
    const env = buildEnvelope("Error", "m", [], {
      level: "warning",
      environment: "prod",
      release: "1.2.3",
      tags: { a: "b" },
      request: { url: "/x", method: "GET" },
    });
    assert.equal(env.level, "warning");
    assert.equal(env.environment, "prod");
    assert.equal(env.release, "1.2.3");
    assert.deepEqual(env.tags, { a: "b" });
    assert.deepEqual(env.request, { url: "/x", method: "GET" });
  });
});

describe("sendEnvelope — transport rules", () => {
  const ENVELOPE = {
    exception: { type: "E", value: "v", stacktrace: { frames: [{ filename: "f", lineno: 1 }] } },
  };
  const INGEST = "https://argus.test/api/v1/ingest/p1/envelope";

  /* run a send to completion under mocked timers, ticking past every backoff */
  async function settle(t, promise) {
    for (let i = 0; i < 6; i++) {
      await flush();
      t.mock.timers.tick(2000);
    }
    await flush();
    return promise;
  }

  test("posts once with auth header and stops on 200", async () => {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
      calls.push({ url, opts });
      return { ok: true, status: 200 };
    };
    await sendEnvelope(INGEST, "pk", ENVELOPE);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, INGEST);
    assert.equal(calls[0].opts.method, "POST");
    assert.equal(calls[0].opts.headers["x-sentry-auth"], "Sentry sentry_key=pk");
    assert.deepEqual(JSON.parse(calls[0].opts.body), ENVELOPE);
  });

  test("429 (quota) → dropped silently: no retry, no warn", async (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    let calls = 0;
    globalThis.fetch = async () => (calls++, { ok: false, status: 429 });
    await sendEnvelope(INGEST, "pk", ENVELOPE);
    assert.equal(calls, 1);
    assert.equal(warn.mock.callCount(), 0);
  });

  test("other 4xx → one warn, no retry (payload/key won't improve)", async (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    let calls = 0;
    globalThis.fetch = async () => (calls++, { ok: false, status: 400 });
    await sendEnvelope(INGEST, "pk", ENVELOPE);
    assert.equal(calls, 1);
    assert.equal(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /rejected by server \(400\)/);
  });

  test("5xx → retries twice with backoff, then warns once", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const warn = t.mock.method(console, "warn", () => {});
    let calls = 0;
    globalThis.fetch = async () => (calls++, { ok: false, status: 503 });
    await settle(t, sendEnvelope(INGEST, "pk", ENVELOPE));
    assert.equal(calls, 3); /* 1 + MAX_RETRIES */
    assert.equal(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /failed to send event after retries/);
  });

  test("network failure then success → retried, no warn", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const warn = t.mock.method(console, "warn", () => {});
    let calls = 0;
    globalThis.fetch = async () => {
      if (++calls === 1) throw new Error("ECONNREFUSED");
      return { ok: true, status: 200 };
    };
    await settle(t, sendEnvelope(INGEST, "pk", ENVELOPE));
    assert.equal(calls, 2);
    assert.equal(warn.mock.callCount(), 0);
  });

  test("NEVER throws into the host app, whatever fetch does", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    t.mock.method(console, "warn", () => {});
    globalThis.fetch = () => {
      throw "not even an Error"; /* sync throw, non-Error — worst case */
    };
    await assert.doesNotReject(settle(t, sendEnvelope(INGEST, "pk", ENVELOPE)));
  });
});
