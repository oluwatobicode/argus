import type { InputHTMLAttributes, Ref } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, error, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
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
      <input
        id={inputId}
        className={`h-12 rounded-[20px] border bg-bg-1 px-3.5 font-mono text-[13px] text-text-1
          placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-lime/40
          ${error ? "border-error" : "border-border-2 focus:border-lime/50"}`}
        {...rest}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
