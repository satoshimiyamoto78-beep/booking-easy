import { ServiceCategory } from "@booking-easy/db";

type ServiceFormValues = {
  id?: string;
  name?: string;
  description?: string | null;
  category?: string;
  durationMinutes?: number;
  priceCents?: number;
  active?: boolean;
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
    <form action={action} className="max-w-xl space-y-4">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

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
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ServiceCategory.BARBER}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          >
            <option value={ServiceCategory.BARBER}>Barbershop</option>
            <option value={ServiceCategory.SPA}>Spa</option>
            <option value={ServiceCategory.SALON}>Salon</option>
          </select>
        </div>
        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium">
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
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
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
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="rounded border-neutral-300 dark:border-neutral-700"
        />
        Visible to customers
      </label>

      <button
        type="submit"
        className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-neutral-950"
      >
        {submitLabel}
      </button>
    </form>
  );
}
