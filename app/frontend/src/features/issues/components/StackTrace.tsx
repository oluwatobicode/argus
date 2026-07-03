import type { IssueEvent, Level } from "../../../types/api";
import { LEVEL_META } from "../../../utils/levels";

/* stack trace viewer: top frame tinted in level color, vendor frames dimmed
   (design.md §4). Function color: top = pink, app = lime, vendor = muted. */
export function StackTrace({ event, level }: { event: IssueEvent; level: Level }) {
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
              <span style={{ color: fnColor }}>{frame.function ?? "<anonymous>"}</span>{" "}
              <span className="text-text-4">in</span>{" "}
              <span className="text-text-2">{frame.filename}</span>
              <span className="text-text-4">
                :{frame.lineno}
                {frame.colno != null ? `:${frame.colno}` : ""}
              </span>
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
