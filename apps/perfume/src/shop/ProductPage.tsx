import { useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Empty, Stepper, cx, Button } from "../components/ui";
import { useStore } from "../lib/store";
import { money } from "../lib/format";
import { navigate } from "../lib/router";
import { MobileTop } from "./ShopLayout";
import { ProductCard, visibleProducts } from "./ProductCard";

export function ProductPage({ id }: { id: string }) {
  const { db, addToCart, toggleWish, toast } = useStore();
  const p = db.products.find((x) => x.id === id && x.status !== "archived");
  const [vid, setVid] = useState<string>(() => {
    const vs = p?.variants ?? [];
    return (vs.find((v) => v.sizeMl === 50 && v.stock > 0) ?? vs.find((v) => v.stock > 0) ?? vs[0])?.id ?? "";
  });
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"details" | "notes" | "delivery">("details");

  if (!p) return <Empty icon={<I.drop size={26} />} title="Fragrance not found" action={<Button onClick={() => navigate("/shop")}>Back to catalogue</Button>} />;

  const s = db.settings;
  const v = p.variants.find((x) => x.id === vid) ?? p.variants[0];
  const wished = db.wishlist.includes(p.id);
  const inCart = db.cart.find((c) => c.variantId === v?.id)?.qty ?? 0;
  const available = s.allowBackorder ? 99 : Math.max(0, (v?.stock ?? 0) - inCart);
  const family = db.families.find((f) => f.id === p.familyId);
  const collection = db.collections.find((c) => c.id === p.collectionId);
  const related = visibleProducts(db.products, s.showOutOfStock)
    .filter((x) => x.id !== p.id && (x.familyId === p.familyId || x.collectionId === p.collectionId))
    .slice(0, 4);

  const add = () => {
    if (!v) return;
    if (!s.storeOpen) return toast("Online ordering is currently paused.", "error");
    addToCart(p.id, v.id, qty);
    toast(`${p.name} · ${v.sizeMl}ml added to bag`, "success");
    setQty(1);
  };

  return (
    <div className="pb-32 md:pb-10">
      <MobileTop
        back={() => (history.length > 1 ? history.back() : navigate("/shop"))}
        title="Details"
        right={
          <button aria-label="Wishlist" onClick={() => toggleWish(p.id)} className={cx("grid size-10 place-items-center rounded-full border border-line", wished ? "bg-inverse text-on-inverse" : "bg-card")}>
            <I.heart size={18} fill={wished ? "currentColor" : "none"} />
          </button>
        }
      />
      <div className="md:grid md:grid-cols-2 md:gap-10 md:px-6 md:pt-2">
        <div className="relative mx-4 overflow-hidden rounded-[28px] bg-gradient-to-b from-soft to-card md:sticky md:top-24 md:mx-0 md:self-start">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 50% 60%, ${p.bottle.liquid}55, transparent 60%)` }} />
          <div className="relative flex aspect-square items-center justify-center p-8 md:aspect-[4/5]">
            <Bottle product={p} brand={s.brandName} className="h-full max-h-[420px] w-auto drop-shadow-[0_30px_30px_rgba(0,0,0,.18)]" />
          </div>
          {family && (
            <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[11px] font-semibold">
              <span className="size-2.5 rounded-full" style={{ background: family.color }} /> {family.name}
            </span>
          )}
        </div>

        <div className="px-4 pt-6 md:px-0 md:pt-0">
          <p className="eyebrow">{[collection?.name, p.concentration].filter(Boolean).join(" · ")}</p>
          <h1 className="mt-1.5 font-display text-[34px] leading-tight md:text-5xl">{p.name}</h1>
          <div className="mt-3 flex items-center justify-between">
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{v && money(v.price, s)}</span>
              {v?.compareAt && <s className="text-sm text-muted">{money(v.compareAt, s)}</s>}
            </p>
            <Stepper value={qty} onChange={setQty} min={1} max={Math.max(1, available)} />
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-2.5">Size</p>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((x) => {
                const out = x.stock <= 0 && !s.allowBackorder;
                return (
                  <button
                    key={x.id}
                    onClick={() => {
                      setVid(x.id);
                      setQty(1);
                    }}
                    className={cx(
                      "relative flex h-16 min-w-20 flex-col items-center justify-center rounded-2xl border px-4 transition",
                      x.id === v?.id ? "border-inverse bg-inverse text-on-inverse" : "border-line bg-card hover:border-ink/40",
                      out && "opacity-45",
                    )}
                  >
                    <span className="text-sm font-bold">{x.sizeMl} ml</span>
                    <span className={cx("text-[11px]", x.id === v?.id ? "text-on-inverse/70" : "text-muted")}>{out ? "Sold out" : money(x.price, s)}</span>
                  </button>
                );
              })}
            </div>
            {v && v.stock > 0 && v.stock <= v.reorderPoint && <p className="mt-2 text-xs font-semibold text-warn">Only {v.stock} left in this size</p>}
          </div>

          <div className="mt-7 flex gap-6 border-b border-line text-sm">
            {(["details", "notes", "delivery"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cx("-mb-px border-b-2 pb-2.5 font-semibold capitalize", tab === t ? "border-ink" : "border-transparent text-muted")}>
                {t === "notes" ? "Olfactory notes" : t}
              </button>
            ))}
          </div>
          <div className="min-h-36 pt-4 text-sm leading-relaxed text-ink-2">
            {tab === "details" && (
              <div className="fade">
                <p>{p.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <Info k="Concentration" v={p.concentration} />
                  <Info k="For" v={p.gender} />
                  <Info k="Family" v={family?.name ?? "—"} />
                  <Info k="SKU" v={v?.sku ?? "—"} />
                </dl>
              </div>
            )}
            {tab === "notes" && (
              <div className="fade space-y-3">
                {(["top", "heart", "base"] as const).map((k, i) => (
                  <div key={k} className="flex items-start gap-3 rounded-2xl bg-soft p-3.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card font-display text-sm">{i + 1}</span>
                    <div>
                      <p className="text-[11px] font-bold tracking-[.16em] uppercase">{k} notes</p>
                      <p className="mt-0.5 text-ink-2">{p.notes[k].join(" · ") || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === "delivery" && (
              <div className="fade space-y-2">
                <p className="flex gap-2">
                  <I.truck size={18} className="shrink-0" /> {s.freeShippingOver > 0 ? `Complimentary delivery on orders over ${money(s.freeShippingOver, s)}; otherwise ${money(s.shippingFee, s)}.` : `Delivery ${money(s.shippingFee, s)}.`}
                </p>
                <p className="flex gap-2">
                  <I.sparkle size={18} className="shrink-0" /> Gift-wrapped in our signature box with two discovery samples.
                </p>
              </div>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 p-4 backdrop-blur-xl md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
            <button
              onClick={add}
              disabled={!v || available <= 0 || !s.storeOpen}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-inverse text-[15px] font-semibold text-on-inverse transition active:scale-[.99] disabled:opacity-40"
            >
              <I.bag size={18} />
              {!s.storeOpen ? "Ordering paused" : available <= 0 ? (inCart > 0 ? "All available in bag" : "Sold out") : `Add to bag · ${money((v?.price ?? 0) * qty, s)}`}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 px-4 md:px-6">
          <h2 className="mb-3 text-[15px] font-bold">You may also love</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-5">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <dt className="text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
    </div>
  );
}
