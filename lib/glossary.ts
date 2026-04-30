/**
 * In-line glossary — terms that should auto-render with a dotted underline
 * + hover tooltip wherever they appear in quiz Markdown (prompts, options,
 * explanations, hints).
 *
 * Configured ONLY here in code — there is no per-quiz JSON config and no
 * builder UI. Add a new term and every existing quiz that mentions it
 * picks up the definition for free.
 *
 * Matching is case-insensitive and tolerant of hyphen/space — "sibling-
 * student", "sibling student", and "Sibling-Students" all match the same
 * entry. Plurals are handled by including the plural form as its own key
 * (kept simple — no auto-suffix logic).
 */
export const GLOSSARY: Record<string, string> = {
  "sibling-student":
    "Two students who share the same sensei. (E.g. Naruto and Sakura are sibling-students under Kakashi.)",
  "sibling-students":
    "Two students who share the same sensei. (E.g. Naruto and Sakura are sibling-students under Kakashi.)",
  "sibling-teacher":
    "Two teachers that share the same student. (E.g. Iruka and Kakashi are sibling-teachers of Naruto.)",
  "sibling-teachers":
    "Two teachers that share the same student. (E.g. Iruka and Kakashi are sibling-teachers of Naruto.)",
};

/**
 * Build a regex that matches any glossary key, longest-first so longer
 * forms win against shorter prefixes (e.g. "sibling-students" before
 * "sibling-student"). The regex also accepts plain spaces in place of
 * hyphens by treating "[-\s]" as the separator inside multi-word keys.
 */
export function buildGlossaryPattern(): RegExp | null {
  const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return null;
  const escaped = keys.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[-\s]+/g, "[-\\s]+"),
  );
  return new RegExp(`(${escaped.join("|")})`, "gi");
}

/**
 * Look up a definition by surface text. Normalizes hyphen/space + case to
 * find the canonical entry. Returns null if no match.
 */
export function lookupGlossary(surface: string): string | null {
  const norm = surface.toLowerCase().replace(/[-\s]+/g, "-");
  for (const key of Object.keys(GLOSSARY)) {
    if (key.toLowerCase() === norm) return GLOSSARY[key];
  }
  return null;
}
