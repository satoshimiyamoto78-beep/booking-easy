import { useState, type ReactNode } from "react";
import { I } from "../components/icons";
import { Button, cx } from "../components/ui";
import { isLow, isOut, useStore } from "../lib/store";
import { navigate } from "../lib/router";

const NAV = [
  { to: "/studio", label: "Overview", icon: I.home, m: (p: string) => p === "/studio" },
  { to: "/studio/inventory", label: "Inventory", icon: I.layers, m: (p: string) => p.startsWith("/studio/inventory") },
  { to: "/studio/orders", label: "Orders", icon: I.receipt, m: (p: string) => p.startsWith("/studio/orders") },
  { to: "/studio/products", label: "Products", icon: I.box, m: (p: string) => p.startsWith("/studio/products") },
  { to: "/studio/categories", label: "Categories", icon: I.tag, m: (p: string) => p.startsWith("/studio/categories") },
  { to: "/studio/settings", label: "Settings", icon: I.settings, m: (p: string) => p.startsWith("/studio/settings") },
];
const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]];

export function StudioLayout({ path, children }: { path: string; children: ReactNode }) {
  const { db } = useStore();
  const s = db.settings;
  const pending = db.orders.filter((o) => o.status === "pending").length;
  const alerts = s.lowStockAlerts ? db.products.filter((p) => p.status === "active").flatMap((p) => p.variants).filter((v) => isLow(v) || isOut(v)).length : 0;
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem("maison.unlocked") === "1";
    } catch {
      return false;
    }
  });

  if (s.requirePin && s.adminPin && !unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card px-4 py-6 lg:flex">
        <div className="px-3">
          <p className="font-display text-2xl leading-none">{s.brandName}</p>
          <p className="mt-1 text-[10px] font-bold tracking-[.3em] text-muted uppercase">Studio</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.m(path);
            const count = n.to === "/studio/orders" ? pending : n.to === "/studio/inventory" ? alerts : 0;
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                className={cx("flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition", active ? "bg-inverse text-on-inverse" : "text-ink-2 hover:bg-soft")}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{n.label}</span>
                {count > 0 && <span className={cx("grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold", active ? "bg-on-inverse/20" : "bg-accent text-white")}>{count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <Button variant="outline" className="w-full" onClick={() => navigate("/studio/orders/new")}>
            <I.plus size={16} /> New order
          </Button>
          <button onClick={() => navigate("/")} className="flex h-11 w-full items-center gap-3 rounded-full px-4 text-sm font-semibold text-ink-2 hover:bg-soft">
            <I.store size={18} /> View storefront
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-28 lg:pb-10">
        {/* Mobile top bar */}
        <div className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => navigate("/studio")} className="flex items-baseline gap-2">
            <span className="font-display text-xl">{s.brandName}</span>
            <span className="text-[9px] font-bold tracking-[.25em] text-muted uppercase">Studio</span>
          </button>
          <div className="flex gap-2">
            <button aria-label="Categories" onClick={() => navigate("/studio/categories")} className="grid size-9 place-items-center rounded-full border border-line bg-card">
              <I.tag size={16} />
            </button>
            <button aria-label="Storefront" onClick={() => navigate("/")} className="grid size-9 place-items-center rounded-full border border-line bg-card">
              <I.store size={16} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-5 md:px-8 md:pt-8">{children}</div>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden" aria-label="Studio">
        <div className="flex items-center gap-1 rounded-full bg-inverse p-1.5 shadow-2xl shadow-black/30">
          {MOBILE.map((n) => {
            const Icon = n.icon;
            const active = n.m(path);
            const count = n.to === "/studio/orders" ? pending : n.to === "/studio/inventory" ? alerts : 0;
            return (
              <button
                key={n.to}
                aria-label={n.label}
                onClick={() => navigate(n.to)}
                className={cx("relative grid h-12 w-14 place-items-center rounded-full transition", active ? "bg-card text-ink" : "text-on-inverse/70")}
              >
                <Icon size={20} />
                {count > 0 && <span className="absolute top-1.5 right-2.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{count}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHead({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display text-[32px] leading-tight md:text-[40px]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const { db } = useStore();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const press = (d: string) => {
    const next = (pin + d).slice(0, 6);
    setErr(false);
    setPin(next);
    if (next.length === db.settings.adminPin.length) {
      if (next === db.settings.adminPin) {
        try {
          sessionStorage.setItem("maison.unlocked", "1");
        } catch {
          /* ignore */
        }
        onUnlock();
      } else {
        setErr(true);
        setTimeout(() => setPin(""), 400);
      }
    }
  };
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-inverse px-6 text-on-inverse">
      <I.lock size={28} />
      <p className="mt-4 font-display text-3xl">{db.settings.brandName} Studio</p>
      <p className="mt-1 text-sm opacity-60">Enter your staff PIN</p>
      <div className={cx("mt-8 flex gap-3", err && "animate-pulse")}>
        {Array.from({ length: db.settings.adminPin.length }).map((_, i) => (
          <span key={i} className={cx("size-3.5 rounded-full border", i < pin.length ? (err ? "border-bad bg-bad" : "border-on-inverse bg-on-inverse") : "border-on-inverse/40")} />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) =>
          k === "" ? (
            <span key="blank" />
          ) : (
            <button
              key={k}
              aria-label={k === "⌫" ? "Delete" : k}
              onClick={() => (k === "⌫" ? setPin(pin.slice(0, -1)) : press(k))}
              className="grid size-18 place-items-center rounded-full bg-on-inverse/8 text-2xl font-semibold transition hover:bg-on-inverse/15 active:scale-95"
            >
              {k}
            </button>
          ),
        )}
      </div>
      <button onClick={() => navigate("/")} className="mt-10 text-sm opacity-60 hover:opacity-100">
        ← Back to storefront
      </button>
    </div>
  );
}
