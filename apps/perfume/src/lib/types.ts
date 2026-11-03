export type ID = string;

export type Concentration = "Extrait" | "Parfum" | "Eau de Parfum" | "Eau de Toilette" | "Eau de Cologne";
export type Gender = "Feminine" | "Masculine" | "Unisex";
export type ProductStatus = "active" | "draft" | "archived";
export type BottleShape = "square" | "round" | "tall" | "facet";

export interface Variant {
  id: ID;
  sizeMl: number;
  sku: string;
  price: number;
  compareAt?: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  barcode?: string;
}

export interface Product {
  id: ID;
  name: string;
  collectionId: ID | null;
  familyId: ID | null;
  concentration: Concentration;
  gender: Gender;
  description: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  tags: string[];
  status: ProductStatus;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  bottle: { shape: BottleShape; liquid: string; cap: string };
  image?: string;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: ID;
  name: string;
  color: string;
  description: string;
}

export interface Collection {
  id: ID;
  name: string;
  description: string;
}

export type MovementType = "receive" | "sale" | "adjust" | "return" | "cancel" | "damage";

export interface StockMovement {
  id: ID;
  productId: ID;
  variantId: ID;
  type: MovementType;
  qty: number; // signed delta
  balance: number; // stock after movement
  reason: string;
  ref?: string;
  at: string;
}

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "card_on_delivery" | "cash_on_delivery" | "bank_transfer" | "in_store";
export type Channel = "online" | "in-store" | "phone";

export interface OrderItem {
  productId: ID;
  variantId: ID;
  name: string;
  sizeMl: number;
  sku: string;
  price: number;
  qty: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface Order {
  id: ID;
  number: string;
  channel: Channel;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: string;
  history: { status: OrderStatus | "note" | "payment"; at: string; text?: string }[];
}

export interface Settings {
  brandName: string;
  tagline: string;
  currency: string;
  locale: string;
  taxRate: number; // percent
  taxInclusive: boolean;
  shippingFee: number;
  freeShippingOver: number;
  defaultReorderPoint: number;
  skuPrefix: string;
  orderPrefix: string;
  nextOrderNo: number;
  allowBackorder: boolean;
  storeOpen: boolean;
  showOutOfStock: boolean;
  announcement: string;
  theme: "light" | "dark" | "system";
  accent: string;
  requirePin: boolean;
  adminPin: string;
  lowStockAlerts: boolean;
  payments: Record<PaymentMethod, boolean>;
  sizePresets: number[];
  promoCodes: { code: string; percent: number; active: boolean }[];
  onboarded: boolean;
}

export interface CartLine {
  variantId: ID;
  productId: ID;
  qty: number;
}

export interface DB {
  version: 1;
  products: Product[];
  families: Family[];
  collections: Collection[];
  movements: StockMovement[];
  orders: Order[];
  settings: Settings;
  cart: CartLine[];
  wishlist: ID[];
  myOrders: ID[];
}
