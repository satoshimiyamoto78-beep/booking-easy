import "dotenv/config";
import { prisma } from "./src/index";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD must be set");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.platformAdmin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Seeded platform admin: ${email}`);
}

main().finally(() => prisma.$disconnect());
