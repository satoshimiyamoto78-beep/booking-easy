import { ServiceCategory } from "@booking-easy/db";
import { ToggleField } from "@/components/ui/toggle-field";
import { ImageUploadField } from "@/components/ui/image-upload-field";

type ServiceFormValues = {
  id?: string;
  name?: string;
  description?: string | null;
  category?: string;
  durationMinutes?: number;
  priceCents?: number;
  active?: boolean;
  imageUrl?: string | null;
};

export function ServiceForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ServiceFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div>
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input id="name" name="name" required defaultValue={defaultValues?.name} className="input" />
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ""}
          className="textarea"
        />
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Photo"
        defaultValue={defaultValues?.imageUrl}
        hint="Shown on the services grid and the customer booking page."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ServiceCategory.BARBER}
            className="select"
          >
            <option value={ServiceCategory.BARBER}>Barbershop</option>
            <option value={ServiceCategory.SPA}>Spa</option>
            <option value={ServiceCategory.SALON}>Salon</option>
          </select>
        </div>
        <div>
          <label htmlFor="durationMinutes" className="field-label">
            Duration (min)
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            step={5}
            required
            defaultValue={defaultValues?.durationMinutes ?? 30}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="price" className="field-label">
            Price ($)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={
              defaultValues?.priceCents !== undefined
                ? (defaultValues.priceCents / 100).toFixed(2)
                : undefined
            }
            className="input"
          />
        </div>
      </div>

      <div className="card p-4">
        <ToggleField
          name="active"
          label="Visible to customers"
          description="Turn off to hide this service from the booking page."
          defaultChecked={defaultValues?.active ?? true}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
