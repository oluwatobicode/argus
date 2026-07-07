import { Link } from "react-router";

const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#magic" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "https://argus-7960b943.mintlify.site/" },
      { label: "SDKs on npm", href: "https://www.npmjs.com/org/argusdev" },
      { label: "Self-hosting", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <>
      {/* final CTA */}
      <section className="relative mx-auto w-[min(1180px,calc(100%_-_40px))] pt-28">
        <div className="relative overflow-hidden border border-lime/65 bg-[rgba(17,19,24,0.78)] px-8 py-[70px] text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(163,230,53,0.12),transparent_30rem)]" />
          <h2 className="relative font-display text-[32px] leading-[1.15] font-extrabold md:text-[38px]">
            Stop finding out from your users.
          </h2>
          <p className="relative mx-auto mt-5 max-w-[480px] font-code text-[14px] leading-[1.8] text-[#9699a6]">
            Set up Argus in a minute and see your first error before you finish
            your coffee.
          </p>
          <Link
            to="/register"
            className="relative mt-8 inline-flex min-h-[48px] items-center rounded-[10px] border border-lime/50 bg-lime/15 px-[26px] text-[15px] font-extrabold text-lime transition-colors hover:bg-lime/25"
          >
            Start monitoring free →
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="relative mx-auto w-[min(1180px,calc(100%_-_40px))] pt-[70px] pb-[50px]">
        <div className="flex flex-wrap items-start justify-between gap-10 border-t border-[rgba(52,56,67,0.72)] pt-11">
          <div className="max-w-[280px]">
            <div className="mb-3.5 flex items-center gap-[11px]">
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden">
                <img
                  src="/argus-logo.png"
                  alt="Argus"
                  className="h-full w-full scale-[3.2] object-contain"
                />
              </div>
              <span className="text-base font-bold">Argus</span>
            </div>
            <p className="font-code text-[12px] leading-[1.7] text-[#777b87]">
              Open-source error tracking and performance monitoring. Self-host
              it or let us run it.
            </p>
          </div>
          <div className="flex flex-wrap gap-14">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="mb-3.5 font-code text-[10px] tracking-[0.16em] text-[#5a5f6d] uppercase">
                  {col.title}
                </div>
                <div className="flex flex-col gap-[11px]">
                  {col.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="text-[13.5px] text-[#9699a6] transition-colors hover:text-lime"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-11 flex flex-wrap items-center justify-between gap-3">
          <div className="font-code text-[12px] text-[#5a5f6d]">
            © 2026 Argus · Open source
          </div>
          <div className="font-code text-[12px] text-[#5a5f6d]">
            Made for developers, by developers.
          </div>
        </div>
      </footer>
    </>
  );
}
