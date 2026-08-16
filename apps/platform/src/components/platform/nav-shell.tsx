"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut } from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const active = pathname === "/platform" || pathname.startsWith("/platform/businesses");

  return (
    <nav className="flex flex-col gap-1">
      <Link href="/platform" className="nav-link" data-active={active}>
        <Building2 size={18} strokeWidth={2} />
        Businesses
      </Link>
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
