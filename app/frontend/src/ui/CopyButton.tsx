import { useState } from "react";
import toast from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

interface Props {
  value: string;
  label?: string;
}

/* copy-to-clipboard pill with a brief "copied" confirmation */
export function CopyButton({ value, label = "Copy" }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <button
      onClick={copy}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-2 bg-surface-2 px-3.5 py-2 text-xs font-medium text-text-1 hover:bg-surface"
    >
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
      {copied ? "Copied" : label}
    </button>
  );
}
