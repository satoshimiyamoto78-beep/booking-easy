import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBusinessBySlug } from "@/lib/business";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = await params;
  const { service: preselectedServiceId } = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: business.id, active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.staff.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
      include: { services: { select: { serviceId: true } } },
    }),
  ]);

  const staffOptions = staff.map((member) => ({
    id: member.id,
    name: member.name,
    title: member.title,
    serviceIds: member.services.map((s) => s.serviceId),
  }));

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    category: service.category,
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Book an appointment</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Pick a service, choose your stylist, and grab a time that works.
      </p>
      <div className="mt-10">
        <BookingWizard
          businessSlug={slug}
          services={serviceOptions}
          staff={staffOptions}
          initialServiceId={preselectedServiceId}
        />
      </div>
    </div>
  );
}
