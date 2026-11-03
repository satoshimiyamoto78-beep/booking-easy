import type { DB, Family, Collection, Product, Order, StockMovement, Settings, OrderStatus, PaymentMethod } from "./types";

export const defaultSettings: Settings = {
  brandName: "Maison Aurelle",
  tagline: "Haute parfumerie, composed in small batches.",
  currency: "USD",
  locale: "en-US",
  taxRate: 8,
  taxInclusive: false,
  shippingFee: 12,
  freeShippingOver: 250,
  defaultReorderPoint: 6,
  skuPrefix: "MA",
  orderPrefix: "MA-",
  nextOrderNo: 1001,
  allowBackorder: false,
  storeOpen: true,
  showOutOfStock: true,
  announcement: "Complimentary samples with every order",
  theme: "light",
  accent: "#B8925A",
  requirePin: false,
  adminPin: "",
  lowStockAlerts: true,
  payments: { card_on_delivery: true, cash_on_delivery: true, bank_transfer: true, in_store: true },
  sizePresets: [30, 50, 100],
  promoCodes: [
    { code: "WELCOME10", percent: 10, active: true },
    { code: "VIP20", percent: 20, active: false },
  ],
  onboarded: false,
};

const families: Family[] = [
  { id: "fam-floral", name: "Floral", color: "#E7B8C3", description: "Rose, jasmine, tuberose and white petals." },
  { id: "fam-woody", name: "Woody", color: "#8C6A4F", description: "Sandalwood, cedar, vetiver and oud." },
  { id: "fam-amber", name: "Amber", color: "#C98A3D", description: "Warm resins, vanilla and spice." },
  { id: "fam-fresh", name: "Fresh", color: "#9CC5C9", description: "Aquatic, green and airy accords." },
  { id: "fam-citrus", name: "Citrus", color: "#E8C95A", description: "Bergamot, neroli, yuzu and mandarin." },
  { id: "fam-gourmand", name: "Gourmand", color: "#A86B5A", description: "Edible facets: cacao, praline, tonka." },
  { id: "fam-leather", name: "Leather", color: "#4B3A33", description: "Suede, birch tar and smoky florals." },
];

const collections: Collection[] = [
  { id: "col-signature", name: "Signature", description: "The founding compositions of the house." },
  { id: "col-atelier", name: "Atelier Privé", description: "Rare materials, numbered bottles." },
  { id: "col-voyages", name: "Les Voyages", description: "Olfactory postcards from far-away places." },
  { id: "col-cologne", name: "Cologne Absolue", description: "Bright, generous colognes for every day." },
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
  base: number,
  notes: [string, string, string],
  desc: string,
  flags: string,
];

