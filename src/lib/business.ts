import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getBusinessBySlug = cache(async (slug: string) => {
  return prisma.business.findUnique({ where: { slug } });
});
