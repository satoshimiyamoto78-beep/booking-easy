import type { ReactNode } from "react";
import { I } from "../components/icons";
import { cx } from "../components/ui";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";

const tabs = [
  { to: "/", icon: I.home, label: "Home", match: (p: string) => p === "/" },
  { to: "/shop", icon: I.grid, label: "Catalogue", match: (p: string) => p.startsWith("/shop") || p.startsWith("/p/") },
  { to: "/wishlist", icon: I.heart, label: "Wishlist", match: (p: string) => p === "/wishlist" },
  { to: "/bag", icon: I.bag, label: "Bag", match: (p: string) => p.startsWith("/bag") || p.startsWith("/checkout") },
  { to: "/account", icon: I.user, label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/order/") },
];

export function ShopLayout({ path, children, hideNav }: { path: string; children: ReactNode; hideNav?: boolean }) {
  const { db } = useStore();
  const s = db.settings;
  const bagCount = db.cart.reduce((a, c) => a + c.qty, 0);

  return (
    <div className="min-h-dvh">
      {s.announcement && (
        <div className="bg-inverse px-4 py-2 text-center text-[11px] font-semibold tracking-[.18em] text-on-inverse uppercase">{s.announcement}</div>
      )}
      {!s.storeOpen && (
        <div className="bg-warn/15 px-4 py-2 text-center text-xs font-semibold text-warn">Online ordering is paused — browse the catalogue and check back soon.</div>
      )}

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden border-b border-line bg-paper/85 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <button onClick={() => navigate("/")} className="font-display text-2xl tracking-wide">
            {s.brandName}
          </button>
          <nav className="flex gap-6 text-sm font-semibold text-ink-2">
            {tabs.slice(0, 2).map((t) => (
              <button key={t.to} onClick={() => navigate(t.to)} className={cx("hover:text-ink", t.match(path) && "text-ink underline decoration-accent decoration-2 underline-offset-8")}>
                {t.label}
              </button>
            ))}
            <button onClick={() => navigate("/shop?sort=new")} className="hover:text-ink">
              New in
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <HeaderIcon label="Search" onClick={() => navigate("/shop?focus=1")} icon={<I.search size={18} />} />
            <HeaderIcon label="Wishlist" onClick={() => navigate("/wishlist")} icon={<I.heart size={18} />} count={db.wishlist.length} />
            <HeaderIcon label="Account" onClick={() => navigate("/account")} icon={<I.user size={18} />} />
            <HeaderIcon label="Bag" onClick={() => navigate("/bag")} icon={<I.bag size={18} />} count={bagCount} />
            <button onClick={() => navigate("/studio")} className="ml-2 inline-flex h-10 items-center gap-2 rounded-full bg-inverse px-4 text-xs font-semibold text-on-inverse">
              <I.box size={16} /> Studio
            </button>
          </div>
        </div>
      </header>

      <main className={cx("mx-auto max-w-6xl", !hideNav && "pb-28 md:pb-16")}>{children}</main>

      {/* Mobile floating pill nav */}
      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 md:hidden" aria-label="Primary">
          <div className="flex items-center gap-1 rounded-full bg-inverse p-1.5 shadow-2xl shadow-black/30">
            {tabs.map((t) => {
              const active = t.match(path);
              const Icon = t.icon;
              const count = t.to === "/bag" ? bagCount : t.to === "/wishlist" ? db.wishlist.length : 0;
              return (
                <button
                  key={t.to}
                  aria-label={t.label}
                  onClick={() => navigate(t.to)}
                  className={cx("relative grid h-12 w-14 place-items-center rounded-full transition", active ? "bg-card text-ink" : "text-on-inverse/70")}
                >
                  <Icon size={21} />
                  {count > 0 && (
                    <span className="absolute top-1.5 right-2.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function HeaderIcon({ icon, label, onClick, count = 0 }: { icon: ReactNode; label: string; onClick: () => void; count?: number }) {
  return (
    <button aria-label={label} onClick={onClick} className="relative grid size-10 place-items-center rounded-full border border-line bg-card hover:border-ink/40">
      {icon}
      {count > 0 && <span className="absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{count}</span>}
    </button>
  );
}

export function MobileTop({ title, back, right }: { title?: ReactNode; back?: string | (() => void); right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex h-15 items-center gap-3 bg-paper/85 px-4 backdrop-blur-xl md:static md:bg-transparent md:px-6 md:pt-6 md:backdrop-blur-none">
      {back && (
        <button
          aria-label="Back"
          onClick={() => (typeof back === "string" ? navigate(back) : back())}
          className="grid size-10 place-items-center rounded-full border border-line bg-card"
        >
          <I.arrowL size={18} />
        </button>
      )}
      <div className="min-w-0 flex-1 truncate text-center font-semibold md:text-left">{title}</div>
      <div className="flex min-w-10 justify-end gap-2">{right}</div>
    </div>
  );
}
