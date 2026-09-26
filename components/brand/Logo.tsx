// The MediCare+ mark: the same "M+" tile the application shell uses, so the
// public pages and the signed-in product read as one brand.

export function LogoMark({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[0.8125rem] font-bold tracking-tight shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] ${
        tone === "dark" ? "bg-accent-400 text-panel" : "bg-accent-700 text-white"
      } ${className}`}
    >
      M+
    </span>
  );
}

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark tone={tone} />
      <span className={`text-[0.9375rem] font-semibold tracking-tight ${tone === "dark" ? "text-white" : "text-ink-900"}`}>
        MediCare+
      </span>
    </span>
  );
}
