import { prisma } from "@/lib/prisma";

export async function getBusinessSettings() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  return (
    settings ?? {
      id: "default",
      shopName: "The Studio",
      tagline: "Barbershop · Spa · Salon",
      address: null,
      phone: null,
      email: null,
      instagram: null,
      updatedAt: new Date(),
    }
  );
}
