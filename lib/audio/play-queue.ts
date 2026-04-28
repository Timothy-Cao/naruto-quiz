/**
 * Pick the next track from a list, avoiding any of the most recent `historyMax` plays.
 * If all tracks are in the recent history (small library), falls back to the full list.
 *
 * `random` defaults to Math.random; the parameter exists for testability.
 */
export function pickNext(
  tracks: string[],
  history: string[],
  random: () => number = Math.random,
  historyMax = 5,
): string | null {
  if (tracks.length === 0) return null;
  const recent = new Set(history.slice(-historyMax));
  const eligible = tracks.filter((t) => !recent.has(t));
  const pool = eligible.length > 0 ? eligible : tracks;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * Append a track to the history, capped at `max` entries (keeps the latest `max`).
 */
export function appendHistory(history: string[], track: string, max = 5): string[] {
  return [...history, track].slice(-max);
}
