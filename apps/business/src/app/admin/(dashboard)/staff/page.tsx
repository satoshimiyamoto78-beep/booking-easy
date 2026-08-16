import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { Plus, Pencil, Users } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminStaffPage() {
  const { businessId } = await verifySession();

  const staff = await prisma.staff.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { services: { include: { service: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {staff.length} team member{staff.length === 1 ? "" : "s"} · {staff.filter((s) => s.active).length} active
          </p>
        </div>
        <Link href="/admin/staff/new" className="btn btn-primary">
          <Plus size={16} strokeWidth={2.4} />
          New staff member
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
          <Users size={28} style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            No team members yet. Add someone to start scheduling appointments.
          </p>
          <Link href="/admin/staff/new" className="btn btn-primary btn-sm mt-1">
            <Plus size={14} />
            New staff member
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <Link
              key={member.id}
              href={`/admin/staff/${member.id}`}
              className="card group flex items-start gap-4 p-4 transition-shadow hover:shadow-lg"
            >
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  {initials(member.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{member.name}</p>
                    <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {member.title || "Team member"}
                    </p>
                  </div>
                  <Pencil
                    size={14}
                    className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <p className="mt-2 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                  {member.services.map((s) => s.service.name).join(", ") || "No services assigned"}
                </p>
                <span className={`badge mt-3 ${member.active ? "badge-completed" : "badge-neutral"}`}>
                  <span className="badge-dot" />
                  {member.active ? "Active" : "Hidden"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
