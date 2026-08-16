import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";

export const verifySession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);

  if (!session?.platformAdminId) {
    redirect("/platform/login");
  }

  return {
    platformAdminId: session.platformAdminId,
    email: session.email,
  };
});

export const getOptionalSession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);
  if (!session?.platformAdminId) return null;
  return {
    platformAdminId: session.platformAdminId,
    email: session.email,
  };
});
