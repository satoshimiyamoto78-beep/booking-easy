import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { updateService, deleteService } from "@/lib/actions/admin";
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
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={14} />
        Services
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit service</h1>
      <div className="mt-6">
        <ServiceForm action={updateService} defaultValues={service} submitLabel="Save changes" />
      </div>
      <div className="mt-8 max-w-2xl border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
        <form action={deleteService}>
          <input type="hidden" name="id" value={service.id} />
          <button type="submit" className="btn btn-danger-ghost btn-sm">
            <Trash2 size={14} />
            Delete service
          </button>
        </form>
      </div>
    </div>
  );
}
