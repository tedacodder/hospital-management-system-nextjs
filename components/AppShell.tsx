"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useRef, useState, type ComponentType, type ReactNode, type RefObject, type SVGProps } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/shell/UserMenu";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  BuildingIcon,
  CalendarIcon,
  CloseIcon,
  ClockIcon,
  EmergencyIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MessageIcon,
  PlusIcon,
  ReceiptIcon,
  StethoscopeIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { useModal } from "@/components/ui/useModal";

// One role-aware shell for every signed-in screen, so navigation only needs to
// be gotten right once. Patients get a bottom tab bar on phones; the other
// roles keep the slide-in drawer, because their navigation is longer.

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { label: string; href: string; icon: IconComponent };
type Role = "PATIENT" | "DOCTOR" | "STAFF" | "ADMIN";

// Each entry is a real, working route. Nothing here links to a page that
// doesn't exist — the earlier draft of this nav did, before those sections
// were merged into single dashboard pages.
const NAV: Record<Role, NavItem[]> = {
  PATIENT: [
    { label: "Overview", href: "/dashboard/user", icon: HomeIcon },
    { label: "Book appointment", href: "/appointment", icon: CalendarIcon },
    { label: "Messages", href: "/dashboard/messages", icon: MessageIcon },
    { label: "Emergency", href: "/emergency", icon: EmergencyIcon },
  ],
  DOCTOR: [
    { label: "Overview", href: "/dashboard/doc", icon: HomeIcon },
    { label: "Patients", href: "/dashboard/doc/patients", icon: UsersIcon },
    { label: "Availability", href: "/dashboard/doc/availability", icon: ClockIcon },
    { label: "Messages", href: "/dashboard/messages", icon: MessageIcon },
  ],
  STAFF: [
    { label: "Overview", href: "/dashboard/admin", icon: HomeIcon },
    { label: "Patients", href: "/dashboard/admin/patients", icon: UsersIcon },
    { label: "Doctors", href: "/dashboard/admin/doctors", icon: StethoscopeIcon },
    { label: "Departments", href: "/dashboard/admin/departments", icon: BuildingIcon },
    { label: "Billing", href: "/dashboard/admin/billing", icon: ReceiptIcon },
    { label: "Messages", href: "/dashboard/messages", icon: MessageIcon },
  ],
  ADMIN: [
    { label: "Overview", href: "/dashboard/admin", icon: HomeIcon },
    { label: "Patients", href: "/dashboard/admin/patients", icon: UsersIcon },
    { label: "Doctors", href: "/dashboard/admin/doctors", icon: StethoscopeIcon },
    { label: "Departments", href: "/dashboard/admin/departments", icon: BuildingIcon },
    { label: "Billing", href: "/dashboard/admin/billing", icon: ReceiptIcon },
    { label: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
    { label: "Messages", href: "/dashboard/messages", icon: MessageIcon },
  ],
};

const PROFILE_ITEM: NavItem = { label: "Profile", href: "/dashboard/profile", icon: UserIcon };

function isActive(pathname: string | null, href: string) {
  return pathname === href || (pathname?.startsWith(href + "/") ?? false);
}

/// Several nav hrefs can match the same pathname when one is a prefix of
/// another (/dashboard/doc is a prefix of /dashboard/doc/patients) — this
/// picks the single longest (most specific) match so exactly one row is
/// ever "active" instead of a parent item staying lit on every subpage.
function bestMatchHref(pathname: string | null, items: NavItem[]): string | null {
  const match = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));
  return match?.href ?? null;
}

