import type { DB, Family, Collection, Product, Order, StockMovement, Settings, OrderStatus, PaymentMethod, Channel } from "./types";
import { r2 } from "./format";

/**
 * Defaults for Loris Perfume's shop in Tajikistan.
 * Prices are in somoni (TJS) and include VAT (14%), as is usual for retail.
 * Everything here is editable in Studio → Settings.
 */
export const defaultSettings: Settings = {
  brandName: "Loris Perfume",
  tagline: "Turkish perfumery, now in Dushanbe.",
  currency: "TJS",
  locale: "en-GB",
  taxRate: 14,
  taxInclusive: true,
  shippingFee: 25,
  freeShippingOver: 600,
  defaultReorderPoint: 5,
  skuPrefix: "LP",
  orderPrefix: "LP-",
  nextOrderNo: 1001,
  allowBackorder: false,
  storeOpen: true,
  showOutOfStock: true,
  announcement: "Free delivery in Dushanbe on orders over 600 TJS",
  theme: "light",
  accent: "#9A7440",
  requirePin: false,
  adminPin: "",
  lowStockAlerts: true,
  payments: { card_on_delivery: true, cash_on_delivery: true, bank_transfer: true, in_store: true },
  sizePresets: [30, 50, 100],
  promoCodes: [
    { code: "WELCOME10", percent: 10, active: true },
    { code: "NAVRUZ15", percent: 15, active: false },
  ],
  onboarded: false,
};

const families: Family[] = [
  { id: "fam-floral", name: "Floral", color: "#E3A9B7", description: "Rose, jasmine, peony and white flowers." },
  { id: "fam-woody", name: "Woody", color: "#8C6A4F", description: "Sandalwood, cedar, vetiver and oud." },
  { id: "fam-amber", name: "Amber", color: "#C98A3D", description: "Warm resins, vanilla and spices." },
  { id: "fam-fresh", name: "Fresh", color: "#8DBBC2", description: "Aquatic, green and airy." },
  { id: "fam-citrus", name: "Citrus", color: "#E2C04E", description: "Bergamot, neroli, lemon and mandarin." },
  { id: "fam-gourmand", name: "Gourmand", color: "#A86B5A", description: "Sweet notes: cacao, praline, tonka." },
  { id: "fam-leather", name: "Leather", color: "#4B3A33", description: "Suede, tobacco and smoky accords." },
];

const collections: Collection[] = [
  { id: "col-signature", name: "Signature", description: "The best-loved everyday scents." },
  { id: "col-private", name: "Private Collection", description: "Intense extraits with rare materials." },
  { id: "col-orient", name: "Orient", description: "Oud, spice and amber from the East." },
  { id: "col-fresh", name: "Fresh Line", description: "Light, bright scents for warm days." },
];

type Raw = [
  name: string,
  fam: string,
  col: string,
  conc: Product["concentration"],
  gender: Product["gender"],
  shape: Product["bottle"]["shape"],
  liquid: string,
  cap: string,
  price100: number,
  notes: [string, string, string],
  desc: string,
  flags: string,
];

