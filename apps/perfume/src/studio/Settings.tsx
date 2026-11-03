import { useRef, useState, type ReactNode } from "react";
import { I } from "../components/icons";
import { ask, Button, Card, Field, Input, Modal, Select, Toggle, cx } from "../components/ui";
import { useStore } from "../lib/store";
import { downloadFile, money } from "../lib/format";
import type { DB, PaymentMethod, Settings as S } from "../lib/types";
import { PAYMENT_LABEL } from "../shop/Bag";
import { PageHead } from "./StudioLayout";

type Section = "brand" | "pricing" | "delivery" | "payments" | "inventory" | "orders" | "promos" | "appearance" | "security" | "data";

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SAR", "QAR", "CHF", "JPY", "CAD", "AUD", "TJS", "RUB", "KZT", "TRY", "INR"];
const LOCALES = [
  ["en-US", "English (US)"],
  ["en-GB", "English (UK)"],
  ["fr-FR", "Français"],
  ["de-DE", "Deutsch"],
  ["it-IT", "Italiano"],
  ["ar-AE", "العربية"],
  ["ru-RU", "Русский"],
  ["ja-JP", "日本語"],
];
const ACCENTS = ["#B8925A", "#9E1B32", "#3B5B4A", "#2F3E66", "#8A6E9E", "#111111"];

