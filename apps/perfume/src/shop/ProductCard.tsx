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
  const v0 = p.variants.reduce((a, v) => (v.price < a.price ? v : a), p.variants[0]);
  const collection = db.collections.find((c) => c.id === p.collectionId);
  return (
    <div className={cx("group rise", className)}>
      <div className="relative overflow-hidden rounded-[22px] bg-card">
        <button onClick={() => navigate(`/p/${p.id}`)} className="block aspect-[4/5] w-full" aria-label={p.name}>
          <div className="flex h-full items-center justify-center bg-gradient-to-b from-soft to-card p-5 transition duration-500 group-hover:scale-[1.04]">
            <Bottle product={p} brand={db.settings.brandName} className="h-full max-h-56 w-auto" />
          </div>
        </button>
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWish(p.id)}
          className={cx("absolute top-3 right-3 grid size-8 place-items-center rounded-full transition", wished ? "bg-inverse text-on-inverse" : "bg-card/90 text-ink")}
        >
          <I.heart size={15} fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {p.isNew && <span className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">New</span>}
          {st === "out" && <span className="rounded-full bg-inverse px-2 py-0.5 text-[10px] font-bold tracking-wider text-on-inverse uppercase">Sold out</span>}
        </div>
      </div>
      <button onClick={() => navigate(`/p/${p.id}`)} className="mt-2.5 block w-full px-1 text-left">
        <p className="text-[10px] font-semibold tracking-[.16em] text-muted uppercase">{collection?.name ?? p.concentration}</p>
        <p className="mt-0.5 truncate text-[13.5px] font-semibold">{p.name}</p>
        <p className="mt-0.5 flex items-baseline gap-1.5 text-[13px] font-bold">
          {p.variants.length > 1 && <span className="text-[11px] font-medium text-muted">from</span>}
          {money(minPrice(p), db.settings)}
          {v0?.compareAt && <s className="text-[11px] font-medium text-muted">{money(v0.compareAt, db.settings)}</s>}
        </p>
      </button>
    </div>
  );
}

export function visibleProducts(products: Product[], showOutOfStock: boolean) {
  return products.filter((p) => p.status === "active" && p.variants.length > 0 && (showOutOfStock || stockState(p) !== "out"));
}
