import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { cx } from "../components/ui";
import { minPrice, stockState, useStore } from "../lib/store";
import { money } from "../lib/format";
import { navigate } from "../lib/router";
import type { Product } from "../lib/types";

export function ProductCard({ p, className }: { p: Product; className?: string }) {
  const { db, toggleWish } = useStore();
  const wished = db.wishlist.includes(p.id);
  const st = stockState(p);
  const cheapest = p.variants.reduce((a, v) => (v.price < a.price ? v : a), p.variants[0]);
  const family = db.families.find((f) => f.id === p.familyId);
  return (
    <article className={cx("group rise flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-ink/40", className)}>
      <div className="relative">
        <button onClick={() => navigate(`/p/${p.id}`)} className="block aspect-[4/5] w-full max-w-full bg-soft" aria-label={p.name}>
          <div className="flex h-full items-center justify-center p-6 transition duration-500 group-hover:scale-[1.03]">
            <Bottle product={p} brand={db.settings.brandName} className="h-full max-h-60 w-auto" />
          </div>
        </button>
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          onClick={() => toggleWish(p.id)}
          className={cx(
            "absolute top-3 right-3 grid size-9 place-items-center rounded-full border-[1.5px] transition-colors",
            wished ? "border-inverse bg-inverse text-on-inverse" : "border-line-2 bg-card text-ink hover:border-ink",
          )}
        >
          <I.heart size={16} fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {p.isNew && <span className="rounded-full border border-ink bg-card px-2.5 py-0.5 text-[11px] font-semibold">New</span>}
          {st === "out" && <span className="rounded-full border border-inverse bg-inverse px-2.5 py-0.5 text-[11px] font-semibold text-on-inverse">Sold out</span>}
          {st === "low" && <span className="rounded-full border border-warn/40 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-warn">Few left</span>}
        </div>
      </div>
      <button onClick={() => navigate(`/p/${p.id}`)} className="flex flex-1 flex-col gap-1 border-t border-line p-3.5 text-left md:p-4">
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          {family && <span className="size-2 shrink-0 rounded-full" style={{ background: family.color }} />}
          <span className="truncate">{p.concentration}</span>
        </span>
        <span className="line-clamp-1 text-[15px] leading-snug font-semibold md:text-[16px]">{p.name}</span>
        <span className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1 text-[14.5px] font-semibold tabular-nums">
          {p.variants.length > 1 && <span className="text-[12px] font-normal text-muted">from</span>}
          {money(minPrice(p), db.settings)}
          {cheapest?.compareAt && <s className="text-[12px] font-normal text-muted">{money(cheapest.compareAt, db.settings)}</s>}
        </span>
      </button>
    </article>
  );
}

export function visibleProducts(products: Product[], showOutOfStock: boolean) {
  return products.filter((p) => p.status === "active" && p.variants.length > 0 && (showOutOfStock || stockState(p) !== "out"));
}
