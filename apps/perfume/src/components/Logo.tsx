import defaultLogo from "../assets/loris-logo.png?inline";
import { cx } from "./ui";
import { useStore } from "../lib/store";

/**
 * Brand logo. Uses the logo uploaded in Settings, or the bundled Loris Parfum mark.
 * The mark is single-colour, so on dark surfaces it is inverted to white.
 */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const { db } = useStore();
  const src = db.settings.logo || defaultLogo;
  return (
    <img
      src={src}
      alt={db.settings.brandName}
      draggable={false}
      className={cx("block w-auto select-none", onDark ? "invert" : "dark:invert", className)}
    />
  );
}
