"use client";

import { useEffect, useId, useRef, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { BellIcon, CalendarIcon, CheckIcon, MessageIcon, PillIcon, ReceiptIcon } from "@/components/ui/Icons";
import { apiGet, apiSend } from "@/lib/api-client";
import { relativeTime } from "@/lib/patient-ui";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

// Polls rather than opening a socket — there is no WebSocket server in this
// application, and the UI should never imply real-time delivery it doesn't have.
const POLL_MS = 30_000;

const TYPE_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  APPOINTMENT: CalendarIcon,
  PRESCRIPTION: PillIcon,
  BILLING: ReceiptIcon,
  MESSAGE: MessageIcon,
};

function NotificationRow({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  const Icon = TYPE_ICON[n.type] ?? BellIcon;
  const content = (
    <>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          n.isRead ? "bg-ink-900/5 text-ink-500" : "bg-accent-050 text-accent-700"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={`truncate text-sm ${n.isRead ? "font-medium text-ink-700" : "font-semibold text-ink-900"}`}>
            {n.title}
          </span>
          <span className="shrink-0 text-xs text-ink-500">{relativeTime(n.createdAt)}</span>
        </span>
        {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-ink-500">{n.body}</span>}
      </span>
      {!n.isRead && (
        <>
          <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-600" />
          <span className="sr-only">Unread</span>
        </>
      )}
    </>
  );

  const cls = `flex w-full items-start gap-3 border-b border-rule px-4 py-3 text-left transition-colors last:border-0 hover:bg-paper ${
    n.isRead ? "" : "bg-accent-050/50"
  }`;

  // A notification without a destination is informational: mark it read, don't navigate.
  return n.link ? (
    <Link href={n.link} onClick={() => onOpen(n)} className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen(n)} className={cls}>
      {content}
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiGet<{ notifications: Notification[]; unread: number }>(
          "/notifications",
          { pageSize: 8 },
        );
        if (!cancelled) {
          setItems(res.notifications);
          setUnread(res.unread);
          setLoaded(true);
        }
      } catch {
        // Silent — a failed poll shouldn't interrupt the page.
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openNotification(n: Notification) {
    setOpen(false);
    if (n.isRead) return;
    // Optimistic: the item is about to be navigated away from, so there's no
    // later render to reconcile against if this fails — but the next poll
    // will pick up the true state regardless.
    setItems((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await apiSend("PATCH", `/notifications/${n.id}`);
    } catch {
      // The next poll will reconcile if this failed.
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await apiSend("POST", "/notifications/read-all");
    } catch {
      // The next poll will reconcile if this failed.
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-signal-stop)] px-1 font-mono text-[10px] font-semibold text-white ring-2 ring-surface"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="animate-pop fixed inset-x-3 top-[4.25rem] z-40 overflow-hidden rounded-xl border border-rule bg-surface shadow-[var(--shadow-float)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent-700 transition-colors hover:bg-accent-050"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(24rem,60dvh)] overflow-y-auto">
            {!loaded ? (
              <div className="space-y-3 p-4" role="status" aria-label="Loading notifications">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-050 text-accent-700">
                  <CheckIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-ink-900">You&apos;re all caught up</p>
                <p className="text-sm text-ink-500">New notifications will appear here.</p>
              </div>
            ) : (
              items.map((n) => <NotificationRow key={n.id} n={n} onOpen={openNotification} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
