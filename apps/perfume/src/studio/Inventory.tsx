import { useMemo, useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Badge, Button, Card, Chip, Empty, Field, Input, Modal, Select, cx } from "../components/ui";
import { findVariant, isLow, isOut, useStore } from "../lib/store";
import { dateTime, downloadFile, money, toCSV } from "../lib/format";
import { navigate } from "../lib/router";
import type { MovementType, Product, Variant } from "../lib/types";
import { PageHead } from "./StudioLayout";

type Row = { p: Product; v: Variant };
type Filter = "all" | "low" | "out" | "healthy";

export const MOVE_LABEL: Record<MovementType, string> = {
  receive: "Received",
  sale: "Sale",
  adjust: "Adjustment",
  return: "Return",
  cancel: "Cancelled order",
  damage: "Damaged / tester",
};

export function Inventory({ query }: { query: URLSearchParams }) {
  const { db } = useStore();
  const s = db.settings;
  const [tab, setTab] = useState<"stock" | "moves">(query.get("tab") === "moves" ? "moves" : "stock");
  const [filter, setFilter] = useState<Filter>((query.get("filter") as Filter) || "all");
  const [q, setQ] = useState("");
  const [fam, setFam] = useState("");
  const [adjust, setAdjust] = useState<Row | null>(null);
  const [receive, setReceive] = useState(query.get("receive") === "1");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.products
      .filter((p) => p.status !== "archived")
      .flatMap((p) => p.variants.map((v) => ({ p, v })))
      .filter(({ p, v }) => !t || `${p.name} ${v.sku} ${v.barcode ?? ""}`.toLowerCase().includes(t))
      .filter(({ p }) => !fam || p.familyId === fam)
      .filter(({ v }) => (filter === "low" ? isLow(v) || isOut(v) : filter === "out" ? isOut(v) : filter === "healthy" ? !isLow(v) && !isOut(v) : true))
      .sort((a, b) => a.p.name.localeCompare(b.p.name) || a.v.sizeMl - b.v.sizeMl);
  }, [db.products, q, fam, filter]);

  const all = db.products.filter((p) => p.status !== "archived").flatMap((p) => p.variants);
  const counts = { all: all.length, low: all.filter((v) => isLow(v) || isOut(v)).length, out: all.filter(isOut).length, healthy: all.filter((v) => !isLow(v) && !isOut(v)).length };

  const exportCSV = () => {
    const data = [
      ["Product", "Size (ml)", "SKU", "Barcode", "Stock", "Reorder point", "Unit cost", "Price", "Stock value (cost)", "Status"],
      ...rows.map(({ p, v }) => [p.name, v.sizeMl, v.sku, v.barcode, v.stock, v.reorderPoint, v.cost, v.price, v.stock * v.cost, isOut(v) ? "Out" : isLow(v) ? "Low" : "OK"]),
    ];
    downloadFile(`inventory-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(data), "text/csv");
  };

  return (
    <div className="rise">
      <PageHead
        eyebrow="Stock control"
        title="Inventory"
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}>
              <I.download size={16} /> Export
            </Button>
            <Button onClick={() => setReceive(true)}>
              <I.plus size={16} /> Receive stock
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["all", "All SKUs", counts.all, "text-ink"],
            ["healthy", "Healthy", counts.healthy, "text-ok"],
            ["low", "Needs restock", counts.low, "text-warn"],
            ["out", "Out of stock", counts.out, "text-bad"],
          ] as const
        ).map(([k, label, n, c]) => (
          <button
            key={k}
            onClick={() => {
              setFilter(k);
              setTab("stock");
            }}
            className={cx("rounded-[22px] border p-4 text-left transition", filter === k && tab === "stock" ? "border-inverse bg-card shadow-sm" : "border-line bg-card/60 hover:bg-card")}
          >
            <p className={cx("text-2xl font-bold", c)}>{n}</p>
            <p className="text-xs text-muted">{label}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full bg-card p-1 shadow-sm">
          {(["stock", "moves"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("h-9 rounded-full px-4 text-xs font-bold", tab === t ? "bg-inverse text-on-inverse" : "text-muted")}>
              {t === "stock" ? "Stock levels" : "Movement log"}
            </button>
          ))}
        </div>
        {tab === "stock" && (
          <>
            <div className="relative min-w-48 flex-1">
              <I.search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or barcode" className="h-11 w-full rounded-full border border-line bg-card pr-4 pl-10 text-sm outline-none focus:border-ink/50" />
            </div>
            <div className="w-44">
              <Select value={fam} onChange={(e) => setFam(e.target.value)} className="h-11 rounded-full bg-card">
                <option value="">All families</option>
                {db.families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}
      </div>

      {tab === "stock" ? (
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <Empty icon={<I.layers size={26} />} title="Nothing here" text={db.products.length ? "No SKUs match these filters." : "Add your first product to start tracking stock."} action={!db.products.length && <Button onClick={() => navigate("/studio/products/new")}>Add product</Button>} />
          ) : (
            <>
              {/* desktop table */}
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] tracking-wider text-muted uppercase">
                    <th className="py-3 pl-5 font-semibold">Product</th>
                    <th className="font-semibold">SKU</th>
                    <th className="text-right font-semibold">Value</th>
                    <th className="text-right font-semibold">Reorder at</th>
                    <th className="w-56 pl-6 font-semibold">On hand</th>
                    <th className="pr-5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <StockRow key={r.v.id} r={r} onAdjust={() => setAdjust(r)} />
                  ))}
                </tbody>
              </table>
              {/* mobile list */}
              <div className="md:hidden">
                {rows.map(({ p, v }) => (
                  <button key={v.id} onClick={() => setAdjust({ p, v })} className="flex w-full items-center gap-3 border-b border-line p-3.5 text-left last:border-0">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft">
                      <Bottle product={p} label={false} className="h-10 w-auto" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {p.name} <span className="font-normal text-muted">· {v.sizeMl}ml</span>
                      </p>
                      <p className="text-[11px] text-muted">{v.sku}</p>
                      <Level v={v} className="mt-1.5" />
                    </div>
                    <div className="text-right">
                      <p className={cx("text-lg font-bold tabular-nums", isOut(v) ? "text-bad" : isLow(v) ? "text-warn" : "")}>{v.stock}</p>
                      <p className="text-[10px] text-muted">units</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      ) : (
        <Movements />
      )}

      <AdjustModal key={adjust?.v.id ?? "none"} row={adjust} onClose={() => setAdjust(null)} />
      <ReceiveModal open={receive} onClose={() => setReceive(false)} />
      <p className="mt-4 text-center text-xs text-muted">
        Stock value at cost: <b>{money(all.reduce((a, v) => a + Math.max(0, v.stock) * v.cost, 0), s)}</b>
      </p>
    </div>
  );
}

function Level({ v, className }: { v: Variant; className?: string }) {
  const cap = Math.max(v.reorderPoint * 4, 20);
  const pct = Math.min(100, (Math.max(0, v.stock) / cap) * 100);
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-soft", className)}>
      <div className={cx("h-full rounded-full", isOut(v) ? "bg-bad" : isLow(v) ? "bg-warn" : "bg-ok")} style={{ width: `${Math.max(pct, isOut(v) ? 0 : 3)}%` }} />
    </div>
  );
}

function StockRow({ r, onAdjust }: { r: Row; onAdjust: () => void }) {
  const { db, adjustStock } = useStore();
  const { p, v } = r;
  return (
    <tr className="border-b border-line last:border-0 hover:bg-soft/60">
      <td className="py-3 pl-5">
        <button onClick={() => navigate(`/studio/products/${p.id}`)} className="flex items-center gap-3 text-left">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft">
            <Bottle product={p} label={false} className="h-9 w-auto" />
          </div>
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-muted">
              {v.sizeMl} ml · {p.concentration}
            </p>
          </div>
        </button>
      </td>
      <td className="font-mono text-xs text-muted">{v.sku}</td>
      <td className="text-right tabular-nums">{money(Math.max(0, v.stock) * v.cost, db.settings)}</td>
      <td className="text-right text-muted tabular-nums">{v.reorderPoint}</td>
      <td className="pl-6">
        <div className="flex items-center gap-3">
          <span className={cx("w-8 text-right text-base font-bold tabular-nums", isOut(v) ? "text-bad" : isLow(v) ? "text-warn" : "")}>{v.stock}</span>
          <Level v={v} className="flex-1" />
          {isOut(v) ? <Badge tone="bad">Out</Badge> : isLow(v) ? <Badge tone="warn">Low</Badge> : <Badge tone="ok">OK</Badge>}
        </div>
      </td>
      <td className="pr-5">
        <div className="flex justify-end gap-1">
          <button aria-label="Remove one" title="−1" onClick={() => adjustStock(v.id, -1, "adjust", "Quick adjust")} className="grid size-8 place-items-center rounded-full border border-line hover:border-ink/40">
            <I.minus size={14} />
          </button>
          <button aria-label="Add one" title="+1" onClick={() => adjustStock(v.id, 1, "adjust", "Quick adjust")} className="grid size-8 place-items-center rounded-full border border-line hover:border-ink/40">
            <I.plus size={14} />
          </button>
          <button onClick={onAdjust} className="h-8 rounded-full bg-inverse px-3 text-xs font-semibold text-on-inverse">
            Adjust
          </button>
        </div>
      </td>
    </tr>
  );
}

function AdjustModal({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const { db, adjustStock, toast } = useStore();
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [qty, setQty] = useState("1");
  const [type, setType] = useState<MovementType>("receive");
  const [reason, setReason] = useState("");
  const live = row ? findVariant(db, row.v.id)?.variant : undefined;
  if (!row || !live) return null;
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const delta = mode === "add" ? n : mode === "remove" ? -n : n - live.stock;
  const submit = () => {
    if (delta === 0) return onClose();
    const t: MovementType = mode === "set" ? "adjust" : type;
    adjustStock(live.id, delta, t, reason || (mode === "set" ? "Stock count" : MOVE_LABEL[t]));
    toast(`${row.p.name} ${live.sizeMl}ml → ${live.stock + delta} units`, "success");
    setQty("1");
    setReason("");
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust stock"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit}>
            Save · {live.stock} → {live.stock + delta}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-soft p-3">
        <Bottle product={row.p} label={false} className="h-14 w-auto" />
        <div>
          <p className="font-semibold">
            {row.p.name} · {live.sizeMl}ml
          </p>
          <p className="text-xs text-muted">
            {live.sku} · {live.stock} on hand
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-soft p-1">
        {(["add", "remove", "set"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setType(m === "add" ? "receive" : "adjust");
              if (m === "set") setQty(String(live.stock));
            }}
            className={cx("h-9 rounded-full text-xs font-bold capitalize", mode === m ? "bg-card shadow-sm" : "text-muted")}
          >
            {m === "set" ? "Set count" : m}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={mode === "set" ? "Counted units" : "Quantity"}>
          <Input type="number" min={0} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        </Field>
        {mode !== "set" && (
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
              {(mode === "add" ? (["receive", "return", "adjust"] as MovementType[]) : (["adjust", "damage", "sale"] as MovementType[])).map((t) => (
                <option key={t} value={t}>
                  {MOVE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Reason / reference" className="col-span-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. PO-1042, tester for boutique, cycle count" />
        </Field>
      </div>
      {!db.settings.allowBackorder && live.stock + delta < 0 && <p className="mt-3 text-xs text-bad">This will make stock negative.</p>}
    </Modal>
  );
}

function ReceiveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, receiveBatch, toast } = useStore();
  const [lines, setLines] = useState<{ variantId: string; qty: string; cost: string }[]>([{ variantId: "", qty: "", cost: "" }]);
  const [ref, setRef] = useState("");
  const [supplier, setSupplier] = useState("");
  const options = db.products.filter((p) => p.status !== "archived").flatMap((p) => p.variants.map((v) => ({ p, v })));
  const total = lines.reduce((a, l) => a + (Number(l.qty) || 0), 0);
  const submit = () => {
    const valid = lines.filter((l) => l.variantId && Number(l.qty) > 0).map((l) => ({ variantId: l.variantId, qty: Math.floor(Number(l.qty)), cost: l.cost ? Number(l.cost) : undefined }));
    if (!valid.length) return toast("Add at least one line with a quantity.", "error");
    receiveBatch(valid, ref, supplier ? `Received from ${supplier}` : "Stock received");
    toast(`${valid.reduce((a, l) => a + l.qty, 0)} units received`, "success");
    setLines([{ variantId: "", qty: "", cost: "" }]);
    setRef("");
    setSupplier("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Receive stock"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit}>
            Receive {total || ""} units
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchase order / reference">
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="PO-1042" />
        </Field>
        <Field label="Supplier">
          <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Grasse atelier" />
        </Field>
      </div>
      <div className="mt-4 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_90px_36px] items-end gap-2">
            <Field label={i === 0 ? "Product & size" : ""}>
              <Select value={l.variantId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, variantId: e.target.value } : x)))}>
                <option value="">Select…</option>
                {options.map(({ p, v }) => (
                  <option key={v.id} value={v.id}>
                    {p.name} · {v.sizeMl}ml ({v.stock})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={i === 0 ? "Qty" : ""}>
              <Input type="number" min={0} value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} />
            </Field>
            <Field label={i === 0 ? "Unit cost" : ""}>
              <Input type="number" min={0} step="0.01" placeholder="opt." value={l.cost} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, cost: e.target.value } : x)))} />
            </Field>
            <button aria-label="Remove line" onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : lines)} className="mb-1 grid size-9 place-items-center rounded-full text-muted hover:bg-soft">
              <I.x size={16} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="soft" size="sm" className="mt-3" onClick={() => setLines([...lines, { variantId: "", qty: "", cost: "" }])}>
        <I.plus size={14} /> Add line
      </Button>
    </Modal>
  );
}

function Movements() {
  const { db } = useStore();
  const [type, setType] = useState<MovementType | "">("");
  const [limit, setLimit] = useState(60);
  const list = db.movements.filter((m) => !type || m.type === type);
  return (
    <Card className="overflow-hidden">
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line p-3">
        <Chip active={!type} onClick={() => setType("")}>
          All
        </Chip>
        {(Object.keys(MOVE_LABEL) as MovementType[]).map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {MOVE_LABEL[t]}
          </Chip>
        ))}
      </div>
      {list.length === 0 && <Empty icon={<I.history size={26} />} title="No movements yet" />}
      {list.slice(0, limit).map((m) => {
        const f = findVariant(db, m.variantId);
        return (
          <div key={m.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <span className={cx("grid size-9 shrink-0 place-items-center rounded-full", m.qty > 0 ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad")}>{m.qty > 0 ? <I.plus size={15} /> : <I.minus size={15} />}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {f ? `${f.product.name} · ${f.variant.sizeMl}ml` : "Deleted product"}
              </p>
              <p className="truncate text-xs text-muted">
                {MOVE_LABEL[m.type]} · {m.reason}
                {m.ref && m.ref !== m.reason ? ` · ${m.ref}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className={cx("text-sm font-bold tabular-nums", m.qty > 0 ? "text-ok" : "text-bad")}>
                {m.qty > 0 ? "+" : ""}
                {m.qty}
              </p>
              <p className="text-[10px] text-muted">
                bal. {m.balance} · {dateTime(m.at, db.settings.locale)}
              </p>
            </div>
          </div>
        );
      })}
      {list.length > limit && (
        <div className="p-3 text-center">
          <Button variant="soft" size="sm" onClick={() => setLimit(limit + 100)}>
            Show more ({list.length - limit})
          </Button>
        </div>
      )}
    </Card>
  );
}
