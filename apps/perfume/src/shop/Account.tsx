import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Badge, Button, Empty } from "../components/ui";
import { findVariant, useStore } from "../lib/store";
import { dateShort, dateTime, money } from "../lib/format";
import { navigate } from "../lib/router";
import type { OrderStatus } from "../lib/types";
import { MobileTop } from "./ShopLayout";
import { ProductCard } from "./ProductCard";
import { PAYMENT_LABEL } from "./Bag";

export const STATUS_TONE: Record<OrderStatus, "neutral" | "ok" | "warn" | "bad" | "dark" | "accent"> = {
  pending: "warn",
  confirmed: "accent",
  packed: "accent",
  shipped: "dark",
  delivered: "ok",
  cancelled: "bad",
};
const STEPS: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

export function Wishlist() {
  const { db } = useStore();
  const items = db.products.filter((p) => db.wishlist.includes(p.id) && p.status === "active");
  return (
    <div>
      <MobileTop title="Wishlist" />
      <div className="px-4 md:px-6">
        <h1 className="mb-5 hidden font-display text-5xl md:block">Wishlist</h1>
        {items.length === 0 ? (
          <Empty icon={<I.heart size={26} />} title="Nothing saved yet" text="Tap the heart on any fragrance to keep it here." action={<Button onClick={() => navigate("/shop")}>Browse scents</Button>} />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-5">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Account() {
  const { db } = useStore();
  const mine = db.myOrders.map((id) => db.orders.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o);
  const s = db.settings;
  return (
    <div>
      <MobileTop title="Account" />
      <div className="px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f3e6d2] to-[#e7d2b4] p-6 text-[#2b2118]">
          <I.sparkle size={120} className="absolute -top-6 -right-6 text-white/40" />
          <p className="text-[10px] font-bold tracking-[.3em] uppercase opacity-70">{s.brandName} Privilège</p>
          <p className="mt-2 font-display text-3xl">{mine.length ? `${mine.length} order${mine.length > 1 ? "s" : ""}` : "Welcome"}</p>
          <p className="mt-1 text-sm opacity-80">Track your orders and saved scents on this device.</p>
        </div>

        <h2 className="mt-8 mb-3 text-[15px] font-bold">My orders</h2>
        {mine.length === 0 ? (
          <div className="rounded-[24px] border border-line bg-card">
            <Empty icon={<I.receipt size={26} />} title="No orders yet" text="Orders you place on this device appear here." />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-line bg-card">
            {mine.map((o) => (
              <button key={o.id} onClick={() => navigate(`/order/${o.id}`)} className="flex w-full items-center gap-3 border-b border-line p-4 text-left last:border-0 hover:bg-soft">
                <div className="grid size-11 place-items-center rounded-full bg-soft">
                  <I.receipt size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-xs text-muted">
                    {dateShort(o.createdAt, s.locale)} · {o.items.reduce((a, i) => a + i.qty, 0)} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{money(o.total, s)}</p>
                  <Badge tone={STATUS_TONE[o.status]} className="mt-1 capitalize">
                    {o.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}

        <h2 className="mt-8 mb-3 text-[15px] font-bold">Boutique</h2>
        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <Row icon={<I.heart size={18} />} label="Wishlist" onClick={() => navigate("/wishlist")} />
          <Row icon={<I.sparkle size={18} />} label="Welcome screen" onClick={() => navigate("/welcome")} />
          <Row icon={<I.box size={18} />} label="Open Studio (staff)" onClick={() => navigate("/studio")} />
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left text-sm font-medium last:border-0 hover:bg-soft">
      {icon}
      <span className="flex-1">{label}</span>
      <span className="grid size-7 place-items-center rounded-full bg-soft">
        <I.arrowR size={14} />
      </span>
    </button>
  );
}

export function OrderView({ id, isNew }: { id: string; isNew: boolean }) {
  const { db } = useStore();
  const s = db.settings;
  const o = db.orders.find((x) => x.id === id);
  if (!o) return <Empty icon={<I.receipt size={26} />} title="Order not found" action={<Button onClick={() => navigate("/account")}>My account</Button>} />;
  const step = STEPS.indexOf(o.status);
  return (
    <div>
      <MobileTop title={o.number} back="/account" />
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        {isNew && (
          <div className="rise mb-6 flex flex-col items-center rounded-[28px] bg-inverse px-6 py-10 text-center text-on-inverse">
            <div className="grid size-16 place-items-center rounded-full bg-accent text-white">
              <I.check size={30} />
            </div>
            <p className="mt-5 font-display text-3xl">Merci, {o.customer.name.split(" ")[0]}</p>
            <p className="mt-2 max-w-xs text-sm opacity-70">Your order {o.number} has been received. We'll confirm it shortly at {o.customer.email}.</p>
          </div>
        )}

        <div className="rounded-[24px] border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Status</p>
            <Badge tone={STATUS_TONE[o.status]} className="capitalize">
              {o.status}
            </Badge>
          </div>
          {o.status !== "cancelled" && (
            <div className="mt-5 flex items-center">
              {STEPS.map((st, i) => (
                <div key={st} className="flex flex-1 flex-col items-center last:flex-none">
                  <div className="flex w-full items-center">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] ${i <= step ? "bg-inverse text-on-inverse" : "bg-soft text-muted"}`}>
                      {i <= step ? <I.check size={12} /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && <span className={`mx-1 h-0.5 flex-1 rounded ${i < step ? "bg-inverse" : "bg-line"}`} />}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-between text-[10px] text-muted capitalize">
            {o.status !== "cancelled" && STEPS.map((st) => <span key={st}>{st}</span>)}
          </div>
          <p className="mt-4 text-xs text-muted">Placed {dateTime(o.createdAt, s.locale)} · {PAYMENT_LABEL[o.paymentMethod]} · {o.paymentStatus}</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-card">
          {o.items.map((it) => {
            const f = findVariant(db, it.variantId);
            return (
              <div key={it.variantId} className="flex items-center gap-3 border-b border-line p-4 last:border-0">
                <div className="grid size-14 place-items-center rounded-xl bg-soft">{f && <Bottle product={f.product} label={false} className="h-12 w-auto" />}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{it.name}</p>
                  <p className="text-xs text-muted">
                    {it.sizeMl} ml × {it.qty}
                  </p>
                </div>
                <p className="text-sm font-bold">{money(it.price * it.qty, s)}</p>
              </div>
            );
          })}
          <div className="space-y-1.5 bg-soft p-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{money(o.subtotal, s)}</span>
            </div>
            {o.discount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span>− {money(o.discount, s)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Delivery</span>
              <span>{o.shipping ? money(o.shipping, s) : "Complimentary"}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax</span>
              <span>{money(o.tax, s)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>Total</span>
              <span>{money(o.total, s)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-[24px] border border-line bg-card p-5 text-sm">
          <p className="eyebrow mb-2">Deliver to</p>
          <p className="font-semibold">{o.customer.name}</p>
          <p className="text-muted">
            {o.customer.address}, {o.customer.city}, {o.customer.country}
          </p>
          <p className="text-muted">
            {o.customer.phone} · {o.customer.email}
          </p>
        </div>
        <Button variant="outline" className="mt-6 w-full" onClick={() => navigate("/shop")}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
