import Link from "next/link";
import { getOptionalSession } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/staff", label: "Staff" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();

  return (
    <div className="flex min-h-full bg-neutral-50 dark:bg-neutral-950">
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 p-6 sm:block dark:border-neutral-800">
        <p className="text-sm font-semibold">Admin</p>
        <nav className="mt-6 flex flex-col gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500">
            {session ? `Signed in as ${session.email}` : ""}
          </p>
          {session && (
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-medium text-neutral-600 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400"
              >
                Sign out
              </button>
            </form>
          )}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
