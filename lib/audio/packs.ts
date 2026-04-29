/**
 * A "pack" bundles a music library + branding for the site. The site is
 * generic; the active pack defines the theme of the experience.
 *
 * For now we ship only the Naruto OST pack. The architecture is here so
 * future packs (Avatar, Bleach, JJK, etc.) can be added by:
 *   1. Dropping their MP3s into `public/music/<pack-id>/`
 *   2. Appending a Pack entry to PACKS below
 *   3. Eventually: adding a theme block (deferred until needed — keeping
 *      the type lean now so we don't ship the wrong shape).
 */

export type Pack = {
  /** URL-safe identifier — used in localStorage and as the music subfolder. */
  id: string;
  /** Headline shown on the main menu. */
  displayName: string;
  /** Subtitle under the headline. */
  subtitle: string;
  /** Filename inside `public/music/<id>/` to play first on every page load. */
  openingTrack: string;
};

export const PACKS: Pack[] = [
  {
    id: "naruto-ost",
    displayName: "Naruto Quiz",
    subtitle: "Do you hate me now?",
    openingTrack: "Hyouhaku.mp3",
  },
];

export const DEFAULT_PACK_ID = PACKS[0].id;

export function getPack(id: string): Pack {
  return PACKS.find((p) => p.id === id) ?? PACKS[0];
}
