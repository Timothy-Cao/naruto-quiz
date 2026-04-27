const KEY = "naruto-quiz:scores";

export type ScoreEntry = {
  bestScore: number;
  bestOutOf: number;
  bestAt: string;
  attempts: number;
};

export type ScoreStore = Record<string, ScoreEntry>;

function readStore(): ScoreStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ScoreStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function getAllScores(): ScoreStore {
  return readStore();
}

export function getScore(slug: string): ScoreEntry | null {
  return readStore()[slug] ?? null;
}

export function recordAttempt(slug: string, score: number, outOf: number): ScoreEntry {
  const store = readStore();
  const prev = store[slug];
  const entry: ScoreEntry = prev
    ? {
        bestScore: Math.max(prev.bestScore, score),
        bestOutOf: outOf,
        bestAt: score > prev.bestScore ? new Date().toISOString() : prev.bestAt,
        attempts: prev.attempts + 1,
      }
    : {
        bestScore: score,
        bestOutOf: outOf,
        bestAt: new Date().toISOString(),
        attempts: 1,
      };
  store[slug] = entry;
  writeStore(store);
  return entry;
}
