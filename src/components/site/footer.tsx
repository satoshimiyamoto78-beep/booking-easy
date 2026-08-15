import { getBusinessSettings } from "@/lib/business";

export async function SiteFooter() {
  const settings = await getBusinessSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-600 sm:px-6 dark:text-neutral-400">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">{settings.shopName}</p>
            {settings.address && <p className="mt-1">{settings.address}</p>}
          </div>
          <div className="space-y-1">
            {settings.phone && <p>{settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
            {settings.instagram && <p>{settings.instagram}</p>}
          </div>
        </div>
        <p className="mt-8 text-xs text-neutral-500">
          &copy; {year} {settings.shopName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
