import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { createStaff } from "@/lib/actions/admin";
import { StaffForm } from "@/components/admin/staff-form";

export default async function NewStaffPage() {
  const { businessId } = await verifySession();
  const services = await prisma.service.findMany({
    where: { businessId, active: true },
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
