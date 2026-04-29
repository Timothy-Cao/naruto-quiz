/**
 * Quiz publishing — Supabase-backed.
 *
 * - Public read: anyone can list/fetch published quizzes.
 * - Authenticated write: only the publisher can insert/update/delete their
 *   own rows. RLS enforces auth.email() = publisher_email.
 * - Non-admin users may publish exactly one quiz at a time. The cap is
 *   enforced app-side in `publishQuiz`: when a non-admin publishes a new
 *   slug, any existing row for their email is deleted first.
 *
 * Admin moderation (deleting abusive content) is done from the Supabase
 * dashboard for v1 — there's no in-app moderation UI yet.
 */

import type { Quiz } from "@/lib/quiz-schema";
import { QuizSchema } from "@/lib/quiz-schema";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

export const PUBLISHED_TABLE = "naruto_quiz_published_quizzes";

export type PublishedQuizRow = {
  slug: string;
  publisher_email: string;
  publisher_name: string | null;
  quiz_json: Quiz;
  created_at: string;
  updated_at: string;
};

export type PublishedQuizSummary = {
  slug: string;
  title: string;
  description: string | null;
  questionCount: number;
  coverImage: string | null;
  author: string | null;
  publisherEmail: string;
  updatedAt: string;
};

function rowToSummary(row: PublishedQuizRow): PublishedQuizSummary | null {
  const parsed = QuizSchema.safeParse(row.quiz_json);
  if (!parsed.success) return null;
  const q = parsed.data;
  return {
    slug: row.slug,
    title: q.title,
    description: q.description ?? null,
    questionCount: q.questions.length,
    coverImage: q.coverImage ?? null,
    author: q.author ?? row.publisher_name ?? null,
    publisherEmail: row.publisher_email,
    updatedAt: row.updated_at,
  };
}

// ----- Server-side reads (cookieless anon client) -------------------------

export async function listPublishedQuizzesServer(): Promise<PublishedQuizSummary[]> {
  const supabase = getSupabaseAnonClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from(PUBLISHED_TABLE)
    .select("slug, publisher_email, publisher_name, quiz_json, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (!data) return [];
  return (data as PublishedQuizRow[])
    .map(rowToSummary)
    .filter((s): s is PublishedQuizSummary => s !== null);
}

export async function fetchPublishedQuizServer(slug: string): Promise<Quiz | null> {
  const supabase = getSupabaseAnonClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from(PUBLISHED_TABLE)
    .select("quiz_json")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const parsed = QuizSchema.safeParse((data as { quiz_json: unknown }).quiz_json);
  return parsed.success ? parsed.data : null;
}
