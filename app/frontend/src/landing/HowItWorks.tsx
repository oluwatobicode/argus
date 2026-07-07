const CHECKS = [
  "Grouped by stack fingerprint, not string matching",
  "Live counts, first-seen & last-seen",
  "Resolve once, stay resolved until it regresses",
];

const PILE_OPACITY = [0.3, 0.45, 0.6, 0.78, 1];

const STATS = [
  { n: "503→1", label: "crashes to one issue" },
  { n: "<60s", label: "to first event" },
  { n: "10k", label: "free events / month" },
  { n: "100%", label: "open source" },
];

export function HowItWorks() {
  return (
    <>
      {/* magic moment */}
      <section id="magic" className="relative mx-auto w-[min(1180px,calc(100%_-_40px))] pt-24">
        <div className="grid items-center gap-12 border border-[#343843] bg-[rgba(17,19,24,0.78)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:grid-cols-2 md:p-[52px]">
          <div>
            <div className="mb-3.5 font-code text-[11px] tracking-[0.2em] text-[#ff4f9a] uppercase">
              The magic moment
            </div>
            <h2 className="font-display text-[28px] leading-[1.15] font-extrabold md:text-[32px]">
              500 crashes. One issue to fix.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-[#9699a6]">
              Argus fingerprints every error by its stack trace and deduplicates
              on the fly. Instead of scrolling 500 identical rows, you see a
              single issue with a live event count — so you always know what's
              actually on fire.
            </p>
            <div className="mt-[26px] flex flex-col gap-3">
              {CHECKS.map((c) => (
                <div key={c} className="flex items-center gap-[11px] text-sm text-[#e7e8ee]">
                  <span className="text-lime">✓</span> {c}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="mb-[18px] flex flex-col gap-1.5">
              {PILE_OPACITY.map((op, i) => (
                <div
                  key={i}
                  className="truncate border border-[rgba(52,56,67,0.72)] bg-[#08090c] px-[13px] py-[9px] font-code text-[11px] whitespace-nowrap text-[#777b87]"
                  style={{ opacity: op }}
                >
                  <span className="text-error">●</span> TypeError: Cannot read
                  properties of undefined
                </div>
              ))}
            </div>
            <div className="my-1.5 mb-4 flex items-center justify-center gap-2.5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#343843]" />
              <span className="font-code text-[11px] text-lime">deduplicated ↓</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#343843] to-transparent" />
            </div>
            <div className="flex items-center gap-3.5 border border-lime/50 bg-lime/10 px-[18px] py-4">
              <span className="h-2.5 w-2.5 flex-none bg-error" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-code text-[12.5px] whitespace-nowrap text-[#f4f4f6]">
                  TypeError: Cannot read properties…
                </div>
                <div className="mt-1 font-code text-[10.5px] text-[#777b87]">
                  src/components/IssueList.tsx:42
                </div>
              </div>
              <div className="font-code text-[17px] font-bold text-lime">×503</div>
            </div>
          </div>
        </div>
      </section>

      {/* stats band with crashing server rack */}
      <section className="relative mx-auto w-[min(1180px,calc(100%_-_40px))] pt-24">
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          {/* crashing rack illustration */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] px-[30px] pt-11 pb-[30px]">
            <span className="absolute top-[34px] left-8 rotate-[-6deg] animate-[landing-pulse_2.6s_ease-in-out_infinite] border border-[rgba(240,68,56,0.45)] bg-[rgba(240,68,56,0.1)] px-2.5 py-[5px] font-code text-[11px] text-error">
              ERROR 500
            </span>
            <span className="absolute top-[96px] right-9 rotate-[5deg] animate-[landing-pulse_3.4s_ease-in-out_0.8s_infinite] border border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.1)] px-2.5 py-[5px] font-code text-[11px] text-warning">
              CPU 99%
            </span>
            <span className="absolute bottom-16 left-10 rotate-[4deg] animate-[landing-pulse_3s_ease-in-out_1.4s_infinite] border border-[rgba(194,42,49,0.5)] bg-[rgba(194,42,49,0.12)] px-2.5 py-[5px] font-code text-[11px] text-fatal">
              FATAL
            </span>

            <div className="relative animate-[landing-rumble_0.35s_linear_infinite]">
              {/* smoke */}
              <span className="absolute -top-[26px] left-[34px] h-[9px] w-[9px] animate-[landing-smoke_2.4s_ease-out_infinite] bg-[rgba(150,153,166,0.4)]" />
              <span className="absolute -top-[22px] left-[58px] h-[7px] w-[7px] animate-[landing-smoke_2.1s_ease-out_0.7s_infinite] bg-[rgba(150,153,166,0.32)]" />
              <span className="absolute -top-[24px] left-[46px] h-1.5 w-1.5 animate-[landing-smoke_2.7s_ease-out_1.3s_infinite] bg-[rgba(150,153,166,0.28)]" />
              {/* fire */}
              <span className="absolute -top-[24px] right-[18px] z-[2] rotate-[8deg] text-[28px] leading-none">🔥</span>

              {/* unit 1 — knocked askew */}
              <div className="relative z-[1] flex h-[46px] w-[230px] translate-x-[-8px] translate-y-[2px] rotate-[-5deg] animate-[landing-flicker_2.2s_linear_infinite] items-center gap-3 border border-[rgba(240,68,56,0.55)] bg-[#0b0d11] px-3.5">
                <span className="flex gap-[5px]">
                  <span className="h-1.5 w-1.5 animate-[landing-blink_0.5s_step-end_infinite] bg-error" />
                  <span className="h-1.5 w-1.5 animate-[landing-blink_0.7s_step-end_0.2s_infinite] bg-error" />
                  <span className="h-1.5 w-1.5 bg-[#343843]" />
                </span>
                <span className="h-[18px] flex-1 bg-[repeating-linear-gradient(90deg,#23262e_0_3px,transparent_3px_8px)]" />
                <span className="font-code text-[10px] text-error">u01</span>
              </div>
              {/* unit 2 */}
              <div className="flex h-[46px] w-[230px] items-center gap-3 border border-t-0 border-[#343843] bg-[#0b0d11] px-3.5">
                <span className="flex gap-[5px]">
                  <span className="h-1.5 w-1.5 animate-[landing-pulse_1.1s_ease-in-out_infinite] bg-warning" />
                  <span className="h-1.5 w-1.5 bg-lime" />
                  <span className="h-1.5 w-1.5 bg-[#343843]" />
                </span>
                <span className="h-[18px] flex-1 bg-[repeating-linear-gradient(90deg,#23262e_0_3px,transparent_3px_8px)]" />
                <span className="font-code text-[10px] text-[#5a5f6d]">u02</span>
              </div>
              {/* unit 3 */}
              <div className="flex h-[46px] w-[230px] items-center gap-3 border border-t-0 border-[#343843] bg-[#0b0d11] px-3.5">
                <span className="flex gap-[5px]">
                  <span className="h-1.5 w-1.5 animate-[landing-pulse_1.8s_ease-in-out_infinite] bg-lime" />
                  <span className="h-1.5 w-1.5 bg-lime" />
                  <span className="h-1.5 w-1.5 bg-[#343843]" />
                </span>
                <span className="h-[18px] flex-1 bg-[repeating-linear-gradient(90deg,#23262e_0_3px,transparent_3px_8px)]" />
                <span className="font-code text-[10px] text-[#5a5f6d]">u03</span>
              </div>
            </div>

            <div className="relative mt-[26px] font-code text-[12px] text-[#5a5f6d]">
              your server · 2:47 AM <span className="text-lime">· Argus already knows</span>
            </div>
          </div>

          {/* stats 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] p-[26px] text-center"
              >
                <div className="font-code text-[32px] font-bold tracking-[-0.02em] text-lime">{s.n}</div>
                <div className="mt-2 font-code text-[12px] text-[#9699a6]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
