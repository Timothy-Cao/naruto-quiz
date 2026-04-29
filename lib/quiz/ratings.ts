"use client";

/**
 * Per-question difficulty ratings.
 *
 * Each device gets a random UUID stored in localStorage (privacy-safe, not
 * tied to any user identity). Ratings are upserted to a shared Supabase
 * table; the PRIMARY KEY (device_id, quiz_slug, question_id) enforces "one
 * rating per device per question" — re-rating overwrites.
 *
 * The user's own ratings are also cached in localStorage so the rater
 * widget can show "you rated this 4★" without an extra Supabase round trip.
 *
 * Writes go browser → Supabase directly (no Vercel edge involved).
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type Rating = 1 | 2 | 3 | 4 | 5;

const TABLE = "naruto_quiz_question_ratings";
const DEVICE_KEY = "naruto-quiz:device-id";
const RATINGS_CACHE_KEY = "naruto-quiz:my-ratings";

type MyRatings = Record<string, Rating>; // key: `${slug}::${questionId}`

function key(slug: string, questionId: string): string {
  return `${slug}::${questionId}`;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function readCache(): MyRatings {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RATINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(map: MyRatings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RATINGS_CACHE_KEY, JSON.stringify(map));
}

export function getMyRating(slug: string, questionId: string): Rating | null {
  return (readCache()[key(slug, questionId)] as Rating) ?? null;
}

export async function rateQuestion(
  slug: string,
  questionId: string,
  rating: Rating,
): Promise<void> {
  // Local cache first — instant UI response, survives offline.
  const cache = readCache();
  cache[key(slug, questionId)] = rating;
  writeCache(cache);

  // Best-effort write to Supabase. Silent fail keeps the cache consistent.
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  try {
    await supabase.from(TABLE).upsert(
      {
        device_id: getDeviceId(),
        quiz_slug: slug,
        question_id: questionId,
        rating,
      },
      { onConflict: "device_id,quiz_slug,question_id" },
    );
  } catch {
    // Network / RLS / table-missing failures are non-fatal — cache holds it.
  }
}

export type AggregatedRating = {
  questionId: string;
  count: number;
  avg: number;
  distribution: Record<Rating, number>;
};

/**
 * Pulls every rating row for one quiz and aggregates client-side.
 * Cheap because rating volume is bounded; saves a server-side aggregation
 * function.
 */
export async function fetchQuizRatings(
  slug: string,
): Promise<Record<string, AggregatedRating>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return {};
  const { data } = await supabase
    .from(TABLE)
    .select("question_id, rating")
    .eq("quiz_slug", slug);
  if (!data) return {};

  const out: Record<string, AggregatedRating> = {};
  for (const row of data as Array<{ question_id: string; rating: Rating }>) {
    const id = row.question_id;
    if (!out[id]) {
      out[id] = {
        questionId: id,
        count: 0,
        avg: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
    out[id].count++;
    out[id].distribution[row.rating]++;
  }
  for (const agg of Object.values(out)) {
    let sum = 0;
    for (let r = 1 as Rating; r <= 5; r = (r + 1) as Rating) {
      sum += r * agg.distribution[r];
    }
    agg.avg = agg.count > 0 ? sum / agg.count : 0;
  }
  return out;
}
