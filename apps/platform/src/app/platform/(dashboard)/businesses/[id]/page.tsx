import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@booking-easy/db";
import { formatPrice } from "@booking-easy/shared";
import { setBusinessSuspended } from "@/lib/actions/businesses";
import { TIER_PRICE_CENTS } from "@/lib/pricing";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-completed",
  TRIALING: "badge-accent",
  PAST_DUE: "badge-pending",
  CANCELED: "badge-cancelled",
  INCOMPLETE: "badge-neutral",
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      _count: { select: { appointments: true, staff: true, services: true, customers: true } },
      admins: { select: { email: true, name: true } },
    },
  });
  if (!business) notFound();

  return (
    <div>
      <Link
        href="/platform"
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={14} />
        Businesses
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            /{business.slug}
            {business.tagline ? ` · ${business.tagline}` : ""}
          </p>
        </div>
        <a
          href={`https://bookingeasy.vercel.app/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
        >
          View site
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Subscription</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Tier
              </p>
              <p className="mt-0.5 text-sm font-medium">{business.subscriptionTier}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Status
              </p>
              <span className={`badge mt-1 ${STATUS_BADGE[business.subscriptionStatus] ?? "badge-neutral"}`}>
                <span className="badge-dot" />
                {business.subscriptionStatus.replace("_", " ")}
              </span>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Est. monthly value
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {formatPrice(TIER_PRICE_CENTS[business.subscriptionTier])}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Current period ends
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {business.currentPeriodEnd
                  ? business.currentPeriodEnd.toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Contact
            </h3>
            <div className="mt-2 space-y-1 text-sm">
              <p>{business.email || "No email on file"}</p>
              <p style={{ color: "var(--text-secondary)" }}>{business.phone || "No phone on file"}</p>
            </div>
            {business.admins.length > 0 && (
              <div className="mt-3">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Admin accounts
                </p>
                <p className="mt-0.5 text-sm">{business.admins.map((a) => a.email).join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold">Usage</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Services</dt>
              <dd className="font-medium">{business._count.services}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Staff</dt>
              <dd className="font-medium">{business._count.staff}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Customers</dt>
              <dd className="font-medium">{business._count.customers}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt style={{ color: "var(--text-secondary)" }}>Appointments</dt>
              <dd className="font-medium">{business._count.appointments}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card mt-6 p-5" style={{ borderColor: business.suspended ? "var(--status-cancelled-fg)" : undefined }}>
        <h2 className="text-sm font-semibold">Policy suspension</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Independent of billing status — suspending immediately blocks this business&apos;s admin
          dashboard and hides their public booking site, regardless of subscription state.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className={`badge ${business.suspended ? "badge-cancelled" : "badge-completed"}`}>
            <span className="badge-dot" />
            {business.suspended ? "Suspended" : "Active"}
          </span>
          <form action={setBusinessSuspended}>
            <input type="hidden" name="id" value={business.id} />
            <input type="hidden" name="suspended" value={(!business.suspended).toString()} />
            <button
              type="submit"
              className={business.suspended ? "btn btn-secondary btn-sm" : "btn btn-danger-ghost btn-sm"}
            >
              {business.suspended ? "Reinstate business" : "Suspend business"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
