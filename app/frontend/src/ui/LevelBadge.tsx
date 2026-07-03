import type { Level } from "../types/api";
import { LEVEL_META } from "../utils/levels";

/* pill chip: colored dot + mono uppercase level label (design.md §4) */
export function LevelBadge({ level }: { level: Level }) {
  const { color, bg, border } = LEVEL_META[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{ background: color }}
      />
      <span
        className="font-mono text-[10px] font-semibold tracking-[0.08em]"
        style={{ color }}
      >
        {level}
      </span>
    </span>
  );
}
