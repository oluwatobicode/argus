import { useEffect, useState } from "react";
import { ERR_POOL, clock } from "./demoData";

const SDKS = [
  { name: "React", sub: "@argusdev/sdk-react", logo: "/React-icon.svg", alt: "React logo" },
  { name: "Next.js", sub: "React + Node ready", logo: "/next-js.svg", alt: "Next.js logo", markClassName: "rounded-full bg-[#e7e8ee] p-1" },
  { name: "Node.js", sub: "@argusdev/sdk-node", logo: "/Node.js.svg", alt: "Node.js logo" },
  { name: "JavaScript", sub: "@argusdev/sdk-core", logo: "/js-logo.png", alt: "JavaScript logo" },
  { name: "TypeScript", sub: "first-class types", logo: "/ts-logo.png", alt: "TypeScript logo" },
];

const FW: Record<
  string,
  { label: string; file: string; code: { t: string; c: string }[][] }
> = {
  react: {
    label: "React",
    file: "main.tsx",
    code: [
      [{ t: "kw", c: "import" }, { t: "tx", c: " { init, ArgusErrorBoundary } from " }, { t: "st", c: '"@argusdev/sdk-react"' }],
      [{ t: "tx", c: "" }],
      [{ t: "tx", c: "init({ dsn: " }, { t: "st", c: '"https://ed533eb8@…"' }, { t: "tx", c: " })" }],
      [{ t: "tx", c: "<ArgusErrorBoundary><App /></ArgusErrorBoundary>" }],
    ],
  },
  browser: {
    label: "Browser",
    file: "app.ts",
    code: [
      [{ t: "kw", c: "import" }, { t: "tx", c: " { init } from " }, { t: "st", c: '"@argusdev/sdk-browser"' }],
      [{ t: "tx", c: "" }],
      [{ t: "tx", c: "init({ dsn: " }, { t: "st", c: '"https://ed533eb8@…"' }, { t: "tx", c: " })" }],
      [{ t: "cm", c: "// errors + web vitals, captured automatically" }],
    ],
  },
  node: {
    label: "Node.js",
    file: "server.ts",
    code: [
      [{ t: "kw", c: "import" }, { t: "tx", c: " { init } from " }, { t: "st", c: '"@argusdev/sdk-node"' }],
      [{ t: "tx", c: "" }],
      [{ t: "tx", c: "init({ dsn: " }, { t: "st", c: '"https://ed533eb8@…"' }, { t: "tx", c: " })" }],
      [{ t: "cm", c: "// uncaught crashes reported before exit" }],
    ],
  },
};

const TOKEN_COLOR: Record<string, string> = {
  kw: "#ff4f9a",
  st: "#A3E635",
  tx: "#e7e8ee",
  cm: "#5a5f6d",
};

interface FeedLog {
  id: string;
  time: string;
  level: string;
  color: string;
  msg: string;
  route: string;
}

