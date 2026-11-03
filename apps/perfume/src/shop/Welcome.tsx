import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";

export function Welcome() {
  const { db, updateSettings } = useStore();
  const s = db.settings;
  const hero = db.products.filter((p) => p.status === "active").slice(0, 3);
  const go = (to: string) => {
    updateSettings({ onboarded: true });
    navigate(to);
  };
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0f0d0b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(201,164,107,.35),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(120,70,40,.45),transparent_60%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-10 pb-8 md:flex-row md:items-center md:gap-10 md:px-10">
        <div className="pointer-events-none flex flex-1 items-end justify-center gap-0 pt-6 md:order-2 md:items-center">
          {hero.map((p, i) => (
            <div
              key={p.id}
              className="rise w-[34%] max-w-52"
              style={{ animationDelay: `${i * 120}ms`, transform: `translateY(${i === 1 ? -24 : 0}px) scale(${i === 1 ? 1.12 : 0.92})` }}
            >
              <Bottle product={p} brand={s.brandName} className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.5)]" />
            </div>
          ))}
        </div>
        <div className="relative md:order-1 md:flex-1">
          <p className="mb-4 text-[11px] font-semibold tracking-[.32em] text-white/60 uppercase">{s.brandName}</p>
          <h1 className="font-display text-[46px] leading-[.98] tracking-tight uppercase md:text-7xl">
            Wear a <br />
            scent that <br />
            <em className="text-[#d9b87c] normal-case">remembers</em> you
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">{s.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => go("/")}
              className="group flex h-14 flex-1 items-center justify-between rounded-full border border-white/40 bg-white/5 pr-2 pl-6 text-sm font-semibold tracking-wider uppercase backdrop-blur transition hover:bg-white/10 sm:max-w-xs"
            >
              Explore the house
              <span className="grid size-10 place-items-center rounded-full bg-white text-black transition group-hover:translate-x-0.5">
                <I.arrowR size={18} />
              </span>
            </button>
            <button onClick={() => go("/studio")} className="h-14 rounded-full px-6 text-sm font-semibold text-white/70 hover:text-white">
              Open Studio <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
