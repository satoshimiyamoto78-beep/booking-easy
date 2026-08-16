"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@booking-easy/db";
import { verifySession } from "@/lib/dal";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const BusinessSettingsSchema = z.object({
  name: z.string().trim().min(1, { error: "Business name is required." }),
  tagline: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.literal(""), z.email()]).optional(),
  instagram: z.string().trim().optional(),
  brandColor: z.string().trim().regex(HEX_COLOR, { error: "Enter a valid hex color." }),
  logoUrl: z.string().trim().optional(),
});

export async function updateBusinessSettings(formData: FormData) {
  const { businessId } = await verifySession();

  const parsed = BusinessSettingsSchema.parse({
    name: formData.get("name"),
    tagline: formData.get("tagline") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    instagram: formData.get("instagram") || undefined,
    brandColor: formData.get("brandColor"),
    logoUrl: formData.get("logoUrl") || undefined,
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { ...parsed, email: parsed.email || null },
  });

  revalidatePath("/admin/settings");
}
