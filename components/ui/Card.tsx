import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  /// Adds the small hover lift used on tappable cards across the product.
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-rule bg-surface ${padded ? "p-5" : ""} ${
        interactive
          ? "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-card)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  eyebrow,
}: {
  title: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs text-ink-500">{eyebrow}</p>}
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/// A single measurement, not a decoration. Every value passed here must come
/// from a real query — see the "no fabricated statistics" rule in the API layer.
export function StatCard({
  label,
  value,
  sublabel,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  tone?: "neutral" | "wait" | "stop";
  icon?: ReactNode;
}) {
  const valueClass =
    tone === "wait"
      ? "text-[var(--color-signal-wait)]"
      : tone === "stop"
        ? "text-[var(--color-signal-stop)]"
        : "text-ink-900";

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink-500">{label}</p>
        {icon && <span className="text-ink-300 [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
      </div>
      <p className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
    </Card>
  );
}

/// Every async list uses one of these three states, per the product brief.
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-rule-strong bg-surface/60 px-6 py-12 text-center">
      {icon && (
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-050 text-accent-700 [&>svg]:h-[22px] [&>svg]:w-[22px]">
          {icon}
        </span>
      )}
      <p className="text-[0.9375rem] font-semibold text-ink-900">{title}</p>
      {body && <p className="max-w-sm text-sm leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/// Callers pass a friendly message of their own; nothing from the server or an
/// Error object should be passed straight through.
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-signal-stop)]/20 bg-[var(--color-signal-stop-bg)] px-6 py-10 text-center"
    >
      <p className="text-sm font-medium text-[var(--color-signal-stop)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex h-9 items-center rounded-md border border-[var(--color-signal-stop)]/30 bg-surface px-3.5 text-sm font-medium text-[var(--color-signal-stop)] transition-colors hover:bg-[var(--color-signal-stop-bg)]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-label="Loading" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14" aria-hidden="true" />
      ))}
    </div>
  );
}
