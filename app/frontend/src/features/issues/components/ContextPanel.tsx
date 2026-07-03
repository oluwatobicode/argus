import type { IssueEvent } from "../../../types/api";

/* right-column context + tags, built only from fields the event actually has */
export function ContextPanel({ event }: { event: IssueEvent }) {
  const rows: { k: string; v: string }[] = [];
  if (event.contexts?.browser) {
    rows.push({
      k: "Browser",
      v: `${event.contexts.browser.name} ${event.contexts.browser.version}`,
    });
  }
  if (event.contexts?.os) {
    rows.push({
      k: "OS",
      v: `${event.contexts.os.name} ${event.contexts.os.version}`,
    });
  }
  if (event.userContext?.email || event.userContext?.id) {
    rows.push({ k: "User", v: event.userContext.email ?? event.userContext.id! });
  }
  if (event.request?.url) {
    rows.push({
      k: "Request",
      v: `${event.request.method ?? "GET"} ${event.request.url}`,
    });
  }

  const tags = Object.entries(event.tags ?? {});

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[18px] border border-border bg-surface p-[18px]">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
          Context
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-text-3">No context captured.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.k}>
                <div className="text-[11px] text-text-3">{row.k}</div>
                <div className="mt-0.5 break-words font-mono text-[12px] text-text-1">
                  {row.v}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="rounded-[18px] border border-border bg-surface p-[18px]">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-text-4">
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(([k, v]) => (
              <div
                key={k}
                className="rounded-full border border-lime/20 bg-lime/5 px-[11px] py-[5px] font-mono text-[11px]"
              >
                <span className="text-text-3">{k}: </span>
                <span className="text-text-1">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
