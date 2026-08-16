import { verifySession } from "@/lib/dal";
import { prisma, AppointmentStatus } from "@booking-easy/db";
import { formatPrice } from "@booking-easy/shared";
import { updateAppointmentStatus } from "@/lib/actions/admin";
import { CalendarX2 } from "lucide-react";

const STATUS_OPTIONS = Object.values(AppointmentStatus);

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  CONFIRMED: "badge-confirmed",
  CANCELLED: "badge-cancelled",
  COMPLETED: "badge-completed",
  NO_SHOW: "badge-noshow",
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
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        {appointments.length} most recent appointment{appointments.length === 1 ? "" : "s"}
      </p>

      {appointments.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
          <CalendarX2 size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No bookings yet.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {appointments.map((appt) => (
              <div key={appt.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{appt.customer.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {appt.startsAt.toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[appt.status]}`}>
                    <span className="badge-dot" />
                    {appt.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {appt.service.name} with {appt.staff.name}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  {formatPrice(appt.service.priceCents)}
                </p>
                <form action={updateAppointmentStatus} className="mt-3 flex items-center gap-2">
                  <input type="hidden" name="appointmentId" value={appt.id} />
                  <select name="status" defaultValue={appt.status} className="select flex-1">
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-secondary btn-sm">
                    Save
                  </button>
                </form>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="card mt-6 hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["When", "Customer", "Service", "Staff", "Status", "Update"].map((h) => (
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
                {appointments.map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {appt.startsAt.toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{appt.customer.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {appt.customer.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {appt.service.name}
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {formatPrice(appt.service.priceCents)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{appt.staff.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${STATUS_BADGE[appt.status]}`}>
                        <span className="badge-dot" />
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <form action={updateAppointmentStatus} className="flex items-center gap-2">
                        <input type="hidden" name="appointmentId" value={appt.id} />
                        <select
                          name="status"
                          defaultValue={appt.status}
                          className="select"
                          style={{ padding: "0.4rem 2.2rem 0.4rem 0.7rem", fontSize: "0.75rem" }}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-secondary btn-sm">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
