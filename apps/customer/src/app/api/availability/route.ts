import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@booking-easy/db";
import { getAvailableSlots, getAvailableSlotsAnyStaff } from "@/lib/availability";
import { getBusinessBySlug } from "@/lib/business";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");
  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date");

  if (!slug || !serviceId || !staffId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "slug, serviceId, staffId, and date (YYYY-MM-DD) are required." },
      { status: 400 },
    );
  }

  const business = await getBusinessBySlug(slug);
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (staffId === "any") {
    const eligibleStaff = await prisma.staff.findMany({
      where: { businessId: business.id, active: true, services: { some: { serviceId } } },
      select: { id: true },
      orderBy: { name: "asc" },
    });

    const slots = await getAvailableSlotsAnyStaff({
      businessId: business.id,
      serviceId,
      staffIds: eligibleStaff.map((s) => s.id),
      date,
    });

    return NextResponse.json({
      slots: slots.map((s) => ({
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        staffId: s.staffId,
      })),
    });
  }

  const slots = await getAvailableSlots({ businessId: business.id, serviceId, staffId, date });

  return NextResponse.json({
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      staffId,
    })),
  });
}
