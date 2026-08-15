import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateStaff } from "@/lib/actions/admin";
import { StaffForm } from "@/components/admin/staff-form";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;

  const [staff, services] = await Promise.all([
    prisma.staff.findUnique({
      where: { id },
      include: { services: true, schedules: true },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!staff) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit staff member</h1>
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
    </div>
  );
}
