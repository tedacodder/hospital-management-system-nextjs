"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";

// The only client code in the landing header. Everything else on the page is
// a server component.

export interface NavLink {
  label: string;
  href: string;
  emergency?: boolean;
}

export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-900 transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="animate-rise absolute inset-x-0 top-full border-b border-rule bg-paper px-5 pb-5 pt-2 shadow-[var(--shadow-card)]"
        >
          <nav aria-label="Mobile">
            <ul className="divide-y divide-rule">
              {links.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("#") ? (
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-12 items-center text-base font-medium text-ink-900"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="flex min-h-12 items-center gap-2 text-base font-medium text-ink-900">
                      {l.emergency && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal-stop)]" aria-hidden="true" />
                      )}
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 grid gap-2">
            <ButtonLink href="/signup" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
