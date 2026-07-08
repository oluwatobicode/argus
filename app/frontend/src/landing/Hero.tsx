import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { CMD, ERR_POOL, clock } from "./demoData";

interface TermLog {
  id: string;
  time: string;
  level: string;
  color: string;
  msg: string;
}

/* floating error chip — --r feeds the per-chip rotation in the float keyframe */
const rot = (r: string) => ({ "--r": r }) as CSSProperties;

export function Hero() {
  const [crashHover, setCrashHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const [termText, setTermText] = useState("");
  const [termStep, setTermStep] = useState(0);
  const [termLogs, setTermLogs] = useState<TermLog[]>([]);
  const [dedupCount, setDedupCount] = useState(497);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let feed: ReturnType<typeof setInterval> | undefined;

    let i = 0;
    const type = () => {
      i++;
      setTermText(CMD.slice(0, i));
      if (i < CMD.length) {
        timers.push(setTimeout(type, 55));
        return;
      }
      timers.push(setTimeout(() => setTermStep(1), 500));
      timers.push(setTimeout(() => setTermStep(2), 1300));
      timers.push(
        setTimeout(() => {
          setTermStep(3);
          setTermLogs(
            ERR_POOL.slice(0, 3).map((l, idx) => ({ ...l, id: `s${idx}`, time: clock(idx) })),
          );
          let n = 0;
          feed = setInterval(() => {
            n++;
            const nx = { ...ERR_POOL[(n + 2) % ERR_POOL.length], id: `t${n}`, time: clock(n + 3) };
            setTermLogs((logs) => [...logs.slice(-4), nx]);
            setDedupCount((c) => c + Math.ceil(Math.random() * 3));
          }, 1100);
        }, 2100),
      );
    };
    timers.push(setTimeout(type, 600));

    return () => {
      timers.forEach(clearTimeout);
      if (feed) clearInterval(feed);
    };
  }, []);

  const copyCmd = () => {
    navigator.clipboard?.writeText(CMD).catch(() => {});
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-12 text-center sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-[72px]">
      {/* floating error illustration (desktop only) */}
      <div className="pointer-events-none absolute inset-0 z-0 max-[1149px]:hidden">
        <span style={rot("-5deg")} className="absolute top-[330px] left-0 inline-flex max-w-[calc(50%_-_310px)] animate-[landing-float_5.5s_ease-in-out_infinite] items-center gap-[9px] overflow-hidden rounded-[10px] border border-[rgba(240,68,56,0.4)] bg-[rgba(240,68,56,0.08)] px-3 py-[7px] font-code text-[11.5px] whitespace-nowrap text-error">
          <span className="h-[7px] w-[7px] rounded-full bg-error" />
          TypeError: cart is undefined
        </span>
        <span style={rot("4deg")} className="absolute top-[305px] right-0 inline-flex max-w-[calc(50%_-_310px)] animate-[landing-float_6.5s_ease-in-out_0.9s_infinite] items-center gap-[9px] overflow-hidden rounded-[10px] border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.07)] px-3 py-[7px] font-code text-[11.5px] whitespace-nowrap text-warning">
          <span className="h-[7px] w-[7px] rounded-full bg-warning" />
          ERROR 500 · /checkout
        </span>
        <span style={rot("-3deg")} className="absolute top-[408px] left-9 animate-[landing-float_7s_ease-in-out_1.6s_infinite] font-code text-[11px] text-[#5a5f6d] opacity-75">
          at renderCart (App.tsx:42:17)
        </span>
        <span style={rot("3deg")} className="absolute top-[398px] right-[34px] inline-flex max-w-[calc(50%_-_330px)] animate-[landing-float_6s_ease-in-out_2.4s_infinite] items-center gap-[9px] overflow-hidden rounded-[10px] border border-[rgba(194,42,49,0.45)] bg-[rgba(194,42,49,0.09)] px-3 py-[7px] font-code text-[11.5px] whitespace-nowrap text-fatal">
          <span className="h-[7px] w-[7px] rounded-full bg-fatal" />
          unhandled rejection
        </span>
      </div>

      <h1 className="relative z-10 mx-auto max-w-[900px] font-display text-[34px] leading-[1.1] font-extrabold sm:text-[42px] md:text-[58px] md:leading-[1.08]">
        Catch every{" "}
        <span
          onMouseEnter={() => setCrashHover(true)}
          onMouseLeave={() => setCrashHover(false)}
          className="relative inline-block cursor-pointer align-bottom"
        >
          <span
            className="relative inline-block border border-lime/50 bg-lime/15 px-2.5 text-lime sm:px-4"
            style={{ animation: crashHover ? "landing-shake 0.4s linear infinite" : "none" }}
          >
            crash
            <span className="absolute -top-3 -right-2.5 flex h-[30px] w-[30px] rotate-12 items-center justify-center border-2 border-[rgba(255,79,154,0.55)] bg-[#15181e] text-[15px] leading-none shadow-[0_4px_14px_rgba(0,0,0,0.5)] sm:-top-4 sm:-right-3.5 sm:h-[38px] sm:w-[38px] sm:text-[19px]">
              🔥
            </span>
          </span>
        </span>{" "}
        before your users do.
      </h1>

      <p className="relative z-10 mx-auto mt-5 max-w-[44rem] font-code text-[14px] leading-[1.75] text-[#9699a6] sm:mt-[26px] sm:text-[15px] sm:leading-[1.8]">
        Argus groups thousands of identical errors into one actionable issue —
        full stack traces, context, and the exact line that broke.
        Self-hostable, developer-first.
      </p>

      <div className="relative z-10 mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-[34px] sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          to="/register"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-lime/50 bg-lime/15 px-[22px] text-[14px] font-extrabold whitespace-nowrap text-lime transition-colors hover:bg-lime/25"
        >
          Get started free →
        </Link>
        <button
          onClick={copyCmd}
          className="inline-flex min-h-[44px] min-w-0 cursor-pointer items-center justify-start gap-2.5 rounded-[10px] border border-[#343843] bg-[rgba(17,19,24,0.72)] px-4 font-code text-[12px] text-[#f4f4f6] sm:max-w-full sm:px-5 sm:text-[13px]"
        >
          <span className="flex-none text-lime">$</span>
          <span className="min-w-0 flex-1 break-all text-left sm:break-normal">
            {CMD}
          </span>
          <span className="flex-none text-xs" style={{ color: copied ? "#A3E635" : "#5a5f6d" }}>
            {copied ? "✓ copied" : "⧉"}
          </span>
        </button>
      </div>

      {/* animated terminal */}
      <div className="relative z-10 mt-10 pb-8 sm:mt-[60px] sm:pb-11">
        <div className="relative mx-auto max-w-[880px] overflow-hidden border border-[#343843] bg-[rgba(17,19,24,0.78)] text-left shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-2 border-b border-[rgba(52,56,67,0.72)] px-3 py-[13px] sm:px-4">
            <span className="h-2.5 w-2.5 bg-[#343843]" />
            <span className="h-2.5 w-2.5 bg-[#343843]" />
            <span className="h-2.5 w-2.5 bg-[#343843]" />
            <span className="mr-2 flex-1 truncate text-center font-code text-[11px] text-[#5a5f6d] sm:mr-11">
              dev@my-shop — argus
            </span>
          </div>
          <div className="min-h-[320px] overflow-hidden p-4 font-code text-[11.5px] leading-[1.85] sm:min-h-[380px] sm:p-7 sm:text-[13.5px] sm:leading-[1.9]">
            <div>
              <span className="text-lime">❯</span>{" "}
              <span className="text-[#ff4f9a]">~</span>{" "}
              <span className="break-all">{termText}</span>
              {termStep === 0 && (
                <span className="ml-0.5 inline-block h-[17px] w-[9px] animate-[landing-blink_1s_step-end_infinite] bg-lime/55 align-middle" />
              )}
            </div>
            {termStep >= 1 && (
              <div className="text-[#777b87]">
                + @argusdev/sdk-browser@0.2.0 · added in 1.2s
              </div>
            )}
            {termStep >= 2 && (
              <div className="text-lime">
                ✓ Argus initialized — watching my-shop-frontend
              </div>
            )}
            {termStep >= 3 && (
              <>
                <div className="h-3" />
                {termLogs.map((l) => (
                  <div key={l.id} className="flex min-w-0 animate-[landing-slidein_0.35s_ease] items-center gap-2 sm:gap-3.5">
                    <span className="flex-none text-[#5a5f6d]">{l.time}</span>
                    <span className="w-12 flex-none sm:w-16" style={{ color: l.color }}>{l.level}</span>
                    <span className="flex-1 truncate text-[#e7e8ee]">{l.msg}</span>
                    <span className="hidden flex-none text-[#5a5f6d] sm:inline">captured</span>
                  </div>
                ))}
                <div className="h-3" />
                <div className="inline-flex max-w-full flex-wrap items-center gap-2 border border-lime/65 bg-lime/10 px-3 py-[7px] sm:gap-2.5 sm:px-4">
                  <span className="h-[7px] w-[7px] animate-[landing-pulse_1.6s_ease-in-out_infinite] bg-lime" />
                  <span className="text-[11.5px] text-lime sm:text-[12.5px]">
                    deduplicated → 1 issue · ×{dedupCount}
                  </span>
                  <span className="hidden text-xs text-[#5a5f6d] sm:inline">argus.io/my-shop/issues/1</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
