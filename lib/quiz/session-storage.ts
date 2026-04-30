"use client";

/**
 * Per-quiz play session persistence — saves the user's PlayerState (current
 * question + every answer) to localStorage so they can leave mid-quiz and
 * resume where they left off. Cleared automatically on quiz completion or
 * on explicit reset.
 *
 * Keyed by quiz slug. Includes the questionCount at save-time so we can
 * detect quizzes that were edited after the user started — in that case
 * the saved session is discarded and the user starts fresh.
 */

import type { PlayerState } from "@/lib/player-reducer";

const KEY_PREFIX = "naruto-quiz:session:";

export type SavedSession = {
  state: PlayerState;
  savedAt: string; // ISO 8601
  questionCount: number;
};

export function loadSession(slug: string): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.questionCount !== "number" ||
      !parsed.state
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(
  slug: string,
  state: PlayerState,
  questionCount: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const data: SavedSession = {
      state,
      savedAt: new Date().toISOString(),
      questionCount,
    };
    window.localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded or disabled — silent failure is fine.
  }
}

export function clearSession(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY_PREFIX + slug);
  } catch {
    /* ignore */
  }
}

/** True if any answer is in 'draft' or 'confirmed' state — i.e., the user
 *  has actually engaged with the quiz, not just opened it. */
export function sessionHasProgress(state: PlayerState): boolean {
  if (state.currentIndex > 0) return true;
  for (const a of Object.values(state.answers)) {
    if (a.status !== "unanswered") return true;
  }
  return false;
}
