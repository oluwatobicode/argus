import { useState } from "react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#magic" },
  { label: "Open source", href: "#opensource" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-3 z-[60] mx-auto mt-3 w-[min(1180px,calc(100%_-_24px))] sm:top-4 sm:mt-[18px] sm:w-[min(1180px,calc(100%_-_40px))]">
      <div className="rounded-[24px] border border-[#343843] bg-[rgba(17,19,24,0.92)] shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:rounded-full">
        <div className="flex items-center justify-between gap-3 py-2.5 pr-2.5 pl-4 sm:gap-5 sm:pl-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-[26px] w-[26px] flex-none items-center justify-center overflow-hidden">
              <img
                src="/argus-logo.png"
                alt="Argus"
                className="h-full w-full scale-[3.2] object-contain"
              />
            </div>
            <span className="truncate text-[17px] font-bold tracking-[-0.01em]">
              Argus
            </span>
          </Link>

          <div className="hidden items-center gap-[30px] font-code lg:flex">
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

          <div className="flex flex-none items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden font-code text-[12.5px] text-[#f4f4f6] sm:inline"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="hidden min-h-[38px] items-center rounded-full border border-lime/50 bg-lime/15 px-[18px] text-[13px] font-bold whitespace-nowrap text-lime transition-colors hover:bg-lime/25 sm:inline-flex"
            >
              Start free
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-[#343843] bg-[rgba(17,19,24,0.72)] text-[#f4f4f6] transition-colors hover:border-[#4a4f5c] lg:hidden"
            >
              <HugeiconsIcon
                icon={open ? Cancel01Icon : Menu01Icon}
                size={18}
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-[rgba(52,56,67,0.72)] px-3 pb-3 lg:hidden">
            <div className="grid gap-1 pt-3 font-code">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[14px] px-3 py-2.5 text-[13px] text-[#9699a6] transition-colors hover:bg-lime/10 hover:text-lime"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[#343843] font-code text-[12.5px] text-[#f4f4f6]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-lime/50 bg-lime/15 text-[13px] font-bold text-lime"
              >
                Start free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
