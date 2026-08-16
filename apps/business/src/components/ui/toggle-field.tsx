"use client";

import { useState } from "react";

export function ToggleField({
  name,
  label,
  defaultChecked = false,
  description,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  description?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs" style={{ color: "var(--text-tertiary)" }}>
            {description}
          </span>
        )}
      </span>
      <span className="switch" data-checked={checked}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="sr-only"
        />
        <span className="switch-knob" />
      </span>
    </label>
  );
}
