"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { Construction } from "lucide-react";

export function UnderConstructionBanner() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hasSupabaseBrowserEnv()) {
      setSignedIn(false);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (signedIn === null || signedIn) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/10 p-6 sm:p-8 text-center grid gap-3">
      <div className="flex justify-center gap-3">
        <Construction className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
        <Construction className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
        <Construction className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-wide text-[var(--color-accent)] uppercase">
        Under Construction
      </h2>
      <p className="text-base sm:text-lg text-[var(--color-text)] leading-relaxed max-w-md mx-auto">
        Quizzes being imported from Quiz Maker.
      </p>
      <p className="text-sm text-[var(--color-text-dim)]">
        Sign in to access the full site.
      </p>
    </div>
  );
}
