import type { ReactNode } from "react";
import Link from "next/link";
import { AuthBrandPanel, AUTH_COPY, type AuthVariant } from "@/components/auth/AuthBrandPanel";
import { Logo } from "@/components/brand/Logo";
import { ArrowLeftIcon } from "@/components/ui/Icons";

// Shared frame for /login and /signup. Rendered from each route's layout.tsx,
// so it stays a server component and the brand panel adds no client JavaScript.
//
//   lg and up   dark brand panel | form
//   below lg    compact dark band, with the form card overlapping its lower edge
//
// Only the form column carries the page-enter animation, so moving between
// sign in and sign up changes the form while the frame stays put.

export function AuthShell({
  variant,
  width = "narrow",
  children,
}: {
  variant: AuthVariant;
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  const copy = AUTH_COPY[variant];

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AuthBrandPanel variant={variant} />

      <div className="relative flex min-h-screen flex-col overflow-x-clip lg:min-h-0">
        {/* Compact brand band — below lg only */}
        <header className="relative overflow-hidden bg-ink-900 px-5 pb-20 pt-5 text-white sm:px-8 lg:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="bg-grid-dark absolute inset-0" />
            <div className="glow-accent-dark absolute -right-24 -top-32 h-80 w-80" />
          </div>
          <div className="relative mx-auto flex max-w-[34rem] items-center justify-between">
            <Link
              href="/"
              aria-label="MediCare+ home"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <Logo tone="dark" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-white/75 transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Home
            </Link>
          </div>
          <p className="relative mx-auto mt-6 max-w-[34rem] text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-2xl">
            {copy.title}
          </p>
        </header>

        {/* Desktop back link */}
        <div className="hidden items-center justify-between px-10 pt-8 lg:flex xl:px-16">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <main className="page-enter relative -mt-12 flex flex-1 flex-col justify-start px-4 pb-12 sm:px-8 lg:mt-0 lg:justify-center lg:px-10 lg:py-10 xl:px-16">
          <div className={`mx-auto w-full ${width === "wide" ? "max-w-[34rem]" : "max-w-[28rem]"}`}>
            <div className="rounded-xl border border-rule bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
