import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={14} />
        Staff
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New staff member</h1>
      <div className="mt-6">
        <StaffForm action={createStaff} services={services} submitLabel="Create staff member" />
      </div>
    </div>
  );
}
