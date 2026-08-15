"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { timeToMinutes } from "@/lib/schedule";
import { AppointmentStatus, ServiceCategory } from "@/generated/prisma/client";

// ---------- Services ----------

const ServiceSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  description: z.string().trim().optional(),
  category: z.enum(ServiceCategory),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  priceCents: z.coerce.number().int().min(0),
  active: z.coerce.boolean(),
});

export async function createService(formData: FormData) {
  const { businessId } = await verifySession();

  const parsed = ServiceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    priceCents: Math.round(Number(formData.get("price")) * 100),
    active: formData.get("active") === "on",
  });

  await prisma.service.create({ data: { ...parsed, businessId } });
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function updateService(formData: FormData) {
  const { businessId } = await verifySession();

  const id = formData.get("id") as string;
  const parsed = ServiceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    priceCents: Math.round(Number(formData.get("price")) * 100),
    active: formData.get("active") === "on",
  });

  await prisma.service.update({ where: { id, businessId }, data: parsed });
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deleteService(formData: FormData) {
  const { businessId } = await verifySession();
  const id = formData.get("id") as string;
  await prisma.service.delete({ where: { id, businessId } });
  revalidatePath("/admin/services");
}

// ---------- Staff ----------

const StaffSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  title: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  active: z.coerce.boolean(),
});

function parseServiceIds(formData: FormData): string[] {
  return formData.getAll("serviceIds").map(String);
}

function parseSchedule(formData: FormData) {
  const schedule: { dayOfWeek: number; startMinute: number; endMinute: number }[] = [];
  for (let day = 0; day < 7; day++) {
    if (formData.get(`day-${day}-enabled`) !== "on") continue;
    const start = String(formData.get(`day-${day}-start`) ?? "");
    const end = String(formData.get(`day-${day}-end`) ?? "");
    if (!start || !end) continue;
    const startMinute = timeToMinutes(start);
    const endMinute = timeToMinutes(end);
    if (endMinute > startMinute) {
      schedule.push({ dayOfWeek: day, startMinute, endMinute });
    }
  }
  return schedule;
}

export async function createStaff(formData: FormData) {
  const { businessId } = await verifySession();

  const parsed = StaffSchema.parse({
    name: formData.get("name"),
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    active: formData.get("active") === "on",
  });
  const serviceIds = parseServiceIds(formData);
  const schedule = parseSchedule(formData);

  const staff = await prisma.staff.create({ data: { ...parsed, businessId } });

  await prisma.$transaction([
    prisma.staffService.createMany({
      data: serviceIds.map((serviceId) => ({ staffId: staff.id, serviceId })),
    }),
    prisma.staffSchedule.createMany({
      data: schedule.map((s) => ({ staffId: staff.id, ...s })),
    }),
  ]);

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function updateStaff(formData: FormData) {
  const { businessId } = await verifySession();

  const id = formData.get("id") as string;
  const parsed = StaffSchema.parse({
    name: formData.get("name"),
    title: formData.get("title") || undefined,
    bio: formData.get("bio") || undefined,
    active: formData.get("active") === "on",
  });
  const serviceIds = parseServiceIds(formData);
  const schedule = parseSchedule(formData);

  // staff.update fails fast (P2025) if id/businessId don't match, and the
  // whole array-form $transaction rolls back atomically, so the join-table
  // writes below never need their own businessId check.
  await prisma.$transaction([
    prisma.staff.update({ where: { id, businessId }, data: parsed }),
    prisma.staffService.deleteMany({ where: { staffId: id } }),
    prisma.staffService.createMany({
      data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
    }),
    prisma.staffSchedule.deleteMany({ where: { staffId: id } }),
    prisma.staffSchedule.createMany({
      data: schedule.map((s) => ({ staffId: id, ...s })),
    }),
  ]);

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaff(formData: FormData) {
  const { businessId } = await verifySession();
  const id = formData.get("id") as string;
  await prisma.staff.delete({ where: { id, businessId } });
  revalidatePath("/admin/staff");
}

// ---------- Appointments ----------

export async function updateAppointmentStatus(formData: FormData) {
  const { businessId } = await verifySession();
  const id = formData.get("appointmentId") as string;
  const status = formData.get("status") as string;

  if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    throw new Error("Invalid status");
  }

  await prisma.appointment.update({
    where: { id, businessId },
    data: { status: status as AppointmentStatus },
  });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}
