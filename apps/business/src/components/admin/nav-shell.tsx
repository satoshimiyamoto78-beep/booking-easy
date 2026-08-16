"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Sparkles, Users, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/services", label: "Services", icon: Sparkles },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

const SECONDARY_NAV_ITEMS = [{ href: "/admin/settings", label: "Settings", icon: Settings }];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link key={item.href} href={item.href} className="nav-link" data-active={active}>
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarSecondaryNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {SECONDARY_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} className="nav-link" data-active={active}>
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileSettingsLink() {
  const pathname = usePathname();
  const active = isActive(pathname, "/admin/settings");
  return (
    <Link
      href="/admin/settings"
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}
      aria-label="Settings"
    >
      <Settings size={17} strokeWidth={2} />
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SignOutButton({ action }: { action: () => void }) {
  return (
    <form action={action}>
      <button type="submit" className="nav-link w-full">
        <LogOut size={18} strokeWidth={2} />
        Sign out
      </button>
    </form>
  );
}
