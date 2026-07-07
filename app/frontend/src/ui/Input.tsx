import { useState, type InputHTMLAttributes, type Ref } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, error, id, type, ...rest }: InputProps) {
  const [show, setShow] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";
  const effectiveType = isPassword && show ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[14px] font-sans font-medium text-white"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={effectiveType}
          className={`h-12 w-full rounded-[20px] border bg-bg-1 px-3.5 ${isPassword ? "pr-11" : ""} font-mono text-[13px] text-text-1
            placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-lime/40
            ${error ? "border-error" : "border-border-2 focus:border-lime/50"}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-3 transition-colors hover:text-text-1"
          >
            <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} size={18} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