// Sample catalogue: replace with the shop's real products in Studio → Products.
const raw: Raw[] = [
  ["Amber Oud", "fam-amber", "col-orient", "Eau de Parfum", "Unisex", "square", "#D89A4A", "#1A1A1A", 520, ["Saffron, Pink pepper", "Rose, Labdanum", "Oud, Vanilla, Amber"], "Warm amber and smoky oud that glows on skin for hours. Rich, velvety, made for evenings.", "fb"],
  ["Rose Velvet", "fam-floral", "col-signature", "Eau de Parfum", "Feminine", "round", "#F0C4C9", "#C9A46B", 450, ["Lychee, Bergamot", "Turkish rose, Peony", "White musk, Cashmere wood"], "A soft, dewy rose over clean musk. Romantic, light and easy to wear every day.", "fb"],
  ["Cedar Iris", "fam-woody", "col-signature", "Eau de Parfum", "Masculine", "tall", "#E9DCC2", "#2B2B2B", 480, ["Cardamom, Grapefruit", "Cedar, Iris", "Vetiver, Ambrette"], "Dry cedar and powdery iris. Crisp, elegant and quietly confident.", "b"],
  ["Neroli Light", "fam-citrus", "col-fresh", "Eau de Toilette", "Unisex", "tall", "#F4E7A8", "#C9A46B", 340, ["Neroli, Lemon", "Orange blossom", "Musk, Light woods"], "Sparkling neroli and orange blossom. Clean, sunny and perfect for summer.", "n"],
  ["Royal Oud", "fam-woody", "col-private", "Extrait", "Unisex", "facet", "#6B3F2A", "#C9A46B", 890, ["Saffron, Elemi", "Oud, Rose", "Leather, Patchouli"], "Our most intense extrait: aged oud, dark rose and soft leather. Long-lasting and bold.", "f"],
  ["Powder Iris", "fam-floral", "col-private", "Parfum", "Feminine", "facet", "#D9CDE6", "#C9A46B", 760, ["Aldehydes, Violet leaf", "Iris, Violet", "Suede, Tonka"], "Cool iris softened with suede. Refined, powdery and very elegant.", "n"],
  ["Green Tea", "fam-fresh", "col-fresh", "Eau de Toilette", "Unisex", "round", "#CFE0C3", "#2B2B2B", 320, ["Yuzu, Mint", "Green tea, Jasmine", "Moss, Musk"], "Fresh green tea with a touch of jasmine. Calm and clean.", ""],
  ["Spiced Dates", "fam-amber", "col-orient", "Eau de Parfum", "Unisex", "square", "#B8642E", "#1A1A1A", 540, ["Cinnamon, Cardamom", "Dates, Rose", "Tobacco, Benzoin"], "Warm spices, sweet dates and a hint of tobacco. Cosy and rich for winter.", "b"],
  ["Cocoa Tonka", "fam-gourmand", "col-signature", "Eau de Parfum", "Unisex", "round", "#7A4A36", "#C9A46B", 470, ["Bitter orange, Pink pepper", "Cacao, Praline", "Tonka, Sandalwood"], "Dark cacao and tonka bean. Sweet but never sugary.", "n"],
  ["Midnight Leather", "fam-leather", "col-private", "Extrait", "Masculine", "square", "#3A2A24", "#C9A46B", 820, ["Black pepper, Saffron", "Birch, Iris", "Suede, Amber"], "Smooth black leather with smoky birch and saffron.", ""],
  ["Sea Breeze", "fam-fresh", "col-fresh", "Eau de Toilette", "Masculine", "tall", "#BFD9E4", "#2B2B2B", 360, ["Sea salt, Lemon", "Sage, Lavender", "Driftwood, Ambergris"], "Salty air, citrus and driftwood. Fresh from morning to night.", "b"],
  ["Jasmine Night", "fam-floral", "col-orient", "Eau de Parfum", "Feminine", "round", "#F6EFD6", "#C9A46B", 490, ["Mandarin, Green leaves", "Jasmine, Tuberose", "Benzoin, Musk"], "Night-blooming jasmine and tuberose. Radiant and feminine.", "f"],
];

/** Price ladder relative to 100ml, rounded to the nearest 5 TJS. */
const SIZES: [number, number][] = [
  [30, 0.45],
  [50, 0.65],
  [100, 1],
];
const round5 = (n: number) => Math.round(n / 5) * 5;

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const CUSTOMERS: [string, string, string][] = [
  ["Farrukh Rahimov", "Dushanbe", "Rudaki Ave 45, apt 12"],
  ["Malika Saidova", "Dushanbe", "Ismoili Somoni St 18"],
  ["Dilnoza Karimova", "Khujand", "Lenin St 102"],
  ["Bakhtiyor Nazarov", "Dushanbe", "Bokhtar St 7"],
  ["Zarina Sharipova", "Dushanbe", "Ayni St 54, apt 3"],
  ["Shahzod Umarov", "Kulob", "Sino St 21"],
  ["Nigina Azimova", "Dushanbe", "Firdavsi St 9"],
  ["Rustam Davlatov", "Bokhtar", "Vahdat St 30"],
  ["Madina Yusufova", "Dushanbe", "Shotemur St 66"],
  ["Firuz Kholov", "Istaravshan", "Ferghana St 14"],
];

