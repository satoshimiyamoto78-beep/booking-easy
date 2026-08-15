import { verifySession } from "@/lib/dal";
import { createService } from "@/lib/actions/admin";
import { ServiceForm } from "@/components/admin/service-form";

export default async function NewServicePage() {
  await verifySession();

  return (
    <div>
      <h1 className="text-2xl font-semibold">New service</h1>
      <div className="mt-6">
        <ServiceForm action={createService} submitLabel="Create service" />
      </div>
    </div>
  );
}
