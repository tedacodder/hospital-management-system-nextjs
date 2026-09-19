"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiGet, apiSend } from "@/lib/api-client";

type Notification = {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

// Polls rather than opening a socket — there is no WebSocket server in this
// application, and the UI should never imply real-time delivery it doesn't have.
const POLL_MS = 30_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

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
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-700 hover:bg-ink-900/5"
      >
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2.5c-2.3 0-4 1.85-4 4.2v2.6c0 .5-.2 1.2-.5 1.7L4.5 12.8c-.6.9 0 2.2 1.1 2.2h8.8c1.1 0 1.7-1.3 1.1-2.2l-1-1.8c-.3-.5-.5-1.2-.5-1.7V6.7c0-2.35-1.7-4.2-4-4.2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 15.8a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-signal-stop)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-lg border border-rule bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-accent-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => openNotification(n)}
                  className={`block border-b border-rule px-4 py-3 text-sm last:border-0 hover:bg-paper ${
                    !n.isRead ? "bg-accent-050" : ""
                  }`}
                >
                  <p className="font-medium text-ink-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-ink-500">{n.body}</p>}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
