"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type Session, type User } from "@supabase/supabase-js";
import { type AuthUserSummary } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { LogIn, LogOut } from "lucide-react";

function mapSupabaseUser(user: User): AuthUserSummary {
  const meta = user.user_metadata as Record<string, unknown> | null;
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      typeof meta?.full_name === "string"
        ? (meta.full_name as string)
        : typeof meta?.name === "string"
          ? (meta.name as string)
          : null,
    avatarUrl:
      typeof meta?.avatar_url === "string" ? (meta.avatar_url as string) : null,
    // Admin flag is only authoritative server-side; the client copy is just
    // a hint until the next page refresh re-renders server-rendered state.
    isAdmin: false,
  };
}

export function AuthControls({
  initialUser = null,
}: {
  initialUser?: AuthUserSummary | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUserSummary | null>(initialUser);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!mounted) return;
      setUser(data.user ? mapSupabaseUser(data.user) : null);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const u = session?.user;
        setUser(u ? mapSupabaseUser(u) : null);
        startTransition(() => router.refresh());
      },
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const origin = window.location.origin;
    const next = pathname || "/";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    startTransition(() => router.refresh());
  }

  if (!hasSupabaseBrowserEnv()) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => void handleSignIn()}
        disabled={isPending}
        aria-label="Sign in with Google"
        className="fixed top-4 right-16 z-40 h-10 px-3 rounded-full bg-[var(--color-surface)]/80 backdrop-blur border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] flex items-center gap-2 text-xs uppercase tracking-wide shadow-lg transition-colors disabled:opacity-60"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 right-16 z-40 flex items-center gap-2"
      data-no-sfx
    >
      <div className="h-10 px-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur border border-[var(--color-border)] flex items-center gap-2 shadow-lg">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full border border-[var(--color-border-2)] object-cover"
          />
        ) : (
          <div className="h-7 w-7 rounded-full border border-[var(--color-border-2)] bg-[var(--color-surface-2)] flex items-center justify-center text-xs text-[var(--color-text-dim)]">
            {(user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="hidden md:inline text-xs text-[var(--color-text)] max-w-[10ch] truncate">
          {user.displayName ?? user.email ?? "Signed in"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isPending}
        aria-label="Sign out"
        className="h-10 w-10 rounded-full bg-[var(--color-surface)]/80 backdrop-blur border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
