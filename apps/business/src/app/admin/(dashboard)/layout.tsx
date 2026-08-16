import { getOptionalSession } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";
import {
  SidebarNav,
  SidebarSecondaryNav,
  BottomNav,
  MobileSettingsLink,
  SignOutButton,
} from "@/components/admin/nav-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getOptionalSession();
  const initial = session?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex min-h-full" style={{ background: "var(--paper)" }}>
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r p-5 sm:flex"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 px-2 py-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            B
          </span>
          <span className="text-sm font-semibold tracking-tight">Booking Easy</span>
        </div>

        <div className="mt-8 flex-1">
          <p
            className="px-3 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Manage
          </p>
          <div className="mt-2">
            <SidebarNav />
          </div>
        </div>

        <div className="border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
          <SidebarSecondaryNav />
        </div>

        <div className="border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
          {session && (
            <div className="mb-2 flex items-center gap-3 px-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                {initial}
              </span>
              <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                {session.email}
              </span>
            </div>
          )}
          {session && <SignOutButton action={logout} />}
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b px-5 py-4 sm:hidden"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              B
            </span>
            <span className="text-sm font-semibold">Booking Easy</span>
          </div>
          <div className="flex items-center gap-4">
            <MobileSettingsLink />
            {session && (
              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 sm:pb-10 sm:pt-8">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
