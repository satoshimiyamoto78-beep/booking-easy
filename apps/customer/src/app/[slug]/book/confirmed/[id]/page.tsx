import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { getBusinessBySlug } from "@/lib/business";
import { formatPrice } from "@booking-easy/shared";
import { Check } from "lucide-react";

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

  const rows = [
    { label: "Service", value: appointment.service.name },
    { label: "With", value: appointment.staff.name },
    {
      label: "When",
      value: appointment.startsAt.toLocaleString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    },
    { label: "Price", value: formatPrice(appointment.service.priceCents) },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6 sm:py-28">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--brand) 14%, var(--surface))", color: "var(--brand)" }}
      >
        <Check size={28} strokeWidth={2.5} />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">You&apos;re booked!</h1>
      <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
        A confirmation has been recorded for {appointment.customer.name}.
      </p>

      <div className="card mt-8 p-6 text-left text-sm">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex justify-between py-3"
            style={{
              borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : undefined,
            }}
          >
            <span style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <Link href={`/${slug}`} className="btn btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
