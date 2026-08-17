import "server-only";
import { addMinutes, areIntervalsOverlapping, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@booking-easy/db";

const SLOT_INTERVAL_MINUTES = 15;

export type Slot = {
  startsAt: Date;
  endsAt: Date;
};

/**
 * Parses a "YYYY-MM-DD" date string as a local calendar day (not UTC), so
 * slot minutes-of-day line up with StaffSchedule regardless of server TZ.
 */
export function parseDateOnly(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export async function getAvailableSlots(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  date: string;
}): Promise<Slot[]> {
  const { businessId, serviceId, staffId, date } = params;

  const service = await prisma.service.findUnique({ where: { id: serviceId, businessId } });
  if (!service || !service.active) return [];

  const day = startOfDay(parseDateOnly(date));
  const dayOfWeek = day.getDay();
  const dayEnd = endOfDay(day);

  const [schedules, appointments, timeOffs] = await Promise.all([
    prisma.staffSchedule.findMany({ where: { staffId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: {
        businessId,
        staffId,
        status: { not: "CANCELLED" },
        startsAt: { lt: dayEnd },
        endsAt: { gt: day },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({
      where: {
        staffId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: day },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  if (schedules.length === 0) return [];

  const busy = [...appointments, ...timeOffs].map((b) => ({
    start: b.startsAt,
    end: b.endsAt,
  }));

  const now = new Date();
  const slots: Slot[] = [];

  for (const schedule of schedules) {
    let cursor = addMinutes(day, schedule.startMinute);
    const windowEnd = addMinutes(day, schedule.endMinute);

    while (true) {
      const slotEnd = addMinutes(cursor, service.durationMinutes);
      if (slotEnd > windowEnd) break;

      const overlapsBusy = busy.some((b) =>
        areIntervalsOverlapping(
          { start: cursor, end: slotEnd },
          { start: b.start, end: b.end },
        ),
      );

      if (!overlapsBusy && cursor > now) {
        slots.push({ startsAt: cursor, endsAt: slotEnd });
      }

      cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Merges availability across every staff member eligible for a service, for
 * the "any available professional" option. Each returned slot is tagged with
 * the first eligible staff member (in `staffIds` order) who is free for it,
 * so the caller can submit a concrete staffId without the customer ever
 * having to pick one.
 */
export async function getAvailableSlotsAnyStaff(params: {
  businessId: string;
  serviceId: string;
  staffIds: string[];
  date: string;
}): Promise<(Slot & { staffId: string })[]> {
  const { businessId, serviceId, staffIds, date } = params;

  const perStaff = await Promise.all(
    staffIds.map((staffId) =>
      getAvailableSlots({ businessId, serviceId, staffId, date }).then((slots) => ({ staffId, slots })),
    ),
  );

  const merged = new Map<string, Slot & { staffId: string }>();
  for (const { staffId, slots } of perStaff) {
    for (const slot of slots) {
      const key = slot.startsAt.toISOString();
      if (!merged.has(key)) {
        merged.set(key, { ...slot, staffId });
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function isSlotAvailable(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  startsAt: Date;
}): Promise<boolean> {
  const { businessId, serviceId, staffId, startsAt } = params;
  const service = await prisma.service.findUnique({ where: { id: serviceId, businessId } });
  if (!service) return false;

  const endsAt = addMinutes(startsAt, service.durationMinutes);

  const dayOfWeek = startsAt.getDay();
  const minuteOfDay = startsAt.getHours() * 60 + startsAt.getMinutes();

  const schedule = await prisma.staffSchedule.findFirst({
    where: {
      staffId,
      dayOfWeek,
      startMinute: { lte: minuteOfDay },
      endMinute: { gte: minuteOfDay + service.durationMinutes },
    },
  });
  if (!schedule) return false;

  const conflict = await prisma.appointment.findFirst({
    where: {
      businessId,
      staffId,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (conflict) return false;

  const timeOff = await prisma.timeOff.findFirst({
    where: {
      staffId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (timeOff) return false;

  return startsAt > new Date();
}
