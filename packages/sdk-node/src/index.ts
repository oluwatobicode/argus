/*
 * @argus/sdk-node — build order:
 *   1. stacktrace.ts  — parse V8 error.stack string → StackFrame[]
 *   2. init.ts        — init({ dsn }): process.on("uncaughtException" / "unhandledRejection")
 *   3. express.ts     — errorHandler() middleware: captures err, then next(err)
 */

export {};
