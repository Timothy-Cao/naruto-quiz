"use client";

/**
 * Browser-side publish/unpublish APIs. Hits Supabase directly — RLS enforces
 * that only the authenticated user can write rows for their own email.
 *
 * Non-admin users get a "1 quiz max" cap enforced here: when publishing a
 * new slug, any existing row for the user's email is deleted first. Admins
 * can publish unlimited rows under their email.
 */

import type { Quiz } from "@/lib/quiz-schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PUBLISHED_TABLE, type PublishedQuizRow } from "./publishing";

export type PublishContext = {
  email: string;
  displayName: string | null;
  isAdmin: boolean;
};

export type PublishResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function publishQuiz(
  quiz: Quiz,
  ctx: PublishContext,
): Promise<PublishResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured." };

  // Non-admins: enforce 1-quiz cap. If they have an existing row at a
  // different slug, remove it. Same-slug republish is an upsert below.
  if (!ctx.isAdmin) {
    const { data: existing, error: listErr } = await supabase
      .from(PUBLISHED_TABLE)
      .select("slug")
      .eq("publisher_email", ctx.email);
    if (listErr) return { ok: false, error: listErr.message };
    const others = (existing ?? []).filter((r) => r.slug !== quiz.slug);
    if (others.length > 0) {
      const { error: delErr } = await supabase
        .from(PUBLISHED_TABLE)
        .delete()
        .eq("publisher_email", ctx.email)
        .neq("slug", quiz.slug);
      if (delErr) return { ok: false, error: delErr.message };
    }
  }

  const { error } = await supabase.from(PUBLISHED_TABLE).upsert(
    {
      slug: quiz.slug,
      publisher_email: ctx.email,
      publisher_name: ctx.displayName,
      quiz_json: quiz,
    },
    { onConflict: "slug" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug: quiz.slug };
}

export async function unpublishQuiz(slug: string): Promise<PublishResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured." };
  const { error } = await supabase
    .from(PUBLISHED_TABLE)
    .delete()
    .eq("slug", slug);
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug };
}

/**
 * Returns rows currently published by the signed-in user. Used to show
 * "your published quiz" status in the builder.
 */
export async function getMyPublishedQuizzes(
  email: string,
): Promise<PublishedQuizRow[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from(PUBLISHED_TABLE)
    .select("slug, publisher_email, publisher_name, quiz_json, created_at, updated_at")
    .eq("publisher_email", email);
  return (data as PublishedQuizRow[] | null) ?? [];
}
