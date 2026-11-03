import { useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Button, Empty, Field, Input, Stepper, Textarea, cx } from "../components/ui";
import { findVariant, quote, useStore } from "../lib/store";
import { money } from "../lib/format";
import { navigate } from "../lib/router";
import type { Customer, PaymentMethod } from "../lib/types";
import { MobileTop } from "./ShopLayout";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card_on_delivery: "Card on delivery",
  cash_on_delivery: "Cash on delivery",
  bank_transfer: "Bank transfer",
  in_store: "Pay in boutique",
};

export function Bag() {
  const { db, setCartQty } = useStore();
  const s = db.settings;
  const q = quote(db, db.cart);

  if (db.cart.length === 0)
    return (
      <>
        <MobileTop title="Your bag" back="/shop" />
        <Empty icon={<I.bag size={26} />} title="Your bag is empty" text="Discover a signature scent made for you." action={<Button onClick={() => navigate("/shop")}>Explore the catalogue</Button>} />
      </>
    );

  return (
    <div>
      <MobileTop title="Your bag" back="/shop" />
      <div className="px-4 md:grid md:grid-cols-[1fr_380px] md:gap-8 md:px-6">
        <div className="space-y-3">
          {db.cart.map((c) => {
            const f = findVariant(db, c.variantId);
            if (!f) return null;
            const max = s.allowBackorder ? 99 : f.variant.stock;
            return (
              <div key={c.variantId} className="rise flex gap-4 rounded-[24px] border border-line bg-card p-3">
                <button onClick={() => navigate(`/p/${f.product.id}`)} className="grid size-24 shrink-0 place-items-center rounded-2xl bg-soft">
                  <Bottle product={f.product} label={false} className="h-20 w-auto" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{f.product.name}</p>
                      <p className="text-xs text-muted">
                        {f.product.concentration} · {f.variant.sizeMl} ml
                      </p>
                    </div>
                    <button aria-label="Remove" onClick={() => setCartQty(c.variantId, 0)} className="text-muted hover:text-bad">
                      <I.x size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <p className="font-bold">{money(f.variant.price * c.qty, s)}</p>
                    <Stepper value={c.qty} min={0} max={max} onChange={(n) => setCartQty(c.variantId, n)} />
                  </div>
                  {c.qty > f.variant.stock && !s.allowBackorder && <p className="mt-1 text-xs text-bad">Only {f.variant.stock} available</p>}
                </div>
              </div>
            );
          })}
        </div>
        <Summary q={q} className="mt-5 md:mt-0">
          <Button size="lg" className="mt-4 w-full" onClick={() => navigate("/checkout")} disabled={!s.storeOpen}>
            {s.storeOpen ? "Checkout" : "Ordering paused"} <I.arrowR size={18} />
          </Button>
        </Summary>
      </div>
    </div>
  );
}

