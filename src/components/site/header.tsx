import Link from "next/link";
import { getBusinessSettings } from "@/lib/business";

export async function SiteHeader() {
  const settings = await getBusinessSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight">{settings.shopName}</span>
          {settings.tagline && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {settings.tagline}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/services" className="hover:text-amber-600 dark:hover:text-amber-400">
            Services
          </Link>
          <Link
            href="/book"
            className="rounded-full bg-neutral-900 px-4 py-2 text-white transition hover:bg-amber-500 hover:text-neutral-950 dark:bg-white dark:text-neutral-900"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
