import Link from "next/link";

export function MarketingHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: "var(--brand)", color: "var(--brand-contrast)" }}
          >
            B
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Booking Easy</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/pricing" style={{ color: "var(--text-secondary)" }}>
            Pricing
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_BUSINESS_APP_URL ?? "https://booking-easy-business.vercel.app"}
            className="hidden sm:inline"
            style={{ color: "var(--text-secondary)" }}
          >
            Log in
          </a>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
