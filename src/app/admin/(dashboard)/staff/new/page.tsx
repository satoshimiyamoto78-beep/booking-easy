import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { createStaff } from "@/lib/actions/admin";
import { StaffForm } from "@/components/admin/staff-form";

export default async function NewStaffPage() {
  await verifySession();
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">New staff member</h1>
      <div className="mt-6">
        <StaffForm action={createStaff} services={services} submitLabel="Create staff member" />
      </div>
    </div>
  );
}
