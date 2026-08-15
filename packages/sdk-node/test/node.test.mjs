import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { init, captureException, argusErrorHandler, parseStack } from "@argusdev/sdk-node";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, status: 200 };
};

describe("parseStack (V8)", () => {
  test("named and anonymous frames", () => {
    const frames = parseStack(
      "Error: boom\n    at inner (/app/src/service.ts:42:17)\n    at /app/src/index.ts:7:3",
    );
    assert.deepEqual(frames, [
      { filename: "/app/src/service.ts", lineno: 42, colno: 17, function: "inner" },
      { filename: "/app/src/index.ts", lineno: 7, colno: 3 },
    ]);
  });

  test("no stack → empty array", () => {
    assert.deepEqual(parseStack(undefined), []);
  });
});

describe("init + captureException", () => {
  test("captureException before init() is a silent no-op", async () => {
    await captureException(new Error("too early"));
    assert.equal(sent.length, 0);
  });

  test("init() registers exactly one handler for each process hook", () => {
    const beforeU = process.listeners("uncaughtException").length;
    const beforeR = process.listeners("unhandledRejection").length;
    init({ dsn: "https://pk@argus.test/proj1", environment: "test", release: "9.9.9" });
    assert.equal(process.listeners("uncaughtException").length, beforeU + 1);
    assert.equal(process.listeners("unhandledRejection").length, beforeR + 1);
  });

  test("real Error → envelope with parsed frames, env/release, ms timestamp", async () => {
    function throwDeep() {
      return new Error("db exploded");
    }
    await captureException(throwDeep());
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, "https://argus.test/api/v1/ingest/proj1/envelope");
    const env = sent[0].body;
    assert.equal(env.exception.type, "Error");
    assert.equal(env.exception.value, "db exploded");
    assert.equal(env.environment, "test");
    assert.equal(env.release, "9.9.9");
    assert.ok(env.timestamp >= 1_577_836_800_000); /* ms contract */
    const top = env.exception.stacktrace.frames[0];
    assert.equal(top.function, "throwDeep");
    assert.ok(top.filename.includes("node.test.mjs"));
  });

  test("non-Error → normalized, never zero frames", async () => {
    await captureException("just a string");
    const env = sent.at(-1).body;
    assert.equal(env.exception.type, "Error");
    assert.equal(env.exception.value, "just a string");
    assert.ok(env.exception.stacktrace.frames.length >= 1);
  });

  test("unhandledRejection handler captures without exiting", async () => {
    const before = sent.length;
    /* invoke the registered handler directly — emitting the event process-wide
       would also wake the test runner's own listeners */
    const handler = process.listeners("unhandledRejection").at(-1);
    handler(new Error("rejected in background"), Promise.resolve());
    await flush();
    assert.equal(sent.length, before + 1);
    assert.equal(sent.at(-1).body.exception.value, "rejected in background");
  });
});

describe("argusErrorHandler (express)", () => {
  test("captures with request context and forwards to next() synchronously", async () => {
    const before = sent.length;
    const err = new Error("route blew up");
    let forwarded = null;
    argusErrorHandler()(
      err,
      { method: "POST", originalUrl: "/api/users?page=2", url: "/api/users" },
      {},
      (e) => {
        forwarded = e;
      },
    );
    assert.equal(forwarded, err); /* observe, never absorb — before the send settles */
    await flush();
    assert.equal(sent.length, before + 1);
    /* originalUrl preferred over url */
    assert.deepEqual(sent.at(-1).body.request, { method: "POST", url: "/api/users?page=2" });
  });
});

describe("uncaughtException (real subprocess)", () => {
  test("event is delivered, then the process exits 1 — crash behavior preserved", async () => {
    const { createServer } = await import("node:http");
    const bodies = [];
    const server = createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        bodies.push(JSON.parse(raw));
        res.statusCode = 200;
        res.end("{}");
      });
    });
    await new Promise((r) => server.listen(0, r));
    const port = server.address().port;

    const script = `
      import { init } from "@argusdev/sdk-node";
      init({ dsn: "http://pk@127.0.0.1:${port}/proj1" });
      setTimeout(() => { throw new Error("kaboom-uncaught"); }, 10);
    `;
    const { execFile } = await import("node:child_process");
    const exitCode = await new Promise((resolve) => {
      execFile(
        process.execPath,
        ["--input-type=module", "-e", script],
        /* cwd = package root, so "@argusdev/sdk-node" resolves by self-reference */
        { cwd: fileURLToPath(new URL("..", import.meta.url)), timeout: 10_000 },
        (err) => resolve(err ? err.code : 0),
      );
    });
    server.close();

    assert.equal(exitCode, 1);
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].exception.value, "kaboom-uncaught");
  });
});
