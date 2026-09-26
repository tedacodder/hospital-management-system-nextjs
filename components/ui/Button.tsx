import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "light" | "outlineLight";
export type ButtonSize = "sm" | "md" | "touch" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-700 text-white hover:bg-accent-600 disabled:bg-ink-300",
  secondary:
    "bg-surface text-ink-900 border border-rule-strong hover:bg-paper disabled:text-ink-300",
  danger:
    "bg-surface text-[var(--color-signal-stop)] border border-[var(--color-signal-stop)]/30 hover:bg-[var(--color-signal-stop-bg)] disabled:opacity-50",
  ghost: "text-ink-700 hover:bg-ink-900/5 disabled:text-ink-300",
  // For dark surfaces (brand panel, closing call-to-action). Fixed white/dark
  // regardless of site theme, to match the panel it always sits on.
  light: "bg-white text-panel hover:bg-panel-hover disabled:opacity-60",
  outlineLight: "border border-white/30 text-white hover:bg-white/10 disabled:opacity-60",
};

// Radius travels with size so a large button is not just a bigger small one.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  // 44px: the height of a large form control, for buttons that sit beside one.
  touch: "h-11 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-[0.9375rem] rounded-lg",
};

/// One source for button styling, shared by <Button> and <ButtonLink> so a
/// link that looks like a button is guaranteed to match a real one.
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return `inline-flex items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px focus-visible:outline-none disabled:cursor-not-allowed disabled:active:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