export function Summary({ q, className, children }: { q: ReturnType<typeof quote>; className?: string; children?: React.ReactNode }) {
  const { db } = useStore();
  const s = db.settings;
  const toFree = s.freeShippingOver - (q.subtotal - q.discount);
  return (
    <div className={cx("h-fit rounded-[24px] bg-inverse p-5 text-on-inverse md:sticky md:top-24", className)}>
      <p className="font-display text-xl">Summary</p>
      {s.freeShippingOver > 0 && toFree > 0 && (
        <div className="mt-3">
          <p className="text-xs opacity-70">{money(toFree, s)} away from complimentary delivery</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-on-inverse/15">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, ((q.subtotal - q.discount) / s.freeShippingOver) * 100)}%` }} />
          </div>
        </div>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        <Row k="Subtotal" v={money(q.subtotal, s)} />
        {q.discount > 0 && <Row k={`Promo ${q.promo?.code ?? ""}`} v={`− ${money(q.discount, s)}`} />}
        <Row k="Delivery" v={q.shipping === 0 ? "Complimentary" : money(q.shipping, s)} />
        <Row k={s.taxInclusive ? `Incl. tax (${s.taxRate}%)` : `Tax (${s.taxRate}%)`} v={money(q.tax, s)} />
        <div className="my-2 border-t border-on-inverse/15" />
        <div className="flex items-baseline justify-between">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display text-2xl">{money(q.total, s)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between">
    <dt className="opacity-70">{k}</dt>
    <dd className="font-semibold">{v}</dd>
  </div>
);

export function Checkout() {
  const { db, placeOrder, toast } = useStore();
  const s = db.settings;
  const methods = (Object.keys(s.payments) as PaymentMethod[]).filter((m) => s.payments[m] && m !== "in_store");
  const [c, setC] = useState<Customer>(() => {
    try {
      return JSON.parse(localStorage.getItem("maison.customer") || "") as Customer;
    } catch {
      return { name: "", email: "", phone: "", address: "", city: "", country: "" };
    }
  });
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? "card_on_delivery");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState("");
  const [note, setNote] = useState("");
  const q = quote(db, db.cart, applied);

  if (db.cart.length === 0)
    return (
      <>
        <MobileTop title="Checkout" back="/bag" />
        <Empty icon={<I.bag size={26} />} title="Nothing to check out" action={<Button onClick={() => navigate("/shop")}>Explore the catalogue</Button>} />
      </>
    );

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setC({ ...c, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.storeOpen) return toast("Online ordering is paused.", "error");
    if (!/^\S+@\S+\.\S+$/.test(c.email)) return toast("Please enter a valid email.", "error");
    const r = placeOrder({ customer: c, items: db.cart, channel: "online", paymentMethod: method, note, promoCode: applied, fromCart: true });
    if (!r.ok) return toast(r.error, "error");
    try {
      localStorage.setItem("maison.customer", JSON.stringify(c));
    } catch {
      /* ignore */
    }
    navigate(`/order/${r.order.id}?new=1`);
  };

  return (
    <form onSubmit={submit}>
      <MobileTop title="Checkout" back="/bag" />
      <div className="px-4 md:grid md:grid-cols-[1fr_380px] md:gap-8 md:px-6">
        <div className="space-y-5">
          <section className="rounded-[24px] border border-line bg-card p-5">
            <p className="eyebrow mb-4">Contact</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <Input required value={c.name} onChange={set("name")} autoComplete="name" />
              </Field>
              <Field label="Email">
                <Input required type="email" value={c.email} onChange={set("email")} autoComplete="email" />
              </Field>
              <Field label="Phone">
                <Input required type="tel" value={c.phone} onChange={set("phone")} autoComplete="tel" />
              </Field>
            </div>
          </section>
          <section className="rounded-[24px] border border-line bg-card p-5">
            <p className="eyebrow mb-4">Delivery address</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Street address" className="sm:col-span-2">
                <Input required value={c.address} onChange={set("address")} autoComplete="street-address" />
              </Field>
              <Field label="City">
                <Input required value={c.city} onChange={set("city")} autoComplete="address-level2" />
              </Field>
              <Field label="Country">
                <Input required value={c.country} onChange={set("country")} autoComplete="country-name" />
              </Field>
              <Field label="Note for the atelier (optional)" className="sm:col-span-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Gift message, delivery instructions…" className="min-h-20" />
              </Field>
            </div>
          </section>
          <section className="rounded-[24px] border border-line bg-card p-5">
            <p className="eyebrow mb-4">Payment</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {methods.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cx("flex items-center gap-2 rounded-2xl border p-3.5 text-left text-sm font-semibold", method === m ? "border-inverse bg-inverse text-on-inverse" : "border-line")}
                >
                  {m === "bank_transfer" ? <I.globe size={18} /> : m === "cash_on_delivery" ? <I.cash size={18} /> : <I.card size={18} />}
                  {PAYMENT_LABEL[m]}
                </button>
              ))}
            </div>
            {method === "bank_transfer" && <p className="mt-3 text-xs text-muted">Transfer details will be emailed with your order confirmation. We ship once payment is received.</p>}
            {methods.length === 0 && <p className="text-sm text-bad">No payment methods are enabled. Please contact the boutique.</p>}
          </section>
        </div>
        <Summary q={q} className="mt-5 mb-8 md:mt-0">
          <div className="mt-4 flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promo code"
              className="h-11 min-w-0 flex-1 rounded-full border border-on-inverse/20 bg-transparent px-4 text-sm uppercase outline-none placeholder:normal-case placeholder:opacity-50"
            />
            <button
              type="button"
              onClick={() => {
                const ok = quote(db, db.cart, promo).promo;
                if (ok) {
                  setApplied(promo);
                  toast(`${ok.code} applied — ${ok.percent}% off`, "success");
                } else toast("That code isn't valid.", "error");
              }}
              className="h-11 rounded-full bg-on-inverse/10 px-4 text-sm font-semibold"
            >
              Apply
            </button>
          </div>
          <button type="submit" disabled={methods.length === 0} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-on-inverse text-[15px] font-semibold text-inverse disabled:opacity-40">
            Place order · {money(q.total, s)}
          </button>
          <p className="mt-3 text-center text-[11px] opacity-60">No card details are collected online — you pay on delivery or by transfer.</p>
        </Summary>
      </div>
    </form>
  );
}
