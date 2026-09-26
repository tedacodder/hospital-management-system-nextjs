import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MobileMenu, type NavLink } from "@/components/marketing/MobileMenu";

const LINKS: NavLink[] = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#journey" },
  { label: "Security", href: "#security" },
  { label: "About", href: "/about" },
  { label: "Emergency", href: "/emergency", emergency: true },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule/80 bg-paper/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          aria-label="MediCare+ home"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const cls =
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/5 hover:text-ink-900";
            return l.href.startsWith("#") ? (
              <a key={l.href} href={l.href} className={cls}>
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={cls}>
                {l.emergency && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal-stop)]" aria-hidden="true" />
                )}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" className="hidden sm:inline-flex">
            Create account
          </ButtonLink>
          <MobileMenu links={LINKS} />
        </div>
      </div>
    </header>
  );
}
