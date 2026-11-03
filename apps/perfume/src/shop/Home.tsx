import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { LinkArrow, SectionHead } from "../components/ui";
import { useStore } from "../lib/store";
import { money } from "../lib/format";
import { navigate } from "../lib/router";
import { Logo } from "../components/Logo";
import { ProductCard, visibleProducts } from "./ProductCard";

export function Home() {
  const { db } = useStore();
  const s = db.settings;
  const list = visibleProducts(db.products, s.showOutOfStock);
  const featured = list.find((p) => p.featured) ?? list[0];
  const best = list.filter((p) => p.bestseller).slice(0, 4);
  const fresh = list.filter((p) => p.isNew).concat(list.filter((p) => !p.isNew)).slice(0, 4);

  return (
    <div className="flex flex-col gap-12 px-4 pt-4 md:gap-16 md:px-6 md:pt-8">
      {featured && (
        <section className="rise grid overflow-hidden rounded-2xl border border-inverse bg-[#151311] text-[#f4f1ea] md:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10 flex flex-col justify-end gap-4 p-6 md:p-12">
            <p className="text-[12px] font-semibold tracking-[.1em] text-white/55 uppercase">Featured · {featured.concentration}</p>
            <h1 className="font-display text-[44px] leading-[.95] md:text-[72px]">{featured.name}</h1>
            <p className="max-w-md text-[15px] leading-relaxed text-white/70">{featured.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button onClick={() => navigate(`/p/${featured.id}`)} className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-[#f4f1ea] bg-[#f4f1ea] px-6 text-[14px] font-semibold text-[#151311]">
                Discover <I.arrowR size={16} />
              </button>
              <span className="text-[14px] text-white/60">from {money(Math.min(...featured.variants.map((v) => v.price)), s)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/p/${featured.id}`)}
            aria-label={featured.name}
            className="relative flex min-h-56 items-end justify-center bg-[radial-gradient(circle_at_50%_55%,rgba(217,184,124,.35),transparent_60%)] px-6 pt-8 md:min-h-[420px]"
          >
            <Bottle product={featured} brand={s.brandName} className="h-52 w-auto drop-shadow-[0_25px_30px_rgba(0,0,0,.6)] md:h-80" />
          </button>
        </section>
      )}

      <section>
        <SectionHead title="Shop by family" action={<LinkArrow onClick={() => navigate("/shop")}>All scents</LinkArrow>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {db.families.map((f) => {
            const n = list.filter((p) => p.familyId === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => navigate(`/shop?family=${f.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left transition-colors hover:border-ink md:flex-col md:items-start md:p-4"
              >
                <span className="size-9 shrink-0 rounded-full border border-black/5 md:size-10" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}99)` }} />
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold">{f.name}</span>
                  <span className="block text-[12.5px] text-muted">{n} {n === 1 ? "scent" : "scents"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {best.length > 0 && (
        <section>
          <SectionHead title="Best sellers" action={<LinkArrow onClick={() => navigate("/shop?sort=best")}>Show all</LinkArrow>} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {best.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {db.collections.length > 0 && (
        <section>
          <SectionHead title="Collections" />
          <div className="grid gap-3 md:grid-cols-2">
            {db.collections.map((c) => {
              const sample = list.filter((p) => p.collectionId === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/shop?collection=${c.id}`)}
                  className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-card p-5 text-left transition-colors hover:border-ink"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[28px]">{c.name}</p>
                    <p className="mt-1 text-[14px] text-muted">{c.description}</p>
                    <p className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold">
                      {sample.length} fragrances <I.arrowR size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </div>
                  <div className="flex h-24 shrink-0 items-end -space-x-4">
                    {sample.slice(0, 3).map((p) => (
                      <Bottle key={p.id} product={p} label={false} className="h-20 w-auto" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHead title="New arrivals" action={<LinkArrow onClick={() => navigate("/shop?sort=new")}>View all</LinkArrow>} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {fresh.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [I.truck, "Delivery", s.freeShippingOver > 0 ? `${money(s.shippingFee, s)}, free over ${money(s.freeShippingOver, s)}` : money(s.shippingFee, s)],
          [I.cash, "Pay on delivery", "Cash or card when your order arrives"],
          [I.store, "Visit the shop", "Try every scent in person in Dushanbe"],
        ].map(([Icon, t, d]) => {
          const C = Icon as typeof I.truck;
          return (
            <div key={String(t)} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-2">
                <C size={18} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{String(t)}</span>
                <span className="block text-[13.5px] text-muted">{String(d)}</span>
              </span>
            </div>
          );
        })}
      </section>

      <footer className="flex flex-col items-center gap-3 border-t border-line py-10 text-center">
        <Logo className="h-14" />
        <p className="text-[14px] text-muted">{s.tagline}</p>
      </footer>
    </div>
  );
}
