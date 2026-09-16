import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-rule bg-surface ${padded ? "p-5" : ""} ${className}`}
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
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
  tone?: "neutral" | "wait" | "stop";
}) {
  const valueClass =
    tone === "wait"
      ? "text-[var(--color-signal-wait)]"
      : tone === "stop"
        ? "text-[var(--color-signal-stop)]"
        : "text-ink-900";

  return (
    <Card>
      <p className="text-sm text-ink-500">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
    </Card>
  );
}

/// Every async list uses one of these three states, per the product brief.
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-rule py-12 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-500">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-signal-stop)]/20 bg-[var(--color-signal-stop-bg)] py-10 text-center">
      <p className="text-sm font-medium text-[var(--color-signal-stop)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-[var(--color-signal-stop)] underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-ink-900/5" />
      ))}
    </div>
  );
}
