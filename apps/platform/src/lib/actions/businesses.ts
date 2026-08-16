"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@booking-easy/db";
import { verifySession } from "@/lib/dal";

export async function setBusinessSuspended(formData: FormData) {
  await verifySession();

  const id = formData.get("id") as string;
  const suspended = formData.get("suspended") === "true";

  await prisma.business.update({ where: { id }, data: { suspended } });
  revalidatePath("/platform");
  revalidatePath(`/platform/businesses/${id}`);
}
