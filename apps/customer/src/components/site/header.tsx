import Link from "next/link";
import type { Business } from "@booking-easy/db";

export function SiteHeader({ business }: { business: Business }) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={`/${business.slug}`} className="flex items-center gap-2.5 leading-tight">
          {business.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">{business.name}</span>
            {business.tagline && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {business.tagline}
              </span>
            )}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href={`/${business.slug}/services`}
            className="hover:text-[var(--brand)]"
          >
            Services
          </Link>
          <Link
            href={`/${business.slug}/book`}
            className="rounded-full bg-neutral-900 px-4 py-2 text-white transition hover:bg-[var(--brand)] hover:text-neutral-950 dark:bg-white dark:text-neutral-900"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
