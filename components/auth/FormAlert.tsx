import type { ReactNode } from "react";
import { AlertIcon, CheckCircleIcon } from "@/components/ui/Icons";

/// A form-level message. Errors use role="alert" so they are announced the
/// moment they appear; success and information use role="status", which waits
/// for a pause.
export function FormAlert({
  tone,
  children,
  id,
}: {
  tone: "error" | "success";
  children: ReactNode;
  id?: string;
}) {
  const error = tone === "error";
  return (
    <div
      id={id}
      role={error ? "alert" : "status"}
      className={`animate-rise flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm leading-snug ${
        error
          ? "border-[var(--color-signal-stop)]/25 bg-[var(--color-signal-stop-bg)] text-[var(--color-signal-stop)]"
          : "border-[var(--color-signal-ok)]/25 bg-[var(--color-signal-ok-bg)] text-[var(--color-signal-ok)]"
      }`}
    >
      {error ? (
        <AlertIcon className="mt-px h-[18px] w-[18px] shrink-0" />
      ) : (
        <CheckCircleIcon className="mt-px h-[18px] w-[18px] shrink-0" />
      )}
      <p>{children}</p>
    </div>
  );
}