export function buildSeed(): DB {
  const rnd = seededRand(7);
  const now = Date.now();
  const products: Product[] = raw.map((r, i) => {
    const [name, fam, col, conc, gender, shape, liquid, cap, price100, notes, desc, flags] = r;
    const code = name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("");
    const id = `p-${i + 1}`;
    const variants = SIZES.filter(([ml]) => !(conc === "Extrait" && ml === 30)).map(([ml, f]) => {
      const price = round5(price100 * f);
      return {
        id: `${id}-v${ml}`,
        sizeMl: ml,
        sku: `LP-${code}-${ml}`,
        price,
        compareAt: i === 1 && ml === 100 ? round5(price * 1.15) : undefined,
        cost: r2(price * 0.42),
        stock: Math.floor(rnd() * 22) + 3,
        reorderPoint: 5,
        barcode: `869${String(4000000000 + i * 1000 + ml).padStart(10, "0")}`,
      };
    });
    // A few realistic stock problems for the demo.
    if (i === 6) variants[2].stock = 0;
    if (i === 9) variants[0].stock = 2;
    if (i === 2) variants[1].stock = 4;
    const created = new Date(now - (70 - i * 2) * 86400000).toISOString();
    return {
      id,
      name,
      collectionId: col,
      familyId: fam,
      concentration: conc,
      gender,
      description: desc,
      notes: { top: notes[0].split(", "), heart: notes[1].split(", "), base: notes[2].split(", ") },
      tags: [],
      status: "active",
      featured: flags.includes("f"),
      bestseller: flags.includes("b"),
      isNew: flags.includes("n"),
      bottle: { shape, liquid, cap },
      variants,
      createdAt: created,
      updatedAt: created,
    };
  });

  const s = defaultSettings;
  const movements: StockMovement[] = [];
  for (const p of products)
    for (const v of p.variants)
      movements.push({ id: `m-open-${v.id}`, productId: p.id, variantId: v.id, type: "receive", qty: 0, balance: v.stock, reason: "Opening stock", ref: "PO-0001", at: p.createdAt });

  const orders: Order[] = [];
  let no = s.nextOrderNo;
  const recent: OrderStatus[] = ["delivered", "delivered", "shipped", "packed", "confirmed", "pending", "pending", "cancelled"];
  const methods: PaymentMethod[] = ["cash_on_delivery", "card_on_delivery", "bank_transfer"];
  for (let k = 0; k < 40; k++) {
    const daysAgo = Math.max(0, Math.floor((1 - k / 40) * 40) - (rnd() < 0.5 ? 0 : 1));
    const at = new Date(now - daysAgo * 86400000 - Math.floor(rnd() * 30e6)).toISOString();
    const [name, city, address] = CUSTOMERS[Math.floor(rnd() * CUSTOMERS.length)];
    const pick = new Map<string, Order["items"][number]>();
    for (let n = 0; n < 1 + Math.floor(rnd() * 2.2); n++) {
      const p = products[Math.floor(rnd() * products.length)];
      const v = p.variants[Math.floor(rnd() * p.variants.length)];
      const ex = pick.get(v.id);
      if (ex) ex.qty++;
      else pick.set(v.id, { productId: p.id, variantId: v.id, name: p.name, sizeMl: v.sizeMl, sku: v.sku, price: v.price, qty: 1 });
    }
    const items = [...pick.values()];
    const channel: Channel = rnd() < 0.65 ? "online" : rnd() < 0.6 ? "in-store" : "phone";
    // Same pricing rules as checkout (VAT included, delivery not taxed).
    const subtotal = r2(items.reduce((a, it) => a + it.price * it.qty, 0));
    const shipping = channel === "in-store" || subtotal >= s.freeShippingOver ? 0 : s.shippingFee;
    const tax = r2(subtotal - subtotal / (1 + s.taxRate / 100));
    const total = r2(subtotal + shipping);
    const status: OrderStatus = daysAgo > 6 ? (rnd() < 0.07 ? "cancelled" : "delivered") : channel === "in-store" ? "delivered" : recent[Math.floor(rnd() * recent.length)];
    const method: PaymentMethod = channel === "in-store" ? "in_store" : methods[Math.floor(rnd() * methods.length)];
    const paid = status === "delivered" || (status !== "cancelled" && status !== "pending" && method === "bank_transfer");
    const id = `o-${k + 1}`;
    const number = `${s.orderPrefix}${no++}`;
    const flow: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const history: Order["history"] =
      status === "cancelled" ? [{ status: "pending", at }, { status: "cancelled", at }] : flow.slice(0, flow.indexOf(status) + 1).map((st) => ({ status: st, at }));
    orders.push({
      id,
      number,
      channel,
      customer: { name, email: name.toLowerCase().replace(" ", ".") + "@mail.tj", phone: `+992 9${Math.floor(rnd() * 9)} ${100 + k} ${String(10 + k).slice(-2)} ${String(40 + k).slice(-2)}`, address, city, country: "Tajikistan" },
      items,
      subtotal,
      discount: 0,
      shipping,
      tax,
      total,
      status,
      paymentStatus: paid ? "paid" : "unpaid",
      paymentMethod: method,
      note: "",
      createdAt: at,
      history,
    });
    for (const it of items) {
      movements.push({ id: `m-${id}-${it.variantId}`, productId: it.productId, variantId: it.variantId, type: "sale", qty: -it.qty, balance: 0, reason: `Order ${number}`, ref: number, at });
      if (status === "cancelled")
        movements.push({ id: `m-${id}-${it.variantId}-c`, productId: it.productId, variantId: it.variantId, type: "cancel", qty: it.qty, balance: 0, reason: `Order ${number} cancelled`, ref: number, at });
    }
  }

  // Opening receipt = current stock + net quantity sold since; then replay to get running balances.
  const net = new Map<string, number>();
  for (const m of movements) if (m.type !== "receive") net.set(m.variantId, (net.get(m.variantId) ?? 0) + m.qty);
  for (const m of movements) if (m.type === "receive") m.qty = m.balance - (net.get(m.variantId) ?? 0);
  movements.sort((a, b) => a.at.localeCompare(b.at) || (a.type === "receive" ? -1 : 1));
  const bal = new Map<string, number>();
  for (const m of movements) {
    const b = (bal.get(m.variantId) ?? 0) + m.qty;
    bal.set(m.variantId, b);
    m.balance = b;
  }
  movements.reverse();
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { version: 1, products, families, collections, movements, orders, settings: { ...s, nextOrderNo: no }, cart: [], wishlist: [], myOrders: [] };
}

export function emptyDB(settings: Settings): DB {
  return { version: 1, products: [], families, collections, movements: [], orders: [], settings: { ...settings, nextOrderNo: 1001 }, cart: [], wishlist: [], myOrders: [] };
}
