import Link from "next/link";
import { prisma } from "@booking-easy/db";
import { formatPrice } from "@booking-easy/shared";
import { Building2, TrendingUp, ShieldAlert, Users } from "lucide-react";
import { TIER_PRICE_CENTS } from "@/lib/pricing";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge-completed",
  TRIALING: "badge-accent",
  PAST_DUE: "badge-pending",
  CANCELED: "badge-cancelled",
  INCOMPLETE: "badge-neutral",
};

export default async function PlatformOverviewPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { appointments: true, staff: true } } },
  });

  const activeCount = businesses.filter((b) => b.subscriptionStatus === "ACTIVE").length;
  const suspendedCount = businesses.filter((b) => b.suspended).length;
  const mrrCents = businesses
    .filter((b) => b.subscriptionStatus === "ACTIVE" || b.subscriptionStatus === "TRIALING")
    .reduce((sum, b) => sum + TIER_PRICE_CENTS[b.subscriptionTier], 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Every business on the platform.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={businesses.length.toString()} sublabel="businesses" icon={Building2} />
        <StatCard label="Active" value={activeCount.toString()} sublabel="subscriptions" icon={Users} />
        <StatCard label="Est. MRR" value={formatPrice(mrrCents)} sublabel="active + trialing" icon={TrendingUp} />
        <StatCard
          label="Suspended"
          value={suspendedCount.toString()}
          sublabel="policy holds"
          icon={ShieldAlert}
        />
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {["Business", "Tier", "Status", "Staff", "Appointments", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                  No businesses yet.
                </td>
              </tr>
            )}
            {businesses.map((business) => (
              <tr key={business.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td className="px-5 py-3.5">
                  <Link href={`/platform/businesses/${business.id}`} className="font-medium hover:underline">
                    {business.name}
                  </Link>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    /{business.slug}
                  </div>
                </td>
                <td className="px-5 py-3.5">{business.subscriptionTier}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${STATUS_BADGE[business.subscriptionStatus] ?? "badge-neutral"}`}>
                    <span className="badge-dot" />
                    {business.subscriptionStatus.replace("_", " ")}
                  </span>
                  {business.suspended && (
                    <span className="badge badge-cancelled ml-2">
                      <span className="badge-dot" />
                      Suspended
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">{business._count.staff}</td>
                <td className="px-5 py-3.5">{business._count.appointments}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/platform/businesses/${business.id}`}
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="card p-5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>{" "}
        · {sublabel}
      </p>
    </div>
  );
}
