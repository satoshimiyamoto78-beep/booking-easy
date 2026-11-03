import { useEffect, useMemo, useRef, useState } from "react";
import { I } from "../components/icons";
import { Chip, Empty, Modal, Button, cx } from "../components/ui";
import { minPrice, useStore } from "../lib/store";
import { navigate } from "../lib/router";
import type { Concentration, Gender } from "../lib/types";
import { ProductCard, visibleProducts } from "./ProductCard";

const SORTS = { featured: "Featured", best: "Best sellers", new: "Newest", low: "Price: low to high", high: "Price: high to low", az: "Name A–Z" } as const;
type Sort = keyof typeof SORTS;

export function Catalogue({ query }: { query: URLSearchParams }) {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<string>(query.get("family") ?? "");
  const [collection, setCollection] = useState<string>(query.get("collection") ?? "");
  const [sort, setSort] = useState<Sort>((query.get("sort") as Sort) || "featured");
  const [genders, setGenders] = useState<Gender[]>([]);
  const [concs, setConcs] = useState<Concentration[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.get("focus")) searchRef.current?.focus();
  }, [query]);

  const list = useMemo(() => {
    let l = visibleProducts(db.products, db.settings.showOutOfStock);
    const t = q.trim().toLowerCase();
    if (t)
      l = l.filter((p) =>
        [p.name, p.description, p.concentration, ...p.notes.top, ...p.notes.heart, ...p.notes.base, ...p.tags].join(" ").toLowerCase().includes(t),
      );
    if (family) l = l.filter((p) => p.familyId === family);
    if (collection) l = l.filter((p) => p.collectionId === collection);
    if (genders.length) l = l.filter((p) => genders.includes(p.gender));
    if (concs.length) l = l.filter((p) => concs.includes(p.concentration));
    const by: Record<Sort, (a: typeof l[number], b: typeof l[number]) => number> = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.bestseller) - Number(a.bestseller),
      best: (a, b) => Number(b.bestseller) - Number(a.bestseller),
      new: (a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt),
      low: (a, b) => minPrice(a) - minPrice(b),
      high: (a, b) => minPrice(b) - minPrice(a),
      az: (a, b) => a.name.localeCompare(b.name),
    };
    return [...l].sort(by[sort]);
  }, [db, q, family, collection, genders, concs, sort]);

  const activeFilters = genders.length + concs.length + (collection ? 1 : 0);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="px-4 pt-3 md:px-6 md:pt-8">
      <div className="mb-4 flex items-center justify-between md:hidden">
        <h1 className="font-display text-[32px]">Catalogue</h1>
        <span className="text-xs font-semibold text-muted">{list.length} scents</span>
      </div>
      <div className="mb-1 hidden items-end justify-between md:flex">
        <div>
          <p className="eyebrow">The catalogue</p>
          <h1 className="font-display text-5xl">All fragrances</h1>
        </div>
        <span className="text-sm text-muted">{list.length} scents</span>
      </div>

      <div className="sticky top-0 z-20 -mx-4 bg-paper/90 px-4 pt-2 pb-3 backdrop-blur-xl md:top-16 md:mx-0 md:px-0 md:pt-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <I.search size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scents, notes, moods…"
              className="h-12 w-full rounded-full border border-line bg-card pr-4 pl-11 text-sm outline-none focus:border-ink/50"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="relative flex h-12 items-center gap-2 rounded-full bg-inverse px-4 text-sm font-semibold text-on-inverse"
            aria-label="Filters and sorting"
          >
            <I.filter size={18} /> <span className="hidden sm:inline">Filter</span>
            {activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px]">{activeFilters}</span>}
          </button>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <Chip active={!family} onClick={() => setFamily("")}>
            All
          </Chip>
          {db.families.map((f) => (
            <Chip key={f.id} active={family === f.id} onClick={() => setFamily(family === f.id ? "" : f.id)}>
              {f.name}
            </Chip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<I.search size={26} />}
          title="No scents found"
          text="Try a different note or clear your filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setFamily("");
                setCollection("");
                setGenders([]);
                setConcs([]);
              }}
            >
              Clear all
            </Button>
          }
        />
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5">
          {list.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Refine"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setGenders([]);
                setConcs([]);
                setCollection("");
                setSort("featured");
              }}
            >
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show {list.length}
            </Button>
          </>
        }
      >
        <FilterGroup title="Sort by">
          {(Object.keys(SORTS) as Sort[]).map((k) => (
            <Chip key={k} active={sort === k} onClick={() => setSort(k)}>
              {SORTS[k]}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="Collection">
          {db.collections.map((c) => (
            <Chip key={c.id} active={collection === c.id} onClick={() => setCollection(collection === c.id ? "" : c.id)}>
              {c.name}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="For">
          {(["Feminine", "Masculine", "Unisex"] as Gender[]).map((g) => (
            <Chip key={g} active={genders.includes(g)} onClick={() => setGenders(toggle(genders, g))}>
              {g}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title="Concentration">
          {(["Extrait", "Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne"] as Concentration[]).map((c) => (
            <Chip key={c} active={concs.includes(c)} onClick={() => setConcs(toggle(concs, c))}>
              {c}
            </Chip>
          ))}
        </FilterGroup>
        <button className={cx("mt-2 text-xs text-muted underline")} onClick={() => navigate("/shop")}>
          Clear URL filters
        </button>
      </Modal>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="eyebrow mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
