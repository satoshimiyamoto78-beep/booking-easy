import type { Business } from "@booking-easy/db";

export function SiteFooter({ business }: { business: Business }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-600 sm:px-6 dark:text-neutral-400">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">{business.name}</p>
            {business.address && <p className="mt-1">{business.address}</p>}
          </div>
          <div className="space-y-1">
            {business.phone && <p>{business.phone}</p>}
            {business.email && <p>{business.email}</p>}
            {business.instagram && <p>{business.instagram}</p>}
          </div>
        </div>
        <p className="mt-8 text-xs text-neutral-500">
          &copy; {year} {business.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
