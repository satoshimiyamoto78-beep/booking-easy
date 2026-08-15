export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

const CATEGORY_LABELS: Record<string, string> = {
  BARBER: "Barbershop",
  SPA: "Spa",
  SALON: "Salon",
};

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
