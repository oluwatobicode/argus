/*
 * The shape SvelteKit hands to handleError, mirrored structurally — every
 * field optional/widened so both HandleClientError and HandleServerError
 * inputs are assignable to it without depending on @sveltejs/kit.
 */
export interface ArgusErrorInput {
  error: unknown;
  status?: number;
  message?: string;
  event?: {
    /* the dynamic PATTERN ("/blog/[slug]") — stable across requests, the
       grouping/filter key */
    route?: { id?: string | null };
    url?: { pathname?: string };
    /* server-only: the incoming Request */
    request?: {
      method?: string;
      headers?: { get(name: string): string | null };
    };
  };
}

export interface ArgusTagsAndRequest {
  tags: Record<string, string>;
  request?: { url?: string; method?: string; headers?: Record<string, string> };
}

/*
 * Shared between client and server wrappers: what an error input is worth
 * as envelope context. Headers are NOT forwarded wholesale — cookies and
 * authorization live in there; user-agent is the one worth having.
 */
export function contextFrom(input: ArgusErrorInput): ArgusTagsAndRequest {
  const tags: Record<string, string> = {};
  const event = input.event;

  if (event?.route?.id) tags.routeId = event.route.id;
  if (typeof input.status === "number") tags.status = String(input.status);
  /* SvelteKit's own label ("Internal Error", "Not Found") — cheap context */
  if (input.message) tags.sveltekitMessage = input.message.slice(0, 200);

  const method = event?.request?.method;
  const userAgent = event?.request?.headers?.get?.("user-agent") ?? undefined;

  const result: ArgusTagsAndRequest = { tags };
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
export function shouldCapture(input: ArgusErrorInput): boolean {
  return input.status !== 404;
}
