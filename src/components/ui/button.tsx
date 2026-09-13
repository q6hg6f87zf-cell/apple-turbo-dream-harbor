import { cn } from "@/lib/cn";
import { sfx } from "@/game/audio";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-paper text-ink hover:bg-moon disabled:opacity-40",
  ember: "bg-ember text-ink hover:bg-ember-bright disabled:opacity-40",
  ghost:
    "bg-transparent text-paper shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] hover:text-ember-bright disabled:opacity-40",
  danger: "bg-danger/15 text-danger shadow-[var(--shadow-border)] hover:bg-danger/25 disabled:opacity-40",
  quiet: "bg-raised text-muted hover:text-paper hover:bg-panel disabled:opacity-40",
};

const sizes = {
  sm: "min-h-10 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  sound = "click",
  type = "button",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  sound?: "click" | "none";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-display text-[11px] font-semibold uppercase tracking-[0.14em] transition-[color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
      onClick={(e) => {
        if (sound === "click" && !props.disabled) sfx.click();
        onClick?.(e);
      }}
    />
  );
}
