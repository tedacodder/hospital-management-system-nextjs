"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";

// The message is deliberately fixed. An Error's own text can carry a database
// or server detail, so it is logged for developers and never shown.

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div role="alert" className="w-full max-w-md text-center">
        <Link href="/" aria-label="MediCare+ home" className="inline-flex">
          <LogoMark className="h-10 w-10 text-sm" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-ink-900">Something went wrong</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-500">
          We couldn&apos;t load this page. It&apos;s not something you did. Try again, or come back in a moment.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
