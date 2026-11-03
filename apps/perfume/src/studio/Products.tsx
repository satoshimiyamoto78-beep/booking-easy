import { useMemo, useRef, useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Badge, Button, Card, Chip, Empty, Field, Input, Select, Textarea, Toggle, cx } from "../components/ui";
import { minPrice, stockState, totalStock, useStore } from "../lib/store";
import { money, splitList, uid } from "../lib/format";
import { navigate } from "../lib/router";
import type { BottleShape, Concentration, Gender, Product, ProductStatus, Variant } from "../lib/types";
import { PageHead } from "./StudioLayout";

const STATUS_TONE: Record<ProductStatus, "ok" | "neutral" | "bad"> = { active: "ok", draft: "neutral", archived: "bad" };

export function Products() {
  const { db, setProductStatus, toast } = useStore();
  const s = db.settings;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [col, setCol] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [sel, setSel] = useState<string[]>([]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.products
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => !col || p.collectionId === col)
      .filter((p) => !t || `${p.name} ${p.variants.map((v) => v.sku).join(" ")} ${p.tags.join(" ")}`.toLowerCase().includes(t));
  }, [db.products, q, status, col]);

  const bulk = (st: ProductStatus) => {
    setProductStatus(sel, st);
    toast(`${sel.length} product${sel.length > 1 ? "s" : ""} set to ${st}`, "success");
    setSel([]);
  };

  return (
    <div className="rise">
      <PageHead
        eyebrow="Catalogue"
        title="Products"
        actions={
          <Button onClick={() => navigate("/studio/products/new")}>
            <I.plus size={16} /> New product
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <I.search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, SKUs, tags" className="h-11 w-full rounded-full border border-line bg-card pr-4 pl-10 text-sm outline-none focus:border-ink/50" />
        </div>
        <div className="w-44">
          <Select value={col} onChange={(e) => setCol(e.target.value)} className="h-11 rounded-full bg-card">
            <option value="">All collections</option>
            {db.collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-card p-1">
          {(["list", "grid"] as const).map((v) => (
            <button key={v} aria-label={`${v} view`} onClick={() => setView(v)} className={cx("grid size-9 place-items-center rounded-full", view === v ? "bg-inverse text-on-inverse" : "text-muted")}>
              {v === "grid" ? <I.grid size={16} /> : <I.menu size={16} />}
            </button>
          ))}
        </div>
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(["all", "active", "draft", "archived"] as const).map((st) => (
          <Chip key={st} active={status === st} onClick={() => setStatus(st)}>
            {st} · {st === "all" ? db.products.length : db.products.filter((p) => p.status === st).length}
          </Chip>
        ))}
      </div>

      {sel.length > 0 && (
        <div className="sheet sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-full bg-inverse py-2 pr-2 pl-5 text-sm text-on-inverse lg:top-4">
          <span className="mr-auto font-semibold">{sel.length} selected</span>
          <button onClick={() => bulk("active")} className="h-8 rounded-full bg-on-inverse/10 px-3 text-xs font-semibold">
            Publish
          </button>
          <button onClick={() => bulk("draft")} className="h-8 rounded-full bg-on-inverse/10 px-3 text-xs font-semibold">
            Draft
          </button>
          <button onClick={() => bulk("archived")} className="h-8 rounded-full bg-on-inverse/10 px-3 text-xs font-semibold">
            Archive
          </button>
          <button aria-label="Clear selection" onClick={() => setSel([])} className="grid size-8 place-items-center rounded-full bg-on-inverse/10">
            <I.x size={14} />
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Card>
          <Empty icon={<I.box size={26} />} title="No products" text="Create your first fragrance to build the catalogue." action={<Button onClick={() => navigate("/studio/products/new")}>New product</Button>} />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <button key={p.id} onClick={() => navigate(`/studio/products/${p.id}`)} className="rounded-[22px] border border-line bg-card p-3 text-left transition hover:shadow-lg">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-soft p-3">
                <Bottle product={p} brand={s.brandName} className="h-full w-auto" />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <Badge tone={STATUS_TONE[p.status]} className="capitalize">
                  {p.status}
                </Badge>
              </div>
              <p className="text-xs text-muted">
                {money(minPrice(p), s)} · {totalStock(p)} in stock
              </p>
            </button>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          {list.map((p) => {
            const st = stockState(p);
            const checked = sel.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0 hover:bg-soft/60 md:px-5">
                <input
                  type="checkbox"
                  aria-label={`Select ${p.name}`}
                  checked={checked}
                  onChange={() => setSel(checked ? sel.filter((x) => x !== p.id) : [...sel, p.id])}
                  className="size-4 accent-[var(--ink)]"
                />
                <button onClick={() => navigate(`/studio/products/${p.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft">
                    <Bottle product={p} label={false} className="h-10 w-auto" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {p.name}
                      {p.featured && <I.sparkle size={12} className="ml-1 inline text-accent" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {db.collections.find((c) => c.id === p.collectionId)?.name ?? "No collection"} · {p.concentration} · {p.variants.map((v) => `${v.sizeMl}ml`).join(" / ")}
                    </p>
                  </div>
                  <div className="hidden w-28 text-right text-sm font-semibold md:block">{money(minPrice(p), s)}</div>
                  <div className="w-20 text-right">
                    <p className={cx("text-sm font-bold tabular-nums", st === "out" ? "text-bad" : st === "low" ? "text-warn" : "")}>{totalStock(p)}</p>
                    <p className="text-[10px] text-muted">in stock</p>
                  </div>
                  <Badge tone={STATUS_TONE[p.status]} className="hidden w-20 justify-center capitalize sm:inline-flex">
                    {p.status}
                  </Badge>
                </button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

const SHAPES: BottleShape[] = ["square", "round", "tall", "facet"];
const LIQUIDS = ["#D89A4A", "#F0C4C9", "#E9DCC2", "#F4E7A8", "#6B3F2A", "#D9CDE6", "#CFE0C3", "#B8642E", "#BFD9E4", "#3A2A24", "#F6EFD6", "#9E1B32"];
const CAPS = ["#1A1A1A", "#C9A46B", "#2B2B2B", "#E8E3DA", "#7A5C3E", "#B8B8B8"];

function blank(s: { defaultReorderPoint: number; sizePresets: number[] }): Product {
  const id = uid("p-");
  return {
    id,
    name: "",
    collectionId: null,
    familyId: null,
    concentration: "Eau de Parfum",
    gender: "Unisex",
    description: "",
    notes: { top: [], heart: [], base: [] },
    tags: [],
    status: "draft",
    featured: false,
    bestseller: false,
    isNew: true,
    bottle: { shape: "square", liquid: "#E9DCC2", cap: "#1A1A1A" },
    variants: s.sizePresets.map((ml) => ({ id: uid("v-"), sizeMl: ml, sku: "", price: 0, cost: 0, stock: 0, reorderPoint: s.defaultReorderPoint })),
    createdAt: "",
    updatedAt: "",
  };
}

export function ProductEditor({ id }: { id: string }) {
  const { db, saveProduct, deleteProduct, duplicateProduct, toast } = useStore();
  const s = db.settings;
  const existing = db.products.find((p) => p.id === id);
  const isNew = id === "new";
  const [p, setP] = useState<Product>(() => (existing ? structuredClone(existing) : blank(s)));
  const [notes, setNotes] = useState(() => ({ top: p.notes.top.join(", "), heart: p.notes.heart.join(", "), base: p.notes.base.join(", "), tags: p.tags.join(", ") }));
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isNew && !existing)
    return (
      <Card>
        <Empty icon={<I.box size={26} />} title="Product not found" action={<Button onClick={() => navigate("/studio/products")}>All products</Button>} />
      </Card>
    );

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const setV = (vid: string, patch: Partial<Variant>) => setP((x) => ({ ...x, variants: x.variants.map((v) => (v.id === vid ? { ...v, ...patch } : v)) }));

  const autoSku = (ml: number) => {
    const code = p.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("");
    return `${s.skuPrefix}-${code || "NEW"}-${ml}`;
  };

  const save = (status?: ProductStatus) => {
    if (!p.name.trim()) return toast("Give the fragrance a name.", "error");
    if (p.variants.length === 0) return toast("Add at least one size.", "error");
    const variants = p.variants.map((v) => ({ ...v, sku: v.sku.trim() || autoSku(v.sizeMl) }));
    const skus = variants.map((v) => v.sku);
    const clash = db.products.some((o) => o.id !== p.id && o.variants.some((v) => skus.includes(v.sku)));
    if (clash || new Set(skus).size !== skus.length) return toast("Each SKU must be unique.", "error");
    if (variants.some((v) => v.price <= 0)) return toast("Every size needs a price.", "error");
    const final: Product = {
      ...p,
      status: status ?? p.status,
      variants,
      notes: { top: splitList(notes.top), heart: splitList(notes.heart), base: splitList(notes.base) },
      tags: splitList(notes.tags),
    };
    saveProduct(final);
    toast(isNew ? "Product created" : "Changes saved", "success");
    navigate(`/studio/products`);
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 1.5e6) return toast("Please use an image under 1.5 MB.", "error");
    const r = new FileReader();
    r.onload = () => {
      // downscale to keep local storage small
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * k;
        c.height = img.height * k;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        set("image", c.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  };

  return (
    <div className="rise">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button aria-label="Back" onClick={() => navigate("/studio/products")} className="grid size-10 place-items-center rounded-full border border-line bg-card">
          <I.arrowL size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{isNew ? "New product" : "Edit product"}</p>
          <h1 className="truncate font-display text-3xl">{p.name || "Untitled fragrance"}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  duplicateProduct(p.id);
                  toast("Duplicated as draft", "success");
                  navigate("/studio/products");
                }}
              >
                <I.copy size={16} /> <span className="hidden sm:inline">Duplicate</span>
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`Delete “${p.name}”? Stock history is kept, but the product is removed. Consider archiving instead.`)) {
                    deleteProduct(p.id);
                    toast("Product deleted");
                    navigate("/studio/products");
                  }
                }}
              >
                <I.trash size={16} />
              </Button>
            </>
          )}
          {p.status !== "active" && (
            <Button variant="outline" onClick={() => save("active")}>
              Save & publish
            </Button>
          )}
          <Button onClick={() => save()}>
            <I.check size={16} /> Save
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="eyebrow mb-4">Essentials</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <Input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ambre Nocturne" />
              </Field>
              <Field label="Collection">
                <Select value={p.collectionId ?? ""} onChange={(e) => set("collectionId", e.target.value || null)}>
                  <option value="">None</option>
                  {db.collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Olfactory family">
                <Select value={p.familyId ?? ""} onChange={(e) => set("familyId", e.target.value || null)}>
                  <option value="">None</option>
                  {db.families.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Concentration">
                <Select value={p.concentration} onChange={(e) => set("concentration", e.target.value as Concentration)}>
                  {["Extrait", "Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="For">
                <Select value={p.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                  {["Unisex", "Feminine", "Masculine"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <Textarea value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell the story of the scent…" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">Sizes, pricing & stock</p>
              <Button
                size="sm"
                variant="soft"
                onClick={() =>
                  setP((x) => ({
                    ...x,
                    variants: [...x.variants, { id: uid("v-"), sizeMl: 75, sku: "", price: 0, cost: 0, stock: 0, reorderPoint: s.defaultReorderPoint }],
                  }))
                }
              >
                <I.plus size={14} /> Add size
              </Button>
            </div>
            <div className="space-y-3">
              {p.variants.map((v) => (
                <div key={v.id} className="rounded-2xl border border-line bg-soft/60 p-3">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Field label="Size (ml)">
                      <Input type="number" min={1} value={v.sizeMl} onChange={(e) => setV(v.id, { sizeMl: Number(e.target.value) })} />
                    </Field>
                    <Field label="Price">
                      <Input type="number" min={0} step="0.01" value={v.price || ""} onChange={(e) => setV(v.id, { price: Number(e.target.value) })} />
                    </Field>
                    <Field label="Compare at">
                      <Input type="number" min={0} step="0.01" value={v.compareAt ?? ""} placeholder="—" onChange={(e) => setV(v.id, { compareAt: e.target.value ? Number(e.target.value) : undefined })} />
                    </Field>
                    <Field label="Unit cost">
                      <Input type="number" min={0} step="0.01" value={v.cost || ""} onChange={(e) => setV(v.id, { cost: Number(e.target.value) })} />
                    </Field>
                    <Field label="SKU">
                      <Input value={v.sku} placeholder={autoSku(v.sizeMl)} onChange={(e) => setV(v.id, { sku: e.target.value.toUpperCase() })} className="font-mono text-xs" />
                    </Field>
                    <Field label="Barcode">
                      <Input value={v.barcode ?? ""} onChange={(e) => setV(v.id, { barcode: e.target.value })} className="font-mono text-xs" />
                    </Field>
                    <Field label="On hand" hint={existing ? "Changes are logged as adjustments" : "Logged as initial stock"}>
                      <Input type="number" value={v.stock} onChange={(e) => setV(v.id, { stock: Math.floor(Number(e.target.value)) })} />
                    </Field>
                    <Field label="Reorder at">
                      <Input type="number" min={0} value={v.reorderPoint} onChange={(e) => setV(v.id, { reorderPoint: Number(e.target.value) })} />
                    </Field>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>{v.price > 0 && v.cost > 0 ? `Margin ${Math.round(((v.price - v.cost) / v.price) * 100)}%` : "Set price & cost to see margin"}</span>
                    <button onClick={() => setP((x) => ({ ...x, variants: x.variants.filter((y) => y.id !== v.id) }))} className="font-semibold text-bad hover:underline">
                      Remove size
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="eyebrow mb-4">Olfactory pyramid</p>
            <div className="grid gap-3">
              <Field label="Top notes" hint="Comma separated">
                <Input value={notes.top} onChange={(e) => setNotes({ ...notes, top: e.target.value })} placeholder="Bergamot, Pink pepper" />
              </Field>
              <Field label="Heart notes">
                <Input value={notes.heart} onChange={(e) => setNotes({ ...notes, heart: e.target.value })} placeholder="Rose, Jasmine" />
              </Field>
              <Field label="Base notes">
                <Input value={notes.base} onChange={(e) => setNotes({ ...notes, base: e.target.value })} placeholder="Amber, Musk, Sandalwood" />
              </Field>
              <Field label="Search tags" hint="Extra keywords customers might search for">
                <Input value={notes.tags} onChange={(e) => setNotes({ ...notes, tags: e.target.value })} placeholder="evening, gift, signature" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <p className="eyebrow mb-3">Visual</p>
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-soft to-card p-6">
              <Bottle product={p} brand={s.brandName} className="h-full w-auto" />
              {p.image && (
                <button onClick={() => set("image", undefined)} className="absolute top-2 right-2 rounded-full bg-card px-3 py-1 text-xs font-semibold shadow">
                  Remove photo
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => fileRef.current?.click()}>
              <I.upload size={14} /> Upload product photo
            </Button>
            {!p.image && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold">Flacon</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SHAPES.map((sh) => (
                      <button key={sh} onClick={() => set("bottle", { ...p.bottle, shape: sh })} className={cx("rounded-xl border p-1.5 capitalize", p.bottle.shape === sh ? "border-inverse" : "border-line")}>
                        <Bottle product={{ ...p, bottle: { ...p.bottle, shape: sh } }} label={false} className="mx-auto h-10 w-auto" />
                        <span className="text-[10px]">{sh}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Swatches label="Juice" value={p.bottle.liquid} options={LIQUIDS} onChange={(c) => set("bottle", { ...p.bottle, liquid: c })} />
                <Swatches label="Cap" value={p.bottle.cap} options={CAPS} onChange={(c) => set("bottle", { ...p.bottle, cap: c })} />
              </div>
            )}
          </Card>
          <Card className="p-5">
            <p className="eyebrow mb-3">Visibility</p>
            <div className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-soft p-1">
              {(["active", "draft", "archived"] as const).map((st) => (
                <button key={st} onClick={() => set("status", st)} className={cx("h-8 rounded-full text-xs font-bold capitalize", p.status === st ? "bg-card shadow-sm" : "text-muted")}>
                  {st}
                </button>
              ))}
            </div>
            {(
              [
                ["featured", "Featured on home"],
                ["bestseller", "Best seller badge"],
                ["isNew", "Mark as new"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between py-2 text-sm">
                <span>{label}</span>
                <Toggle label={label} checked={p[k]} onChange={(v) => set(k, v)} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Swatches({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (c: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((c) => (
          <button key={c} aria-label={c} onClick={() => onChange(c)} className={cx("size-7 rounded-full border-2", value.toLowerCase() === c.toLowerCase() ? "border-inverse" : "border-transparent")} style={{ background: c }} />
        ))}
        <label className="relative grid size-7 cursor-pointer place-items-center rounded-full border border-dashed border-muted" title="Custom colour">
          <I.plus size={12} />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  );
}
