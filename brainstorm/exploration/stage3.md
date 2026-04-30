# Stage 3 — readiness review

Pass over the 64 stage-2 picks. All review-bucket fixes have been applied; only **Ready** and **Revamp** remain.

- **Ready** — text-only, format clearly maps to one of our schema types, grammar clean. Drop straight into the builder.
- **Revamp** — needs media we haven't loaded (image/audio for prompt or options) or significant restructure (multi-dimensional matching, missing source content).

Each ready question lists its **canonical phrasing** and a hint at the **type** when not obviously mc-single. Where flags remain (3 questions), they're tagged `[FLAG]` for human eyes during authoring.

---

## Aggregate

| Bucket | Logic | Fact | Total |
|---|---:|---:|---:|
| **Ready** | 18 | 38 | **56** |
| **Revamp** | 0 | 8 | **8** |
| **Total** | 18 | 46 | **64** |

**Skipped from Round 1 → Round 2:** out of ~156 transcribable questions across the six quizzes (1: 25, 2: 24, 3: 29, 4: 29, 5: 25, 7: 24), you picked 64 → **92 skipped.**

---

## Logic — Ready (18)

### 1-22. What is Hinata's husband's dad's sensei's sensei's son's wife's specialty?
mc-single — Medical ninjutsu | Genjutsu | Taijutsu | Not a ninja

### 2-6. Person A's son's murderer's controller's manipulator's manipulator's rival's granddaughter is a healer. How did Person A die?
mc-single — Suicide | Killed in battle | Still alive | Old age

### 2-7. A pervert's student's student's crush's murderer's rival's student's crush is Person A. What color is their hair?
mc-single — Pink | Black | Yellow | Blue | Green | Other

### 2-8. Person A's bro's best friend's boss's rival's killer's student is Person B. What is the relationship between them?
mc-single — Family | Themselves | Rivals | Same team

### 3-5. A test subject's captain's student's crush's crush's teammate's brother's birthplace's first-kage's student's rival's student — what nature transformation(s) do they have?
mc-multi — Wind | Water | Fire | Lightning | Earth | None

### 3-10. How many degrees of separation are between Sakura and Kaguya at the start of Shippuden?
mc-single — 2-3 | 4-5 | 6-20 | 21+ | There is no connection | Unknown

### 3-13. Person A's wife's father's impersonator's sensei's son's killer's partner is Person B. Person C's mother's successor's husband's sensei is Person D, who is a writer. Who is the oldest?
mc-single — A | B | C | D

### 4-19. Character A is a character (NOT BELOW) that has battled against more of the characters below than anyone else. Select all such characters below that have fought A.
mc-multi — Naruto | Sasuke | Itachi | Jiraiya | Orochimaru | Kakashi | Kushina | Minato | Madara | Obito | Hashirama | Matatabi (Two Tails)

### 4-21. Person X's father's murderer's murderer's sensei's teammate's savior's brother's murderer's father's rival's clan is clan A. How many people in this chain are from this clan?
slider (numeric) — `[FLAG]` "Person X" is a placeholder anchor — pick a canonical starting character (Itachi? Sasuke?) when authoring, since the original chain had no anchor.

### 5-4. Person A's son's student's student's student's student's godfather's rival's student's brother's killer. How many unique first names are in this chain?
slider (numeric)

### 5-11. A person's dad is Person A who saved the tutor of Person B whose rival's master's sensei is Person C, who knows all basic nature transformations. What is true?
mc-multi — They are of 3 different generations | None of them share a last name | All of them have met Naruto | None of them participated in the 4th war

### 5-20. Person A's partner's teacher's son's killer's son's rival's student's crush's crush's brother is Person B. Select all true statements.
mc-multi — They have fought each other | Person B is younger | There exists a person that has defeated both of them | They are from the same village

### 7-4. Character A's spouse's killer's leader killed Character B, whose family member killed the son of Character C. Which statement could not be said by any of A, B, C?
mc-single — Every known member of my clan has a famous nickname | I've sealed a tailed beast into someone before | I've fought the current leader of a hidden village | I specialize in genjutsu | I am the only one of us 3 who has fought 2 or more Uchiha in the past | I've known Character A since I was young

### 7-7. Person A, Person B, and Person C are all sibling-students. What is true?
mc-multi — Person B taught Person A first | The teacher of Person A and B has never died | None of them are from the same clan | Person C could be multiple people

(Glossary tooltip on "sibling-students" auto-renders the definition.)

### 7-8. Person A and Person B are sibling-teachers of Person C. 3 of the options below are correct, select them.
mc-multi — Person A or B is a kage | Two of them are Uchiha | They have all participated in the 3rd war | Person A and B have met before death

### 7-13. Person A and Person B both wanted to fight Person C. There is only one false statement below — select it.
mc-single — 2 of A, B, C have died | A and B are from different villages | All of them have fought each other | C never lost against A or B | At least 2 of them are missing nin

### 7-21. How many degrees of separation are between the 2nd Raikage and Yugito Nii? (Two characters are connected if they have met — on panel or stated — before they died.)
slider (0-6+)

