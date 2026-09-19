"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/NotificationBell";

// Replaces Navbar.tsx, Sidebar.tsx, DocNav.tsx and PatientNav.tsx with one
// role-aware shell, so navigation only needs to be gotten right once.

type NavItem = { label: string; href: string; icon: ReactNode };

const ICONS = {
  home: (
    <path d="M3 9.5 10 4l7 5.5M5 8.5V16a1 1 0 0 0 1 1h3v-4.5h2V17h3a1 1 0 0 0 1-1V8.5" strokeLinejoin="round" />
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
      <path d="M3.5 8h13M7 3v3M13 3v3" strokeLinecap="round" />
    </>
  ),
  patients: (
    <>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M2.5 16c.5-3 2.2-4.5 4.5-4.5S11 13 11.5 16" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" />
      <path d="M13 11.2c1.8.1 3 1.4 3.5 3.6" strokeLinecap="round" />
    </>
  ),
  doctors: (
    <>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M4 17c.7-4 2.8-6 6-6s5.3 2 6 6" strokeLinecap="round" />
    </>
  ),
  records: (
    <>
      <path d="M6 3.5h6.5L16 7v9.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M8 9.5h4M8 12.5h4" strokeLinecap="round" />
    </>
  ),
  prescription: (
    <>
      <path d="M5 3.5h10v13H5z" strokeLinejoin="round" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" strokeLinecap="round" />
    </>
  ),
  billing: (
    <>
      <rect x="3" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 8.5h14" strokeLinecap="round" />
      <path d="M6 12h3" strokeLinecap="round" />
    </>
  ),
  departments: (
    <>
      <path d="M4 16.5V8l6-4 6 4v8.5" strokeLinejoin="round" />
      <path d="M8 16.5v-5h4v5" strokeLinejoin="round" />
    </>
  ),
  users: (
    <>
      <circle cx="7" cy="6.5" r="2.5" />
      <circle cx="14" cy="6.5" r="2" />
      <path d="M2.5 16c.4-3 2-4.5 4.5-4.5S11 13 11.4 16M12.5 12c2 .2 3.3 1.6 3.9 4" strokeLinecap="round" />
    </>
  ),
  messages: (
    <path d="M3.5 4.5h13v9h-8L4.5 16v-2.5h-1v-9Z" strokeLinejoin="round" strokeLinecap="round" />
  ),
  emergency: (
    <>
      <path d="M10 2.5 17 6v5c0 4-3 6.5-7 7-4-.5-7-3-7-7V6Z" strokeLinejoin="round" />
      <path d="M10 7v4M10 13.5v.01" strokeLinecap="round" />
    </>
  ),
  profile: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c.7-4 2.8-6 6-6s5.3 2 6 6" strokeLinecap="round" />
    </>
  ),
} as const;

function Icon({ path }: { path: ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      {path}
    </svg>
  );
}

// Each entry is a real, working route. Nothing here links to a page that
// doesn't exist — the earlier draft of this nav did, before those sections
// were merged into single dashboard pages.
const NAV: Record<"PATIENT" | "DOCTOR" | "STAFF" | "ADMIN", NavItem[]> = {
  PATIENT: [
    { label: "Overview", href: "/dashboard/user", icon: <Icon path={ICONS.home} /> },
    { label: "Book appointment", href: "/appointment", icon: <Icon path={ICONS.calendar} /> },
    { label: "Messages", href: "/dashboard/messages", icon: <Icon path={ICONS.messages} /> },
    { label: "Emergency", href: "/emergency", icon: <Icon path={ICONS.emergency} /> },
  ],
  DOCTOR: [
    { label: "Overview", href: "/dashboard/doc", icon: <Icon path={ICONS.home} /> },
    { label: "Messages", href: "/dashboard/messages", icon: <Icon path={ICONS.messages} /> },
  ],
  STAFF: [
    { label: "Overview", href: "/dashboard/admin", icon: <Icon path={ICONS.home} /> },
    { label: "Patients", href: "/dashboard/admin/patients", icon: <Icon path={ICONS.patients} /> },
    { label: "Doctors", href: "/dashboard/admin/doctors", icon: <Icon path={ICONS.doctors} /> },
    { label: "Departments", href: "/dashboard/admin/departments", icon: <Icon path={ICONS.departments} /> },
    { label: "Billing", href: "/dashboard/admin/billing", icon: <Icon path={ICONS.billing} /> },
    { label: "Messages", href: "/dashboard/messages", icon: <Icon path={ICONS.messages} /> },
  ],
  ADMIN: [
    { label: "Overview", href: "/dashboard/admin", icon: <Icon path={ICONS.home} /> },
    { label: "Patients", href: "/dashboard/admin/patients", icon: <Icon path={ICONS.patients} /> },
    { label: "Doctors", href: "/dashboard/admin/doctors", icon: <Icon path={ICONS.doctors} /> },
    { label: "Departments", href: "/dashboard/admin/departments", icon: <Icon path={ICONS.departments} /> },
    { label: "Billing", href: "/dashboard/admin/billing", icon: <Icon path={ICONS.billing} /> },
    { label: "Users", href: "/dashboard/admin/users", icon: <Icon path={ICONS.users} /> },
    { label: "Messages", href: "/dashboard/messages", icon: <Icon path={ICONS.messages} /> },
  ],
};

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user?.role ?? "PATIENT") as keyof typeof NAV;
  const items = NAV[role] ?? NAV.PATIENT;

  // The desktop sidebar is always in the DOM; the mobile drawer is a modal
  // overlay, so it needs the same escape-to-close and scroll-lock behavior
  // as the Dialog component — a keyboard or screen-reader user otherwise has
  // no way to close it short of clicking a nav link.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 flex-col border-r border-rule bg-surface md:flex" data-print="hide">
        <SidebarContent items={items} pathname={pathname} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" data-print="hide">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-64 flex-col bg-surface"
          >
            <SidebarContent
              items={items}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className="flex h-14 items-center justify-between border-b border-rule bg-surface px-4 md:px-6"
          data-print="hide"
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-2 text-ink-700 hover:bg-ink-900/5 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2 md:hidden">
            <span className="text-sm font-semibold text-ink-900">MediCare+</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <div className="hidden items-center gap-2 border-l border-rule pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-700 text-xs font-semibold text-white">
                {initials(session?.user?.name)}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-ink-900">{session?.user?.name ?? "—"}</p>
                <p className="text-xs text-ink-500">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-900/5"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  pathname,
  onNavigate,
  onClose,
}: {
  items: NavItem[];
  pathname: string | null;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-rule px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-700 text-xs font-bold text-white">
          M+
        </div>
        <span className="text-sm font-semibold text-ink-900">MediCare+</span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto rounded-md p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-accent-050 text-accent-700" : "text-ink-700 hover:bg-ink-900/5"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-rule p-3">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-900/5"
        >
          <Icon path={ICONS.profile} />
          My profile
        </Link>
      </div>
    </>
  );
}
