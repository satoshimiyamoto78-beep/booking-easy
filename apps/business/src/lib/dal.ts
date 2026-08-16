import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { decrypt, getSessionCookie } from "@/lib/session";

export const verifySession = cache(async () => {
  const token = await getSessionCookie();
  const session = await decrypt(token);

  // Sessions issued before businessId/businessSlug were added to the JWT
  // payload must be rejected, not treated as valid with those fields
  // undefined — an undefined businessId gets silently dropped from every
  // Prisma `where` filter that uses it, which would unscope every query
  // across all tenants instead of failing loudly.
  if (!session?.adminId || !session.businessId || !session.businessSlug) {
    redirect("/admin/login");
  }

  // Platform-admin policy suspension overrides an otherwise-valid session —
  // checked here rather than in proxy.ts because the edge runtime there has
  // no direct database access.
  const business = await prisma.business.findUnique({
    where: { id: session.businessId },
    select: { suspended: true },
  });
  if (business?.suspended) {
    redirect("/admin/suspended");
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
  if (!session?.adminId || !session.businessId || !session.businessSlug) return null;
  return {
    adminId: session.adminId,
    email: session.email,
    businessId: session.businessId,
    businessSlug: session.businessSlug,
  };
});
