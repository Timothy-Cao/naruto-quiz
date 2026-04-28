import { Lock } from "lucide-react";
import { type AuthUserSummary } from "@/lib/auth";

/**
 * Wraps admin-only content. Shows a sign-in CTA for unauthenticated visitors
 * and a friendly forbidden message for authenticated non-admins. Renders
 * children only when the user is in the ADMIN_EMAILS allowlist.
 */
export function AdminGate({
  user,
  children,
}: {
  user: AuthUserSummary | null;
  children: React.ReactNode;
}) {
  if (!user) {
    return (
      <div className="p-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-start gap-3">
        <Lock className="w-5 h-5 text-[var(--color-accent)] mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-[var(--color-text)]">Admin sign-in required</p>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">
            Use the <strong>Sign in</strong> button in the top-right to authenticate with Google.
          </p>
        </div>
      </div>
    );
  }
  if (!user.isAdmin) {
    return (
      <div className="p-6 rounded-lg border border-[var(--color-incorrect)]/40 bg-[var(--color-incorrect)]/10 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[var(--color-incorrect)] mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-[var(--color-text)]">Forbidden</p>
          <p className="text-sm text-[var(--color-text-dim)] mt-1">
            Signed in as <span className="text-[var(--color-text)]">{user.email}</span>, but this
            account isn&apos;t in the admin allowlist.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