### 7-22. Ignoring all instances of Edo Tensei, no two of Characters A, B, C, D were ever alive at the same time. Exactly 5 of these statements are true — select them.
mc-multi — They each have a different hair color | Two of them share the same starting letter | 3 of them have been a Jinchūriki | At least 2 of them are kage | 3 of them have had children | When sorted by birth, they are also sorted by strength (quite agreed upon)

---

## Fact — Ready (38)

### 1-2. Which major military force never employed the Akatsuki?
mc-single — Kumogakure (Cloud) | Kirigakure (Mist) | Konohagakure (Leaf) | Iwagakure (Stone)

### 1-3. Which is a nature release not required for Dust Release?
mc-single — Fire | Earth | Wind | Lightning

### 1-19. How many Akatsuki members took their own life?
mc-single (or slider) — 2 | 3 | 4 | 5

### 1-21. Which of the following is largest in size?
mc-single — True Several Thousand Hands | Perfect Susanoo | Genbu (Island Turtle) | 10 tails

### 1-24. The Explosion Corps belongs to which village?
mc-single — Iwagakure (Stone) | Konohagakure (Leaf) | Kirigakure (Mist) | Kumogakure (Cloud) | Sunagakure (Sand)

### 1-25. Who predates the others?
mc-single — The great toad sage | Onoki | Black Zetsu | Kurama | Indra | The first hokage

### 2-3. Which nature transformations are required for the Rubber Kekkei Genkai?
mc-multi — Fire | Water | Wind | Lightning | Earth

### 2-4. Without being able to open any gates, a user can only use ___% of the body's full potential.
slider (0-100)

### 2-14. How many shinobi have had the ability to fly?
mc-single — 7 or less | 8-9 | 10-11 | 12+

### 2-15. Who has not been shown to have a water affinity?
mc-single — Yahiko | Gamabunta | Ao | Sasori

### 2-19. Order these events chronologically: Itachi uses Tsukuyomi · Sasuke uses rigged shuriken · Itachi steals Sasuke's eye · Shuriken battle.
order — items: Tsukuyomi | Rigged shuriken | Eye theft | Shuriken battle

### 2-22. Which of the following is NOT a normal reaction when chakra paper is applied?
mc-single — Burns to ash | Splits in two | Turns to stone and crumbles | Becomes damp | None of the above

### 2-24. The Puppet Brigade was most active in which era?
mc-single — The first shinobi war | The second shinobi war | The third shinobi war | The fourth shinobi war | Warring states period

### 3-1. Where is DNA applied during the Edo Tensei process?
mc-single — On a sacrificial body | On a scroll | On the hands of the caster | On the tomb used to summon it

### 3-4. What percent of a tailed beast bomb is negative chakra?
mc-single — 20 | 80 | 50 | 33 | 40 | 60

### 3-6. What was the cause of the First Shinobi World War?
mc-single — Resources | Territory | Assassination | Tailed Beasts

### 3-7. Which of the following events occurred during the 3rd Shinobi World War?
mc-multi — Sasori gained the nickname "Sasori of the Red Sand" | The Legendary Sannin gets their nickname | Madara's death | Minato gets his nickname "The Yellow Flash" | 3rd Raikage's death | Tsunade's lover's death

### 3-17. What is the purpose of Hanzo of the Salamander's mask?
mc-single — To protect others from himself | To protect himself from himself | No explicit reason | To protect himself from the polluted air | Allergies | None of the above

### 3-18. Which of the following people don't wear their forehead protector on their head?
mc-multi — Might Guy | Konan | Hinata | Chōjūrō | Gaara | Sakura

### 3-27. Who first figured out that Pain's eyes are linked?
mc-single — Fukasaku | Shima | Jiraiya | Naruto | Kakashi

### 4-2. Where are the location(s) of Shisui's eyes at the time of Neji's death?
mc-multi — Sealed away | Obito's possession | Incinerated | Naruto's possession | Itachi's possession | In a crow

### 4-3. How was the 8 Tails sealed into Killer Bee?
mc-single — 4 Symbols Seal | Iron Armour Seal | 8 Trigrams Seal | Phantom Dragons Nine Consuming Seals | Amber Purifying Pot Tailed-Beast Sealing | Unknown

### 4-4. How many Jinchūriki were also Kages?
slider (numeric)

### 4-18. How many people have walked into Kakashi's Chidori intentionally?
mc-single — 1 | 2 | 3 | 4+

### 4-24. Which of these has Konan created with her paper?
mc-multi — Wings | A sea | Butterflies | Birds | Kunai | Shuriken | Tree | Rock

### 5-2. A Leaf and a Cloud ninja are the only known users of the ___ clone. What is true about these two?
mc-single — One of them refers to Kakashi as senpai | One of them has fought one of the first 5 Hokage | The Leaf ninja is taller | One of them has Wind release

`[FLAG]` Decide whether to fill in the blank ("Lightning Clone"? generic shadow clone variant?) or keep it as a fill-in mystery for the player.

