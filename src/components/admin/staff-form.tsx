import { DAY_LABELS, minutesToTime } from "@/lib/schedule";

type ServiceOption = { id: string; name: string };
type ScheduleEntry = { dayOfWeek: number; startMinute: number; endMinute: number };

type StaffFormValues = {
  id?: string;
  name?: string;
  title?: string | null;
  bio?: string | null;
  active?: boolean;
  serviceIds?: string[];
  schedule?: ScheduleEntry[];
};

export function StaffForm({
  action,
  services,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  services: ServiceOption[];
  defaultValues?: StaffFormValues;
  submitLabel: string;
}) {
  const scheduleByDay = new Map(
    (defaultValues?.schedule ?? []).map((s) => [s.dayOfWeek, s]),
  );
  const selectedServiceIds = new Set(defaultValues?.serviceIds ?? []);

  return (
    <form action={action} className="max-w-2xl space-y-8">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues?.name}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={defaultValues?.title ?? ""}
            placeholder="e.g. Master Barber"
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          defaultValue={defaultValues?.bio ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="rounded border-neutral-300 dark:border-neutral-700"
        />
        Active
      </label>

      <div>
        <p className="text-sm font-medium">Services offered</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="serviceIds"
                value={service.id}
                defaultChecked={selectedServiceIds.has(service.id)}
                className="rounded border-neutral-300 dark:border-neutral-700"
              />
              {service.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Weekly schedule</p>
        <div className="mt-2 space-y-2">
          {DAY_LABELS.map((label, day) => {
            const existing = scheduleByDay.get(day);
            return (
              <div key={day} className="flex items-center gap-3 text-sm">
                <label className="flex w-32 items-center gap-2">
                  <input
                    type="checkbox"
                    name={`day-${day}-enabled`}
                    defaultChecked={Boolean(existing)}
                    className="rounded border-neutral-300 dark:border-neutral-700"
                  />
                  {label}
                </label>
                <input
                  type="time"
                  name={`day-${day}-start`}
                  defaultValue={existing ? minutesToTime(existing.startMinute) : "09:00"}
                  className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                />
                <span className="text-neutral-400">to</span>
                <input
                  type="time"
                  name={`day-${day}-end`}
                  defaultValue={existing ? minutesToTime(existing.endMinute) : "18:00"}
                  className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-neutral-950"
      >
        {submitLabel}
      </button>
    </form>
  );
}
