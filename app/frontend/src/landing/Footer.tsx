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
      { label: "Documentation", href: "https://docs.arguserror.xyz/" },
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
      <section className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-16 sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-28">
        <div className="relative overflow-hidden border border-lime/65 bg-[rgba(17,19,24,0.78)] px-5 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-[70px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(163,230,53,0.12),transparent_30rem)]" />
          <h2 className="relative font-display text-[27px] leading-[1.15] font-extrabold sm:text-[32px] md:text-[38px]">
            Stop finding out from your users.
          </h2>
          <p className="relative mx-auto mt-5 max-w-[480px] font-code text-[13.5px] leading-[1.75] text-[#9699a6] sm:text-[14px] sm:leading-[1.8]">
            Set up Argus in a minute and see your first error before you finish
            your coffee.
          </p>
          <Link
            to="/register"
            className="relative mt-8 inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-lime/50 bg-lime/15 px-[22px] text-[14px] font-extrabold text-lime transition-colors hover:bg-lime/25 sm:px-[26px] sm:text-[15px]"
          >
            Start monitoring free →
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="relative mx-auto w-[min(1180px,calc(100%_-_24px))] pt-12 pb-10 sm:w-[min(1180px,calc(100%_-_40px))] sm:pt-[70px] sm:pb-[50px]">
        <div className="grid gap-10 border-t border-[rgba(52,56,67,0.72)] pt-9 sm:pt-11 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:justify-between">
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
          <div className="grid gap-8 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-12 lg:justify-self-end">
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
        <div className="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
