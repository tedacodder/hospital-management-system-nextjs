"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { LogOutIcon, UserIcon } from "@/components/ui/Icons";

/// Avatar button with a small account menu (profile, sign out). Used in the
/// header on phones, where the sidebar's account section isn't on screen.
export function UserMenu({
  name,
  roleLabel,
  onSignOut,
}: {
  name: string | null | undefined;
  roleLabel: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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

  const item =
    "flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/5 hover:text-ink-900";

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-accent-050"
      >
        <Avatar name={name} tone="brand" size="sm" />
      </button>

      {open && (
        <div
          id={menuId}
          className="animate-pop absolute right-0 top-12 z-40 w-56 rounded-xl border border-rule bg-surface p-1.5 shadow-[var(--shadow-float)]"
        >
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-ink-900">{name ?? "Your account"}</p>
            <p className="text-xs text-ink-500">{roleLabel}</p>
          </div>
          <div className="border-t border-rule pt-1.5">
            <Link href="/dashboard/profile" onClick={() => setOpen(false)} className={item}>
              <UserIcon className="h-[18px] w-[18px]" />
              My profile
            </Link>
            <button type="button" onClick={onSignOut} className={item}>
              <LogOutIcon className="h-[18px] w-[18px]" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
