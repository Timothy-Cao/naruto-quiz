import type { Quiz } from "@/lib/quiz-schema";

const KEY = "naruto-quiz:builder-drafts";

export type Draft = {
  quiz: Quiz;
  savedAt: string; // ISO 8601
};

export type DraftMap = Record<string, Draft>;

function readMap(): DraftMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as DraftMap;
  } catch {
    return {};
  }
}

function writeMap(map: DraftMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function loadDraft(slug: string): Draft | null {
  return readMap()[slug] ?? null;
}

export function saveDraft(slug: string, quiz: Quiz): Draft {
  const map = readMap();
  const draft: Draft = { quiz, savedAt: new Date().toISOString() };
  map[slug] = draft;
  writeMap(map);
  return draft;
}

export function deleteDraft(slug: string): void {
  const map = readMap();
  delete map[slug];
  writeMap(map);
}

export function listDrafts(): DraftMap {
  return readMap();
}
