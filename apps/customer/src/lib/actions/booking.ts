"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { isSlotAvailable } from "@/lib/availability";
import { getBusinessBySlug } from "@/lib/business";

const BookingSchema = z.object({
  businessSlug: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.iso.datetime({ error: "Pick a valid time slot." }),
  name: z.string().trim().min(2, { error: "Enter your full name." }),
  email: z.email({ error: "Enter a valid email." }),
  phone: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
});

export type BookingState =
  | {
      error: string;
    }
  | undefined;

export async function createBooking(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = BookingSchema.safeParse({
    businessSlug: formData.get("businessSlug"),
    serviceId: formData.get("serviceId"),
    staffId: formData.get("staffId"),
    startsAt: formData.get("startsAt"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { businessSlug, serviceId, staffId, startsAt, name, email, phone, notes } = parsed.data;
  const startDate = new Date(startsAt);

  const business = await getBusinessBySlug(businessSlug);
  if (!business || business.suspended) {
    return { error: "That business or team member is no longer available." };
  }
  const businessId = business.id;

  const [service, staff] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId, businessId } }),
    prisma.staff.findUnique({ where: { id: staffId, businessId } }),
  ]);

  if (!service || !service.active || !staff || !staff.active) {
    return { error: "That service or team member is no longer available." };
  }

  const endsAt = new Date(startDate.getTime() + service.durationMinutes * 60_000);

  let appointmentId: string;
  try {
    appointmentId = await prisma.$transaction(
      async (tx) => {
        // Re-check availability inside the transaction so two concurrent
        // bookings for the same slot can't both pass the earlier check.
        const conflict = await tx.appointment.findFirst({
          where: {
            businessId,
            staffId,
            status: { not: "CANCELLED" },
            startsAt: { lt: endsAt },
            endsAt: { gt: startDate },
          },
        });
        if (conflict) {
          throw new Error("SLOT_TAKEN");
        }

        const available = await isSlotAvailable({ businessId, serviceId, staffId, startsAt: startDate });
        if (!available) {
          throw new Error("SLOT_TAKEN");
        }

        const customer = await tx.customer.upsert({
          where: { businessId_email: { businessId, email } },
          update: { name, phone },
          create: { businessId, name, email, phone },
        });

        const appointment = await tx.appointment.create({
          data: {
            businessId,
            serviceId,
            staffId,
            customerId: customer.id,
            startsAt: startDate,
            endsAt,
            notes,
            status: "CONFIRMED",
          },
        });

        return appointment.id;
      },
      { isolationLevel: "Serializable" },
    );
  } catch {
    return { error: "That time was just booked. Please pick another slot." };
  }

  redirect(`/${businessSlug}/book/confirmed/${appointmentId}`);
}
