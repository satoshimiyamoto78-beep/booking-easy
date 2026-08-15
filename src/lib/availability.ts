import "server-only";
import { addMinutes, areIntervalsOverlapping, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

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
  serviceId: string;
  staffId: string;
  date: string;
}): Promise<Slot[]> {
  const { serviceId, staffId, date } = params;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return [];

  const day = startOfDay(parseDateOnly(date));
  const dayOfWeek = day.getDay();
  const dayEnd = endOfDay(day);

  const [schedules, appointments, timeOffs] = await Promise.all([
    prisma.staffSchedule.findMany({ where: { staffId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: {
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

export async function isSlotAvailable(params: {
  serviceId: string;
  staffId: string;
  startsAt: Date;
}): Promise<boolean> {
  const { serviceId, staffId, startsAt } = params;
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
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
