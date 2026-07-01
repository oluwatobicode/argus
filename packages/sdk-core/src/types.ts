/*
 * TODO(you): the envelope contract types.
 *
 * Mirror the shapes in app/backend/api/src/validators/envelope.validator.ts
 * (that Zod schema is the source of truth — see "Envelope contract" in AGENTS.md):
 *
 *   - StackFrame      { filename, function?, lineno, colno? }
 *   - ExceptionPayload{ type, value, stacktrace: { frames: StackFrame[] } }
 *   - Breadcrumb      { type, message?, timestamp?, data? }
 *   - Envelope        { level?, timestamp?, environment?, release?, exception,
 *                       user?, breadcrumbs?, contexts?, tags?, request? }
 *
 * Remember: all timestamps are MILLISECONDS since epoch (Date.now()).
 */

export {};
