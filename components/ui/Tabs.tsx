"use client";

import { useRef, type KeyboardEvent } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /// Optional count shown beside the label.
  count?: number;
}

export function tabId(prefix: string, id: string) {
  return `${prefix}-tab-${id}`;
}

export function panelId(prefix: string, id: string) {
  return `${prefix}-panel-${id}`;
}

/// Underline tabs following the WAI-ARIA tabs pattern: one tab stop, arrow keys
/// / Home / End move between tabs. The consumer renders the matching
/// role="tabpanel" with id={panelId(prefix, id)} and aria-labelledby={tabId(prefix, id)}.
/// On narrow screens the strip scrolls sideways instead of wrapping.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  prefix,
  label,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  prefix: string;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.id === value);
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    onChange(tabs[next].id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${tabs[next].id}"]`)?.focus();
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex min-w-max gap-1 border-b border-rule"
      >
        {tabs.map((t) => {
          const selected = t.id === value;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={tabId(prefix, t.id)}
              data-tab={t.id}
              aria-selected={selected}
              aria-controls={panelId(prefix, t.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={`relative flex h-11 items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors ${
                selected ? "text-accent-700" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 font-mono text-[0.6875rem] tabular-nums ${
                    selected ? "bg-accent-050 text-accent-700" : "bg-ink-900/5 text-ink-500"
                  }`}
                >
                  {t.count}
                </span>
              )}
              <span
                aria-hidden="true"
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors ${
                  selected ? "bg-accent-700" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