const raw: Raw[] = [
  ["Ambre Nocturne", "fam-amber", "col-signature", "Eau de Parfum", "Unisex", "square", "#D89A4A", "#1A1A1A", 165, ["Pink pepper, Saffron", "Labdanum, Rose absolute", "Vanilla, Benzoin, Amber"], "A slow-burning amber that glows like candlelight on skin — resinous, velvety and quietly addictive.", "fb"],
  ["Rose Silencieuse", "fam-floral", "col-signature", "Eau de Parfum", "Feminine", "round", "#F0C4C9", "#C9A46B", 148, ["Lychee, Bergamot", "Turkish rose, Peony", "White musk, Cashmere wood"], "A whispered rose: dewy petals laid over soft musks, intimate and luminous.", "fb"],
  ["Cèdre Blanc", "fam-woody", "col-signature", "Eau de Parfum", "Masculine", "tall", "#E9DCC2", "#2B2B2B", 155, ["Cardamom, Grapefruit", "Atlas cedar, Iris", "Vetiver, Ambrette"], "Sun-bleached cedar and powdery iris — crisp, architectural, effortlessly elegant.", "b"],
  ["Néroli Lumière", "fam-citrus", "col-cologne", "Eau de Cologne", "Unisex", "tall", "#F4E7A8", "#C9A46B", 98, ["Neroli, Petitgrain", "Orange blossom", "Musk, Light woods"], "The first light on a Mediterranean terrace; sparkling, clean and generous.", "n"],
  ["Oud Impérial", "fam-woody", "col-atelier", "Extrait", "Unisex", "facet", "#6B3F2A", "#C9A46B", 320, ["Saffron, Elemi", "Cambodian oud, Rose", "Leather, Patchouli"], "A numbered extrait of aged oud, smoky rose and supple leather. Bold, regal, unforgettable.", "f"],
  ["Iris Poudré", "fam-floral", "col-atelier", "Parfum", "Feminine", "facet", "#D9CDE6", "#C9A46B", 260, ["Aldehydes, Carrot seed", "Orris butter, Violet", "Suede, Tonka"], "Cool orris butter softened by suede — the scent of a silk glove.", "n"],
  ["Thé Kyoto", "fam-fresh", "col-voyages", "Eau de Toilette", "Unisex", "round", "#CFE0C3", "#2B2B2B", 118, ["Yuzu, Shiso", "Green tea, Hinoki", "Moss, Musk"], "Steam rising from matcha in a cedar temple — serene and luminous.", ""],
  ["Marrakech Épicé", "fam-amber", "col-voyages", "Eau de Parfum", "Unisex", "square", "#B8642E", "#1A1A1A", 152, ["Cinnamon, Clove", "Rose, Date", "Tobacco, Labdanum"], "A souk at dusk: warm spices, dried fruit and smoky tobacco.", "b"],
  ["Cacao Velours", "fam-gourmand", "col-signature", "Eau de Parfum", "Unisex", "round", "#7A4A36", "#C9A46B", 142, ["Bitter orange, Pink pepper", "Cacao absolute, Praline", "Tonka, Sandalwood"], "Dark cacao folded into velvet tonka — decadent without the sugar.", "n"],
  ["Cuir de Minuit", "fam-leather", "col-atelier", "Extrait", "Masculine", "square", "#3A2A24", "#C9A46B", 285, ["Black pepper, Saffron", "Birch tar, Iris", "Suede, Amber"], "Supple black leather and smoky birch, lit by a glint of saffron.", ""],
  ["Brise Marine", "fam-fresh", "col-cologne", "Eau de Toilette", "Masculine", "tall", "#BFD9E4", "#2B2B2B", 104, ["Sea salt, Lemon", "Seaweed, Sage", "Driftwood, Ambergris"], "Salt on warm skin, a linen shirt and the endless horizon.", "b"],
  ["Jasmin Sambac", "fam-floral", "col-voyages", "Eau de Parfum", "Feminine", "round", "#F6EFD6", "#C9A46B", 158, ["Mandarin, Green leaves", "Jasmine sambac, Tuberose", "Benzoin, Musk"], "Night-blooming jasmine garlands, heady and radiant.", "f"],
];

