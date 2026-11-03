import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { I } from "./icons";
import { useStore } from "../lib/store";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/*
  Size scale (height):  sm 36 · md 44 · lg 52
  Radius scale:         controls = pill · inputs 12 · cards 16 · sheets 24
  Stroke:               containers 1px --line · controls 1.5px --line-2 / ink
*/

type BtnVariant = "primary" | "outline" | "ghost" | "soft" | "danger" | "accent";
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  const v: Record<BtnVariant, string> = {
    primary: "border-inverse bg-inverse text-on-inverse hover:bg-ink-2 hover:border-ink-2",
    accent: "border-accent bg-accent text-white hover:brightness-110",
    outline: "border-ink bg-card text-ink hover:bg-inverse hover:text-on-inverse",
    soft: "border-line-2 bg-card text-ink hover:border-ink",
    ghost: "border-transparent text-ink-2 hover:bg-soft hover:text-ink",
    danger: "border-bad/40 bg-card text-bad hover:bg-bad hover:text-white hover:border-bad",
  };
  const s = { sm: "h-9 px-3.5 text-[13px] gap-1.5", md: "h-11 px-5 text-[14px] gap-2", lg: "h-13 px-7 text-[15px] gap-2.5" }[size];
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-full border-[1.5px] font-semibold whitespace-nowrap transition-colors duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-40",
        v[variant],
        s,
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
}

export function IconButton({ className, children, label, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx("inline-grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-line-2 bg-card text-ink transition-colors hover:border-ink active:scale-95", className)}
      {...p}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-2xl border border-line bg-card", className)} {...p}>
      {children}
    </div>
  );
}

/** Card header row: title on the left, optional action on the right, hairline below. */
export function CardHead({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block min-w-0", className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full min-w-0 rounded-xl border border-line-2 bg-card px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/70 hover:border-ink/50 focus:border-ink focus:ring-2 focus:ring-ink/10";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(inputCls, "h-12", className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cx(inputCls, "min-h-24 resize-y py-3 leading-relaxed", className)} {...p} />
);
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative min-w-0">
    <select className={cx(inputCls, "h-12 appearance-none pr-10", className)} {...p}>
      {children}
    </select>
    <I.chevD size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
  </div>
);

/** Search box with icon — one style everywhere. */
export function SearchInput({ value, onChange, placeholder, inputRef, className }: { value: string; onChange: (v: string) => void; placeholder: string; inputRef?: React.Ref<HTMLInputElement>; className?: string }) {
  return (
    <div className={cx("relative min-w-0 flex-1", className)}>
      <I.search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-line-2 bg-card pr-4 pl-11 text-[15px] outline-none transition-colors placeholder:text-muted/70 hover:border-ink/50 focus:border-ink focus:ring-2 focus:ring-ink/10"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative h-7 w-12 shrink-0 rounded-full border-[1.5px] transition-colors", checked ? "border-inverse bg-inverse" : "border-line-2 bg-soft")}
    >
      <span className={cx("absolute top-[2px] size-5 rounded-full shadow-sm transition-all", checked ? "left-[22px] bg-on-inverse" : "left-[2px] bg-card ring-1 ring-line-2")} />
    </button>
  );
}

/** Segmented control (2–4 options). */
export function Segmented<T extends string>({ value, options, onChange, className }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx("inline-flex rounded-full border border-line-2 bg-card p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx("h-9 flex-1 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors", value === o.value ? "bg-inverse text-on-inverse" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "ok" | "warn" | "bad" | "dark" | "accent"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "border-line-2 text-ink-2",
    ok: "border-ok/35 bg-ok/8 text-ok",
    warn: "border-warn/35 bg-warn/8 text-warn",
    bad: "border-bad/35 bg-bad/8 text-bad",
    dark: "border-inverse bg-inverse text-on-inverse",
    accent: "border-accent/40 bg-accent/8 text-accent",
  }[tone];
  return (
    <span className={cx("inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold whitespace-nowrap", t, className)}>
      {tone !== "neutral" && tone !== "dark" && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[13.5px] font-medium whitespace-nowrap transition-colors",
        active ? "border-inverse bg-inverse text-on-inverse" : "border-line-2 bg-card text-ink-2 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 9999 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full border-[1.5px] border-line-2 bg-card">
      <button aria-label="Decrease" className="grid h-full w-10 place-items-center rounded-l-full hover:bg-soft disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <I.minus size={16} />
      </button>
      <span className="min-w-8 text-center text-[15px] font-semibold tabular-nums">{value}</span>
      <button aria-label="Increase" className="grid h-full w-10 place-items-center rounded-r-full hover:bg-soft disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <I.plus size={16} />
      </button>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx("sheet flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-card shadow-2xl sm:rounded-3xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h3 className="text-[18px] font-semibold">{title}</h3>
          <IconButton label="Close" onClick={onClose} className="size-9">
            <I.x size={16} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex gap-3 border-t border-line px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(16px,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx("sheet flex max-w-md items-center gap-2.5 rounded-full border px-5 py-3 text-[14px] font-medium shadow-xl", t.tone === "error" ? "border-bad bg-bad text-white" : "border-inverse bg-inverse text-on-inverse")}
        >
          {t.tone === "success" && <I.check size={16} />}
          {t.tone === "error" && <I.alert size={16} />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full border border-line-2 text-muted">{icon}</div>
      <p className="text-[18px] font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[14px] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-3">
      <h2 className="font-display text-[28px] md:text-[32px]">{title}</h2>
      {action}
    </div>
  );
}

export function LinkArrow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
      {children} <I.arrowR size={15} />
    </button>
  );
}

type Ask = { msg: string; resolve: (ok: boolean) => void };
let pushAsk: ((a: Ask) => void) | null = null;

/** In-page replacement for window.confirm (which embedded/sandboxed viewers block). */
export function ask(msg: string): Promise<boolean> {
  return new Promise((resolve) => (pushAsk ? pushAsk({ msg, resolve }) : resolve(false)));
}

export function ConfirmHost() {
  const [q, setQ] = useState<Ask | null>(null);
  useEffect(() => {
    pushAsk = setQ;
    return () => {
      pushAsk = null;
    };
  }, []);
  const done = (ok: boolean) => {
    q?.resolve(ok);
    setQ(null);
  };
  return (
    <Modal
      open={!!q}
      onClose={() => done(false)}
      title="Please confirm"
      footer={
        <>
          <Button variant="soft" className="flex-1" onClick={() => done(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => done(true)} autoFocus>
            Confirm
          </Button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-2">{q?.msg}</p>
    </Modal>
  );
}