export function Settings() {
  const { db, updateSettings, toast } = useStore();
  const s = db.settings;
  const [open, setOpen] = useState<Section | null>(null);
  const [draft, setDraft] = useState<S>(s);

  const show = (k: Section) => {
    setDraft(structuredClone(s));
    setOpen(k);
  };
  const save = () => {
    if (draft.requirePin && !/^\d{4,6}$/.test(draft.adminPin)) return toast("PIN must be 4–6 digits.", "error");
    updateSettings(draft);
    toast("Settings saved", "success");
    setOpen(null);
  };
  const d = <K extends keyof S>(k: K, v: S[K]) => setDraft((x) => ({ ...x, [k]: v }));

  const groups: { title: string; items: { k: Section; icon: ReactNode; label: string; sub: string }[] }[] = [
    {
      title: "Boutique",
      items: [
        { k: "brand", icon: <I.store size={18} />, label: "Brand & storefront", sub: s.storeOpen ? "Open for orders" : "Ordering paused" },
        { k: "appearance", icon: <I.sparkle size={18} />, label: "Appearance", sub: `${s.theme} theme` },
      ],
    },
    {
      title: "Commerce",
      items: [
        { k: "pricing", icon: <I.percent size={18} />, label: "Currency & tax", sub: `${s.currency} · ${s.taxRate}% ${s.taxInclusive ? "incl." : "added"}` },
        { k: "delivery", icon: <I.truck size={18} />, label: "Delivery", sub: `${money(s.shippingFee, s)} · free over ${money(s.freeShippingOver, s)}` },
        { k: "payments", icon: <I.card size={18} />, label: "Payment methods", sub: `${Object.values(s.payments).filter(Boolean).length} enabled` },
        { k: "promos", icon: <I.tag size={18} />, label: "Promo codes", sub: `${s.promoCodes.filter((p) => p.active).length} active` },
      ],
    },
    {
      title: "Operations",
      items: [
        { k: "inventory", icon: <I.layers size={18} />, label: "Inventory rules", sub: `Reorder at ${s.defaultReorderPoint} · backorders ${s.allowBackorder ? "on" : "off"}` },
        { k: "orders", icon: <I.receipt size={18} />, label: "Order numbering", sub: `Next: ${s.orderPrefix}${s.nextOrderNo}` },
      ],
    },
    {
      title: "Security & data",
      items: [
        { k: "security", icon: <I.lock size={18} />, label: "Staff PIN lock", sub: s.requirePin && s.adminPin ? "Enabled" : "Off" },
        { k: "data", icon: <I.download size={18} />, label: "Backup, import & reset", sub: `${db.products.length} products · ${db.orders.length} orders` },
      ],
    },
  ];

  return (
    <div className="rise">
      <PageHead eyebrow="Studio" title="Settings" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="relative h-fit overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/20 to-transparent" />
          <div className="relative mx-auto grid size-20 place-items-center rounded-full border-4 border-card bg-inverse font-display text-3xl text-on-inverse shadow-lg">{s.brandName.charAt(0)}</div>
          <p className="relative mt-4 font-display text-2xl">{s.brandName}</p>
          <p className="relative mt-1 text-sm text-muted">{s.tagline}</p>
          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl bg-soft py-3 text-center">
            <div>
              <p className="font-bold">{db.products.length}</p>
              <p className="text-[10px] text-muted uppercase">Products</p>
            </div>
            <div>
              <p className="font-bold">{db.orders.length}</p>
              <p className="text-[10px] text-muted uppercase">Orders</p>
            </div>
            <div>
              <p className="font-bold">{db.movements.length}</p>
              <p className="text-[10px] text-muted uppercase">Moves</p>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="eyebrow mb-2 px-1">{g.title}</p>
              <Card className="overflow-hidden">
                {g.items.map((it) => (
                  <button key={it.k} onClick={() => show(it.k)} className="flex w-full items-center gap-3.5 border-b border-line px-5 py-4 text-left last:border-0 hover:bg-soft/60">
                    <span className="text-ink-2">{it.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{it.label}</span>
                      <span className="block truncate text-xs text-muted first-letter:uppercase">{it.sub}</span>
                    </span>
                    <span className="grid size-7 place-items-center rounded-full bg-soft">
                      <I.arrowR size={14} />
                    </span>
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!open && open !== "data"}
        onClose={() => setOpen(null)}
        title={groups.flatMap((g) => g.items).find((i) => i.k === open)?.label ?? ""}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        {open === "brand" && (
          <div className="space-y-3">
            <Field label="Brand name">
              <Input value={draft.brandName} onChange={(e) => d("brandName", e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={draft.tagline} onChange={(e) => d("tagline", e.target.value)} />
            </Field>
            <Field label="Announcement bar" hint="Leave empty to hide">
              <Input value={draft.announcement} onChange={(e) => d("announcement", e.target.value)} />
            </Field>
            <ToggleRow label="Accept online orders" sub="Turn off to pause checkout (catalogue stays visible)" checked={draft.storeOpen} onChange={(v) => d("storeOpen", v)} />
            <ToggleRow label="Show sold-out products" sub="Keep out-of-stock scents visible in the catalogue" checked={draft.showOutOfStock} onChange={(v) => d("showOutOfStock", v)} />
          </div>
        )}
        {open === "pricing" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <Select value={draft.currency} onChange={(e) => d("currency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Number format">
                <Select value={draft.locale} onChange={(e) => d("locale", e.target.value)}>
                  {LOCALES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Tax rate (%)">
              <Input type="number" min={0} step="0.1" value={draft.taxRate} onChange={(e) => d("taxRate", Number(e.target.value))} />
            </Field>
            <ToggleRow label="Prices include tax" sub="VAT-style pricing: tax is shown but not added at checkout" checked={draft.taxInclusive} onChange={(v) => d("taxInclusive", v)} />
            <p className="rounded-2xl bg-soft p-3 text-xs text-muted">Preview: {money(185.29, draft)}</p>
          </div>
        )}
        {open === "delivery" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery fee">
              <Input type="number" min={0} step="0.01" value={draft.shippingFee} onChange={(e) => d("shippingFee", Number(e.target.value))} />
            </Field>
            <Field label="Free delivery over" hint="0 = never free">
              <Input type="number" min={0} step="0.01" value={draft.freeShippingOver} onChange={(e) => d("freeShippingOver", Number(e.target.value))} />
            </Field>
          </div>
        )}
        {open === "payments" && (
          <div>
            {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
              <ToggleRow key={m} label={PAYMENT_LABEL[m]} sub={m === "in_store" ? "Studio point-of-sale only" : "Offered at online checkout"} checked={draft.payments[m]} onChange={(v) => d("payments", { ...draft.payments, [m]: v })} />
            ))}
            <p className="mt-3 rounded-2xl bg-soft p-3 text-xs text-muted">Online card payments need a payment provider (e.g. Stripe) connected to a backend — see the README for next steps.</p>
          </div>
        )}
        {open === "inventory" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Default reorder point" hint="Used for new sizes">
                <Input type="number" min={0} value={draft.defaultReorderPoint} onChange={(e) => d("defaultReorderPoint", Number(e.target.value))} />
              </Field>
              <Field label="SKU prefix">
                <Input value={draft.skuPrefix} onChange={(e) => d("skuPrefix", e.target.value.toUpperCase())} />
              </Field>
            </div>
            <Field label="Default sizes (ml)" hint="Comma separated — pre-filled on new products">
              <Input
                defaultValue={draft.sizePresets.join(", ")}
                onBlur={(e) =>
                  d(
                    "sizePresets",
                    e.target.value
                      .split(",")
                      .map((x) => Number(x.trim()))
                      .filter((n) => n > 0),
                  )
                }
              />
            </Field>
            <ToggleRow label="Allow backorders" sub="Let customers order sizes that are out of stock" checked={draft.allowBackorder} onChange={(v) => d("allowBackorder", v)} />
            <ToggleRow label="Low-stock alerts" sub="Badges and the restock banner in Studio" checked={draft.lowStockAlerts} onChange={(v) => d("lowStockAlerts", v)} />
            <ApplyReorder value={draft.defaultReorderPoint} />
          </div>
        )}
        {open === "orders" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Order prefix">
              <Input value={draft.orderPrefix} onChange={(e) => d("orderPrefix", e.target.value)} />
            </Field>
            <Field label="Next number">
              <Input type="number" min={1} value={draft.nextOrderNo} onChange={(e) => d("nextOrderNo", Number(e.target.value))} />
            </Field>
            <p className="col-span-2 text-xs text-muted">
              Next order will be <b>{`${draft.orderPrefix}${draft.nextOrderNo}`}</b>
            </p>
          </div>
        )}
        {open === "promos" && <Promos draft={draft} set={(v) => d("promoCodes", v)} />}
        {open === "appearance" && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button key={t} onClick={() => d("theme", t)} className={cx("flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold capitalize", draft.theme === t ? "border-inverse" : "border-line")}>
                    {t === "light" ? <I.sun size={20} /> : t === "dark" ? <I.moon size={20} /> : <I.settings size={20} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Accent</p>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENTS.map((c) => (
                  <button key={c} aria-label={c} onClick={() => d("accent", c)} className={cx("size-9 rounded-full border-2", draft.accent === c ? "border-ink" : "border-transparent")} style={{ background: c }} />
                ))}
                <input type="color" value={draft.accent} onChange={(e) => d("accent", e.target.value)} className="h-9 w-12 cursor-pointer rounded-full border border-line bg-transparent" aria-label="Custom accent" />
              </div>
            </div>
          </div>
        )}
        {open === "security" && (
          <div className="space-y-3">
            <ToggleRow label="Require PIN to open Studio" sub="Asked once per browser session" checked={draft.requirePin} onChange={(v) => d("requirePin", v)} />
            {draft.requirePin && (
              <Field label="Staff PIN (4–6 digits)">
                <Input inputMode="numeric" maxLength={6} value={draft.adminPin} onChange={(e) => d("adminPin", e.target.value.replace(/\D/g, ""))} className="text-center font-mono text-xl tracking-[.5em]" />
              </Field>
            )}
            <p className="rounded-2xl bg-soft p-3 text-xs text-muted">The PIN stops casual access on a shared shop device. It is not a substitute for real accounts — for multi-staff use, connect the app to a backend with sign-in.</p>
          </div>
        )}
      </Modal>

      <DataModal open={open === "data"} onClose={() => setOpen(null)} />
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-4 border-b border-line py-3 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function ApplyReorder({ value }: { value: number }) {
  const { db, saveProduct, toast } = useStore();
  return (
    <button
      className="text-xs font-semibold text-accent hover:underline"
      onClick={async () => {
        if (!await ask(`Set the reorder point of every size to ${value}?`)) return;
        for (const p of db.products) saveProduct({ ...p, variants: p.variants.map((v) => ({ ...v, reorderPoint: value })) });
        toast("Reorder points updated", "success");
      }}
    >
      Apply {value} to all existing sizes →
    </button>
  );
}

function Promos({ draft, set }: { draft: S; set: (v: S["promoCodes"]) => void }) {
  const [code, setCode] = useState("");
  const [pct, setPct] = useState("10");
  return (
    <div>
      {draft.promoCodes.map((p, i) => (
        <div key={p.code} className="flex items-center gap-3 border-b border-line py-3">
          <span className="rounded-lg bg-soft px-2 py-1 font-mono text-xs font-bold">{p.code}</span>
          <span className="flex-1 text-sm">{p.percent}% off</span>
          <Toggle label={`Activate ${p.code}`} checked={p.active} onChange={(v) => set(draft.promoCodes.map((x, j) => (j === i ? { ...x, active: v } : x)))} />
          <button aria-label="Delete code" onClick={() => set(draft.promoCodes.filter((_, j) => j !== i))} className="text-muted hover:text-bad">
            <I.trash size={16} />
          </button>
        </div>
      ))}
      <div className="mt-4 flex gap-2">
        <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} className="font-mono" />
        <Input type="number" min={1} max={100} value={pct} onChange={(e) => setPct(e.target.value)} className="w-20" />
        <Button
          variant="soft"
          onClick={() => {
            if (!code || draft.promoCodes.some((p) => p.code === code)) return;
            set([...draft.promoCodes, { code, percent: Math.min(100, Math.max(1, Number(pct) || 10)), active: true }]);
            setCode("");
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function DataModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, importDB, resetDemo, startEmpty, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const onImport = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const data = JSON.parse(String(r.result)) as DB;
        if (data.version !== 1 || !Array.isArray(data.products) || !data.settings) throw new Error("bad");
        if (!(await ask(`Replace all current data with this backup (${data.products.length} products, ${data.orders.length} orders)?`))) return;
        importDB({ ...data, cart: data.cart ?? [], wishlist: data.wishlist ?? [], myOrders: data.myOrders ?? [] });
        toast("Backup restored", "success");
        onClose();
      } catch {
        toast("That file isn't a valid backup.", "error");
      }
    };
    r.readAsText(f);
  };
  return (
    <Modal open={open} onClose={onClose} title="Backup, import & reset">
      <div className="space-y-2">
        <Action
          icon={<I.download size={18} />}
          title="Download full backup"
          sub="Products, stock, orders and settings as JSON"
          onClick={() => {
            downloadFile(`maison-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 2), "application/json");
            toast("Backup downloaded and copied to clipboard", "success");
          }}
        />
        <Action icon={<I.upload size={18} />} title="Restore from backup" sub="Replaces everything on this device" onClick={() => fileRef.current?.click()} />
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
        <div className="pt-3">
          <p className="eyebrow mb-2">Danger zone</p>
          <Action
            danger
            icon={<I.history size={18} />}
            title="Reload demo catalogue"
            sub="Replace data with the sample house"
            onClick={async () => {
              if (await ask("Replace all data with the demo catalogue?")) {
                resetDemo();
                toast("Demo data loaded");
                onClose();
              }
            }}
          />
          <Action
            danger
            icon={<I.trash size={18} />}
            title="Start fresh"
            sub="Remove all products, orders and stock history (settings kept)"
            onClick={async () => {
              if (await ask("Delete ALL products, orders and stock history? Download a backup first if unsure.")) {
                startEmpty();
                toast("Clean slate — add your first product");
                onClose();
              }
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

function Action({ icon, title, sub, onClick, danger }: { icon: ReactNode; title: string; sub: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition", danger ? "border-bad/20 hover:bg-bad/5" : "border-line hover:bg-soft")}>
      <span className={danger ? "text-bad" : ""}>{icon}</span>
      <span className="flex-1">
        <span className={cx("block text-sm font-semibold", danger && "text-bad")}>{title}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <I.chevR size={16} className="text-muted" />
    </button>
  );
}
