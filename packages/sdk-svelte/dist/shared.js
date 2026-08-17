/*
 * Shared between client and server wrappers: what an error input is worth
 * as envelope context. Headers are NOT forwarded wholesale — cookies and
 * authorization live in there; user-agent is the one worth having.
 */
export function contextFrom(input) {
    const tags = {};
    const event = input.event;
    if (event?.route?.id)
        tags.routeId = event.route.id;
    if (typeof input.status === "number")
        tags.status = String(input.status);
    /* SvelteKit's own label ("Internal Error", "Not Found") — cheap context */
    if (input.message)
        tags.sveltekitMessage = input.message.slice(0, 200);
    const method = event?.request?.method;
    const userAgent = event?.request?.headers?.get?.("user-agent") ?? undefined;
    const result = { tags };
    if (event?.url?.pathname || method || userAgent) {
        result.request = {
            ...(event?.url?.pathname ? { url: event.url.pathname } : {}),
            ...(method ? { method } : {}),
            ...(userAgent ? { headers: { "user-agent": userAgent } } : {}),
        };
    }
    return result;
}
/* 404s reach handleError too (unmatched routes) — they're traffic noise, not
   crashes. Everything else is worth an Issue. */
export function shouldCapture(input) {
    return input.status !== 404;
}
//# sourceMappingURL=shared.js.map