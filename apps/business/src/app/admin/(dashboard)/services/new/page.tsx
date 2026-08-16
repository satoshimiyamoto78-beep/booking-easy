import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { createService } from "@/lib/actions/admin";
import { ServiceForm } from "@/components/admin/service-form";

export default async function NewServicePage() {
  await verifySession();

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
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New service</h1>
      <div className="mt-6">
        <ServiceForm action={createService} submitLabel="Create service" />
      </div>
    </div>
  );
}
