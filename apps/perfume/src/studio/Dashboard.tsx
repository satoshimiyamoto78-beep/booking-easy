import { useMemo, useState } from "react";
import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { Badge, Button, Card, cx } from "../components/ui";
import { isLow, isOut, useStore } from "../lib/store";
import { money, relTime } from "../lib/format";
import { navigate } from "../lib/router";
import { STATUS_TONE } from "../shop/Account";

const DAY = 86400000;

export function Dashboard() {
  const { db } = useStore();
  const s = db.settings;
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const stats = useMemo(() => {
    const now = Date.now();
    const valid = db.orders.filter((o) => o.status !== "cancelled");
    const inWin = (o: { createdAt: string }, from: number, to: number) => {
      const t = new Date(o.createdAt).getTime();
      return t >= now - from * DAY && t < now - to * DAY;
    };
    const cur = valid.filter((o) => inWin(o, 30, 0));
    const prev = valid.filter((o) => inWin(o, 60, 30));
    const rev = cur.reduce((a, o) => a + o.total, 0);
    const prevRev = prev.reduce((a, o) => a + o.total, 0);
    const variants = db.products.filter((p) => p.status !== "archived").flatMap((p) => p.variants.map((v) => ({ p, v })));
    const units = variants.reduce((a, x) => a + Math.max(0, x.v.stock), 0);
    const costValue = variants.reduce((a, x) => a + Math.max(0, x.v.stock) * x.v.cost, 0);
    const retailValue = variants.reduce((a, x) => a + Math.max(0, x.v.stock) * x.v.price, 0);
    const low = variants.filter((x) => x.p.status === "active" && (isLow(x.v) || isOut(x.v)));

    // daily series
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(now - (range - 1 - i) * DAY);
      d.setHours(0, 0, 0, 0);
      return { d, total: 0, count: 0 };
    });
    for (const o of valid) {
      const t = new Date(o.createdAt);
      t.setHours(0, 0, 0, 0);
      const b = days.find((x) => x.d.getTime() === t.getTime());
      if (b) {
        b.total += o.total;
        b.count++;
      }
    }

    // top sellers (30d)
    const units30 = new Map<string, number>();
    for (const o of cur) for (const it of o.items) units30.set(it.productId, (units30.get(it.productId) ?? 0) + it.qty);
    const top = [...units30.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => ({ p: db.products.find((p) => p.id === id), n }))
      .filter((x) => x.p);

    // stock by family
    const fam = db.families.map((f) => ({
      f,
      units: variants.filter((x) => x.p.familyId === f.id).reduce((a, x) => a + Math.max(0, x.v.stock), 0),
    }));

    return {
      rev,
      delta: prevRev ? ((rev - prevRev) / prevRev) * 100 : null,
      orders: cur.length,
      aov: cur.length ? rev / cur.length : 0,
      units,
      costValue,
      retailValue,
      low,
      days,
      top,
      fam,
      pending: db.orders.filter((o) => o.status === "pending"),
    };
  }, [db, range]);

  const max = Math.max(1, ...stats.days.map((d) => d.total));
  const famMax = Math.max(1, ...stats.fam.map((f) => f.units));
  const hour = new Date().getHours();

  return (
    <div className="rise">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"} 👋</p>
          <h1 className="font-display text-[32px] leading-tight md:text-[40px]">Overview</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/studio/inventory?receive=1")}>
            <I.download size={16} /> Receive stock
          </Button>
          <Button onClick={() => navigate("/studio/orders/new")}>
            <I.plus size={16} /> New order
          </Button>
        </div>
      </div>

      {/* Hero metric */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <p className="text-sm text-muted">Revenue · last 30 days</p>
          <div className="mt-1 flex items-end gap-3">
            <p className="font-display text-5xl tracking-tight">{money(stats.rev, s)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {stats.delta !== null ? (
              <p className={cx("flex items-center gap-1 text-sm font-semibold", stats.delta >= 0 ? "text-ok" : "text-bad")}>
                <span>{stats.delta >= 0 ? "↗" : "↘"}</span> {Math.abs(stats.delta).toFixed(0)}%<span className="font-normal text-muted">vs previous 30 days</span>
              </p>
            ) : (
              <p className="text-sm text-muted">First month of sales</p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="eyebrow">Daily revenue</p>
            <div className="flex gap-1 rounded-full bg-soft p-1">
              {([7, 14, 30] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cx("h-7 rounded-full px-3 text-[11px] font-bold", range === r ? "bg-card shadow-sm" : "text-muted")}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex h-40 items-end gap-[3px]">
            {stats.days.map((d) => (
              <div key={d.d.toISOString()} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-md bg-inverse/85 transition group-hover:bg-accent"
                  style={{ height: `${Math.max(2, (d.total / max) * 100)}%`, opacity: d.total ? 1 : 0.15 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-xl bg-inverse px-2.5 py-1.5 text-center text-[11px] whitespace-nowrap text-on-inverse group-hover:block">
                  <b>{money(d.total, s)}</b>
                  <br />
                  {d.d.toLocaleDateString(s.locale, { day: "numeric", month: "short" })} · {d.count} orders
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted">
            <span>{stats.days[0].d.toLocaleDateString(s.locale, { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Kpi icon={<I.receipt size={18} />} tint="#3b6fd6" value={String(stats.orders)} label="Orders (30d)" />
          <Kpi icon={<I.chart size={18} />} tint="#8b5cf6" value={money(stats.aov, s)} label="Avg. order value" />
          <Kpi icon={<I.layers size={18} />} tint="#b8925a" value={stats.units.toLocaleString()} label="Units in stock" />
          <Kpi icon={<I.tag size={18} />} tint="#3f8f5f" value={money(stats.retailValue, s)} label={`Retail value · cost ${money(stats.costValue, s)}`} />
        </div>
      </div>

      {/* Alert banner */}
      {stats.low.length > 0 && (
        <div className="relative mt-4 flex items-center gap-4 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#3a1d14] to-[#7a3a24] p-5 text-white">
          <I.alert size={110} className="absolute -right-4 -bottom-6 text-white/8" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {stats.low.length} size{stats.low.length > 1 ? "s" : ""} need restocking
            </p>
            <p className="mt-0.5 truncate text-sm text-white/70">
              {stats.low
                .slice(0, 3)
                .map((x) => `${x.p.name} ${x.v.sizeMl}ml (${x.v.stock})`)
                .join(" · ")}
              {stats.low.length > 3 && " …"}
            </p>
          </div>
          <button onClick={() => navigate("/studio/inventory?filter=low")} className="relative h-10 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-black">
            Review
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Recent orders</h2>
            <button onClick={() => navigate("/studio/orders")} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
              See all <I.chevR size={14} />
            </button>
          </div>
          {db.orders.slice(0, 6).map((o) => (
            <button key={o.id} onClick={() => navigate(`/studio/orders/${o.id}`)} className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-soft">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-soft font-display text-sm">{o.customer.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.customer.name}</p>
                <p className="text-xs text-muted">
                  {o.number} · {o.channel} · {relTime(o.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{money(o.total, s)}</p>
                <Badge tone={STATUS_TONE[o.status]} className="mt-0.5 capitalize">
                  {o.status}
                </Badge>
              </div>
            </button>
          ))}
          {db.orders.length === 0 && <p className="py-8 text-center text-sm text-muted">No orders yet.</p>}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-[15px] font-bold">Top sellers · 30 days</h2>
            {stats.top.length === 0 && <p className="py-4 text-sm text-muted">No sales in this period.</p>}
            {stats.top.map(({ p, n }, i) => (
              <button key={p!.id} onClick={() => navigate(`/studio/products/${p!.id}`)} className="flex w-full items-center gap-3 py-1.5 text-left">
                <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
                <div className="grid size-10 place-items-center rounded-xl bg-soft">
                  <Bottle product={p!} label={false} className="h-8 w-auto" />
                </div>
                <span className="flex-1 truncate text-sm font-semibold">{p!.name}</span>
                <span className="text-xs font-bold">{n} sold</span>
              </button>
            ))}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-[15px] font-bold">Stock by family</h2>
            <div className="space-y-2.5">
              {stats.fam.map(({ f, units }) => (
                <div key={f.id} className="flex items-center gap-3 text-sm">
                  <span className="w-20 truncate text-xs font-semibold">{f.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                    <div className="h-full rounded-full" style={{ width: `${(units / famMax) * 100}%`, background: f.color }} />
                  </div>
                  <span className="w-10 text-right text-xs text-muted tabular-nums">{units}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, tint, value, label }: { icon: React.ReactNode; tint: string; value: string; label: string }) {
  return (
    <Card className="flex flex-col p-5">
      <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: tint }}>
        {icon}
      </span>
      <p className="mt-auto pt-6 text-xl font-bold tracking-tight md:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </Card>
  );
}
