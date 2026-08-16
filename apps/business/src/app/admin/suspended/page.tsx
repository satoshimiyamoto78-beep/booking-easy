import { ShieldAlert } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export default function SuspendedPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--paper)" }}
    >
      <div className="card-raised max-w-sm p-8 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--status-cancelled-bg)", color: "var(--status-cancelled-fg)" }}
        >
          <ShieldAlert size={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Account suspended</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Your business&apos;s access has been suspended. Contact support to resolve this.
        </p>
        <form action={logout} className="mt-6">
          <button type="submit" className="btn btn-secondary w-full">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
