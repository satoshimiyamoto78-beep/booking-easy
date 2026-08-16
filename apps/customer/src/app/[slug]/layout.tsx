import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getBusinessBySlug } from "@/lib/business";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return {};

  return {
    title: business.tagline ? `${business.name} — ${business.tagline}` : business.name,
    description: `Book appointments online with ${business.name}.`,
  };
}

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      style={{ "--brand": business.brandColor || "#f59e0b" } as React.CSSProperties}
    >
      <SiteHeader business={business} />
      <main className="flex-1">{children}</main>
      <SiteFooter business={business} />
    </div>
  );
}
