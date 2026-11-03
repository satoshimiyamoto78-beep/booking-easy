import { Bottle } from "../components/Bottle";
import { I } from "../components/icons";
import { useStore } from "../lib/store";
import { navigate } from "../lib/router";
import { Logo } from "../components/Logo";

export function Welcome() {
  const { db, updateSettings } = useStore();
  const s = db.settings;
  const hero = db.products.filter((p) => p.status === "active").slice(0, 3);
  const go = (to: string) => {
    updateSettings({ onboarded: true });
    navigate(to);
  };
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#121110] text-[#f4f1ea]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(201,164,107,.28),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(110,64,38,.4),transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 md:px-10">
        <Logo onDark className="h-11 md:h-12" />
        <button onClick={() => go("/studio")} className="h-10 rounded-full border-[1.5px] border-white/30 px-4 text-[13px] font-semibold text-white/80 transition-colors hover:border-white hover:text-white">
          Staff Studio
        </button>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end gap-8 px-5 pt-6 pb-10 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="pointer-events-none flex items-end justify-center md:order-2 md:w-1/2">
          {hero.map((p, i) => (
            <div key={p.id} className="rise w-[32%] max-w-56" style={{ animationDelay: `${i * 110}ms`, transform: `translateY(${i === 1 ? -20 : 0}px) scale(${i === 1 ? 1.1 : 0.92})` }}>
              <Bottle product={p} brand={s.brandName} className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.5)]" />
            </div>
          ))}
        </div>
        <div className="md:order-1 md:w-1/2">
          <p className="mb-4 inline-flex h-8 items-center rounded-full border border-white/25 px-3 text-[12px] font-medium text-white/70">Dushanbe · Tajikistan</p>
          <h1 className="font-display text-[52px] leading-[.95] md:text-[84px]">
            Find the scent
            <br />
            that feels <em className="text-[#d9b87c]">like you</em>
          </h1>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-white/70">{s.tagline} Order online and pay when it arrives.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => go("/")}
              className="group flex h-14 items-center justify-between gap-6 rounded-full border-[1.5px] border-[#f4f1ea] bg-[#f4f1ea] pr-2 pl-6 text-[15px] font-semibold text-[#121110] transition-colors hover:bg-white sm:min-w-72"
            >
              Shop the collection
              <span className="grid size-10 place-items-center rounded-full bg-[#121110] text-[#f4f1ea] transition-transform group-hover:translate-x-0.5">
                <I.arrowR size={18} />
              </span>
            </button>
            <button onClick={() => go("/shop")} className="h-14 rounded-full border-[1.5px] border-white/30 px-6 text-[15px] font-semibold text-white/85 transition-colors hover:border-white">
              Browse catalogue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
