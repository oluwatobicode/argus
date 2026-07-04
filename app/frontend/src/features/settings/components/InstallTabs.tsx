import { useState } from "react";
import { CopyButton } from "../../../ui/CopyButton";

interface Framework {
  key: string;
  label: string;
  pkg: string;
  snippet: (dsn: string) => string;
}

const FRAMEWORKS: Framework[] = [
  {
    key: "browser",
    label: "Browser",
    pkg: "@argusdev/sdk-browser",
    snippet: (dsn) =>
      `import { init } from "@argusdev/sdk-browser";\n\ninit({ dsn: "${dsn}" });`,
  },
  {
    key: "react",
    label: "React",
    pkg: "@argusdev/sdk-react",
    snippet: (dsn) =>
      `import { init, ArgusErrorBoundary } from "@argusdev/sdk-react";\n\ninit({ dsn: "${dsn}" });\n\n// wrap your tree:\n// <ArgusErrorBoundary><App /></ArgusErrorBoundary>`,
  },
  {
    key: "node",
    label: "Node",
    pkg: "@argusdev/sdk-node",
    snippet: (dsn) =>
      `import { init } from "@argusdev/sdk-node";\n\ninit({ dsn: "${dsn}" });`,
  },
];

export function InstallTabs({ dsn }: { dsn: string }) {
  const [active, setActive] = useState(FRAMEWORKS[0]);
  const install = `npm install ${active.pkg}`;
  const snippet = active.snippet(dsn);
  const full = `${install}\n\n${snippet}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {FRAMEWORKS.map((fw) => {
            const isActive = fw.key === active.key;
            return (
              <button
                key={fw.key}
                onClick={() => setActive(fw)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border border-lime/30 bg-lime/10 text-lime"
                    : "border border-border-2 bg-surface-2 text-text-2 hover:bg-surface"
                }`}
              >
                {fw.label}
              </button>
            );
          })}
        </div>
        {dsn && <CopyButton value={full} label="Copy" />}
      </div>

      <pre className="mt-3 overflow-x-auto rounded-2xl border border-border bg-bg-1 p-4 font-mono text-[12.5px] leading-relaxed">
        <span className="text-text-4">$ </span>
        <span className="text-lime">npm</span>
        <span className="text-text-3"> install {active.pkg}</span>
        {"\n\n"}
        <span className="text-text-1">{snippet}</span>
      </pre>
    </div>
  );
}
