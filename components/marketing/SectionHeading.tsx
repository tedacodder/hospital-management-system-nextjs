import type { ReactNode } from "react";

export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
  tone = "light",
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={`reveal max-w-2xl ${className}`}>
      <p className={`font-mono text-[0.6875rem] uppercase tracking-wider ${dark ? "text-accent-400" : "text-accent-700"}`}>
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-3 text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] sm:text-4xl ${
          dark ? "text-white" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      {children && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-white/70" : "text-ink-700"}`}>{children}</p>
      )}
    </div>
  );
}
