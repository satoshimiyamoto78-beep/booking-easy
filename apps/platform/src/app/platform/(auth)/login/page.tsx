import { LoginForm } from "./login-form";

export default function PlatformLoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--paper)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            B
          </span>
          <span className="text-sm font-semibold tracking-tight">Booking Easy · Platform</span>
        </div>

        <div className="card-raised p-8">
          <h1 className="text-xl font-semibold tracking-tight">Founder sign in</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage every business on the platform.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
