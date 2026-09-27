import { ShieldIcon } from "@/components/ui/Icons";

/// Shown on both the search and detail screens. This app has no Ethiopian
/// formulary of its own — the requirement is to say that plainly rather than
/// let U.S. label data pass as a verified local reference.
export function SourceNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-[var(--color-signal-info)]/20 bg-[var(--color-signal-info-bg)] px-4 py-3">
      <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-signal-info)]" />
      <p className="text-sm leading-relaxed text-[var(--color-signal-info)]">
        <span className="font-semibold">Source: openFDA (U.S. FDA drug labeling).</span> This data reflects U.S.-approved
        products and may not match Ethiopian drug availability, local approvals, or current local treatment guidelines. It
        is for reference only and must be reviewed by a qualified healthcare professional before any clinical decision.
      </p>
    </div>
  );
}
