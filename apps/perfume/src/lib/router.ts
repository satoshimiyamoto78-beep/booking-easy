import { useEffect, useState } from "react";

function current() {
  const h = window.location.hash.replace(/^#/, "") || "/";
  const [path, qs = ""] = h.split("?");
  return { path: path || "/", query: new URLSearchParams(qs) };
}

export function useRoute() {
  const [r, setR] = useState(current);
  useEffect(() => {
    const on = () => {
      setR(current());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}

export function navigate(to: string) {
  window.location.hash = to;
}

/** Match "/studio/products/:id" against a path. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
