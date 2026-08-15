import { cache } from "react";
import { prisma } from "@booking-easy/db";

export const getBusinessBySlug = cache(async (slug: string) => {
  return prisma.business.findUnique({ where: { slug } });
});
