import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ServiceCategory } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri
const SATURDAY = [6];

async function main() {
  const business = await prisma.business.upsert({
    where: { slug: "the-studio" },
    update: {},
    create: {
      slug: "the-studio",
      name: "The Studio",
      tagline: "Barbershop · Spa · Salon",
      address: "123 Main Street, Springfield",
      phone: "(555) 010-1234",
      email: "hello@thestudio.example",
      instagram: "@thestudio",
      subscriptionTier: "BUSINESS",
      subscriptionStatus: "ACTIVE",
    },
  });
  const businessId = business.id;

  const services = await Promise.all(
    [
      {
        name: "Classic Haircut",
        description: "Precision cut, wash, and style.",
        category: ServiceCategory.BARBER,
        durationMinutes: 30,
        priceCents: 3500,
        sortOrder: 1,
      },
      {
        name: "Beard Trim & Shape",
        description: "Hot towel beard trim and line-up.",
        category: ServiceCategory.BARBER,
        durationMinutes: 20,
        priceCents: 2000,
        sortOrder: 2,
      },
      {
        name: "Hot Towel Shave",
        description: "Traditional straight-razor hot towel shave.",
        category: ServiceCategory.BARBER,
        durationMinutes: 40,
        priceCents: 4500,
        sortOrder: 3,
      },
      {
        name: "Swedish Massage",
        description: "60-minute full body relaxation massage.",
        category: ServiceCategory.SPA,
        durationMinutes: 60,
        priceCents: 9000,
        sortOrder: 4,
      },
      {
        name: "Deep Tissue Massage",
        description: "60-minute targeted deep tissue therapy.",
        category: ServiceCategory.SPA,
        durationMinutes: 60,
        priceCents: 10500,
        sortOrder: 5,
      },
      {
        name: "Classic Facial",
        description: "Cleanse, exfoliate, mask, and moisturize.",
        category: ServiceCategory.SPA,
        durationMinutes: 45,
        priceCents: 7500,
        sortOrder: 6,
      },
      {
        name: "Women's Haircut & Style",
        description: "Consultation, cut, and blow-dry finish.",
        category: ServiceCategory.SALON,
        durationMinutes: 60,
        priceCents: 6500,
        sortOrder: 7,
      },
      {
        name: "Full Color",
        description: "Single-process color, gloss, and style.",
        category: ServiceCategory.SALON,
        durationMinutes: 120,
        priceCents: 15000,
        sortOrder: 8,
      },
      {
        name: "Manicure",
        description: "Shape, cuticle care, and polish.",
        category: ServiceCategory.SALON,
        durationMinutes: 30,
        priceCents: 3000,
        sortOrder: 9,
      },
    ].map((data) =>
      prisma.service.create({
        data: { ...data, businessId },
      }),
    ),
  );

  const byName = Object.fromEntries(services.map((s) => [s.name, s]));

  const staffData = [
    {
      name: "Marcus Reid",
      title: "Master Barber",
      bio: "12 years behind the chair, specializing in fades and straight-razor shaves.",
      category: ServiceCategory.BARBER,
      schedule: WEEKDAYS.concat(SATURDAY),
      serviceNames: ["Classic Haircut", "Beard Trim & Shape", "Hot Towel Shave"],
    },
    {
      name: "Jonah Lee",
      title: "Barber",
      bio: "Modern cuts and beard sculpting.",
      category: ServiceCategory.BARBER,
      schedule: WEEKDAYS,
      serviceNames: ["Classic Haircut", "Beard Trim & Shape"],
    },
    {
      name: "Priya Nair",
      title: "Massage Therapist, LMT",
      bio: "Specializes in Swedish and deep tissue techniques.",
      category: ServiceCategory.SPA,
      schedule: WEEKDAYS.concat(SATURDAY),
      serviceNames: ["Swedish Massage", "Deep Tissue Massage"],
    },
    {
      name: "Elena Torres",
      title: "Esthetician",
      bio: "Facials and skincare tailored to your skin type.",
      category: ServiceCategory.SPA,
      schedule: WEEKDAYS,
      serviceNames: ["Classic Facial"],
    },
    {
      name: "Sofia Marchetti",
      title: "Senior Stylist",
      bio: "Color specialist and precision cutting.",
      category: ServiceCategory.SALON,
      schedule: WEEKDAYS.concat(SATURDAY),
      serviceNames: ["Women's Haircut & Style", "Full Color"],
    },
    {
      name: "Grace Kim",
      title: "Nail Technician",
      bio: "Manicures, pedicures, and nail art.",
      category: ServiceCategory.SALON,
      schedule: WEEKDAYS.concat(SATURDAY),
      serviceNames: ["Manicure"],
    },
  ];

  for (const s of staffData) {
    const staff = await prisma.staff.create({
      data: {
        businessId,
        name: s.name,
        title: s.title,
        bio: s.bio,
        active: true,
      },
    });

    await prisma.staffService.createMany({
      data: s.serviceNames.map((name) => ({
        staffId: staff.id,
        serviceId: byName[name].id,
      })),
    });

    await prisma.staffSchedule.createMany({
      data: s.schedule.map((dayOfWeek) => ({
        staffId: staff.id,
        dayOfWeek,
        startMinute: 9 * 60, // 9:00am
        endMinute: dayOfWeek === 6 ? 15 * 60 : 18 * 60, // Sat until 3pm, weekdays until 6pm
      })),
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "owner@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-please";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      businessId,
      email: adminEmail,
      passwordHash,
      name: "Shop Owner",
    },
  });

  console.log(`Seeded database. Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
