import type { ReactNode } from "react";
import { I } from "../components/icons";
import { cx } from "../components/ui";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";

const tabs = [
  { to: "/", icon: I.home, label: "Home", match: (p: string) => p === "/" },
  { to: "/shop", icon: I.grid, label: "Catalogue", match: (p: string) => p.startsWith("/shop") || p.startsWith("/p/") },
  { to: "/wishlist", icon: I.heart, label: "Saved", match: (p: string) => p === "/wishlist" },
  { to: "/bag", icon: I.bag, label: "Bag", match: (p: string) => p.startsWith("/bag") || p.startsWith("/checkout") },
  { to: "/account", icon: I.user, label: "Account", match: (p: string) => p.startsWith("/account") || p.startsWith("/order/") },
];

export function Wordmark({ className }: { className?: string }) {
  const { db } = useStore();
  const [first, ...rest] = db.settings.brandName.split(" ");
  return (
    <span className={cx("inline-flex items-baseline gap-2 leading-none", className)}>
      <span className="font-display text-[26px] font-bold tracking-[.14em] uppercase">{first}</span>
      {rest.length > 0 && <span className="text-[11px] font-semibold tracking-[.24em] text-muted uppercase">{rest.join(" ")}</span>}
    </span>
  );
}

export function ShopLayout({ path, children, hideNav }: { path: string; children: ReactNode; hideNav?: boolean }) {
  const { db } = useStore();
  const s = db.settings;
  const bagCount = db.cart.reduce((a, c) => a + c.qty, 0);

  return (
    <div className="min-h-dvh">
      {s.announcement && <div className="border-b border-inverse bg-inverse px-4 py-2.5 text-center text-[13px] font-medium text-on-inverse">{s.announcement}</div>}
      {!s.storeOpen && <div className="border-b border-warn/30 bg-warn/10 px-4 py-2.5 text-center text-[13px] font-medium text-warn">Online ordering is paused. You can still browse the catalogue.</div>}

      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:h-[72px] md:px-6">
          <button onClick={() => navigate("/")} aria-label="Home">
            <Wordmark />
          </button>
          <nav className="hidden gap-1 md:flex">
            {[
              ["/", "Home", tabs[0].match(path)],
              ["/shop", "Catalogue", tabs[1].match(path)],
              ["/shop?sort=new", "New in", false],
            ].map(([to, label, active]) => (
              <button
                key={String(label)}
                onClick={() => navigate(String(to))}
                className={cx("h-10 rounded-full px-4 text-[14px] font-medium transition-colors", active ? "bg-soft text-ink" : "text-ink-2 hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <HeaderIcon label="Search" onClick={() => navigate("/shop?focus=1")} icon={<I.search size={18} />} />
            <HeaderIcon label="Saved" onClick={() => navigate("/wishlist")} icon={<I.heart size={18} />} count={db.wishlist.length} className="hidden md:grid" />
            <HeaderIcon label="Account" onClick={() => navigate("/account")} icon={<I.user size={18} />} className="hidden md:grid" />
            <HeaderIcon label="Bag" onClick={() => navigate("/bag")} icon={<I.bag size={18} />} count={bagCount} />
            <button onClick={() => navigate("/studio")} className="ml-1 hidden h-11 items-center gap-2 rounded-full border-[1.5px] border-inverse bg-inverse px-4 text-[14px] font-semibold text-on-inverse md:inline-flex">
              <I.box size={17} /> Studio
            </button>
          </div>
        </div>
      </header>

      <main className={cx("mx-auto max-w-6xl", !hideNav && "pb-32 md:pb-20")}>{children}</main>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-30 flex justify-center px-4 md:hidden" aria-label="Primary">
          <div className="flex items-center gap-1 rounded-full border border-inverse bg-inverse p-1.5 shadow-2xl shadow-black/25">
            {tabs.map((t) => {
              const active = t.match(path);
              const Icon = t.icon;
              const count = t.to === "/bag" ? bagCount : 0;
              return (
                <button
                  key={t.to}
                  aria-label={t.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => navigate(t.to)}
                  className={cx("relative grid h-12 w-[58px] place-items-center rounded-full transition-colors", active ? "bg-on-inverse text-inverse" : "text-on-inverse/65")}
                >
                  <Icon size={21} />
                  {count > 0 && <span className="absolute top-1 right-2.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] leading-[18px] font-bold text-white">{count}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function HeaderIcon({ icon, label, onClick, count = 0, className }: { icon: ReactNode; label: string; onClick: () => void; count?: number; className?: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cx("relative grid size-11 place-items-center rounded-full border-[1.5px] border-line-2 bg-card transition-colors hover:border-ink", className)}>
      {icon}
      {count > 0 && <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full border-2 border-paper bg-accent px-1 text-[10px] leading-4 font-bold text-white">{count}</span>}
    </button>
  );
}

/** Page bar for inner shop screens: back button, centred title, optional action. */
export function MobileTop({ title, back, right }: { title?: ReactNode; back?: string | (() => void); right?: ReactNode }) {
  return (
    <div className="flex h-16 items-center gap-3 px-4 md:h-20 md:px-6">
      {back ? (
        <button
          aria-label="Back"
          onClick={() => (typeof back === "string" ? navigate(back) : back())}
          className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-line-2 bg-card transition-colors hover:border-ink"
        >
          <I.arrowL size={18} />
        </button>
      ) : (
        <span className="size-11 shrink-0 md:hidden" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold md:text-left md:font-display md:text-[34px]">{title}</h1>
      <div className="flex min-w-11 justify-end gap-2">{right}</div>
    </div>
  );
}
