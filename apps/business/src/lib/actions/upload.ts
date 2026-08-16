"use server";

import { put } from "@vercel/blob";
import { verifySession } from "@/lib/dal";

const MAX_BYTES = 4.5 * 1024 * 1024;

export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { businessId } = await verifySession();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 4.5MB." };
  }

  const blob = await put(`${businessId}/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
  });

  return { url: blob.url };
}
