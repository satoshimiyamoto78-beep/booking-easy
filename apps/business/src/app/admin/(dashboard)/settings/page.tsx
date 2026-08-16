import { verifySession } from "@/lib/dal";
import { prisma } from "@booking-easy/db";
import { updateBusinessSettings } from "@/lib/actions/settings";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { ColorField } from "@/components/ui/color-field";

export default async function SettingsPage() {
  const { businessId } = await verifySession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Business profile and customer-facing branding.
      </p>

      <form action={updateBusinessSettings} className="mt-6 max-w-2xl space-y-8">
        <div className="card space-y-5 p-5">
          <h2 className="text-sm font-semibold">Business profile</h2>

          <div>
            <label htmlFor="name" className="field-label">
              Business name
            </label>
            <input id="name" name="name" required defaultValue={business.name} className="input" />
          </div>

          <div>
            <label htmlFor="tagline" className="field-label">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={business.tagline ?? ""}
              placeholder="e.g. Barbershop · Spa · Salon"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="address" className="field-label">
              Address
            </label>
            <input id="address" name="address" defaultValue={business.address ?? ""} className="input" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="field-label">
                Phone
              </label>
              <input id="phone" name="phone" defaultValue={business.phone ?? ""} className="input" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={business.email ?? ""}
                className="input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="instagram" className="field-label">
              Instagram
            </label>
            <input
              id="instagram"
              name="instagram"
              placeholder="@yourbusiness"
              defaultValue={business.instagram ?? ""}
              className="input"
            />
          </div>
        </div>

        <div className="card space-y-5 p-5">
          <h2 className="text-sm font-semibold">Branding</h2>

          <ImageUploadField
            name="logoUrl"
            label="Logo"
            defaultValue={business.logoUrl}
            hint="Shown on your customer booking page."
          />

          <ColorField name="brandColor" label="Brand color" defaultValue={business.brandColor} />
        </div>

        <button type="submit" className="btn btn-primary">
          Save settings
        </button>
      </form>
    </div>
  );
}
