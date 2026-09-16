"use client";

import { ErrorState } from "@/components/ui/Card";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <ErrorState message={error.message || "Something went wrong."} onRetry={reset} />
      </div>
    </div>
  );
}
