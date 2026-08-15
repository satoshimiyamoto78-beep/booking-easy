"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createBooking } from "@/lib/actions/booking";
import { formatCategory, formatDuration, formatPrice } from "@/lib/format";

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
      <ol className="mb-8 flex items-center gap-2 text-xs font-medium text-neutral-400">
        {["Service", "Stylist", "Time", "Your info"].map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${
              step === i + 1 ? "text-amber-600 dark:text-amber-400" : ""
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                step > i + 1
                  ? "border-amber-500 bg-amber-500 text-white"
                  : step === i + 1
                    ? "border-amber-500"
                    : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {i + 1}
            </span>
            {label}
            {i < 3 && <span className="mx-1 text-neutral-300 dark:text-neutral-700">/</span>}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-8">
          {[...grouped.entries()].map(([category, options]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
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
                    className={`rounded-xl border p-4 text-left transition ${
                      serviceId === service.id
                        ? "border-amber-500 ring-1 ring-amber-500"
                        : "border-neutral-200 hover:border-amber-400 dark:border-neutral-800"
                    }`}
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
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
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && selectedService && (
        <div className="space-y-6">
          {eligibleStaff.length === 0 ? (
            <p className="text-sm text-neutral-500">
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
                  className={`rounded-xl border p-4 text-left transition ${
                    staffId === member.id
                      ? "border-amber-500 ring-1 ring-amber-500"
                      : "border-neutral-200 hover:border-amber-400 dark:border-neutral-800"
                  }`}
                >
                  <p className="font-medium">{member.name}</p>
                  {member.title && (
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {member.title}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold dark:border-neutral-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!staffId}
              onClick={() => setStep(3)}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedStaff && (
        <div className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">
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
              className="mt-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            />
          </div>

          <div>
            <p className="text-sm font-medium">Available times</p>
            {loadingSlots ? (
              <p className="mt-3 text-sm text-neutral-500">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">
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
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-500 text-neutral-950"
                          : "border-neutral-200 hover:border-amber-400 dark:border-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold dark:border-neutral-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
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

          <div className="rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <p className="font-medium">{selectedService.name}</p>
            <p className="text-neutral-500 dark:text-neutral-400">
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
              <label htmlFor="name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              />
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold dark:border-neutral-700"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 disabled:opacity-60"
            >
              {pending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
