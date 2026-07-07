import { Link } from "react-router";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#magic" },
  { label: "Open source", href: "#opensource" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  return (
    <nav className="sticky top-4 z-[60] mx-auto mt-[18px] w-[min(1180px,calc(100%_-_40px))]">
      <div className="flex items-center justify-between gap-5 rounded-full border border-[#343843] bg-[rgba(17,19,24,0.9)] py-2.5 pr-3 pl-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center overflow-hidden">
            <img
              src="/argus-logo.png"
              alt="Argus"
              className="h-full w-full scale-[3.2] object-contain"
            />
          </div>
          <span className="text-[17px] font-bold tracking-[-0.01em]">Argus</span>
        </Link>

        <div className="hidden items-center gap-[30px] font-code md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12.5px] text-[#9699a6] transition-colors hover:text-lime"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="font-code text-[12.5px] text-[#f4f4f6]"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-[38px] items-center rounded-full border border-lime/50 bg-lime/15 px-[18px] text-[13px] font-bold text-lime transition-colors hover:bg-lime/25"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}
