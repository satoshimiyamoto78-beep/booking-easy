"use client";

import { useState } from "react";

const PRESETS = [
  "#0f9d70", // emerald (default)
  "#2454c7", // blue
  "#7c3aed", // violet
  "#c92a6c", // rose
  "#c98a3e", // gold
  "#dc4b30", // terracotta
  "#0d9488", // teal
  "#525252", // graphite
];

export function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [color, setColor] = useState(defaultValue || "#0f9d70");

  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-3">
        <label
          className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border"
          style={{ borderColor: "var(--border-strong)", background: color }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          name={name}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="input"
          style={{ maxWidth: 140, fontFamily: "var(--font-mono)" }}
          pattern="^#[0-9a-fA-F]{6}$"
          maxLength={7}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              className="h-6 w-6 rounded-full border transition-transform hover:scale-110"
              style={{
                background: preset,
                borderColor: preset === color ? "var(--text-primary)" : "transparent",
              }}
              aria-label={`Use ${preset}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
        Used for buttons and accents on your customer booking page.
      </p>
    </div>
  );
}
