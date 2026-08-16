import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { updateStaff, deleteStaff } from "@/lib/actions/admin";
import { StaffForm } from "@/components/admin/staff-form";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await verifySession();
  const { id } = await params;

  const [staff, services] = await Promise.all([
    prisma.staff.findUnique({
      where: { id, businessId },
      include: { services: true, schedules: true },
    }),
    prisma.service.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!staff) notFound();

  return (
    <div>
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={14} />
        Staff
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit staff member</h1>
      <div className="mt-6">
        <StaffForm
          action={updateStaff}
          services={services}
          defaultValues={{
            ...staff,
            serviceIds: staff.services.map((s) => s.serviceId),
            schedule: staff.schedules,
          }}
          submitLabel="Save changes"
        />
      </div>
      <div className="mt-8 max-w-2xl border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
        <form action={deleteStaff}>
          <input type="hidden" name="id" value={staff.id} />
          <button type="submit" className="btn btn-danger-ghost btn-sm">
            <Trash2 size={14} />
            Delete staff member
          </button>
        </form>
      </div>
    </div>
  );
}
