import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { updateService } from "@/lib/actions/admin";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { businessId } = await verifySession();
  const { id } = await params;

  const service = await prisma.service.findUnique({ where: { id, businessId } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit service</h1>
      <div className="mt-6">
        <ServiceForm action={updateService} defaultValues={service} submitLabel="Save changes" />
      </div>
    </div>
  );
}
