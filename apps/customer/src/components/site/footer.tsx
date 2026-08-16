import type { Business } from "@booking-easy/db";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";

export function SiteFooter({ business }: { business: Business }) {
  const year = new Date().getFullYear();
  const hasContact = business.address || business.phone || business.email || business.instagram;

  return (
    <footer className="mt-auto" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface)" }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-base font-semibold">{business.name}</p>
            {business.tagline && (
              <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                {business.tagline}
              </p>
            )}
          </div>
          {hasContact && (
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {business.address && (
                <p className="flex items-center gap-2">
                  <MapPin size={15} style={{ color: "var(--text-tertiary)" }} />
                  {business.address}
                </p>
              )}
              {business.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={15} style={{ color: "var(--text-tertiary)" }} />
                  {business.phone}
                </p>
              )}
              {business.email && (
                <p className="flex items-center gap-2">
                  <Mail size={15} style={{ color: "var(--text-tertiary)" }} />
                  {business.email}
                </p>
              )}
              {business.instagram && (
                <p className="flex items-center gap-2">
                  <Instagram size={15} style={{ color: "var(--text-tertiary)" }} />
                  {business.instagram}
                </p>
              )}
            </div>
          )}
        </div>
        <p className="mt-10 text-xs" style={{ color: "var(--text-tertiary)" }}>
          &copy; {year} {business.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
