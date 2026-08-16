import Link from "next/link";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm font-semibold">Booking Easy</p>
        <nav className="flex items-center gap-5 text-sm" style={{ color: "var(--text-tertiary)" }}>
          <Link href="/pricing">Pricing</Link>
          <Link href="/signup">Get started</Link>
        </nav>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          &copy; {year} Booking Easy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
