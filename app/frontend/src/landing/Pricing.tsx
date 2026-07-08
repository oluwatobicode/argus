import { Link } from "react-router";

const FREE_FEATURES = [
  "10,000 events / month",
  "1 project",
  "30-day retention",
  "Full stack traces & context",
];

const PRO_FEATURES = [
  "500,000 events / month",
  "Unlimited projects",
  "90-day retention",
  "Alerts via email & webhook",
];

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-16 sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-28">
      <div className="mx-auto mb-9 max-w-[640px] text-center sm:mb-[50px]">
        <div className="mb-3.5 font-code text-[11px] tracking-[0.2em] text-[#ff4f9a] uppercase">
          Pricing
        </div>
        <h2 className="font-display text-[27px] leading-[1.15] font-extrabold sm:text-[30px] md:text-[36px]">
          Free to start. Fair to scale.
        </h2>
        <p className="mt-[18px] font-code text-[13.5px] text-[#9699a6] sm:text-[14px]">
          Or self-host the whole thing. It's open source.
        </p>
      </div>

      <div className="mx-auto grid max-w-[760px] gap-4 md:grid-cols-2">
        {/* Free */}
        <div className="border border-[rgba(52,56,67,0.85)] bg-[rgba(17,19,24,0.78)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="text-base font-extrabold">Free</div>
          <div className="mt-3.5 mb-1.5 font-code text-[38px] font-bold tracking-[-0.02em] sm:text-[44px]">
            $0<span className="text-[15px] font-normal text-[#777b87]">/mo</span>
          </div>
          <div className="mb-[22px] font-code text-[12px] text-[#9699a6]">
            For solo devs and side projects.
          </div>
          <div className="flex flex-col gap-3 text-sm text-[#e7e8ee]">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex gap-2.5">
                <span className="text-lime">✓</span> {f}
              </div>
            ))}
          </div>
          <Link
            to="/register"
            className="mt-[26px] flex min-h-[44px] items-center justify-center rounded-[10px] border border-[#343843] bg-[rgba(17,19,24,0.72)] text-sm font-bold text-[#f4f4f6] transition-colors hover:border-[#4a4f5c]"
          >
            Start free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative border border-lime/50 bg-lime/[0.07] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <span className="absolute top-5 right-5 bg-[#ff4f9a] px-[11px] py-1 font-code text-[10px] font-bold text-[#08090c] sm:top-[22px] sm:right-[26px]">
            POPULAR
          </span>
          <div className="text-base font-extrabold">Pro</div>
          <div className="mt-3.5 mb-1.5 font-code text-[38px] font-bold tracking-[-0.02em] sm:text-[44px]">
            $10<span className="text-[15px] font-normal text-[#777b87]">/mo</span>
          </div>
          <div className="mb-[22px] font-code text-[12px] text-[#9699a6]">
            For teams that ship every day.
          </div>
          <div className="flex flex-col gap-3 text-sm text-[#e7e8ee]">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex gap-2.5">
                <span className="text-lime">✓</span> {f}
              </div>
            ))}
          </div>
          <Link
            to="/register"
            className="mt-[26px] flex min-h-[44px] items-center justify-center rounded-[10px] border border-lime/50 bg-lime/15 text-sm font-extrabold text-lime transition-colors hover:bg-lime/25"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