const SIZES: [number, number][] = [
  [30, 0.52],
  [50, 0.75],
  [100, 1],
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildSeed(): DB {
  const rnd = seededRand(42);
  const now = Date.now();
  const products: Product[] = raw.map((r, i) => {
    const [name, fam, col, conc, gender, shape, liquid, cap, base, notes, desc, flags] = r;
    const code = name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("");
    const id = `p-${i + 1}`;
    const variants = SIZES.filter(([ml]) => !(conc === "Extrait" && ml === 30)).map(([ml, f], vi) => {
      const price = Math.round(base * f);
      const stock = Math.floor(rnd() * 34) + (i % 5 === 3 && vi === 0 ? 0 : 2);
      return {
        id: `${id}-v${ml}`,
        sizeMl: ml,
        sku: `MA-${code}-${ml}`,
        price,
        compareAt: i === 1 && ml === 100 ? Math.round(price * 1.15) : undefined,
        cost: Math.round(price * 0.32),
        stock: i === 9 && ml === 50 ? 3 : i === 6 && ml === 100 ? 0 : stock,
        reorderPoint: 6,
        barcode: `30${String(1000000000 + i * 1000 + ml).slice(0, 11)}`,
      };
    });
    const created = new Date(now - (70 - i * 2) * 86400000).toISOString();
    return {
      id,
      name,
      collectionId: col,
      familyId: fam,
      concentration: conc,
      gender,
      description: desc,
      notes: {
        top: notes[0].split(", "),
        heart: notes[1].split(", "),
        base: notes[2].split(", "),
      },
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

  const movements: StockMovement[] = [];
  // Opening stock receipts
  for (const p of products)
    for (const v of p.variants)
      movements.push({
        id: `m-open-${v.id}`,
        productId: p.id,
        variantId: v.id,
        type: "receive",
        qty: v.stock,
        balance: v.stock,
        reason: "Opening stock",
        ref: "PO-0001",
        at: p.createdAt,
      });

  const names = [
    ["Léa Martin", "Paris", "France"],
    ["Omar Haddad", "Dubai", "UAE"],
    ["Sofia Rossi", "Milan", "Italy"],
    ["James Carter", "London", "UK"],
    ["Aiko Tanaka", "Tokyo", "Japan"],
    ["Camille Dubois", "Lyon", "France"],
    ["Noah Fischer", "Berlin", "Germany"],
    ["Amira Nasser", "Doha", "Qatar"],
    ["Elena Petrova", "Vienna", "Austria"],
    ["Lucas Silva", "Lisbon", "Portugal"],
  ];
  const orders: Order[] = [];
  let no = defaultSettings.nextOrderNo;
  const statuses: OrderStatus[] = ["delivered", "delivered", "delivered", "shipped", "packed", "confirmed", "pending", "cancelled"];
  const methods: PaymentMethod[] = ["card_on_delivery", "bank_transfer", "cash_on_delivery", "in_store"];
  for (let k = 0; k < 34; k++) {
    const daysAgo = Math.floor((1 - k / 34) * 27) + (rnd() < 0.5 ? 0 : 1);
    const at = new Date(now - daysAgo * 86400000 - Math.floor(rnd() * 36e6)).toISOString();
    const n = names[Math.floor(rnd() * names.length)];
    const items = Array.from({ length: 1 + Math.floor(rnd() * 2.2) }, () => {
      const p = products[Math.floor(rnd() * products.length)];
      const v = p.variants[Math.floor(rnd() * p.variants.length)];
      return { productId: p.id, variantId: v.id, name: p.name, sizeMl: v.sizeMl, sku: v.sku, price: v.price, qty: 1 + (rnd() < 0.15 ? 1 : 0) };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const shipping = subtotal >= defaultSettings.freeShippingOver ? 0 : defaultSettings.shippingFee;
    const tax = Math.round(subtotal * defaultSettings.taxRate) / 100;
    const status = daysAgo > 6 ? (rnd() < 0.08 ? "cancelled" : "delivered") : statuses[Math.floor(rnd() * statuses.length)];
    const channel = rnd() < 0.7 ? "online" : rnd() < 0.5 ? "in-store" : "phone";
    const id = `o-${k + 1}`;
    const number = `${defaultSettings.orderPrefix}${no++}`;
    orders.push({
      id,
      number,
      channel,
      customer: {
        name: n[0],
        email: n[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(" ", ".") + "@example.com",
        phone: "+1 555 0" + String(100 + k).padStart(3, "0"),
        address: `${10 + k} Rue des Fleurs`,
        city: n[1],
        country: n[2],
      },
      items,
      subtotal,
      discount: 0,
      shipping,
      tax,
      total: subtotal + shipping + tax,
      status,
      paymentStatus: status === "cancelled" ? "unpaid" : status === "pending" ? "unpaid" : "paid",
      paymentMethod: channel === "in-store" ? "in_store" : methods[Math.floor(rnd() * 3)],
      note: "",
      createdAt: at,
      history: [{ status: "pending", at }, ...(status !== "pending" ? [{ status, at }] : [])],
    });
    // Historic sales come out of an earlier, larger stock receipt so current stock stays as seeded.
    for (const it of items) {
      movements.push({
        id: `m-${id}-${it.variantId}`,
        productId: it.productId,
        variantId: it.variantId,
        type: "sale",
        qty: -it.qty,
        balance: products.find((p) => p.id === it.productId)!.variants.find((v) => v.id === it.variantId)!.stock,
        reason: `Order ${number}`,
        ref: number,
        at,
      });
      if (status === "cancelled")
        movements.push({
          id: `m-${id}-${it.variantId}-c`,
          productId: it.productId,
          variantId: it.variantId,
          type: "cancel",
          qty: it.qty,
          balance: products.find((p) => p.id === it.productId)!.variants.find((v) => v.id === it.variantId)!.stock,
          reason: `Order ${number} cancelled`,
          ref: number,
          at,
        });
    }
  }
  // Opening receipt = current stock + everything sold since, then replay to get running balances.
  const net = new Map<string, number>();
  for (const m of movements) if (m.type !== "receive") net.set(m.variantId, (net.get(m.variantId) ?? 0) + m.qty);
  for (const m of movements) if (m.type === "receive") m.qty = m.balance - (net.get(m.variantId) ?? 0);
  movements.sort((a, b) => a.at.localeCompare(b.at));
  const bal = new Map<string, number>();
  for (const m of movements) {
    const b = (bal.get(m.variantId) ?? 0) + m.qty;
    bal.set(m.variantId, b);
    m.balance = b;
  }
  movements.reverse();
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    version: 1,
    products,
    families,
    collections,
    movements,
    orders,
    settings: { ...defaultSettings, nextOrderNo: no },
    cart: [],
    wishlist: [],
    myOrders: [],
  };
}

export function emptyDB(settings: Settings): DB {
  return {
    version: 1,
    products: [],
    families,
    collections: [],
    movements: [],
    orders: [],
    settings: { ...settings, nextOrderNo: 1001 },
    cart: [],
    wishlist: [],
    myOrders: [],
  };
}
