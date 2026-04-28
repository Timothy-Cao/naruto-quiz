import fs from "node:fs";
import path from "node:path";

const MUSIC_DIR = path.join(process.cwd(), "public", "music");

/**
 * Reads `public/music/` at build time and returns a list of public-relative URLs
 * to every supported audio file. Returns an empty list if the directory is empty
 * or missing — the player handles that case (silent until the user adds tracks).
 */
export function getMusicTracks(): string[] {
  try {
    const entries = fs.readdirSync(MUSIC_DIR);
    return entries
      .filter((name) => /\.(mp3|m4a|ogg|wav)$/i.test(name))
      .sort()
      .map((name) => `/music/${name}`);
  } catch {
    return [];
  }
}
