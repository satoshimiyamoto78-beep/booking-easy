import { DAY_LABELS, minutesToTime } from "@/lib/schedule";
import { ToggleField } from "@/components/ui/toggle-field";
import { ImageUploadField } from "@/components/ui/image-upload-field";

type ServiceOption = { id: string; name: string };
type ScheduleEntry = { dayOfWeek: number; startMinute: number; endMinute: number };

type StaffFormValues = {
  id?: string;
  name?: string;
  title?: string | null;
  bio?: string | null;
  active?: boolean;
  photoUrl?: string | null;
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
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input id="name" name="name" required defaultValue={defaultValues?.name} className="input" />
        </div>
        <div>
          <label htmlFor="title" className="field-label">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={defaultValues?.title ?? ""}
            placeholder="e.g. Master Barber"
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="field-label">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={2}
          defaultValue={defaultValues?.bio ?? ""}
          className="textarea"
        />
      </div>

      <ImageUploadField name="photoUrl" label="Photo" defaultValue={defaultValues?.photoUrl} shape="circle" />

      <div className="card p-4">
        <ToggleField name="active" label="Active" defaultChecked={defaultValues?.active ?? true} />
      </div>

      <div>
        <p className="field-label">Services offered</p>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <label key={service.id} className="chip-checkbox">
              <input
                type="checkbox"
                name="serviceIds"
                value={service.id}
                defaultChecked={selectedServiceIds.has(service.id)}
              />
              {service.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="field-label">Weekly schedule</p>
        <div className="card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {DAY_LABELS.map((label, day) => {
            const existing = scheduleByDay.get(day);
            return (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <label className="flex w-28 items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    name={`day-${day}-enabled`}
                    defaultChecked={Boolean(existing)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {label}
                </label>
                <input
                  type="time"
                  name={`day-${day}-start`}
                  defaultValue={existing ? minutesToTime(existing.startMinute) : "09:00"}
                  className="input"
                  style={{ width: "auto" }}
                />
                <span style={{ color: "var(--text-tertiary)" }}>to</span>
                <input
                  type="time"
                  name={`day-${day}-end`}
                  defaultValue={existing ? minutesToTime(existing.endMinute) : "18:00"}
                  className="input"
                  style={{ width: "auto" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
