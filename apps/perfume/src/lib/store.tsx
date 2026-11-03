import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  Channel,
  Customer,
  DB,
  ID,
  MovementType,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Settings,
  Variant,
} from "./types";
import { buildSeed, defaultSettings, emptyDB } from "./seed";
import { r2, uid } from "./format";

const KEY = "loris.db.v1";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db && db.version === 1 && Array.isArray(db.products)) {
        db.settings = { ...defaultSettings, ...db.settings, payments: { ...defaultSettings.payments, ...db.settings?.payments } };
        db.cart ??= [];
        db.wishlist ??= [];
        db.myOrders ??= [];
        return db;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return buildSeed();
}

export interface Toast {
  id: string;
  text: string;
  tone: "default" | "success" | "error";
}

export interface NewOrderInput {
  customer: Customer;
  items: { variantId: ID; qty: number; price?: number }[];
  channel: Channel;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  note?: string;
  promoCode?: string;
  shipping?: number;
  fromCart?: boolean;
}

type Result = { ok: true } | { ok: false; error: string };

export function findVariant(db: DB, variantId: ID): { product: Product; variant: Variant } | null {
  for (const product of db.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

/** Merge duplicate lines for the same size so stock checks see the full quantity. */
function mergeLines(items: { variantId: ID; qty: number; price?: number }[]) {
  const map = new Map<ID, { variantId: ID; qty: number; price?: number }>();
  for (const it of items) {
    const q = Math.floor(it.qty);
    if (!(q > 0)) continue;
    const ex = map.get(it.variantId);
    if (ex) ex.qty += q;
    else map.set(it.variantId, { ...it, qty: q });
  }
  return [...map.values()];
}

/**
 * Price an order. All amounts are rounded to 2 decimals at each step so the
 * total always equals the sum of the rows shown to the customer.
 * - Discount applies to the merchandise subtotal only.
 * - Free-delivery threshold is checked against the discounted subtotal.
 * - Inclusive tax (VAT) is extracted from the discounted subtotal; exclusive tax is added on top.
 *   Delivery is not taxed.
 */
export function quote(db: DB, items: { variantId: ID; qty: number; price?: number }[], promoCode?: string, shippingOverride?: number) {
  const s = db.settings;
  const lines: OrderItem[] = [];
  for (const it of mergeLines(items)) {
    const f = findVariant(db, it.variantId);
    if (!f) continue;
    lines.push({
      productId: f.product.id,
      variantId: f.variant.id,
      name: f.product.name,
      sizeMl: f.variant.sizeMl,
      sku: f.variant.sku,
      price: r2(it.price ?? f.variant.price),
      qty: it.qty,
    });
  }
  const subtotal = r2(lines.reduce((a, l) => a + l.price * l.qty, 0));
  const code = promoCode?.trim().toLowerCase();
  const promo = code ? s.promoCodes.find((p) => p.active && p.code.toLowerCase() === code) : undefined;
  const discount = promo ? r2((subtotal * Math.min(100, Math.max(0, promo.percent))) / 100) : 0;
  const net = r2(subtotal - discount);
  const shipping = r2(shippingOverride ?? (lines.length === 0 || (s.freeShippingOver > 0 && net >= s.freeShippingOver) ? 0 : s.shippingFee));
  const rate = Math.max(0, s.taxRate) / 100;
  const tax = s.taxInclusive ? r2(net - net / (1 + rate)) : r2(net * rate);
  const total = r2(net + shipping + (s.taxInclusive ? 0 : tax));
  return { lines, subtotal, discount, net, shipping, tax, total, promo, units: lines.reduce((a, l) => a + l.qty, 0) };
}

/** VAT row label for a saved order — inferred from its own totals so it stays right if settings change later. */
export const vatLabel = (o: Pick<Order, "total" | "subtotal" | "discount" | "shipping">, rate: number) =>
  Math.abs(o.total - (o.subtotal - o.discount + o.shipping)) < 0.01 ? `incl. VAT` : `VAT (${rate}%)`;

/** An order counts towards sales unless it was cancelled or fully refunded. */
export const countsAsSale = (o: Order) => o.status !== "cancelled" && o.paymentStatus !== "refunded";

const FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];

function useStoreState() {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const skipSave = useRef(false);
  // Source of truth for synchronous reads inside actions, so several actions
  // fired in one event (or quickly in a row) always build on each other.
  const dbRef = useRef(db);

  const toast = useCallback((text: string, tone: Toast["tone"] = "default") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      toast("Storage is full. Remove large product photos or download a backup.", "error");
    }
  }, [db, toast]);

  // Keep several open tabs (shop + Studio) in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as DB;
        skipSave.current = true;
        dbRef.current = next;
        setDb(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback(<T,>(fn: (d: DB) => T): T => {
    const next = structuredClone(dbRef.current);
    const out = fn(next);
    dbRef.current = next;
    setDb(next);
    return out;
  }, []);

  const actions = useMemo(() => {
    const move = (d: DB, variantId: ID, qty: number, type: MovementType, reason: string, ref?: string) => {
      const f = findVariant(d, variantId);
      if (!f || qty === 0) return;
      f.variant.stock += qty;
      d.movements.unshift({ id: uid("m"), productId: f.product.id, variantId, type, qty, balance: f.variant.stock, reason, ref, at: new Date().toISOString() });
    };

    return {
      toast,
      updateSettings(patch: Partial<Settings>) {
        update((d) => {
          d.settings = { ...d.settings, ...patch };
        });
      },

      // ---------- Catalogue ----------
      /**
       * Save a product. `stockDelta` holds the change the user typed in the editor
       * for each existing size; it is applied to the *live* stock so sales made while
       * the editor was open are never overwritten. New sizes use their stock as opening stock.
       */
      saveProduct(p: Product, stockDelta: Record<ID, number> = {}) {
        update((d) => {
          const now = new Date().toISOString();
          const idx = d.products.findIndex((x) => x.id === p.id);
          const prev = idx >= 0 ? d.products[idx] : null;
          const next: Product = structuredClone({ ...p, updatedAt: now, createdAt: prev?.createdAt || now });
          const opening = new Map<ID, number>();
          next.variants = next.variants.map((v) => {
            const live = prev?.variants.find((pv) => pv.id === v.id);
            if (!live) opening.set(v.id, Math.max(0, Math.floor(v.stock)));
            return { ...v, stock: live ? live.stock : 0 };
          });
          // Sizes removed in the editor: write their remaining stock off so the ledger balances.
          for (const old of prev?.variants ?? []) {
            if (!next.variants.some((v) => v.id === old.id) && old.stock !== 0) {
              d.movements.unshift({ id: uid("m"), productId: p.id, variantId: old.id, type: "adjust", qty: -old.stock, balance: 0, reason: `Size ${old.sizeMl}ml removed`, at: now });
            }
          }
          if (idx >= 0) d.products[idx] = next;
          else d.products.unshift(next);
          for (const v of next.variants) {
            if (opening.has(v.id)) move(d, v.id, opening.get(v.id)!, "receive", "Opening stock");
            else if (stockDelta[v.id]) move(d, v.id, Math.trunc(stockDelta[v.id]), "adjust", "Edited in product editor");
          }
          const ids = new Set(d.products.flatMap((x) => (x.status === "active" ? x.variants.map((v) => v.id) : [])));
          d.cart = d.cart.filter((c) => ids.has(c.variantId));
        });
      },
      setReorderPointAll(value: number) {
        update((d) => {
          for (const p of d.products) for (const v of p.variants) v.reorderPoint = Math.max(0, Math.floor(value));
        });
      },
      duplicateProduct(id: ID) {
        return update((d) => {
          const p = d.products.find((x) => x.id === id);
          if (!p) return null;
          const copy: Product = structuredClone(p);
          copy.id = uid("p-");
          copy.name = p.name + " (copy)";
          copy.status = "draft";
          copy.variants = copy.variants.map((v) => ({ ...v, id: uid("v-"), sku: v.sku + "-C", stock: 0, barcode: "" }));
          copy.createdAt = copy.updatedAt = new Date().toISOString();
          d.products.unshift(copy);
          return copy.id;
        });
      },
      deleteProduct(id: ID) {
        update((d) => {
          d.products = d.products.filter((p) => p.id !== id);
          d.cart = d.cart.filter((c) => c.productId !== id);
          d.wishlist = d.wishlist.filter((w) => w !== id);
        });
      },
      setProductStatus(ids: ID[], status: Product["status"]) {
        update((d) => {
          for (const p of d.products) if (ids.includes(p.id)) p.status = status;
          if (status !== "active") d.cart = d.cart.filter((c) => !ids.includes(c.productId));
        });
      },

      // ---------- Stock ----------
      adjustStock(variantId: ID, qty: number, type: MovementType, reason: string, ref?: string): Result {
        const cur = findVariant(dbRef.current, variantId);
        if (!cur) return { ok: false, error: "This size no longer exists." };
        if (!dbRef.current.settings.allowBackorder && cur.variant.stock + qty < 0)
          return { ok: false, error: `Only ${cur.variant.stock} in stock. Turn on backorders in Settings to go below zero.` };
        update((d) => move(d, variantId, Math.trunc(qty), type, reason, ref));
        return { ok: true };
      },
      receiveBatch(lines: { variantId: ID; qty: number; cost?: number }[], ref: string, reason: string) {
        update((d) => {
          for (const l of mergeLines(lines.map((x) => ({ ...x, price: x.cost })))) {
            const f = findVariant(d, l.variantId);
            if (!f) continue;
            // Weighted average cost keeps stock value accurate across purchase prices.
            if (l.price !== undefined && l.price > 0) {
              const on = Math.max(0, f.variant.stock);
              f.variant.cost = on > 0 ? r2((on * f.variant.cost + l.qty * l.price) / (on + l.qty)) : r2(l.price);
            }
            move(d, l.variantId, l.qty, "receive", reason || "Stock received", ref || undefined);
          }
        });
      },

      // ---------- Taxonomy ----------
      saveFamily(f: DB["families"][number]) {
        update((d) => {
          const i = d.families.findIndex((x) => x.id === f.id);
          if (i >= 0) d.families[i] = f;
          else d.families.push(f);
        });
      },
      deleteFamily(id: ID) {
        update((d) => {
          d.families = d.families.filter((f) => f.id !== id);
          for (const p of d.products) if (p.familyId === id) p.familyId = null;
        });
      },
      saveCollection(c: DB["collections"][number]) {
        update((d) => {
          const i = d.collections.findIndex((x) => x.id === c.id);
          if (i >= 0) d.collections[i] = c;
          else d.collections.push(c);
        });
      },
      deleteCollection(id: ID) {
        update((d) => {
          d.collections = d.collections.filter((f) => f.id !== id);
          for (const p of d.products) if (p.collectionId === id) p.collectionId = null;
        });
      },

      // ---------- Bag / wishlist ----------
      /** Adds to the bag, capped at available stock. Returns how many were actually added. */
      addToCart(productId: ID, variantId: ID, qty = 1) {
        return update((d) => {
          const f = findVariant(d, variantId);
          if (!f || f.product.status !== "active") return 0;
          const line = d.cart.find((c) => c.variantId === variantId);
          const have = line?.qty ?? 0;
          const max = d.settings.allowBackorder ? 99 : Math.max(0, f.variant.stock);
          const add = Math.max(0, Math.min(qty, max - have));
          if (add === 0) return 0;
          if (line) line.qty += add;
          else d.cart.push({ productId, variantId, qty: add });
          return add;
        });
      },
      setCartQty(variantId: ID, qty: number) {
        update((d) => {
          if (qty <= 0) d.cart = d.cart.filter((c) => c.variantId !== variantId);
          else {
            const l = d.cart.find((c) => c.variantId === variantId);
            if (l) l.qty = Math.floor(qty);
          }
        });
      },
      toggleWish(productId: ID) {
        update((d) => {
          d.wishlist = d.wishlist.includes(productId) ? d.wishlist.filter((w) => w !== productId) : [...d.wishlist, productId];
        });
      },

      // ---------- Orders ----------
      placeOrder(input: NewOrderInput): { ok: true; order: Order } | { ok: false; error: string } {
        const snap = dbRef.current;
        const merged = mergeLines(input.items);
        if (merged.length === 0) return { ok: false, error: "The order has no items." };
        for (const l of merged) {
          const f = findVariant(snap, l.variantId);
          if (!f) return { ok: false, error: "A product in this order is no longer available." };
          if (f.product.status !== "active") return { ok: false, error: `${f.product.name} is not on sale right now.` };
          if (!snap.settings.allowBackorder && f.variant.stock < l.qty)
            return { ok: false, error: f.variant.stock > 0 ? `Only ${f.variant.stock} left of ${f.product.name} ${f.variant.sizeMl}ml.` : `${f.product.name} ${f.variant.sizeMl}ml is sold out.` };
        }
        if (input.channel === "online" && !snap.settings.storeOpen) return { ok: false, error: "Online ordering is paused." };
        const q = quote(snap, merged, input.promoCode, input.shipping);
        const order = update((d) => {
          const now = new Date().toISOString();
          const status = input.status ?? "pending";
          const reached = FLOW.slice(1, Math.max(1, FLOW.indexOf(status) + 1));
          const o: Order = {
            id: uid("o-"),
            number: `${d.settings.orderPrefix}${d.settings.nextOrderNo}`,
            channel: input.channel,
            customer: { ...input.customer, name: input.customer.name.trim() },
            items: q.lines,
            subtotal: q.subtotal,
            discount: q.discount,
            shipping: q.shipping,
            tax: q.tax,
            total: q.total,
            status,
            paymentStatus: input.paymentStatus ?? "unpaid",
            paymentMethod: input.paymentMethod,
            note: input.note?.trim() ?? "",
            createdAt: now,
            history: [
              { status: "pending", at: now, text: q.promo ? `Promo ${q.promo.code} applied (−${q.promo.percent}%)` : undefined },
              ...reached.map((st) => ({ status: st, at: now })),
              ...(input.paymentStatus === "paid" ? [{ status: "payment" as const, at: now, text: "Paid at checkout" }] : []),
            ],
          };
          d.orders.unshift(o);
          d.settings.nextOrderNo += 1;
          for (const l of o.items) move(d, l.variantId, -l.qty, "sale", `Order ${o.number}`, o.number);
          if (input.fromCart) {
            d.cart = [];
            d.myOrders.unshift(o.id);
          }
          return o;
        });
        return { ok: true, order };
      },
      /** Moves an order forward (or cancels it). Cancelling restocks; delivered orders are returned instead. */
      setOrderStatus(id: ID, status: OrderStatus): Result {
        const o = dbRef.current.orders.find((x) => x.id === id);
        if (!o) return { ok: false, error: "Order not found." };
        if (o.status === "cancelled") return { ok: false, error: "This order is cancelled." };
        if (status === "cancelled" && o.status === "delivered") return { ok: false, error: "Delivered orders are returned, not cancelled." };
        if (status !== "cancelled" && FLOW.indexOf(status) <= FLOW.indexOf(o.status)) return { ok: false, error: "Orders only move forward." };
        update((d) => {
          const x = d.orders.find((y) => y.id === id)!;
          const now = new Date().toISOString();
          if (status === "cancelled") {
            for (const l of x.items) move(d, l.variantId, l.qty, "cancel", `Order ${x.number} cancelled`, x.number);
            if (x.paymentStatus === "paid") x.paymentStatus = "refunded";
            x.history.push({ status, at: now });
          } else {
            // Record every step skipped so the timeline stays complete.
            for (const st of FLOW.slice(FLOW.indexOf(x.status) + 1, FLOW.indexOf(status) + 1)) x.history.push({ status: st, at: now });
            if (status === "delivered" && x.paymentStatus === "unpaid" && x.paymentMethod !== "bank_transfer") {
              x.paymentStatus = "paid";
              x.history.push({ status: "payment", at: now, text: "Paid on delivery" });
            }
          }
          x.status = status;
        });
        return { ok: true };
      },
      setPaymentStatus(id: ID, ps: PaymentStatus) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (!o || o.paymentStatus === ps) return;
          o.paymentStatus = ps;
          o.history.push({ status: "payment", at: new Date().toISOString(), text: `Payment marked ${ps}` });
        });
      },
      returnItems(id: ID): Result {
        const o = dbRef.current.orders.find((x) => x.id === id);
        if (!o || o.status !== "delivered") return { ok: false, error: "Only delivered orders can be returned." };
        if (o.returned) return { ok: false, error: "This order was already returned." };
        update((d) => {
          const x = d.orders.find((y) => y.id === id)!;
          for (const l of x.items) move(d, l.variantId, l.qty, "return", `Return of ${x.number}`, x.number);
          x.returned = true;
          x.paymentStatus = "refunded";
          x.history.push({ status: "note", at: new Date().toISOString(), text: "Items returned to stock and refunded" });
        });
        return { ok: true };
      },
      addOrderNote(id: ID, text: string) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (o) o.history.push({ status: "note", at: new Date().toISOString(), text });
        });
      },

      // ---------- Data ----------
      importDB(next: DB) {
        update((d) => Object.assign(d, next));
      },
      resetDemo() {
        update((d) => Object.assign(d, buildSeed(), { settings: { ...buildSeed().settings, onboarded: true } }));
      },
      startEmpty() {
        update((d) => Object.assign(d, emptyDB({ ...d.settings, onboarded: true })));
      },
    };
  }, [toast, update]);

  return { db, toasts, ...actions };
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

// ---------- Derived helpers ----------
export const totalStock = (p: Product) => p.variants.reduce((a, v) => a + Math.max(0, v.stock), 0);
export const minPrice = (p: Product) => (p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0);
export const isLow = (v: Variant) => v.stock > 0 && v.stock <= v.reorderPoint;
export const isOut = (v: Variant) => v.stock <= 0;
/** Product-level stock: "low" only when no size is comfortably stocked. */
export function stockState(p: Product): "in" | "low" | "out" {
  if (p.variants.length === 0 || p.variants.every(isOut)) return "out";
  if (p.variants.every((v) => isLow(v) || isOut(v))) return "low";
  return "in";
}
/** Needs attention in Studio: any size low or out. */
export const needsRestock = (p: Product) => p.variants.some((v) => isLow(v) || isOut(v));
/** Suggested reorder quantity: bring stock back up to 3× the reorder point. */
export const suggestedReorder = (v: Variant) => Math.max(0, v.reorderPoint * 3 - Math.max(0, v.stock));
