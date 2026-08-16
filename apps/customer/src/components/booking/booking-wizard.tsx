"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createBooking } from "@/lib/actions/booking";
import { formatCategory, formatDuration, formatPrice } from "@booking-easy/shared";
import { Check } from "lucide-react";

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

type Slot = { startsAt: string; endsAt: string };

const STEP_LABELS = ["Service", "Stylist", "Time", "Your info"];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
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

  const slotsKey = `${serviceId ?? ""}|${staffId ?? ""}|${date}`;
  const slots = slotsResult?.key === slotsKey ? slotsResult.slots : [];
  const loadingSlots = step === 3 && Boolean(serviceId && staffId) && slotsResult?.key !== slotsKey;

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

  return (
    <div>
      <ol className="mb-10 flex items-center gap-2 text-xs font-medium">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const stepState: "done" | "current" | "upcoming" =
            step > stepNum ? "done" : step === stepNum ? "current" : "upcoming";
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              style={{ color: stepState === "upcoming" ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              <span className="step-dot" data-state={stepState}>
                {stepState === "done" ? <Check size={12} strokeWidth={3} /> : stepNum}
              </span>
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

          <div className="flex justify-end">
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

          <div className="flex justify-between">
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

      {step === 3 && selectedStaff && (
        <div className="space-y-6">
          <div>
            <label htmlFor="date" className="field-label">
              Date
            </label>
            <input
              id="date"
              type="date"
              min={todayIso()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="input"
              style={{ maxWidth: 220 }}
            />
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
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
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
            )}
          </div>

          <div className="flex justify-between">
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

      {step === 4 && selectedService && selectedStaff && selectedSlot && (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="businessSlug" value={businessSlug} />
          <input type="hidden" name="serviceId" value={selectedService.id} />
          <input type="hidden" name="staffId" value={selectedStaff.id} />
          <input type="hidden" name="startsAt" value={selectedSlot.startsAt} />

          <div className="card p-4 text-sm">
            <p className="font-medium">{selectedService.name}</p>
            <p style={{ color: "var(--text-tertiary)" }}>
              with {selectedStaff.name} ·{" "}
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

          <div className="flex justify-between">
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
