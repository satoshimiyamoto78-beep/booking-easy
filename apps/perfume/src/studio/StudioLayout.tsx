import { useState, type ReactNode } from "react";
import { I } from "../components/icons";
import { Button, cx } from "../components/ui";
import { isLow, isOut, useStore } from "../lib/store";
import { navigate } from "../lib/router";
import { Wordmark } from "../shop/ShopLayout";

const NAV = [
  { to: "/studio", label: "Overview", icon: I.home, m: (p: string) => p === "/studio" },
  { to: "/studio/orders", label: "Orders", icon: I.receipt, m: (p: string) => p.startsWith("/studio/orders") },
  { to: "/studio/inventory", label: "Inventory", icon: I.layers, m: (p: string) => p.startsWith("/studio/inventory") },
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
      return sessionStorage.getItem("loris.unlocked") === "1";
    } catch {
      return false;
    }
  });

  if (s.requirePin && s.adminPin && !unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  const badge = (to: string) => (to === "/studio/orders" ? pending : to === "/studio/inventory" ? alerts : 0);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="flex h-[72px] items-center border-b border-line px-6">
          <Wordmark />
        </div>
        <p className="eyebrow px-6 pt-6 pb-2">Studio</p>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.m(path);
            const count = badge(n.to);
            return (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-11 items-center gap-3 rounded-xl border-[1.5px] px-3.5 text-[14.5px] font-medium transition-colors",
                  active ? "border-inverse bg-inverse text-on-inverse" : "border-transparent text-ink-2 hover:border-line-2 hover:text-ink",
                )}
              >
                <Icon size={19} />
                <span className="flex-1 text-left">{n.label}</span>
                {count > 0 && (
                  <span className={cx("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold", active ? "bg-on-inverse text-inverse" : n.to === "/studio/inventory" ? "bg-warn text-white" : "bg-accent text-white")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-line p-4">
          <Button className="w-full" onClick={() => navigate("/studio/orders/new")}>
            <I.plus size={16} /> New sale
          </Button>
          <Button variant="soft" className="w-full" onClick={() => navigate("/")}>
            <I.store size={16} /> Open shop
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-32 lg:pb-12">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => navigate("/studio")} className="flex items-baseline gap-2" aria-label="Studio overview">
            <Wordmark />
          </button>
          <div className="flex gap-2">
            <button aria-label="Categories" onClick={() => navigate("/studio/categories")} className="grid size-11 place-items-center rounded-full border-[1.5px] border-line-2 bg-card">
              <I.tag size={17} />
            </button>
            <button aria-label="Open shop" onClick={() => navigate("/")} className="grid size-11 place-items-center rounded-full border-[1.5px] border-line-2 bg-card">
              <I.store size={17} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8 md:pt-10">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-30 flex justify-center px-4 lg:hidden" aria-label="Studio">
        <div className="flex items-center gap-1 rounded-full border border-inverse bg-inverse p-1.5 shadow-2xl shadow-black/25">
          {MOBILE.map((n) => {
            const Icon = n.icon;
            const active = n.m(path);
            const count = badge(n.to);
            return (
              <button
                key={n.to}
                aria-label={n.label}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(n.to)}
                className={cx("relative grid h-12 w-[58px] place-items-center rounded-full transition-colors", active ? "bg-on-inverse text-inverse" : "text-on-inverse/65")}
              >
                <Icon size={20} />
                {count > 0 && <span className="absolute top-1 right-2.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] leading-[18px] font-bold text-white">{count}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHead({ eyebrow, title, actions, sub }: { eyebrow?: string; title: string; actions?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-[40px] md:text-[48px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-muted">{sub}</p>}
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
          sessionStorage.setItem("loris.unlocked", "1");
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
      <span className="grid size-14 place-items-center rounded-full border-[1.5px] border-on-inverse/30">
        <I.lock size={24} />
      </span>
      <p className="mt-5 font-display text-[36px]">Studio</p>
      <p className="mt-1 text-[15px] opacity-65">{err ? "Wrong PIN, try again" : "Enter your staff PIN"}</p>
      <div className="mt-8 flex gap-3">
        {Array.from({ length: db.settings.adminPin.length }).map((_, i) => (
          <span key={i} className={cx("size-3.5 rounded-full border-[1.5px]", i < pin.length ? (err ? "border-bad bg-bad" : "border-on-inverse bg-on-inverse") : "border-on-inverse/40")} />
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
              className="grid size-[72px] place-items-center rounded-full border-[1.5px] border-on-inverse/20 text-[24px] font-medium transition-colors hover:border-on-inverse/60 active:scale-95"
            >
              {k}
            </button>
          ),
        )}
      </div>
      <button onClick={() => navigate("/")} className="mt-10 text-[14px] opacity-65 hover:opacity-100">
        ← Back to the shop
      </button>
    </div>
  );
}
