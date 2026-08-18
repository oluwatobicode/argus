import type { IssueEvent, Level, StackFrame } from "../../../types/api";
import { LEVEL_META } from "../../../utils/levels";

function CodeContext({ frame, level }: { frame: StackFrame; level: Level }) {
  if (frame.contextLine == null) return null;

  const pre = frame.preContext ?? [];
  const post = frame.postContext ?? [];
  const startLine = frame.lineno - pre.length;
  const rows = [
    ...pre.map((code, i) => ({ no: startLine + i, code, crash: false })),
    { no: frame.lineno, code: frame.contextLine, crash: true },
    ...post.map((code, i) => ({
      no: frame.lineno + 1 + i,
      code,
      crash: false,
    })),
  ];

  return (
    <div className="mt-2.5 overflow-x-auto rounded-xl border border-border bg-bg-1">
      {rows.map((row) => (
        <div
          key={row.no}
          className="flex min-w-max items-baseline whitespace-pre px-0 py-[1px]"
          style={
            row.crash
              ? {
                  background: LEVEL_META[level].bg,
                  borderLeft: `2px solid ${LEVEL_META[level].color}`,
                }
              : { borderLeft: "2px solid transparent" }
          }
        >
          <span
            className="w-12 flex-none pr-3 text-right text-[11px] select-none"
            style={{ color: row.crash ? LEVEL_META[level].color : "#565B52" }}
          >
            {row.no}
          </span>
          <span className={row.crash ? "text-text-1" : "text-text-3"}>
            {row.code || " "}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StackTrace({
  event,
  level,
}: {
  event: IssueEvent;
  level: Level;
}) {
  const frames = event.stacktrace?.frames ?? [];
  const levelColor = LEVEL_META[level].color;

  return (
    <div>
      <div className="border-b border-divider px-5 py-4 font-mono text-[12.5px] leading-relaxed text-text-2">
        {event.message}
      </div>
      <div className="font-mono text-[12.5px] leading-relaxed">
        {frames.map((frame, idx) => {
          const isTop = idx === 0;
          const isVendor = frame.filename.includes("node_modules");
          const fnColor = isTop ? "#F0568B" : isVendor ? "#99A094" : "#A3E635";
          const hasCode = frame.contextLine != null;

          const header = (
            <>
              <span style={{ color: fnColor }}>
                {frame.function ?? "<anonymous>"}
              </span>{" "}
              <span className="text-text-4">in</span>{" "}
              <span className="text-text-2">{frame.filename}</span>
              <span className="text-text-4">
                :{frame.lineno}
                {frame.colno != null ? `:${frame.colno}` : ""}
              </span>
            </>
          );

          return (
            <div
              key={idx}
              className="px-5 py-3"
              style={{
                background: isTop ? LEVEL_META[level].bg : "transparent",
                borderLeft: `2px solid ${isTop ? levelColor : "transparent"}`,
                opacity: isVendor ? 0.5 : 1,
              }}
            >
              {/* top frame: code always visible; deeper frames: fold it away */}
              {hasCode && !isTop ? (
                <details>
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    {header}{" "}
                    <span className="text-[11px] text-lime/70">
                      {"{ code }"}
                    </span>
                  </summary>
                  <CodeContext frame={frame} level={level} />
                </details>
              ) : (
                <>
                  {header}
                  {hasCode && <CodeContext frame={frame} level={level} />}
                </>
              )}
            </div>
          );
        })}
        {frames.length === 0 && (
          <div className="px-5 py-4 text-text-3">No stack trace captured.</div>
        )}
      </div>
    </div>
  );
}
