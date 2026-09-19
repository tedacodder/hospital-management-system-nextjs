import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/#platform" },
      { label: "How it works", href: "/#journey" },
      { label: "Security", href: "/#security" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "About", href: "/about" },
      { label: "Emergency information", href: "/emergency" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Appointments, records, prescriptions and billing for patients, doctors and clinic staff.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-sm font-semibold text-ink-900">{c.title}</p>
              <ul className="mt-3 space-y-1">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-9 items-center text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MediCare+</p>
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-signal-stop)]" aria-hidden="true" />
            In a life-threatening emergency, call your local emergency number.
          </p>
        </div>
      </div>
    </footer>
  );
}
