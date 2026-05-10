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
    <div className="rounded-xl border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-5 py-6 sm:px-8 sm:py-8 text-center grid gap-2">
      <Construction className="w-6 h-6 text-[var(--color-accent)] mx-auto opacity-70" />
      <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-wide text-[var(--color-accent)] uppercase">
        Under Construction
      </h2>
      <p className="text-sm text-[var(--color-text-dim)] leading-relaxed max-w-sm mx-auto">
        Quizzes being imported from Quiz Maker. Sign in to access the full site.
      </p>
    </div>
  );
}
