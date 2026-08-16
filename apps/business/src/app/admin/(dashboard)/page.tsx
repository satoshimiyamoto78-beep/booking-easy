import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { formatPrice } from "@booking-easy/shared";
import { CalendarClock, Sparkles, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { Sparkline, TrendBarChart } from "@/components/ui/charts";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminOverviewPage() {
  const { businessId } = await verifySession();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);

  const [todayCount, upcoming, serviceCount, staffCount, recentAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        businessId,
        startsAt: { gte: startOfToday, lt: endOfToday },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.appointment.findMany({
      where: { businessId, startsAt: { gte: now }, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { service: true, staff: true, customer: true },
    }),
    prisma.service.count({ where: { businessId, active: true } }),
    prisma.staff.count({ where: { businessId, active: true } }),
    prisma.appointment.findMany({
      where: {
        businessId,
        startsAt: { gte: fourteenDaysAgo, lt: endOfToday },
        status: { not: "CANCELLED" },
      },
      select: { startsAt: true, service: { select: { priceCents: true } } },
    }),
  ]);

  const dayBuckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    dayBuckets.set(d.toDateString(), 0);
  }
  for (const appt of recentAppointments) {
    const key = appt.startsAt.toDateString();
    if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const trend = [...dayBuckets.entries()].map(([dateStr, value]) => ({
    label: DAY_LABELS[new Date(dateStr).getDay()],
    value,
  }));
  const last7 = trend.slice(-7).map((d) => d.value);

  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weekAppointments = recentAppointments.filter((a) => a.startsAt >= sevenDaysAgo);
  const weekRevenueCents = weekAppointments.reduce((sum, a) => sum + a.service.priceCents, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={todayCount.toString()}
          sublabel="appointments"
          icon={CalendarClock}
          trend={last7}
        />
        <StatCard
          label="This week"
          value={formatPrice(weekRevenueCents)}
          sublabel="revenue"
          icon={TrendingUp}
          trend={last7}
        />
        <StatCard label="Active services" value={serviceCount.toString()} sublabel="published" icon={Sparkles} />
        <StatCard label="Active staff" value={staffCount.toString()} sublabel="on schedule" icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Appointment volume</h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Last 14 days
              </p>
            </div>
          </div>
          <div className="mt-4 h-[200px]">
            <TrendBarChart data={trend} />
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Upcoming</h2>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--accent)" }}
            >
              View all
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {upcoming.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                No upcoming appointments.
              </p>
            )}
            {upcoming.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3">
                <div
                  className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--accent)" }}>
                    {appt.startsAt.toLocaleString([], { month: "short" })}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                    {appt.startsAt.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{appt.customer.name}</p>
                  <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {appt.service.name} · {appt.staff.name}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {appt.startsAt.toLocaleString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  trend?: number[];
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Icon size={17} strokeWidth={2.2} />
        </span>
        {trend && <Sparkline data={trend} />}
      </div>
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
