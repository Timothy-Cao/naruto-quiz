/**
 * Scrapes Wikipedia's Naruto character list page to produce data/characters.json.
 *
 * Usage: npx tsx scripts/scrape-characters.ts
 *
 * Strategy: Extract character names from h2/h3/h4 section headings on the
 * Wikipedia character list page. Headings are the canonical character entries —
 * they've already been curated by Wikipedia editors and are far less noisy than
 * free-text extraction. We then supplement with known aliases.
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE = "https://en.wikipedia.org/wiki/List_of_Naruto_characters";

// Section headings that are NOT character names (categories, teams, villages, meta).
const NON_CHARACTER_HEADINGS = new Set([
  // Meta / article structure
  "Contents", "Creation and conception", "Reception", "Footnotes",
  "References", "External links", "Notes", "See also",
  // Character group labels
  "Main characters", "Secondary characters", "Supporting characters",
  "Other characters", "Villains", "Antagonists",
  // Team / group names
  "Team 7", "Team 8", "Team 10", "Team Guy (Team 9)", "Team Moegi",
  "Team Hanabi", "Team Udon", "Team Asuma", "Sand Siblings", "Sound Four",
  "Akatsuki", "Taka", "Kara", "Divine Trees",
  // Story arc labels
  "Naruto", "Naruto Shippūden", "Boruto",
  // Village labels
  "Sunagakure", "Kumogakure", "Kirigakure", "Iwagakure",
  "Konohagakure", "Otogakure", "Amegakure",
  // Other labels
  "Tailed Beasts", "Hokage", "Ōtsutsuki Clan",
]);

// Characters known by aliases. We add the alias so autocomplete finds both.
const ALIASES: Record<string, string[]> = {
  "Nagato Uzumaki": ["Pain"],
  "Tsunade Senju": ["Tsunade"],
  "Obito Uchiha": ["Tobi"],
  "Kurama (Nine-Tails)": ["Kurama", "Nine-Tails"],
  "Gyūki (Eight-Tails)": ["Gyuki"],
  "Chōmei (Seven-Tails)": ["Chomei"],
  "Kokuō (Five-Tails)": ["Kokuo"],
  "Son Gokū (Four-Tails)": ["Son Goku"],
  "A (Third Raikage)": ["Third Raikage"],
};

// Characters in the body text but not as section headings; added manually.
// (Extracted from scanning the article body and known wiki content.)
const BODY_CHARACTERS = [
  // Sound Four members
  "Kidomaru", "Sakon", "Ukon", "Tayuya", "Jirobo",
  // Other notable characters
  "Kabuto Yakushi", "Zabuza Momochi", "Haku",
  // Orochimaru's subordinates
  "Kimimaro",
  // Other Akatsuki / villains
  "Zetsu", "White Zetsu", "Black Zetsu",
  // Konoha ninja
  "Iruka Umino", "Anko Mitarashi", "Shizune", "Genma Shiranui",
  "Raido Namiashi", "Ibiki Morino", "Izumo Kamizuki", "Kotetsu Hagane",
  // Other important
  "Killer Bee", "Darui", "Mei Terumi", "Onoki", "Rasa", "Chiyo", "Baki",
  "Chojuro", "Ao", "Karui", "Omoi",
  // Tailed Beasts
  "Shukaku", "Matatabi", "Isobu", "Son Goku", "Kokuo", "Saiken",
  "Chomei", "Gyuki", "Kurama",
  // Notable supporting
  "Itachi Uchiha", "Shisui Uchiha", "Rin Nohara", "Kushina Uzumaki",
  "Fugaku Uchiha", "Mikoto Uchiha",
  // Hyuga clan
  "Hiashi Hyuga", "Hizashi Hyuga",
  // Other named characters
  "Kurenai Yuhi", "Asuma Sarutobi", "Might Guy", "Ebisu",
  "Konohamaru Sarutobi", "Moegi", "Udon",
  "Kakuzu", "Hidan", "Sasori", "Deidara",
  // Kages
  "Hashirama Senju", "Tobirama Senju", "Hiruzen Sarutobi",
  "Minato Namikaze", "Kakashi Hatake",
  "Gaara", "Kankuro", "Temari",
  "A", "Killer Bee", "Darui",
  // Clan leaders
  "Inoichi Yamanaka", "Shikaku Nara", "Choza Akimichi",
  // Other Konoha
  "Sai", "Yamato", "Danzo Shimura",
  // Other notable
  "Hanzo", "Hagoromo Otsutsuki", "Hamura Otsutsuki",
  "Kaguya Otsutsuki", "Toneri Otsutsuki",
];

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "naruto-quiz-scrape/1.0 (educational project)" },
    });
    if (!res.ok) {
      console.warn(`Skipping ${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`Skipping ${url}: ${err}`);
    return null;
  }
}

function extractHeadings(html: string): string[] {
  // Extract text from h2, h3, h4 tags.
  const headingRe = /<h[234][^>]*>([\s\S]*?)<\/h[234]>/gi;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(html)) !== null) {
    // Remove any inner HTML tags (edit links, etc.) and clean whitespace.
    const text = m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\[edit\]/g, "")
      .replace(/&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (text.length === 0 || text.length > 80) continue;
    if (NON_CHARACTER_HEADINGS.has(text)) continue;

    // Skip pure section labels that are clearly not character names.
    // A character heading usually starts with a capital letter and contains
    // at least one letter (not just numbers or symbols).
    if (!/^[A-ZÀ-Ö]/.test(text)) continue;

    names.push(text);
  }
  return names;
}

// Clean macrons and special chars for a normalized form suitable for matching.
// (We keep the original form with macrons in the JSON for correctness.)
function normalize(name: string): string {
  return name
    .replace(/[ōŌ]/g, "o")
    .replace(/[ūŪ]/g, "u")
    .replace(/[āĀ]/g, "a")
    .replace(/[īĪ]/g, "i")
    .replace(/[ēĒ]/g, "e");
}

async function main() {
  console.log(`Fetching ${SOURCE}...`);
  const html = await fetchText(SOURCE);
  if (!html) {
    console.error("Failed to fetch the Wikipedia page.");
    process.exit(1);
  }

  const headingNames = extractHeadings(html);
  console.log(`  -> extracted ${headingNames.length} names from headings`);

  const all = new Set<string>();

  // Add heading-based names.
  for (const name of headingNames) {
    all.add(name);
    // Add aliases if defined.
    for (const [canonical, aliasList] of Object.entries(ALIASES)) {
      if (name === canonical) {
        for (const alias of aliasList) all.add(alias);
      }
    }
  }

  // Add body characters.
  for (const name of BODY_CHARACTERS) {
    all.add(name);
  }

  // Also add normalized (no-macron) versions for key characters so both
  // "Tsunade Senju" and plain "Tsunade" are in the list.
  const toAdd: string[] = [];
  for (const name of all) {
    const norm = normalize(name);
    if (norm !== name) toAdd.push(norm);
  }
  for (const name of toAdd) all.add(name);

  const sorted = Array.from(all).sort((a, b) => a.localeCompare(b));
  const out = path.join(process.cwd(), "data", "characters.json");
  fs.writeFileSync(out, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\nWrote ${sorted.length} names to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
