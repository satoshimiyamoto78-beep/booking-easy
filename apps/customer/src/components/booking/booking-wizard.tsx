"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createBooking } from "@/lib/actions/booking";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";
import { Check, ChevronLeft, ChevronRight, Users, CalendarDays } from "lucide-react";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
};

type StaffOption = {
  id: string;
  name: string;
  title: string | null;
  serviceIds: string[];
};

type Slot = { startsAt: string; endsAt: string; staffId: string };

const STEP_LABELS = ["Service", "Professional", "Time", "Your info"];
const ANY_STAFF = "any";
const DATE_STRIP_DAYS = 14;

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function todayIso() {
  return toIso(new Date());
}

function groupSlots(slots: Slot[]) {
  const groups: { label: string; slots: Slot[] }[] = [
    { label: "Morning", slots: [] },
    { label: "Afternoon", slots: [] },
    { label: "Evening", slots: [] },
  ];
  for (const slot of slots) {
    const hour = new Date(slot.startsAt).getHours();
    const group = hour < 12 ? groups[0] : hour < 17 ? groups[1] : groups[2];
    group.slots.push(slot);
  }
  return groups.filter((g) => g.slots.length > 0);
}

export function BookingWizard({
  businessSlug,
  services,
  staff,
  initialServiceId,
}: {
  businessSlug: string;
  services: ServiceOption[];
  staff: StaffOption[];
  initialServiceId?: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso());
  const [slotsResult, setSlotsResult] = useState<{ key: string; slots: Slot[] } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const eligibleStaff = useMemo(
    () => (serviceId ? staff.filter((s) => s.serviceIds.includes(serviceId)) : []),
    [staff, serviceId],
  );

  const selectedStaff = useMemo(
    () => eligibleStaff.find((s) => s.id === staffId) ?? null,
    [eligibleStaff, staffId],
  );

  const resolvedStaffName = useMemo(() => {
    if (!selectedSlot) return null;
    return staff.find((s) => s.id === selectedSlot.staffId)?.name ?? null;
  }, [staff, selectedSlot]);

  const slotsKey = `${serviceId ?? ""}|${staffId ?? ""}|${date}`;
  const slots = slotsResult?.key === slotsKey ? slotsResult.slots : [];
  const loadingSlots = step === 3 && Boolean(serviceId && staffId) && slotsResult?.key !== slotsKey;
  const slotGroups = useMemo(() => groupSlots(slots), [slots]);

  useEffect(() => {
    if (step !== 3 || !serviceId || !staffId) return;
    let cancelled = false;
    const key = `${serviceId}|${staffId}|${date}`;

    fetch(
      `/api/availability?slug=${businessSlug}&serviceId=${serviceId}&staffId=${staffId}&date=${date}`,
    )
      .then((res) => res.json())
      .then((data: { slots: Slot[] }) => {
        if (!cancelled) setSlotsResult({ key, slots: data.slots ?? [] });
      });

    return () => {
      cancelled = true;
    };
  }, [step, serviceId, staffId, date, businessSlug]);

  const [state, formAction, pending] = useActionState(createBooking, undefined);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, ServiceOption[]>();
    for (const service of services) {
      const list = byCategory.get(service.category) ?? [];
      list.push(service);
      byCategory.set(service.category, list);
    }
    return byCategory;
  }, [services]);

  const dateStrip = useMemo(() => {
    const days: { iso: string; weekday: string; day: number; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < DATE_STRIP_DAYS; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      days.push({
        iso: toIso(d),
        weekday: d.toLocaleDateString([], { weekday: "short" }),
        day: d.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  type SummaryItem = { step: 1 | 2 | 3; label: string; detail: string | null };
  const summaryItems: SummaryItem[] = [];
  if (selectedService) {
    summaryItems.push({
      step: 1,
      label: selectedService.name,
      detail: `${formatDuration(selectedService.durationMinutes)} · ${formatPrice(selectedService.priceCents)}`,
    });
  }
  if (staffId) {
    summaryItems.push({
      step: 2,
      label: staffId === ANY_STAFF ? "Any available professional" : (selectedStaff?.name ?? ""),
      detail: null,
    });
  }
  if (selectedSlot) {
    summaryItems.push({
      step: 3,
      label: new Date(selectedSlot.startsAt).toLocaleString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      detail: resolvedStaffName && staffId === ANY_STAFF ? `with ${resolvedStaffName}` : null,
    });
  }

  return (
    <div ref={topRef} className="scroll-mt-24 pb-28 sm:pb-0">
      <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const stepState: "done" | "current" | "upcoming" =
            step > stepNum ? "done" : step === stepNum ? "current" : "upcoming";
          const canJump = step > stepNum;
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              style={{ color: stepState === "upcoming" ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && setStep(stepNum as 1 | 2 | 3 | 4)}
                className="step-dot"
                data-state={stepState}
                style={{ cursor: canJump ? "pointer" : "default" }}
              >
                {stepState === "done" ? <Check size={12} strokeWidth={3} /> : stepNum}
              </button>
              <span className="hidden sm:inline">{label}</span>
              {i < STEP_LABELS.length - 1 && (
                <span className="mx-1" style={{ color: "var(--border-strong)" }}>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {summaryItems.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {summaryItems.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setStep(item.step)}
              className="badge badge-accent"
              style={{ cursor: "pointer" }}
            >
              {item.label}
              {item.detail && <span style={{ opacity: 0.7 }}>· {item.detail}</span>}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          {[...grouped.entries()].map(([category, options]) => (
            <div key={category}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                {formatCategory(category)}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {options.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setServiceId(service.id);
                      setStaffId(null);
                      setSelectedSlot(null);
                    }}
                    data-selected={serviceId === service.id}
                    className="option-card p-4"
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="booking-actions">
            <span className="hidden sm:block" />
            <button
              type="button"
              disabled={!serviceId}
              onClick={() => setStep(2)}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && selectedService && (
        <div className="space-y-6">
          {eligibleStaff.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No team members currently offer this service. Please choose a different service.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {eligibleStaff.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffId(ANY_STAFF);
                    setSelectedSlot(null);
                  }}
                  data-selected={staffId === ANY_STAFF}
                  className="option-card flex items-center gap-3 p-4"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--brand) 12%, var(--surface))" }}
                  >
                    <Users size={16} style={{ color: "var(--brand)" }} />
                  </span>
                  <span>
                    <span className="block font-medium">Any available professional</span>
                    <span className="block text-sm" style={{ color: "var(--text-tertiary)" }}>
                      Fastest booking — we&apos;ll match you automatically
                    </span>
                  </span>
                </button>
              )}
              {eligibleStaff.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setStaffId(member.id);
                    setSelectedSlot(null);
                  }}
                  data-selected={staffId === member.id}
                  className="option-card p-4"
                >
                  <p className="font-medium">{member.name}</p>
                  {member.title && (
                    <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {member.title}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="booking-actions">
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
              Back
            </button>
            <button
              type="button"
              disabled={!staffId}
              onClick={() => setStep(3)}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && staffId && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <p className="field-label mb-0">Date</p>
              <button
                type="button"
                onClick={() => hiddenDateInputRef.current?.showPicker?.()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--brand)" }}
              >
                <CalendarDays size={13} />
                Pick a date
              </button>
              <input
                ref={hiddenDateInputRef}
                type="date"
                min={todayIso()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
            </div>
            <div className="mt-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => dateStripRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
                className="btn-ghost hidden shrink-0 rounded-full p-1.5 sm:flex"
                aria-label="Scroll earlier"
              >
                <ChevronLeft size={16} />
              </button>
              <div
                ref={dateStripRef}
                className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {dateStrip.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setDate(d.iso);
                      setSelectedSlot(null);
                    }}
                    data-selected={date === d.iso}
                    className="option-card flex shrink-0 flex-col items-center px-3.5 py-2.5"
                    style={{ minWidth: 58 }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {d.isToday ? "Today" : d.weekday}
                    </span>
                    <span className="mt-0.5 text-base font-semibold">{d.day}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => dateStripRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
                className="btn-ghost hidden shrink-0 rounded-full p-1.5 sm:flex"
                aria-label="Scroll later"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div>
            <p className="field-label">Available times</p>
            {loadingSlots ? (
              <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                Loading times…
              </p>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                No openings that day. Try another date.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {slotGroups.map((group) => (
                  <div key={group.label}>
                    <p
                      className="mb-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.slots.map((slot) => {
                        const label = new Date(slot.startsAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        });
                        const isSelected = selectedSlot?.startsAt === slot.startsAt;
                        return (
                          <button
                            key={slot.startsAt}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            data-selected={isSelected}
                            className="option-card px-3 py-2.5 text-center text-sm font-medium"
                            style={isSelected ? { background: "var(--brand)", color: "var(--brand-contrast)" } : undefined}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="booking-actions">
            <button type="button" onClick={() => setStep(2)} className="btn btn-secondary">
              Back
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && selectedService && selectedSlot && (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="businessSlug" value={businessSlug} />
          <input type="hidden" name="serviceId" value={selectedService.id} />
          <input type="hidden" name="staffId" value={selectedSlot.staffId} />
          <input type="hidden" name="startsAt" value={selectedSlot.startsAt} />

          <div className="card p-4 text-sm">
            <p className="font-medium">{selectedService.name}</p>
            <p style={{ color: "var(--text-tertiary)" }}>
              with {resolvedStaffName ?? "your specialist"} ·{" "}
              {new Date(selectedSlot.startsAt).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="field-label">
                Full name
              </label>
              <input id="name" name="name" required className="input" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input id="email" name="email" type="email" required className="input" />
            </div>
            <div>
              <label htmlFor="phone" className="field-label">
                Phone (optional)
              </label>
              <input id="phone" name="phone" type="tel" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="field-label">
                Notes (optional)
              </label>
              <textarea id="notes" name="notes" rows={3} className="textarea" />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm" style={{ color: "#dc4b30" }}>
              {state.error}
            </p>
          )}

          <div className="booking-actions">
            <button type="button" onClick={() => setStep(3)} className="btn btn-secondary">
              Back
            </button>
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
