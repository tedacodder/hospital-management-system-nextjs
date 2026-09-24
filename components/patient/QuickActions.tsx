import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/Icons";

export type QuickAction = {
  key: string;
  title: string;
  body: string;
  icon: ReactNode;
  /// A route to navigate to…
  href?: string;
  /// …or an in-page action (used to jump to a dashboard tab).
  onSelect?: () => void;
};

const TILE =
  "group flex min-h-[4.5rem] w-full items-center gap-3.5 rounded-lg border border-rule bg-surface p-4 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-card)] active:translate-y-0";

function TileBody({ action }: { action: QuickAction }) {
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-050 text-accent-700 [&>svg]:h-5 [&>svg]:w-5">
        {action.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{action.title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-500">{action.body}</span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-500" />
    </>
  );
}

export function QuickActions({ actions, label }: { actions: QuickAction[]; label: string }) {
  return (
    <ul aria-label={label} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((a) => (
        <li key={a.key}>
          {a.href ? (
            <Link href={a.href} className={TILE}>
              <TileBody action={a} />
            </Link>
          ) : (
            <button type="button" onClick={a.onSelect} className={TILE}>
              <TileBody action={a} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
