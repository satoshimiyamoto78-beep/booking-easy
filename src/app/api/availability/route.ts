import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");
  const date = searchParams.get("date");

  if (!serviceId || !staffId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "serviceId, staffId, and date (YYYY-MM-DD) are required." },
      { status: 400 },
    );
  }

  const slots = await getAvailableSlots({ serviceId, staffId, date });

  return NextResponse.json({
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
  });
}
