import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatCategory, formatDuration, formatPrice } from "@/lib/format";
import { deleteService } from "@/lib/actions/admin";

export default async function AdminServicesPage() {
  const { businessId } = await verifySession();

  const services = await prisma.service.findMany({
    where: { businessId },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        <Link
          href="/admin/services/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
        >
          New service
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 py-3 font-medium">{service.name}</td>
                <td className="px-4 py-3">{formatCategory(service.category)}</td>
                <td className="px-4 py-3">{formatDuration(service.durationMinutes)}</td>
                <td className="px-4 py-3">{formatPrice(service.priceCents)}</td>
                <td className="px-4 py-3">
                  {service.active ? (
                    <span className="text-green-600 dark:text-green-400">Active</span>
                  ) : (
                    <span className="text-neutral-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="text-amber-600 hover:underline dark:text-amber-400"
                    >
                      Edit
                    </Link>
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={service.id} />
                      <button type="submit" className="text-red-500 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
