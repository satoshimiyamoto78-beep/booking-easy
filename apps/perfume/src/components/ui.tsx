import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { I } from "./icons";
import { useStore } from "../lib/store";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type BtnVariant = "primary" | "outline" | "ghost" | "soft" | "danger" | "accent";
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  const v: Record<BtnVariant, string> = {
    primary: "bg-inverse text-on-inverse hover:opacity-90",
    accent: "bg-accent text-white hover:brightness-105",
    outline: "border border-line bg-card text-ink hover:border-ink/40",
    ghost: "text-ink hover:bg-soft",
    soft: "bg-soft text-ink hover:bg-line/70",
    danger: "bg-bad/10 text-bad hover:bg-bad/15",
  };
  const s = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-13 px-6 text-[15px] gap-2.5" }[size];
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-40",
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
      className={cx("inline-grid size-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink transition hover:border-ink/40 active:scale-95", className)}
      {...p}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-3xl border border-line bg-card", className)} {...p}>
      {children}
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border border-line bg-soft px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink/50 focus:bg-card";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cx(inputCls, className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cx(inputCls, "min-h-24 resize-y", className)} {...p} />
);
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select className={cx(inputCls, "appearance-none pr-9", className)} {...p}>
      {children}
    </select>
    <I.chevD size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
  </div>
);

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative h-6.5 w-11 shrink-0 rounded-full transition", checked ? "bg-inverse" : "bg-line")}
    >
      <span className={cx("absolute top-0.75 size-5 rounded-full bg-card shadow transition-all", checked ? "left-5.25" : "left-0.75")} />
    </button>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "ok" | "warn" | "bad" | "dark" | "accent"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "bg-soft text-ink-2 border-line",
    ok: "bg-ok/10 text-ok border-ok/20",
    warn: "bg-warn/10 text-warn border-warn/25",
    bad: "bg-bad/10 text-bad border-bad/20",
    dark: "bg-inverse text-on-inverse border-transparent",
    accent: "bg-accent/12 text-accent border-accent/25",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", t, className)}>{children}</span>;
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "h-9 shrink-0 rounded-full border px-4 text-xs font-semibold tracking-wide whitespace-nowrap uppercase transition",
        active ? "border-inverse bg-inverse text-on-inverse" : "border-line bg-card text-ink-2 hover:border-ink/40",
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 9999 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <button aria-label="Decrease" className="grid size-7 place-items-center rounded-full hover:bg-soft disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <I.minus size={14} />
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums">{value}</span>
      <button aria-label="Increase" className="grid size-7 place-items-center rounded-full bg-inverse text-on-inverse disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <I.plus size={14} />
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
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx("sheet flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-card shadow-2xl sm:rounded-[28px]", wide ? "sm:max-w-2xl" : "sm:max-w-md")}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-display text-xl">{title}</h3>
          <IconButton label="Close" onClick={onClose} className="size-9">
            <I.x size={16} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            "sheet flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl",
            t.tone === "error" ? "bg-bad text-white" : "bg-inverse text-on-inverse",
          )}
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
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-soft text-muted">{icon}</div>
      <p className="font-display text-xl">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {action}
    </div>
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
          <Button variant="outline" className="flex-1" onClick={() => done(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => done(true)} autoFocus>
            Confirm
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{q?.msg}</p>
    </Modal>
  );
}
