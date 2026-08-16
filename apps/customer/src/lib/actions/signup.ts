"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@booking-easy/db";
import { dodo } from "@/lib/billing/dodo";
import { getDodoProductId } from "@/lib/billing/plans";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SignupSchema = z.object({
  businessName: z.string().trim().min(1, { error: "Business name is required." }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, { error: "Choose a URL of at least 2 characters." })
    .regex(SLUG_PATTERN, { error: "Use lowercase letters, numbers, and hyphens only." }),
  ownerName: z.string().trim().min(1, { error: "Your name is required." }),
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  tier: z.enum(["STARTER", "PRO", "BUSINESS"]),
});

export type SignupState =
  | {
      error?: string;
    }
  | undefined;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    tier: formData.get("tier"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { businessName, slug, ownerName, email, password, tier } = parsed.data;

  const [existingSlug, existingEmail] = await Promise.all([
    prisma.business.findUnique({ where: { slug } }),
    prisma.adminUser.findUnique({ where: { email } }),
  ]);
  if (existingSlug) {
    return { error: "That URL is already taken. Try another." };
  }
  if (existingEmail) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        slug,
        name: businessName,
        subscriptionTier: tier,
        subscriptionStatus: "INCOMPLETE",
      },
    });
    await tx.adminUser.create({
      data: {
        businessId: created.id,
        email,
        passwordHash,
        name: ownerName,
      },
    });
    return created;
  });

  let checkoutUrl: string;
  try {
    const businessAppUrl = process.env.NEXT_PUBLIC_BUSINESS_APP_URL ?? "https://booking-easy-business.vercel.app";
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: getDodoProductId(tier), quantity: 1 }],
      customer: { email, name: ownerName },
      metadata: { businessId: business.id },
      return_url: `${businessAppUrl}/admin/login`,
    });
    if (!session.checkout_url) {
      throw new Error("Dodo did not return a checkout url");
    }
    checkoutUrl = session.checkout_url;
  } catch (error) {
    // Roll back the just-created business/admin so a billing outage doesn't
    // leave an orphaned, permanently-INCOMPLETE tenant behind.
    await prisma.business.delete({ where: { id: business.id } });
    console.error("Dodo checkout session creation failed", error);
    return { error: "We couldn't start checkout. Please try again in a moment." };
  }

  redirect(checkoutUrl);
}
