"use client";

import { useActionState, useState } from "react";
import { signup } from "@/lib/actions/signup";
import type { PlanDefinition } from "@/lib/billing/plans";
import { formatPrice } from "@booking-easy/shared";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SignupForm({ plans, initialTier }: { plans: PlanDefinition[]; initialTier: string }) {
  const [state, formAction, pending] = useActionState(signup, undefined);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tier, setTier] = useState(initialTier);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className="field-label">Plan</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((plan) => (
            <label key={plan.tier} className="chip-checkbox" data-selected={tier === plan.tier}>
              <input
                type="radio"
                name="tier"
                value={plan.tier}
                checked={tier === plan.tier}
                onChange={() => setTier(plan.tier)}
                className="sr-only"
              />
              <span>
                <span className="block font-semibold">{plan.name}</span>
                <span className="block text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatPrice(plan.priceCents)}/mo
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="businessName" className="field-label">
          Business name
        </label>
        <input
          id="businessName"
          name="businessName"
          required
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="input"
          placeholder="The Studio"
        />
      </div>

      <div>
        <label htmlFor="slug" className="field-label">
          Your booking URL
        </label>
        <div className="flex items-center overflow-hidden rounded-[10px]" style={{ border: "1px solid var(--border-strong)" }}>
          <span className="pl-3 pr-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {(process.env.NEXT_PUBLIC_CUSTOMER_APP_HOST ?? "bookingeasy.vercel.app") + "/"}
          </span>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="flex-1 bg-transparent py-2.5 pr-3 text-sm outline-none"
            placeholder="the-studio"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ownerName" className="field-label">
            Your name
          </label>
          <input id="ownerName" name="ownerName" required className="input" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm" style={{ color: "#dc4b30" }}>
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Setting up your account…" : "Continue to payment"}
      </button>
      <p className="text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        You&apos;ll be taken to Dodo Payments to complete your subscription.
      </p>
    </form>
  );
}
