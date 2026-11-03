import { useMemo, useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { ask, Badge, Button, Card, Chip, Empty, Field, Input, Select, Stepper, Textarea, cx } from "../components/ui";
import { findVariant, quote, useStore } from "../lib/store";
import { dateTime, downloadFile, money, relTime, toCSV } from "../lib/format";
import { navigate } from "../lib/router";
import type { Channel, Customer, OrderStatus, PaymentMethod, PaymentStatus } from "../lib/types";
import { STATUS_TONE } from "../shop/Account";
import { PAYMENT_LABEL } from "../shop/Bag";
import { PageHead } from "./StudioLayout";

const FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = { pending: "Confirm order", confirmed: "Mark packed", packed: "Mark shipped", shipped: "Mark delivered" };

export function Orders() {
  const { db } = useStore();
  const s = db.settings;
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [channel, setChannel] = useState<Channel | "">("");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.orders
      .filter((o) => status === "all" || o.status === status)
      .filter((o) => !channel || o.channel === channel)
      .filter((o) => !t || `${o.number} ${o.customer.name} ${o.customer.email} ${o.customer.phone} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(t));
  }, [db.orders, status, channel, q]);

  const exportCSV = () => {
    downloadFile(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV([
        ["Number", "Date", "Channel", "Customer", "Email", "Phone", "City", "Country", "Items", "Subtotal", "Discount", "Shipping", "Tax", "Total", "Status", "Payment", "Method"],
        ...list.map((o) => [
          o.number,
          o.createdAt,
          o.channel,
          o.customer.name,
          o.customer.email,
          o.customer.phone,
          o.customer.city,
          o.customer.country,
          o.items.map((i) => `${i.qty}× ${i.name} ${i.sizeMl}ml`).join("; "),
          o.subtotal,
          o.discount,
          o.shipping,
          o.tax,
          o.total,
          o.status,
          o.paymentStatus,
          o.paymentMethod,
        ]),
      ]),
      "text/csv",
    );
  };

  return (
    <div className="rise">
      <PageHead
        eyebrow="Sales"
        title="Orders"
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}>
              <I.download size={16} /> Export
            </Button>
            <Button onClick={() => navigate("/studio/orders/new")}>
              <I.plus size={16} /> New order
            </Button>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <I.search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, customer, product" className="h-11 w-full rounded-full border border-line bg-card pr-4 pl-10 text-sm outline-none focus:border-ink/50" />
        </div>
        <div className="w-40">
          <Select value={channel} onChange={(e) => setChannel(e.target.value as Channel | "")} className="h-11 rounded-full bg-card">
            <option value="">All channels</option>
            <option value="online">Online</option>
            <option value="in-store">In-store</option>
            <option value="phone">Phone</option>
          </Select>
        </div>
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(["all", ...FLOW, "cancelled"] as const).map((st) => {
          const n = st === "all" ? db.orders.length : db.orders.filter((o) => o.status === st).length;
          return (
            <Chip key={st} active={status === st} onClick={() => setStatus(st)}>
              {st} {n > 0 && <span className="ml-1 opacity-60">{n}</span>}
            </Chip>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 && <Empty icon={<I.receipt size={26} />} title="No orders" text="Orders placed online or created here will appear in this list." />}
        {list.map((o) => (
          <button key={o.id} onClick={() => navigate(`/studio/orders/${o.id}`)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-0 hover:bg-soft/60 md:px-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-soft font-display">{o.customer.name.charAt(0) || "?"}</div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {o.number}
                <span className="truncate font-normal text-muted">· {o.customer.name}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {o.items.reduce((a, i) => a + i.qty, 0)} items · {o.channel} · {relTime(o.createdAt)}
              </p>
            </div>
            <div className="hidden w-28 md:block">
              <Badge tone={o.paymentStatus === "paid" ? "ok" : o.paymentStatus === "refunded" ? "neutral" : "warn"} className="capitalize">
                {o.paymentStatus}
              </Badge>
            </div>
            <div className="w-24 text-right">
              <p className="text-sm font-bold">{money(o.total, s)}</p>
              <Badge tone={STATUS_TONE[o.status]} className="mt-0.5 capitalize">
                {o.status}
              </Badge>
            </div>
          </button>
        ))}
      </Card>
    </div>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { db, setOrderStatus, setPaymentStatus, addOrderNote, returnItems, toast } = useStore();
  const s = db.settings;
  const o = db.orders.find((x) => x.id === id);
  const [note, setNote] = useState("");
  if (!o)
    return (
      <Card>
        <Empty icon={<I.receipt size={26} />} title="Order not found" action={<Button onClick={() => navigate("/studio/orders")}>All orders</Button>} />
      </Card>
    );
  const idx = FLOW.indexOf(o.status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const returned = o.history.some((h) => h.text?.startsWith("Items returned"));

  return (
    <div className="rise">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <button aria-label="Back" onClick={() => navigate("/studio/orders")} className="grid size-10 place-items-center rounded-full border border-line bg-card">
          <I.arrowL size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            {o.channel} order · {dateTime(o.createdAt, s.locale)}
          </p>
          <h1 className="flex items-center gap-3 font-display text-3xl">
            {o.number}
            <Badge tone={STATUS_TONE[o.status]} className="font-sans capitalize">
              {o.status}
            </Badge>
          </h1>
        </div>
        {next && o.status !== "cancelled" && (
          <Button
            onClick={() => {
              setOrderStatus(o.id, next);
              toast(`${o.number} → ${next}`, "success");
            }}
          >
            {NEXT_LABEL[o.status]} <I.arrowR size={16} />
          </Button>
        )}
      </div>

      {/* Print header */}
      <div className="mb-6 hidden print:block">
        <p className="font-display text-3xl">{s.brandName}</p>
        <p className="text-sm">
          Invoice {o.number} · {dateTime(o.createdAt, s.locale)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {o.status !== "cancelled" && (
            <Card className="no-print p-5">
              <div className="flex items-center">
                {FLOW.map((st, i) => (
                  <div key={st} className="flex flex-1 items-center last:flex-none">
                    <button
                      onClick={() => i > idx && setOrderStatus(o.id, st)}
                      title={st}
                      className={cx("grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold", i <= idx ? "bg-inverse text-on-inverse" : "bg-soft text-muted hover:bg-line")}
                    >
                      {i <= idx ? <I.check size={14} /> : i + 1}
                    </button>
                    {i < FLOW.length - 1 && <span className={cx("mx-1.5 h-0.5 flex-1 rounded", i < idx ? "bg-inverse" : "bg-line")} />}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted capitalize">
                {FLOW.map((st) => (
                  <span key={st}>{st}</span>
                ))}
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            {o.items.map((it) => {
              const f = findVariant(db, it.variantId);
              return (
                <div key={it.variantId} className="flex items-center gap-3 border-b border-line p-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-soft">{f && <Bottle product={f.product} label={false} className="h-12 w-auto" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{it.name}</p>
                    <p className="text-xs text-muted">
                      {it.sizeMl} ml · {it.sku} · {money(it.price, s)} × {it.qty}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{money(it.price * it.qty, s)}</p>
                </div>
              );
            })}
            <dl className="space-y-1.5 bg-soft/60 p-4 text-sm">
              <Line k="Subtotal" v={money(o.subtotal, s)} />
              {o.discount > 0 && <Line k="Discount" v={`− ${money(o.discount, s)}`} />}
              <Line k="Delivery" v={o.shipping ? money(o.shipping, s) : "Complimentary"} />
              <Line k={`Tax${s.taxInclusive ? " (incl.)" : ""}`} v={money(o.tax, s)} />
              <div className="flex justify-between pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd>{money(o.total, s)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="no-print p-5">
            <p className="eyebrow mb-3">Timeline</p>
            <ol className="relative space-y-3 border-l border-line pl-5">
              {[...o.history].reverse().map((h, i) => (
                <li key={i} className="text-sm">
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-inverse" />
                  <p className="font-semibold capitalize">{h.status === "note" ? "Note" : h.status === "payment" ? "Payment" : h.status}</p>
                  {h.text && <p className="text-ink-2">{h.text}</p>}
                  <p className="text-xs text-muted">{dateTime(h.at, s.locale)}</p>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
              <Button
                variant="soft"
                onClick={() => {
                  if (!note.trim()) return;
                  addOrderNote(o.id, note.trim());
                  setNote("");
                }}
              >
                Add
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 text-sm">
            <p className="eyebrow mb-3">Customer</p>
            <p className="font-semibold">{o.customer.name}</p>
            <p className="text-muted">{o.customer.email}</p>
            <p className="text-muted">{o.customer.phone}</p>
            <p className="mt-3 text-ink-2">
              {o.customer.address}
              <br />
              {o.customer.city}, {o.customer.country}
            </p>
            {o.note && <p className="mt-3 rounded-xl bg-soft p-3 text-ink-2 italic">“{o.note}”</p>}
          </Card>
          <Card className="no-print p-5 text-sm">
            <p className="eyebrow mb-3">Payment</p>
            <p className="mb-3 font-semibold">{PAYMENT_LABEL[o.paymentMethod]}</p>
            <div className="grid grid-cols-3 gap-1 rounded-full bg-soft p-1">
              {(["unpaid", "paid", "refunded"] as PaymentStatus[]).map((ps) => (
                <button key={ps} onClick={() => ps !== o.paymentStatus && setPaymentStatus(o.id, ps)} className={cx("h-8 rounded-full text-xs font-bold capitalize", o.paymentStatus === ps ? "bg-card shadow-sm" : "text-muted")}>
                  {ps}
                </button>
              ))}
            </div>
          </Card>
          <Card className="no-print space-y-2 p-5">
            <p className="eyebrow mb-1">Actions</p>
            {o.status !== "cancelled" && o.status !== "delivered" && (
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  if (await ask(`Cancel ${o.number}? Items go back into stock.`)) {
                    setOrderStatus(o.id, "cancelled");
                    toast("Order cancelled — stock restored");
                  }
                }}
              >
                Cancel order & restock
              </Button>
            )}
            {o.status === "delivered" && !returned && (
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (await ask("Return all items to stock and mark refunded?")) {
                    returnItems(o.id);
                    toast("Return processed", "success");
                  }
                }}
              >
                Process return
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                navigator.clipboard?.writeText(`${o.customer.name}\n${o.customer.address}\n${o.customer.city}, ${o.customer.country}\n${o.customer.phone}`);
                toast("Shipping label copied");
              }}
            >
              <I.copy size={16} /> Copy shipping address
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Line = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between text-muted">
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);

export function NewOrder() {
  const { db, placeOrder, toast } = useStore();
  const s = db.settings;
  const [items, setItems] = useState<{ variantId: string; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [c, setC] = useState<Customer>({ name: "", email: "", phone: "", address: "", city: "", country: "" });
  const [channel, setChannel] = useState<Channel>("in-store");
  const [method, setMethod] = useState<PaymentMethod>("in_store");
  const [paid, setPaid] = useState(true);
  const [fulfil, setFulfil] = useState<OrderStatus>("delivered");
  const [promo, setPromo] = useState("");
  const [freeShip, setFreeShip] = useState(true);
  const [note, setNote] = useState("");

  const q = quote(db, items, promo, channel === "in-store" || freeShip ? 0 : undefined);
  const t = search.trim().toLowerCase();
  const options = db.products
    .filter((p) => p.status === "active")
    .flatMap((p) => p.variants.map((v) => ({ p, v })))
    .filter(({ p, v }) => !t || `${p.name} ${v.sku}`.toLowerCase().includes(t))
    .slice(0, 24);

  const add = (variantId: string) => setItems((xs) => (xs.some((x) => x.variantId === variantId) ? xs.map((x) => (x.variantId === variantId ? { ...x, qty: x.qty + 1 } : x)) : [...xs, { variantId, qty: 1 }]));

  const submit = () => {
    if (!items.length) return toast("Add at least one product.", "error");
    if (!c.name.trim()) return toast("Customer name is required.", "error");
    const r = placeOrder({
      customer: { ...c, email: c.email || "—", country: c.country || "—" },
      items,
      channel,
      paymentMethod: method,
      paymentStatus: paid ? "paid" : "unpaid",
      status: fulfil,
      note,
      promoCode: promo,
      shipping: channel === "in-store" || freeShip ? 0 : undefined,
    });
    if (!r.ok) return toast(r.error, "error");
    toast(`Order ${r.order.number} created`, "success");
    navigate(`/studio/orders/${r.order.id}`);
  };

  return (
    <div className="rise">
      <div className="mb-6 flex items-center gap-3">
        <button aria-label="Back" onClick={() => navigate("/studio/orders")} className="grid size-10 place-items-center rounded-full border border-line bg-card">
          <I.arrowL size={18} />
        </button>
        <div>
          <p className="eyebrow">Point of sale</p>
          <h1 className="font-display text-3xl">New order</h1>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="eyebrow mb-3">Add products</p>
            <div className="relative">
              <I.search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or scan SKU" className="h-11 w-full rounded-full border border-line bg-soft pr-4 pl-10 text-sm outline-none focus:border-ink/50" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map(({ p, v }) => {
                const inOrder = items.find((x) => x.variantId === v.id)?.qty ?? 0;
                const out = v.stock - inOrder <= 0 && !s.allowBackorder;
                return (
                  <button key={v.id} disabled={out} onClick={() => add(v.id)} className={cx("flex items-center gap-2 rounded-2xl border p-2 text-left transition disabled:opacity-40", inOrder ? "border-inverse" : "border-line hover:border-ink/40")}>
                    <Bottle product={p} label={false} className="h-11 w-auto shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted">
                        {v.sizeMl}ml · {money(v.price, s)}
                      </p>
                      <p className={cx("text-[10px]", v.stock <= v.reorderPoint ? "text-warn" : "text-muted")}>{v.stock} in stock</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-3">Customer</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["name", "Name *"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["country", "Country"],
                ] as [keyof Customer, string][]
              ).map(([k, label]) => (
                <Field key={k} label={label}>
                  <Input value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} />
                </Field>
              ))}
              <Field label="Note" className="sm:col-span-2">
                <Textarea className="min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <p className="eyebrow mb-3">Order</p>
            {items.length === 0 && <p className="py-6 text-center text-sm text-muted">No items yet</p>}
            {items.map((it) => {
              const f = findVariant(db, it.variantId)!;
              return (
                <div key={it.variantId} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{f.product.name}</p>
                    <p className="text-xs text-muted">
                      {f.variant.sizeMl}ml · {money(f.variant.price, s)}
                    </p>
                  </div>
                  <Stepper value={it.qty} min={0} max={s.allowBackorder ? 999 : f.variant.stock} onChange={(n) => setItems((xs) => (n <= 0 ? xs.filter((x) => x.variantId !== it.variantId) : xs.map((x) => (x.variantId === it.variantId ? { ...x, qty: n } : x))))} />
                </div>
              );
            })}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="Channel">
                <Select
                  value={channel}
                  onChange={(e) => {
                    const ch = e.target.value as Channel;
                    setChannel(ch);
                    setMethod(ch === "in-store" ? "in_store" : "card_on_delivery");
                    setFulfil(ch === "in-store" ? "delivered" : "confirmed");
                  }}
                >
                  <option value="in-store">In-store</option>
                  <option value="phone">Phone</option>
                  <option value="online">Online</option>
                </Select>
              </Field>
              <Field label="Payment">
                <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {(Object.keys(PAYMENT_LABEL) as PaymentMethod[])
                    .filter((m) => s.payments[m])
                    .map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_LABEL[m]}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={fulfil} onChange={(e) => setFulfil(e.target.value as OrderStatus)}>
                  {FLOW.map((f) => (
                    <option key={f} value={f} className="capitalize">
                      {f}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Promo code">
                <Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="—" className="uppercase" />
              </Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="size-4 accent-[var(--ink)]" /> Payment received
            </label>
            {channel !== "in-store" && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={freeShip} onChange={(e) => setFreeShip(e.target.checked)} className="size-4 accent-[var(--ink)]" /> Waive delivery fee
              </label>
            )}
            <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
              <Line k="Subtotal" v={money(q.subtotal, s)} />
              {q.discount > 0 && <Line k={`Promo ${q.promo?.code}`} v={`− ${money(q.discount, s)}`} />}
              <Line k="Delivery" v={money(q.shipping, s)} />
              <Line k="Tax" v={money(q.tax, s)} />
              <div className="flex justify-between pt-1 text-lg font-bold">
                <dt>Total</dt>
                <dd>{money(q.total, s)}</dd>
              </div>
            </dl>
            <Button size="lg" className="mt-4 w-full" onClick={submit}>
              Create order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
