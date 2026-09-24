import type { ReactNode } from "react";

/// Title block used at the top of every patient screen, so headings, spacing
/// and the action slot are identical from page to page.
export function PageHeader({
  title,
  description,
  actions,
  id,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 id={id} className="text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
