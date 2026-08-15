import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminOverviewPage() {
  const { businessId } = await verifySession();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [todayCount, upcoming, serviceCount, staffCount] = await Promise.all([
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
      take: 8,
      include: { service: true, staff: true, customer: true },
    }),
    prisma.service.count({ where: { businessId, active: true } }),
    prisma.staff.count({ where: { businessId, active: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={todayCount} />
        <StatCard label="Active services" value={serviceCount} />
        <StatCard label="Active staff" value={staffCount} />
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Upcoming appointments</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Staff</th>
                <th className="px-4 py-2">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    No upcoming appointments.
                  </td>
                </tr>
              )}
              {upcoming.map((appt) => (
                <tr key={appt.id}>
                  <td className="px-4 py-3">
                    {appt.startsAt.toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">{appt.customer.name}</td>
                  <td className="px-4 py-3">{appt.service.name}</td>
                  <td className="px-4 py-3">{appt.staff.name}</td>
                  <td className="px-4 py-3">{formatPrice(appt.service.priceCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
