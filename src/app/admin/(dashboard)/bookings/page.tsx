import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateAppointmentStatus } from "@/lib/actions/admin";
import { AppointmentStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS = Object.values(AppointmentStatus);

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400",
  NO_SHOW: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

export default async function AdminBookingsPage() {
  const { businessId } = await verifySession();

  const appointments = await prisma.appointment.findMany({
    where: { businessId },
    orderBy: { startsAt: "desc" },
    take: 100,
    include: { service: true, staff: true, customer: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bookings</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Staff</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {appointments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No bookings yet.
                </td>
              </tr>
            )}
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  {appt.startsAt.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div>{appt.customer.name}</div>
                  <div className="text-xs text-neutral-500">{appt.customer.email}</div>
                </td>
                <td className="px-4 py-3">{appt.service.name}</td>
                <td className="px-4 py-3">{appt.staff.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[appt.status]}`}
                  >
                    {appt.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateAppointmentStatus} className="flex items-center gap-2">
                    <input type="hidden" name="appointmentId" value={appt.id} />
                    <select
                      name="status"
                      defaultValue={appt.status}
                      className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium hover:border-amber-500 dark:border-neutral-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
