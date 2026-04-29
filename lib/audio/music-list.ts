import fs from "node:fs";
import path from "node:path";
import { PACKS, type Pack } from "@/lib/audio/packs";

const MUSIC_DIR = path.join(process.cwd(), "public", "music");

/**
 * Reads `public/music/<pack.id>/` at build time and returns a list of
 * public-relative URLs to every supported audio file in that pack.
 *
 * Returns an empty list if the directory is empty or missing — the player
 * handles that case (silent until tracks land).
 */
export function getMusicTracks(pack: Pack): string[] {
  const dir = path.join(MUSIC_DIR, pack.id);
  try {
    const entries = fs.readdirSync(dir);
    return entries
      .filter((name) => /\.(mp3|m4a|ogg|wav)$/i.test(name))
      .sort()
      .map((name) => `/music/${pack.id}/${encodeURIComponent(name)}`);
  } catch {
    return [];
  }
}

/**
 * Builds a record of pack-id -> tracks-list for every registered pack.
 * Called once at build time in the root layout; the result is passed to
 * the AudioRoot client component so users can switch packs without
 * a server round trip.
 */
export function getAllTracks(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const pack of PACKS) {
    out[pack.id] = getMusicTracks(pack);
  }
  return out;
}
