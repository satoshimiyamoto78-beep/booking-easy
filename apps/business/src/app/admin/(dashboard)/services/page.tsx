import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";
import { Plus, Pencil, Sparkles } from "lucide-react";

export default async function AdminServicesPage() {
  const { businessId } = await verifySession();

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {services.length} service{services.length === 1 ? "" : "s"} · {services.filter((s) => s.active).length} published
          </p>
        </div>
        <Link href="/admin/services/new" className="btn btn-primary">
          <Plus size={16} strokeWidth={2.4} />
          New service
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
          <Sparkles size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No services yet. Add your first one to start taking bookings.
          </p>
          <Link href="/admin/services/new" className="btn btn-primary btn-sm mt-1">
            <Plus size={14} />
            New service
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/admin/services/${service.id}`}
              className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
            >
              <div
                className="relative flex h-32 items-center justify-center overflow-hidden"
                style={{ background: "var(--accent-soft)" }}
              >
                {service.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles size={28} style={{ color: "var(--accent)" }} />
                )}
                <span
                  className={`badge absolute right-3 top-3 ${service.active ? "badge-completed" : "badge-neutral"}`}
                >
                  <span className="badge-dot" />
                  {service.active ? "Live" : "Hidden"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{service.name}</p>
                  <Pencil
                    size={14}
                    className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatCategory(service.category)} · {formatDuration(service.durationMinutes)}
                </p>
                <p className="mt-3 text-lg font-semibold" style={{ color: "var(--accent)" }}>
                  {formatPrice(service.priceCents)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