### 5-5. What is Naruto's favorite ramen?
mc-single — Tonkotsu Ramen | Miso Pork Ramen | Shoyu Ramen | Shio Pork Ramen

### 5-7. Match each character to their catchphrase.
categorize — Items: Shikamaru, Sakura, Killer B, Deidara, Itachi, Naruto. Buckets: Shannarō / Mata Kondo Da / Mendokusē / Dattebayo / Bakayarō! Konoyarō! / Geijutsu wa bakuhatsu da

### 5-8. Who has been shown to cast a Juinjutsu (Cursed Seal)?
mc-multi — Hiashi Hyuga | Danzo Shimura | Orochimaru | Hiruzen Sarutobi | Fū Yamanaka | Nagato

### 5-13. Order these characters by their rank in the first Naruto popularity poll (taken during the Chunin Exams).
order — items: Gaara, Rock Lee, Sakura, Haku, Zabuza, Naruto, Sasuke, Hinata, Kakashi, Iruka

### 5-16. Order these final words chronologically.
order — items: "Kakashi..." | "You are the savior of this world" | "For the world of shinobi... for Konoha... I cannot let you live!" | "You are truly a kind child" | "I just want one last smoke" | "Because... you called me a genius" | "It doesn't matter if I'm scattered to the wind! I will stop you!" | "Defeated... by a pack of brats"

### 5-18. Where does Killer Bee NOT hold a sword in his 8-sword stance?
mc-single — Elbow Armpit | Knee Armpit | Mouth | Armpit | Shoulder | Hand

### 5-23. What was the first thing Kamui was ever used to pass through?
mc-single — Sword | Kunai | Wall | Punch | Rasengan | Other

### 7-12. Order these last-ish words chronologically.
order — items (8): "Our pain will only last an instant, unlike yours." | "Listen to your motor mouth mother" | "Yes, that has a nice ring to it" | "I know I cannot be, but I wish I could go to where you have gone..." | "Farewell, disciple. May we meet again in the next world." | "It seems that in the end... I wasn't a worthless human after all..." | "Cower in awe, cry your heart out!" | "Amidst this shinobi world created by us foolish old people, I'm glad that..."

`[FLAG]` 3 of these quotes were truncated in the source — verify each against canon and complete before authoring.

### 7-14. "If Itachi really wanted to kill you, you would most certainly be dead" — said by Person A to Person B. What is their relationship?
mc-single — Same village of birth | Same organization | Same clan | Siblings

### 7-17. How many people have cast reincarnation ninjutsu?
slider (numeric)

### 7-18. Of the speakers below, select the 4 youngest characters.
mc-multi — "This jutsu's risk and weakness is my existence" | "I'll deal with you later" | "I'm telling you this because you don't get it..." | "Naruto, that jutsu symbolizes your weakness." | "Do you hate me now?" | "When a man learns to love, he must bear the risk of hatred" | "I've finally caught up to you two" | "When did you all forsake yourselves"

`[FLAG]` 2 of these quotes were truncated in the source — verify against canon and complete before authoring.

### 7-19. Which chakra types have been seen infused into a blade?
mc-multi — Wind | Lightning | Water | Yin | Yang | Earth | Fire

---

## Fact — Revamp (8)

### 1-10. Who is the only known person to hold both the Will of Fire and Curse of Hatred?
`[REVAMP]` No options were visible on the source page. Either supply mc-single options ourselves OR convert to **name** type (autocomplete on character roster). Our call.

### 3-8. Who is looking through this leaf? (Bonus: what were they doing?)
`[REVAMP]` Needs the source image. Without it the question is unanswerable. The "(Bonus)" sub-question would need to be a separate question or be dropped.

### 3-25. How did Sasuke find out that this was an imposter?
`[REVAMP]` Prompt references "this" — needs the source image (the imposter scene). Without media the question has no anchor.

### 4-20. Order the characters by how early they discovered that Tobi is NOT Madara.
`[REVAMP]` Original options were letter sequences (A, B, C, D) — the actual character mapping isn't in the source. We'd need to identify the four characters ourselves before authoring. Once mapped, this is naturally an **order** type.

### 4-27. Select the 2 characters that are currently physically closest to an Uchiha.
`[REVAMP]` Image-only question — no transcribable text in the source. Needs the panel.

### 5-3. Great nation specialist teams.
`[REVAMP]` Two-dimensional matching: each team needs to be matched to (village, superlative-criterion). Our **categorize** is one-dimensional. Could be split into two questions, or simplified to one dimension (just teams → villages).

### 7-16. Order their deaths episode-wise and select the odd placement deaths (1st, 3rd, etc.).
`[REVAMP]` Two-step task: first order all 8, then select the ones at odd indices. Either split into two questions, just keep the order (drop the "select odd" twist), or pre-compute the odd-indexed deaths and ask "which of these died at an odd-numbered position".

### 7-24. For the following missing words, select the ones that are an odd number of letters.
`[REVAMP]` Each option is paired with an image — without the images the fill-in-the-blank fragments are too sparse to identify reliably.
