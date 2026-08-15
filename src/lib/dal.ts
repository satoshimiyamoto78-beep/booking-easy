import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";

export const verifySession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);

  if (!session?.adminId) {
    redirect("/admin/login");
  }

  return {
    adminId: session.adminId,
    email: session.email,
    businessId: session.businessId,
    businessSlug: session.businessSlug,
  };
});

export const getOptionalSession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);
  if (!session?.adminId) return null;
  return {
    adminId: session.adminId,
    email: session.email,
    businessId: session.businessId,
    businessSlug: session.businessSlug,
  };
});
