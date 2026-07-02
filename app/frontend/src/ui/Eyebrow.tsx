import type { ReactNode } from "react";

/* mono uppercase section label — design.md §2 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-4">
      {children}
    </span>
  );
}
