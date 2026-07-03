import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex text-black font-sans   h-11 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-bold " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-[#9fe871]/70   text-lime-ink font-bold cursor-pointer hover:bg-lime/90",
  secondary: "border border-border-2 bg-surface-2 text-text-1 hover:bg-surface",
  ghost: "text-text-2 hover:text-text-1",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