/// The current section's name for the header, from the longest matching nav
/// entry (so /dashboard/admin/patients reads "Patients", not "Overview").
function titleFor(pathname: string | null, items: NavItem[]): string {
  if (isActive(pathname, PROFILE_ITEM.href)) return "My profile";
  const match = items.find((i) => i.href === bestMatchHref(pathname, items));
  return match?.label ?? "";
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const role = (session?.user?.role ?? "PATIENT") as Role;
  const items = NAV[role] ?? NAV.PATIENT;
  const isPatient = role === "PATIENT";
  const name = session?.user?.name;

  // The drawer is a modal overlay, so it gets the same Escape / focus-trap /
  // scroll-lock behaviour as Dialog — a keyboard or screen-reader user
  // otherwise has no way to close it short of following a nav link.
  useModal(mobileOpen, drawerRef, () => setMobileOpen(false), drawerCloseRef);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-rule bg-surface md:flex" data-print="hide">
        <SidebarContent
          items={items}
          pathname={pathname}
          name={name}
          role={role}
          onSignOut={handleLogout}
          showBook={isPatient}
        />
      </aside>

      {/* Sidebar — mobile drawer (non-patient roles) */}
      {mobileOpen && !isPatient && (
        <div className="fixed inset-0 z-40 md:hidden" data-print="hide">
          <div className="animate-fade absolute inset-0 bg-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="animate-drawer relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-[var(--shadow-float)]"
          >
            <SidebarContent
              items={items}
              pathname={pathname}
              name={name}
              role={role}
              onSignOut={handleLogout}
              onNavigate={() => setMobileOpen(false)}
              closeRef={drawerCloseRef}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-rule bg-paper/85 px-4 backdrop-blur-md md:px-8"
          data-print="hide"
        >
          {!isPatient && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-900/5 md:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          )}

          {/* Phones: brand. Desktop: where you are. */}
          <Link href={isPatient ? "/dashboard/user" : items[0].href} aria-label="MediCare+ home" className="flex items-center gap-2.5 md:hidden">
            <LogoMark />
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink-900">MediCare+</span>
          </Link>
          <p className="hidden text-sm font-medium text-ink-500 md:block" aria-hidden="true">
            {titleFor(pathname, items)}
          </p>

          <div className="ml-auto flex items-center gap-1.5">
            {isPatient && !isActive(pathname, "/appointment") && (
              <ButtonLink href="/appointment" size="sm" className="mr-1 hidden md:inline-flex">
                <PlusIcon className="h-4 w-4" />
                Book appointment
              </ButtonLink>
            )}
            <NotificationBell />
            <ThemeToggle />
            <div className="md:hidden">
              <UserMenu name={name} roleLabel={roleLabel(role)} onSignOut={handleLogout} />
            </div>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className={`mx-auto w-full max-w-7xl flex-1 px-4 pt-5 focus:outline-none md:px-8 md:pt-8 ${
            isPatient ? "pb-28 md:pb-10" : "pb-10"
          }`}
        >
          <div className="page-enter">{children}</div>
        </main>
      </div>

      {/* Bottom tab bar — patients on phones */}
      {isPatient && (
        <nav
          aria-label="Primary"
          className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 backdrop-blur-md md:hidden"
          data-print="hide"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {(() => {
              const tabItems = [...NAV.PATIENT, PROFILE_ITEM];
              const activeHref = bestMatchHref(pathname, tabItems);
              return tabItems.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-medium transition-colors ${
                        active ? "text-accent-700" : "text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-accent-700" />}
                      <Icon className="h-[22px] w-[22px]" />
                      <span className="max-w-full truncate">{item.label === "Book appointment" ? "Book" : item.label}</span>
                    </Link>
                  </li>
                );
              });
            })()}
          </ul>
        </nav>
      )}
    </div>
  );
}

function SidebarContent({
  items,
  pathname,
  name,
  role,
  onSignOut,
  onNavigate,
  onClose,
  closeRef,
  showBook = false,
}: {
  items: NavItem[];
  pathname: string | null;
  name: string | null | undefined;
  role: Role;
  onSignOut: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
  closeRef?: RefObject<HTMLButtonElement | null>;
  showBook?: boolean;
}) {
  const profileActive = isActive(pathname, PROFILE_ITEM.href);
  const activeItemHref = profileActive ? null : bestMatchHref(pathname, items);
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-rule px-5">
        <Link href={items[0].href} onClick={onNavigate} aria-label="MediCare+ home" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink-900">MediCare+</span>
        </Link>
        {onClose && (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-2 ml-auto flex h-11 w-11 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
        {showBook && (
          <ButtonLink href="/appointment" className="mb-3 w-full" onClick={onNavigate}>
            <PlusIcon className="h-4 w-4" />
            Book appointment
          </ButtonLink>
        )}
        {items
          .filter((item) => !(showBook && item.href === "/appointment"))
          .map((item) => {
            const active = item.href === activeItemHref;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                  active ? "bg-accent-050 text-accent-700" : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900"
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent-700" />}
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.href === "/emergency" && (
                  <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-signal-stop)]" />
                )}
              </Link>
            );
          })}
      </nav>

      <div className="shrink-0 border-t border-rule p-3">
        <Link
          href={PROFILE_ITEM.href}
          onClick={onNavigate}
          aria-current={profileActive ? "page" : undefined}
          className={`flex min-h-12 items-center gap-3 rounded-md px-3 transition-colors ${
            profileActive ? "bg-accent-050" : "hover:bg-ink-900/5"
          }`}
        >
          <Avatar name={name} tone="brand" size="sm" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium text-ink-900">{name ?? "My profile"}</span>
            <span className="block text-xs text-ink-500">{roleLabel(role)}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
        >
          <LogOutIcon className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </>
  );
}
