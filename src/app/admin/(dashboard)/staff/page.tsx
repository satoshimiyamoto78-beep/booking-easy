import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { deleteStaff } from "@/lib/actions/admin";

export default async function AdminStaffPage() {
  const { businessId } = await verifySession();

  const staff = await prisma.staff.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { services: { include: { service: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Staff</h1>
        <Link
          href="/admin/staff/new"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
        >
          New staff member
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Services</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3">{member.title}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {member.services.map((s) => s.service.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {member.active ? (
                    <span className="text-green-600 dark:text-green-400">Active</span>
                  ) : (
                    <span className="text-neutral-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/staff/${member.id}`}
                      className="text-amber-600 hover:underline dark:text-amber-400"
                    >
                      Edit
                    </Link>
                    <form action={deleteStaff}>
                      <input type="hidden" name="id" value={member.id} />
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
