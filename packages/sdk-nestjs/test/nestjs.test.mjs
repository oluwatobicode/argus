import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { init, ArgusExceptionFilter } from "@argusdev/sdk-nestjs";

const flush = () => new Promise((r) => setImmediate(r));
const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push(JSON.parse(opts.body));
  return { ok: true, status: 200 };
};

init({ dsn: "https://pk@argus.test/proj1", environment: "test" });

/* a fake ArgumentsHost — express-style response unless told otherwise */
function makeHost({ fastify = false, headers = {} } = {}) {
  const responded = [];
  const response = {
    status(code) {
      responded.push({ code });
      return response;
    },
    ...(fastify
      ? { send(body) { responded.at(-1).body = body; } }
      : { json(body) { responded.at(-1).body = body; } }),
  };
  const request = { method: "POST", url: "/api/orders", headers };
  return {
    responded,
    host: { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) },
  };
}

/* Nest's HttpException, by shape */
const httpException = (status, response) => ({
  getStatus: () => status,
  getResponse: () => response,
});

describe("ArgusExceptionFilter", () => {
  test("plain Error → captured + Nest's default 500 body (express adapter)", async (t) => {
    t.mock.method(console, "error", () => {});
    const { host, responded } = makeHost({
      headers: { "user-agent": ["filter-UA", "dup"], cookie: "session=nest-secret" },
    });
    new ArgusExceptionFilter().catch(new Error("db exploded"), host);
    await flush();

    assert.deepEqual(responded, [
      { code: 500, body: { statusCode: 500, message: "Internal server error" } },
    ]);
    assert.equal(sent.length, 1);
    const env = sent[0];
    assert.equal(env.exception.value, "db exploded");
    assert.deepEqual(env.tags, { httpStatus: "500" });
    assert.deepEqual(env.request, {
      method: "POST",
      url: "/api/orders",
      headers: { "user-agent": "filter-UA" } /* array narrowed, cookie dropped */,
    });
    assert.ok(!JSON.stringify(env).includes("nest-secret"));
  });

  test("fastify adapter: send() used when json() is absent", async (t) => {
    t.mock.method(console, "error", () => {});
    const { host, responded } = makeHost({ fastify: true });
    new ArgusExceptionFilter().catch(new Error("boom"), host);
    await flush();
    assert.equal(responded[0].code, 500);
    assert.deepEqual(responded[0].body, { statusCode: 500, message: "Internal server error" });
  });

  test("4xx HttpException → response preserved, NOT captured, NOT re-logged", async (t) => {
    const consoleSpy = t.mock.method(console, "error", () => {});
    const before = sent.length;
    const { host, responded } = makeHost();
    new ArgusExceptionFilter().catch(httpException(404, "Not Found"), host);
    await flush();
    /* string response → Nest convention { statusCode, message } */
    assert.deepEqual(responded, [{ code: 404, body: { statusCode: 404, message: "Not Found" } }]);
    assert.equal(sent.length, before); /* control flow ≠ crash */
    assert.equal(consoleSpy.mock.callCount(), 0);
  });

  test("object response body passes through untouched", async (t) => {
    t.mock.method(console, "error", () => {});
    const body = { statusCode: 422, message: ["name must be a string"], error: "Unprocessable Entity" };
    const { host, responded } = makeHost();
    new ArgusExceptionFilter().catch(httpException(422, body), host);
    await flush();
    assert.deepEqual(responded[0].body, body);
  });

  test("5xx HttpException → captured AND re-logged (observe, never absorb)", async (t) => {
    const consoleSpy = t.mock.method(console, "error", () => {});
    const before = sent.length;
    const { host } = makeHost();
    const exception = httpException(503, { statusCode: 503, message: "Service Unavailable" });
    new ArgusExceptionFilter().catch(exception, host);
    await flush();
    assert.equal(sent.length, before + 1);
    assert.equal(sent.at(-1).tags.httpStatus, "503");
    assert.equal(consoleSpy.mock.callCount(), 1);
    assert.equal(consoleSpy.mock.calls[0].arguments[0], exception);
  });
});
