import { useId } from "react";
import type { Product } from "../lib/types";

interface Props {
  product: Pick<Product, "bottle" | "name" | "image">;
  brand?: string;
  className?: string;
  label?: boolean;
}

/** A procedurally drawn glass flacon, tinted per product. Falls back from an uploaded photo. */
export function Bottle({ product, brand = "", className = "", label = true }: Props) {
  const id = useId().replace(/:/g, "");
  if (product.image)
    return <img src={product.image} alt={product.name} className={`h-full w-full object-cover ${className}`} loading="lazy" />;

  const { shape, liquid, cap } = product.bottle;
  const g = (s: string) => `${s}-${id}`;

  const bodies: Record<string, { body: string; neck: [number, number, number, number]; capR: [number, number, number, number]; labelY: number; liquidTop: number }> = {
    square: { body: "M48 96 h104 a14 14 0 0 1 14 14 v118 a14 14 0 0 1 -14 14 h-104 a14 14 0 0 1 -14 -14 v-118 a14 14 0 0 1 14 -14z", neck: [86, 82, 28, 16], capR: [80, 38, 40, 46], labelY: 156, liquidTop: 116 },
    round: { body: "M100 92 c42 0 72 30 72 76 c0 46 -30 76 -72 76 c-42 0 -72 -30 -72 -76 c0 -46 30 -76 72 -76z", neck: [88, 78, 24, 18], capR: [76, 34, 48, 46], labelY: 164, liquidTop: 122 },
    tall: { body: "M66 84 h68 a12 12 0 0 1 12 12 v136 a12 12 0 0 1 -12 12 h-68 a12 12 0 0 1 -12 -12 v-136 a12 12 0 0 1 12 -12z", neck: [90, 70, 20, 16], capR: [84, 22, 32, 50], labelY: 160, liquidTop: 104 },
    facet: { body: "M70 92 h60 l36 36 v80 l-36 36 h-60 l-36 -36 v-80z", neck: [86, 78, 28, 16], capR: [72, 26, 56, 54], labelY: 162, liquidTop: 118 },
  };
  const b = bodies[shape] ?? bodies.square;
  const word = (product.name.split(" ")[0] || "").toUpperCase().slice(0, 12);
  const wordSize = word.length > 7 ? Math.max(5, 7.5 - (word.length - 7) * 0.6) : 7.5;

  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label={product.name}>
      <defs>
        <linearGradient id={g("glass")} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".12" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#fff" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={g("liq")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={liquid} stopOpacity=".75" />
          <stop offset="1" stopColor={liquid} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={g("cap")} x1="0" x2="1">
          <stop offset="0" stopColor={cap} />
          <stop offset=".35" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".5" stopColor={cap} />
          <stop offset="1" stopColor={cap} stopOpacity=".85" />
        </linearGradient>
        <clipPath id={g("clip")}>
          <path d={b.body} />
        </clipPath>
        <radialGradient id={g("shadow")} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="248" rx="70" ry="8" fill={`url(#${g("shadow")})`} />
      {/* glass body */}
      <path d={b.body} fill="#fff" fillOpacity=".35" stroke="#000" strokeOpacity=".08" />
      <g clipPath={`url(#${g("clip")})`}>
        <rect x="0" y={b.liquidTop} width="200" height="160" fill={`url(#${g("liq")})`} />
        <rect x="0" y={b.liquidTop} width="200" height="3" fill="#fff" fillOpacity=".35" />
        <rect x="0" y="0" width="200" height="260" fill={`url(#${g("glass")})`} />
        <rect x="44" y="90" width="9" height="160" fill="#fff" fillOpacity=".35" />
      </g>
      {/* neck + cap */}
      <rect x={b.neck[0]} y={b.neck[1]} width={b.neck[2]} height={b.neck[3]} rx="2" fill="#d9d4cc" />
      <rect x={b.capR[0]} y={b.capR[1]} width={b.capR[2]} height={b.capR[3]} rx="4" fill={`url(#${g("cap")})`} />
      {label && (
        <g>
          <rect x="70" y={b.labelY - 16} width="60" height="34" rx="2" fill="#fbf8f2" fillOpacity=".92" stroke="#000" strokeOpacity=".15" strokeWidth=".6" />
          <text x="100" y={b.labelY - 2} textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontWeight="700" fontSize={wordSize} letterSpacing={word.length > 7 ? 0.6 : 1.2} fill="#111">
            {word}
          </text>
          <text x="100" y={b.labelY + 9} textAnchor="middle" fontFamily="Onest, sans-serif" fontSize="4" letterSpacing="1.4" fill="#555">
            {brand.toUpperCase().slice(0, 18)}
          </text>
        </g>
      )}
    </svg>
  );
}
