import { captureException } from "./init";
/*
 * Usage (LAST middleware, after routes):
 *   app.use(argusErrorHandler());
 *
 * Captures the error with request context, then passes it along so the
 * app's own error handler still responds to the user. We observe, never absorb.
 */
export function argusErrorHandler() {
    return (err, req, _res, next) => {
        void captureException(err, {
            request: {
                method: req.method,
                url: req.originalUrl ?? req.url,
            },
        });
        next(err);
    };
}
//# sourceMappingURL=express.js.map