import { useMemo, useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Badge, Button, Card, CardHead, LinkArrow, Segmented, cx } from "../components/ui";
import { countsAsSale, findVariant, isLow, isOut, suggestedReorder, useStore } from "../lib/store";
import { money, r2, relTime } from "../lib/format";
import { navigate } from "../lib/router";
import type { Order } from "../lib/types";
import { STATUS_TONE } from "../shop/Account";

const DAY = 86400000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function Dashboard() {
  const { db } = useStore();
  const s = db.settings;
  const [range, setRange] = useState<"7" | "14" | "30">("14");

  const stats = useMemo(() => {
    const today = startOfDay(Date.now());
    const sales = db.orders.filter(countsAsSale);
    // Calendar windows: the last 30 days including today, and the 30 days before that.
    const inWindow = (o: Order, fromDaysAgo: number, toDaysAgo: number) => {
      const t = startOfDay(new Date(o.createdAt).getTime());
      return t > today - fromDaysAgo * DAY && t <= today - toDaysAgo * DAY;
    };
    const cur = sales.filter((o) => inWindow(o, 30, 0));
    const prev = sales.filter((o) => inWindow(o, 60, 30));
    const gross = r2(cur.reduce((a, o) => a + o.total, 0));
    const prevGross = r2(prev.reduce((a, o) => a + o.total, 0));
    // Profit = merchandise revenue without VAT and delivery, minus current unit cost of the goods sold.
    const merchNet = (o: Order) => o.subtotal - o.discount - (s.taxInclusive ? o.tax : 0);
    const cogs = (o: Order) => o.items.reduce((a, it) => a + (findVariant(db, it.variantId)?.variant.cost ?? 0) * it.qty, 0);
    const revenueExVat = r2(cur.reduce((a, o) => a + merchNet(o), 0));
    const profit = r2(cur.reduce((a, o) => a + merchNet(o) - cogs(o), 0));
    const variants = db.products.filter((p) => p.status !== "archived").flatMap((p) => p.variants.map((v) => ({ p, v })));
    const units = variants.reduce((a, x) => a + Math.max(0, x.v.stock), 0);
    const costValue = r2(variants.reduce((a, x) => a + Math.max(0, x.v.stock) * x.v.cost, 0));
    const retailValue = r2(variants.reduce((a, x) => a + Math.max(0, x.v.stock) * x.v.price, 0));
    const low = variants.filter((x) => x.p.status === "active" && (isLow(x.v) || isOut(x.v))).sort((a, b) => a.v.stock - b.v.stock);

    const n = Number(range);
    const days = Array.from({ length: n }, (_, i) => ({ t: today - (n - 1 - i) * DAY, total: 0, count: 0 }));
    for (const o of sales) {
      const b = days.find((x) => x.t === startOfDay(new Date(o.createdAt).getTime()));
      if (b) {
        b.total = r2(b.total + o.total);
        b.count++;
      }
    }
    const sold = new Map<string, number>();
    for (const o of cur) for (const it of o.items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.qty);
    const top = [...sold.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .flatMap(([id, q]) => {
        const p = db.products.find((x) => x.id === id);
        return p ? [{ p, q }] : [];
      });
    return {
      gross,
      delta: prevGross > 0 ? ((gross - prevGross) / prevGross) * 100 : null,
      orders: cur.length,
      aov: cur.length ? r2(gross / cur.length) : 0,
      revenueExVat,
      profit,
      margin: revenueExVat > 0 ? (profit / revenueExVat) * 100 : 0,
      units,
      costValue,
      retailValue,
      low,
      days,
      top,
      pending: db.orders.filter((o) => o.status === "pending").length,
      toShip: db.orders.filter((o) => o.status === "confirmed" || o.status === "packed").length,
    };
  }, [db, range, s.taxInclusive]);

  const max = Math.max(1, ...stats.days.map((d) => d.total));
  const niceMax = Math.ceil(max / 500) * 500 || 500;
  const hour = new Date().getHours();
  const fmtDay = (t: number) => new Date(t).toLocaleDateString(s.locale, { day: "numeric", month: "short" });

  return (
    <div className="rise">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow mb-1">{hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}</p>
          <h1 className="font-display text-[40px] md:text-[48px]">Overview</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {stats.pending} new order{stats.pending === 1 ? "" : "s"} to confirm · {stats.toShip} to pack or ship
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={() => navigate("/studio/inventory?receive=1")}>
            <I.download size={16} /> Receive stock
          </Button>
          <Button onClick={() => navigate("/studio/orders/new")}>
            <I.plus size={16} /> New sale
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 md:p-6">
            <div>
              <p className="text-[14px] font-medium text-muted">Sales · last 30 days</p>
              <p className="mt-1 text-[36px] leading-tight font-semibold tracking-tight md:text-[42px]">{money(stats.gross, s)}</p>
              {stats.delta !== null ? (
                <p className={cx("mt-1 text-[14px] font-semibold", stats.delta >= 0 ? "text-ok" : "text-bad")}>
                  {stats.delta >= 0 ? "▲" : "▼"} {Math.abs(stats.delta).toFixed(1)}% <span className="font-normal text-muted">vs previous 30 days</span>
                </p>
              ) : (
                <p className="mt-1 text-[14px] text-muted">No sales in the previous 30 days to compare</p>
              )}
            </div>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
              ]}
            />
          </div>
          <div className="p-5 md:p-6">
            <div className="relative flex h-48 gap-3">
              <div className="flex flex-col justify-between pb-0 text-right text-[11px] text-muted tabular-nums">
                <span>{niceMax.toLocaleString(s.locale)}</span>
                <span>{(niceMax / 2).toLocaleString(s.locale)}</span>
                <span>0</span>
              </div>
              <div className="relative flex flex-1 items-end gap-[3px] border-b border-line-2">
                <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                {stats.days.map((d) => (
                  <div key={d.t} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className={cx("w-full rounded-t-[4px] transition-colors", d.total ? "bg-ink group-hover:bg-accent" : "bg-line")} style={{ height: d.total ? `${(d.total / niceMax) * 100}%` : "2px" }} />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-xl border border-inverse bg-inverse px-3 py-2 text-center text-[12px] whitespace-nowrap text-on-inverse group-hover:block">
                      <b className="text-[13px]">{money(d.total, s)}</b>
                      <br />
                      {fmtDay(d.t)} · {d.count} order{d.count === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between pl-10 text-[12px] text-muted">
              <span>{fmtDay(stats.days[0].t)}</span>
              <span>Today</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Kpi icon={<I.receipt size={18} />} value={String(stats.orders)} label="Orders" note="last 30 days" />
          <Kpi icon={<I.chart size={18} />} value={money(stats.aov, s)} label="Average order" note="incl. VAT & delivery" />
          <Kpi icon={<I.percent size={18} />} value={money(stats.profit, s)} label="Gross profit" note={`${stats.margin.toFixed(0)}% margin, excl. VAT`} />
          <Kpi icon={<I.layers size={18} />} value={stats.units.toLocaleString(s.locale)} label="Bottles in stock" note={`worth ${money(stats.costValue, s)} at cost`} />
        </div>
      </div>

      {stats.low.length > 0 && s.lowStockAlerts && (
        <Card className="mt-4 border-warn/40">
          <CardHead
            title={
              <span className="flex items-center gap-2">
                <I.alert size={18} className="text-warn" /> {stats.low.length} size{stats.low.length > 1 ? "s" : ""} need restocking
              </span>
            }
            sub="Suggested order brings each size back to 3× its reorder point"
            action={<LinkArrow onClick={() => navigate("/studio/inventory?filter=low")}>Review all</LinkArrow>}
          />
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
            {stats.low.slice(0, 6).map(({ p, v }) => (
              <button key={v.id} onClick={() => navigate(`/studio/products/${p.id}`)} className="flex items-center gap-3 px-5 py-3.5 text-left hover:bg-soft">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-soft">
                  <Bottle product={p} label={false} className="h-9 w-auto" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{p.name}</p>
                  <p className="text-[13px] text-muted">
                    {v.sizeMl} ml · order {suggestedReorder(v)}
                  </p>
                </div>
                <Badge tone={isOut(v) ? "bad" : "warn"}>{isOut(v) ? "Sold out" : `${v.stock} left`}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHead title="Recent orders" action={<LinkArrow onClick={() => navigate("/studio/orders")}>All orders</LinkArrow>} />
          {db.orders.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No orders yet.</p>}
          <div className="divide-y divide-line">
            {db.orders.slice(0, 6).map((o) => (
              <button key={o.id} onClick={() => navigate(`/studio/orders/${o.id}`)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-soft">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2 text-[14px] font-semibold">{initials(o.customer.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{o.customer.name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {o.number} · {o.channel} · {relTime(o.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[14.5px] font-semibold tabular-nums">{money(o.total, s)}</p>
                  <Badge tone={STATUS_TONE[o.status]} className="capitalize">
                    {o.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Best sellers" sub="Bottles sold, last 30 days" />
          {stats.top.length === 0 && <p className="py-10 text-center text-[14px] text-muted">No sales in this period.</p>}
          <div className="divide-y divide-line">
            {stats.top.map(({ p, q }, i) => (
              <button key={p.id} onClick={() => navigate(`/studio/products/${p.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-soft">
                <span className="w-5 text-[14px] font-semibold text-muted tabular-nums">{i + 1}</span>
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-soft">
                  <Bottle product={p} label={false} className="h-8 w-auto" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{p.name}</span>
                <span className="text-[14px] font-semibold tabular-nums">{q}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-line px-5 py-4 text-[13.5px] text-muted">
            Stock at retail value <b className="text-ink tabular-nums">{money(stats.retailValue, s)}</b>
          </div>
        </Card>
      </div>
    </div>
  );
}

const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

function Kpi({ icon, value, label, note }: { icon: React.ReactNode; value: string; label: string; note: string }) {
  return (
    <Card className="flex flex-col p-5">
      <span className="grid size-10 place-items-center rounded-full border border-line-2 text-ink-2">{icon}</span>
      <p className="mt-auto pt-6 text-[14px] font-medium text-ink-2">{label}</p>
      <p className="text-[22px] leading-tight font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[12.5px] text-muted">{note}</p>
    </Card>
  );
}
