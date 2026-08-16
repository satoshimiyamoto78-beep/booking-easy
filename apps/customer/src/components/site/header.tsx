import Link from "next/link";
import type { Business } from "@booking-easy/db";

export function SiteHeader({ business }: { business: Business }) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={`/${business.slug}`} className="flex items-center gap-2.5 leading-tight">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: "var(--brand)", color: "var(--brand-contrast)" }}
            >
              {business.name[0]}
            </span>
          )}
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold tracking-tight">{business.name}</span>
            {business.tagline && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {business.tagline}
              </span>
            )}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href={`/${business.slug}/services`}
            className="hidden sm:inline"
            style={{ color: "var(--text-secondary)" }}
          >
            Services
          </Link>
          <Link href={`/${business.slug}/book`} className="btn btn-primary btn-sm">
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