export function Features() {
  const [fwTab, setFwTab] = useState<keyof typeof FW>("react");
  const [feed, setFeed] = useState<FeedLog[]>(() =>
    ERR_POOL.slice(0, 5).map((l, idx) => ({ ...l, id: `f${idx}`, time: clock(idx) })),
  );

  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n++;
      const nx = { ...ERR_POOL[(n + 4) % ERR_POOL.length], id: `r${n}`, time: clock(n) };
      setFeed((f) => [...f.slice(1), nx]);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* SDK cards */}
      <section className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-4 pb-14 sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-6 sm:pb-20">
        <div className="mb-[30px] text-center font-code text-[11px] tracking-[0.2em] text-[#5a5f6d] uppercase">
          One SDK per platform · drop-in ready
        </div>
        <div className="grid grid-cols-1 gap-3.5 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {SDKS.map((s) => (
            <div
              key={s.name}
              className="flex min-w-0 flex-col items-center gap-1.5 border border-[#343843] bg-[rgba(17,19,24,0.72)] px-3.5 py-5 text-center transition-colors hover:border-lime/45 sm:py-[26px]"
            >
              <div className={`mb-2 flex h-11 w-11 items-center justify-center ${s.markClassName ?? ""}`}>
                <img
                  src={s.logo}
                  alt={s.alt}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="text-[14.5px] font-bold text-[#e7e8ee]">{s.name}</div>
              <div className="max-w-full break-all font-code text-[11px] text-[#5a5f6d]">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DX bento */}
      <section id="features" className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-10 sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-[50px]">
        <h2 className="mb-8 font-display text-[28px] leading-[1.14] font-extrabold sm:mb-[54px] sm:text-[34px] md:text-[40px]">
          First-class
          <br />
          developer experience
        </h2>

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            {/* one-line setup */}
            <div className="flex min-w-0 flex-col border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-[30px]">
              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center border border-lime/45 bg-lime/10 text-base text-lime">
                  ❯
                </div>
                <div className="text-[18px] font-extrabold">Set up in one line</div>
              </div>
              <p className="mb-5 text-sm leading-[1.6] text-[#9699a6]">
                Install the SDK, pass your DSN, done. Errors start flowing in seconds.
              </p>
              <div className="mt-auto overflow-x-auto border border-[rgba(52,56,67,0.72)] bg-[#08090c] px-4 py-4 font-code text-[12px] sm:px-[18px] sm:text-[13px]">
                <span className="text-lime">$</span>{" "}
                <span className="whitespace-nowrap text-[#e7e8ee]">npm install @argusdev/sdk-browser</span>
              </div>
            </div>

            {/* framework tabs */}
            <div className="flex min-w-0 flex-col border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-[30px]">
              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center border border-lime/45 bg-lime/10 text-lime">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div className="text-[18px] font-extrabold">Meet your framework</div>
              </div>
              <p className="mb-[18px] text-sm leading-[1.6] text-[#9699a6]">
                First-party integrations that hook into your error boundaries and process handlers.
              </p>
              <div className="mb-3.5 flex flex-wrap gap-2">
                {(Object.keys(FW) as (keyof typeof FW)[]).map((key) => {
                  const active = fwTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFwTab(key)}
                      className={`cursor-pointer border px-[15px] py-[7px] font-code text-[12px] font-semibold transition-colors ${
                        active
                          ? "border-lime/50 bg-lime/15 text-lime"
                          : "border-[#343843] bg-[rgba(17,19,24,0.72)] text-[#9699a6]"
                      }`}
                    >
                      {FW[key].label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto overflow-hidden border border-[rgba(52,56,67,0.72)] bg-[#08090c]">
                <div className="flex items-center gap-[7px] border-b border-[rgba(52,56,67,0.72)] px-3.5 py-2.5">
                  <span className="h-2 w-2 bg-[#343843]" />
                  <span className="h-2 w-2 bg-[#343843]" />
                  <span className="ml-2 font-code text-[11px] text-[#5a5f6d]">{FW[fwTab].file}</span>
                </div>
                <div className="min-h-[118px] overflow-x-auto px-4 py-4 font-code text-[11.5px] leading-[1.9] sm:px-[18px] sm:text-[12.5px]">
                  {FW[fwTab].code.map((line, i) => (
                    <div key={i} className="min-w-max whitespace-pre">
                      {line.length === 1 && line[0].c === ""
                        ? " "
                        : line.map((tok, j) => (
                            <span key={j} style={{ color: TOKEN_COLOR[tok.t] }}>
                              {tok.c}
                            </span>
                          ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* live feed */}
          <div className="relative flex min-w-0 flex-col overflow-hidden border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-[30px]">
            <div className="pointer-events-none absolute -top-[90px] -right-[90px] h-[280px] w-[280px] bg-[radial-gradient(closest-side,rgba(163,230,53,0.14),transparent_70%)]" />
            <div className="mb-4 flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center border border-lime/45 bg-lime/10 text-lime">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="text-[18px] font-extrabold">Instant observability</div>
            </div>
            <p className="text-sm leading-[1.6] text-[#9699a6]">
              Watch errors land the second they happen — level, message, and affected route, streaming live.
            </p>
            <div className="mt-auto flex flex-col gap-[9px] pt-6">
              {feed.map((f) => (
                <div
                  key={f.id}
                  className="flex min-w-0 animate-[landing-slidein_0.4s_ease] flex-wrap items-center gap-x-3 gap-y-1 border border-[rgba(52,56,67,0.72)] bg-[#08090c] px-[15px] py-3 font-code text-[11.5px] sm:flex-nowrap"
                >
                  <span className="h-2 w-2 flex-none" style={{ background: f.color }} />
                  <span className="w-[58px] flex-none" style={{ color: f.color }}>{f.level}</span>
                  <span className="flex-1 truncate text-[#e7e8ee]">{f.msg}</span>
                  <span className="ml-5 flex-none text-[#5a5f6d] sm:ml-0">{f.route}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
