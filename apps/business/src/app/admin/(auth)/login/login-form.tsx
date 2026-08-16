"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      {state?.error && (
        <p className="text-sm" style={{ color: "var(--status-cancelled-fg)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
