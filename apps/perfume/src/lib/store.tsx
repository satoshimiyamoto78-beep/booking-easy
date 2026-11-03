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
import { buildSeed, emptyDB } from "./seed";
import { uid } from "./format";

const KEY = "maison.db.v1";

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db && db.version === 1) {
        db.settings = { ...buildSeed().settings, ...db.settings };
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

export function findVariant(db: DB, variantId: ID): { product: Product; variant: Variant } | null {
  for (const product of db.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export function quote(db: DB, items: { variantId: ID; qty: number; price?: number }[], promoCode?: string, shippingOverride?: number) {
  const s = db.settings;
  const lines: OrderItem[] = [];
  for (const it of items) {
    const f = findVariant(db, it.variantId);
    if (!f || it.qty <= 0) continue;
    lines.push({
      productId: f.product.id,
      variantId: f.variant.id,
      name: f.product.name,
      sizeMl: f.variant.sizeMl,
      sku: f.variant.sku,
      price: it.price ?? f.variant.price,
      qty: it.qty,
    });
  }
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const promo = promoCode ? s.promoCodes.find((p) => p.active && p.code.toLowerCase() === promoCode.trim().toLowerCase()) : undefined;
  const discount = promo ? Math.round(subtotal * promo.percent) / 100 : 0;
  const net = subtotal - discount;
  const shipping = shippingOverride ?? (lines.length === 0 || (s.freeShippingOver > 0 && net >= s.freeShippingOver) ? 0 : s.shippingFee);
  const tax = s.taxInclusive ? Math.round((net - net / (1 + s.taxRate / 100)) * 100) / 100 : Math.round(net * s.taxRate) / 100;
  const total = Math.round((net + shipping + (s.taxInclusive ? 0 : tax)) * 100) / 100;
  return { lines, subtotal, discount, shipping, tax, total, promo };
}

function useStoreState() {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const skipSave = useRef(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  const toast = useCallback((text: string, tone: Toast["tone"] = "default") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // Persist
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      toast("Storage is full — remove large product photos or export a backup.", "error");
    }
  }, [db, toast]);

  // Sync between tabs (e.g. storefront in one tab, studio in another)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        skipSave.current = true;
        setDb(JSON.parse(e.newValue));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const move = (d: DB, variantId: ID, qty: number, type: MovementType, reason: string, ref?: string) => {
    const f = findVariant(d, variantId);
    if (!f) return;
    f.variant.stock += qty;
    d.movements.unshift({
      id: uid("m"),
      productId: f.product.id,
      variantId,
      type,
      qty,
      balance: f.variant.stock,
      reason,
      ref,
      at: new Date().toISOString(),
    });
  };

  const actions = useMemo(
    () => ({
      toast,
      updateSettings(patch: Partial<Settings>) {
        update((d) => {
          d.settings = { ...d.settings, ...patch };
        });
      },

      // ---------- Catalogue ----------
      saveProduct(p: Product, reason = "Manual edit") {
        update((d) => {
          const now = new Date().toISOString();
          const idx = d.products.findIndex((x) => x.id === p.id);
          const prev = idx >= 0 ? d.products[idx] : null;
          const next: Product = structuredClone({ ...p, updatedAt: now, createdAt: prev?.createdAt ?? now });
          // stock changes made in the editor are recorded as movements
          const targetStock = new Map(next.variants.map((v) => [v.id, v.stock]));
          next.variants = next.variants.map((v) => ({ ...v, stock: prev?.variants.find((pv) => pv.id === v.id)?.stock ?? 0 }));
          if (idx >= 0) d.products[idx] = next;
          else d.products.unshift(next);
          for (const v of next.variants) {
            const delta = (targetStock.get(v.id) ?? 0) - v.stock;
            if (delta !== 0) move(d, v.id, delta, prev?.variants.some((pv) => pv.id === v.id) ? "adjust" : "receive", prev ? reason : "Initial stock");
          }
        });
      },
      duplicateProduct(id: ID) {
        update((d) => {
          const p = d.products.find((x) => x.id === id);
          if (!p) return;
          const copy: Product = structuredClone(p);
          copy.id = uid("p-");
          copy.name = p.name + " (copy)";
          copy.status = "draft";
          copy.variants = copy.variants.map((v) => ({ ...v, id: uid("v-"), sku: v.sku + "-C", stock: 0 }));
          copy.createdAt = copy.updatedAt = new Date().toISOString();
          d.products.unshift(copy);
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
        });
      },

      // ---------- Stock ----------
      adjustStock(variantId: ID, qty: number, type: MovementType, reason: string, ref?: string) {
        update((d) => move(d, variantId, qty, type, reason, ref));
      },
      receiveBatch(lines: { variantId: ID; qty: number; cost?: number }[], ref: string, reason: string) {
        update((d) => {
          for (const l of lines) {
            if (l.qty <= 0) continue;
            move(d, l.variantId, l.qty, "receive", reason || "Stock received", ref);
            if (l.cost !== undefined && l.cost > 0) {
              const f = findVariant(d, l.variantId);
              if (f) f.variant.cost = l.cost;
            }
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

      // ---------- Cart / wishlist ----------
      addToCart(productId: ID, variantId: ID, qty = 1) {
        update((d) => {
          const l = d.cart.find((c) => c.variantId === variantId);
          if (l) l.qty += qty;
          else d.cart.push({ productId, variantId, qty });
        });
      },
      setCartQty(variantId: ID, qty: number) {
        update((d) => {
          if (qty <= 0) d.cart = d.cart.filter((c) => c.variantId !== variantId);
          else {
            const l = d.cart.find((c) => c.variantId === variantId);
            if (l) l.qty = qty;
          }
        });
      },
      clearCart() {
        update((d) => {
          d.cart = [];
        });
      },
      toggleWish(productId: ID) {
        update((d) => {
          d.wishlist = d.wishlist.includes(productId) ? d.wishlist.filter((w) => w !== productId) : [...d.wishlist, productId];
        });
      },

      // ---------- Orders ----------
      placeOrder(input: NewOrderInput): { ok: true; order: Order } | { ok: false; error: string } {
        // Validate against the current snapshot synchronously, then commit.
        const snapshot = dbRef.current;
        const q = quote(snapshot, input.items, input.promoCode, input.shipping);
        if (q.lines.length === 0) return { ok: false, error: "The order has no items." };
        if (!snapshot.settings.allowBackorder) {
          for (const l of q.lines) {
            const f = findVariant(snapshot, l.variantId);
            if (!f || f.variant.stock < l.qty)
              return { ok: false, error: `Only ${f?.variant.stock ?? 0} left of ${l.name} ${l.sizeMl}ml.` };
          }
        }
        const now = new Date().toISOString();
        const status = input.status ?? "pending";
        const order: Order = {
          id: uid("o-"),
          number: `${snapshot.settings.orderPrefix}${snapshot.settings.nextOrderNo}`,
          channel: input.channel,
          customer: input.customer,
          items: q.lines,
          subtotal: q.subtotal,
          discount: q.discount,
          shipping: q.shipping,
          tax: q.tax,
          total: q.total,
          status,
          paymentStatus: input.paymentStatus ?? "unpaid",
          paymentMethod: input.paymentMethod,
          note: input.note ?? "",
          createdAt: now,
          history: [
            { status: "pending", at: now, text: q.promo ? `Promo ${q.promo.code} applied (−${q.promo.percent}%)` : undefined },
            ...(status !== "pending" ? [{ status, at: now }] : []),
          ],
        };
        update((d) => {
          d.orders.unshift(order);
          d.settings.nextOrderNo += 1;
          for (const l of order.items) move(d, l.variantId, -l.qty, "sale", `Order ${order.number}`, order.number);
          if (input.fromCart) {
            d.cart = [];
            d.myOrders.unshift(order.id);
          }
        });
        return { ok: true, order };
      },
      setOrderStatus(id: ID, status: OrderStatus) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (!o || o.status === status || o.status === "cancelled") return;
          if (status === "cancelled") {
            for (const l of o.items) move(d, l.variantId, l.qty, "cancel", `Order ${o.number} cancelled`, o.number);
            if (o.paymentStatus === "paid") o.paymentStatus = "refunded";
          }
          if (status === "delivered" && o.paymentMethod !== "bank_transfer" && o.paymentStatus === "unpaid") o.paymentStatus = "paid";
          o.status = status;
          o.history.push({ status, at: new Date().toISOString() });
        });
      },
      setPaymentStatus(id: ID, ps: PaymentStatus) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (!o) return;
          o.paymentStatus = ps;
          o.history.push({ status: "payment", at: new Date().toISOString(), text: `Payment marked ${ps}` });
        });
      },
      returnItems(id: ID) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (!o) return;
          for (const l of o.items) move(d, l.variantId, l.qty, "return", `Return of ${o.number}`, o.number);
          o.paymentStatus = "refunded";
          o.history.push({ status: "note", at: new Date().toISOString(), text: "Items returned to stock & refunded" });
        });
      },
      addOrderNote(id: ID, text: string) {
        update((d) => {
          const o = d.orders.find((x) => x.id === id);
          if (o) o.history.push({ status: "note", at: new Date().toISOString(), text });
        });
      },

      // ---------- Data ----------
      importDB(next: DB) {
        setDb(next);
      },
      resetDemo() {
        setDb(buildSeed());
      },
      startEmpty() {
        setDb((d) => emptyDB({ ...d.settings, onboarded: true }));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast, update],
  );

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
export const totalStock = (p: Product) => p.variants.reduce((a, v) => a + v.stock, 0);
export const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
export const isLow = (v: Variant) => v.stock > 0 && v.stock <= v.reorderPoint;
export const isOut = (v: Variant) => v.stock <= 0;
export function stockState(p: Product): "in" | "low" | "out" {
  if (p.variants.every(isOut)) return "out";
  if (p.variants.some((v) => isLow(v) || isOut(v))) return "low";
  return "in";
}
