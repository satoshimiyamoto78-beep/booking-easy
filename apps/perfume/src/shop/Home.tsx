import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { SectionHead } from "../components/ui";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";
import { ProductCard, visibleProducts } from "./ProductCard";

export function Home() {
  const { db } = useStore();
  const s = db.settings;
  const list = visibleProducts(db.products, s.showOutOfStock);
  const featured = list.find((p) => p.featured) ?? list[0];
  const best = list.filter((p) => p.bestseller).slice(0, 4);
  const fresh = [...list].filter((p) => p.isNew).concat(list.filter((p) => !p.isNew)).slice(0, 8);
  const bag = db.cart.reduce((a, c) => a + c.qty, 0);

  return (
    <div className="px-4 pt-3 md:px-6 md:pt-8">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div>
          <p className="eyebrow">{s.brandName}</p>
          <h1 className="font-display text-[32px] leading-tight">Discover</h1>
        </div>
        <div className="flex gap-2">
          <button aria-label="Search" onClick={() => navigate("/shop?focus=1")} className="grid size-10 place-items-center rounded-full border border-line bg-card">
            <I.search size={18} />
          </button>
          <button aria-label="Bag" onClick={() => navigate("/bag")} className="relative grid size-10 place-items-center rounded-full border border-line bg-card">
            <I.bag size={18} />
            {bag > 0 && <span className="absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{bag}</span>}
          </button>
        </div>
      </div>

      {/* Hero */}
      {featured && (
        <button
          onClick={() => navigate(`/p/${featured.id}`)}
          className="rise relative flex w-full overflow-hidden rounded-[28px] bg-[#16120f] text-left text-white md:min-h-[380px]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(217,184,124,.45),transparent_55%)]" />
          <div className="relative z-10 flex flex-1 flex-col justify-end p-6 md:p-12">
            <p className="text-[10px] font-semibold tracking-[.3em] text-white/60 uppercase">The {new Date().getFullYear()} collection</p>
            <h2 className="mt-2 font-display text-[28px] leading-[1.05] md:text-6xl">
              {featured.name}
              <span className="block text-base text-white/60 italic md:text-2xl">{featured.concentration}</span>
            </h2>
            <p className="mt-3 hidden max-w-md text-sm text-white/70 md:block">{featured.description}</p>
            <span className="mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white px-5 text-xs font-bold tracking-wider text-black uppercase">
              Discover <I.arrowR size={14} />
            </span>
          </div>
          <div className="relative flex w-[42%] items-end justify-center pt-6 pr-4 md:w-[40%]">
            <Bottle product={featured} brand={s.brandName} className="h-48 w-auto drop-shadow-[0_25px_30px_rgba(0,0,0,.6)] md:h-80" />
          </div>
        </button>
      )}

      {/* Families */}
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {db.families.map((f) => (
          <button
            key={f.id}
            onClick={() => navigate(`/shop?family=${f.id}`)}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-card pr-4 pl-1.5 text-xs font-bold tracking-[.14em] uppercase hover:border-ink/40"
          >
            <span className="size-8 rounded-full" style={{ background: `linear-gradient(135deg, ${f.color}, ${f.color}88)` }} />
            {f.name}
          </button>
        ))}
      </div>

      {best.length > 0 && (
        <section className="mt-8">
          <SectionHead
            title="Best sellers"
            action={
              <button onClick={() => navigate("/shop?sort=best")} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                Show all <I.arrowR size={14} />
              </button>
            }
          />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-5">
            {best.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Collections */}
      {db.collections.length > 0 && (
        <section className="mt-10">
          <SectionHead title="Collections" />
          <div className="grid gap-3 md:grid-cols-2">
            {db.collections.map((c, i) => {
              const sample = list.filter((p) => p.collectionId === c.id).slice(0, 3);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/shop?collection=${c.id}`)}
                  className={`group flex items-center gap-4 overflow-hidden rounded-[24px] border border-line p-5 text-left ${i % 2 ? "bg-card" : "bg-soft"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-2xl">{c.name}</p>
                    <p className="mt-1 text-xs text-muted">{c.description}</p>
                    <p className="mt-3 text-[11px] font-bold tracking-[.16em] uppercase">{sample.length} fragrances →</p>
                  </div>
                  <div className="flex h-24 items-end -space-x-5">
                    {sample.map((p) => (
                      <Bottle key={p.id} product={p} label={false} className="h-20 w-auto transition group-hover:-translate-y-1" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionHead
          title="New & noteworthy"
          action={
            <button onClick={() => navigate("/shop?sort=new")} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
              View all <I.arrowR size={14} />
            </button>
          }
        />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:px-0">
          {fresh.map((p) => (
            <ProductCard key={p.id} p={p} className="w-[44%] shrink-0 snap-start md:w-auto" />
          ))}
        </div>
      </section>

      <footer className="mt-14 border-t border-line py-8 text-center">
        <p className="font-display text-2xl">{s.brandName}</p>
        <p className="mt-1 text-xs text-muted">{s.tagline}</p>
      </footer>
    </div>
  );
}
