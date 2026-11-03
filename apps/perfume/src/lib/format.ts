import type { Settings } from "./types";

export const uid = (p = "") =>
  p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const PREFIX: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

/** 1 250 TJS · 1 250,50 TJS · $1,250 — whole amounts drop the decimals. */
export function money(n: number, s: Pick<Settings, "currency" | "locale">) {
  const v = r2(n);
  const digits = Number.isInteger(v) ? 0 : 2;
  let num: string;
  try {
    num = new Intl.NumberFormat(s.locale || "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(Math.abs(v));
  } catch {
    num = Math.abs(v).toFixed(digits);
  }
  const sign = v < 0 ? "−" : "";
  const p = PREFIX[s.currency];
  return p ? `${sign}${p}${num}` : `${sign}${num} ${s.currency || ""}`.trim();
}

export function dateTime(iso: string, locale = "en-US") {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateShort(iso: string, locale = "en-US") {
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  // Sandboxed/embedded viewers block downloads; also put the data on the clipboard.
  navigator.clipboard?.writeText(content).catch(() => undefined);
}

export function toCSV(rows: (string | number | boolean | undefined | null)[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const v = c === undefined || c === null ? "" : String(c);
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(","),
    )
    .join("\n");
}

export const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
