import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { MapPin, Phone, ShieldCheck } from "lucide-react";

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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Book an appointment</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        Pick a service, choose your professional, and grab a time that works.
      </p>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={15} />
          Instant confirmation
        </span>
        {business.address && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} />
            {business.address}
          </span>
        )}
        {business.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone size={15} />
            {business.phone}
          </span>
        )}
      </div>

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
