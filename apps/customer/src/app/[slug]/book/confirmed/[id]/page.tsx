import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { formatPrice } from "@booking-easy/shared";

export const dynamic = "force-dynamic";

export default async function BookingConfirmedPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const appointment = await prisma.appointment.findUnique({
    where: { id, businessId: business.id },
    include: { service: true, staff: true, customer: true },
  });

  if (!appointment) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl dark:bg-green-500/10">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-semibold">You&apos;re booked!</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        A confirmation has been recorded for {appointment.customer.name}.
      </p>

      <div className="mt-8 rounded-2xl border border-neutral-200 p-6 text-left text-sm dark:border-neutral-800">
        <div className="flex justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <span className="text-neutral-500">Service</span>
          <span className="font-medium">{appointment.service.name}</span>
        </div>
        <div className="flex justify-between border-b border-neutral-200 py-3 dark:border-neutral-800">
          <span className="text-neutral-500">With</span>
          <span className="font-medium">{appointment.staff.name}</span>
        </div>
        <div className="flex justify-between border-b border-neutral-200 py-3 dark:border-neutral-800">
          <span className="text-neutral-500">When</span>
          <span className="font-medium">
            {appointment.startsAt.toLocaleString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex justify-between pt-3">
          <span className="text-neutral-500">Price</span>
          <span className="font-medium">{formatPrice(appointment.service.priceCents)}</span>
        </div>
      </div>

      <Link
        href={`/${slug}`}
        className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
      >
        Back to home
      </Link>
    </div>
  );
}
