import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Admin sign in</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage bookings, services, and staff.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
