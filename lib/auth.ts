import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthUserSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSupabaseAuthReady(): boolean {
  return hasSupabaseBrowserEnv();
}

export async function getCurrentAuthUser(): Promise<AuthUserSummary | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const meta = user.user_metadata as Record<string, unknown> | null;

  const displayName =
    typeof meta?.full_name === "string"
      ? (meta.full_name as string)
      : typeof meta?.name === "string"
        ? (meta.name as string)
        : null;

  const avatarUrl =
    typeof meta?.avatar_url === "string" ? (meta.avatar_url as string) : null;

  const isAdmin = Boolean(
    user.email && parseAdminEmails().includes(user.email.toLowerCase()),
  );

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl,
    isAdmin,
  };
}

/**
 * Validates a `next` query param against open-redirect attacks. Only allows
 * paths beginning with a single `/` (so no protocol-relative `//evil.com`).
 */
export function getGoogleAuthRedirectPath(nextPath?: string | null): string {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }
  return candidate;
}
