# Stage 3 — readiness review

Pass over the 64 stage-2 picks. For each: classified into **Ready / Review / Revamp**, with grammar fixes inline (in *italics* below the prompt) or `[FLAG]` notes for things I'm not 100% on.

- **Ready** — text is sufficient, no media required, format already maps cleanly to one of our schema types, grammar clean (or trivially fixable).
- **Review** — text-only and format works, but I'm flagging something for human eyes (ambiguous wording, partial grammar uncertainty, source-truncated quotes, type-choice judgment).
- **Revamp** — needs media we haven't loaded (image/audio for prompt or options), or needs significant restructure (multi-dimensional matching, "select first N in chronological order" mechanic, missing source content).

---

## Aggregate

| Bucket | Logic | Fact | Total |
|---|---:|---:|---:|
| **Ready** | 7 | 21 | **28** |
| **Review** | 11 | 17 | **28** |
| **Revamp** | 0 | 8 | **8** |
| **Total** | 18 | 46 | **64** |

**Skipped from Round 1 → Round 2:** out of ~156 transcribable questions across the six quizzes (1: 25, 2: 24, 3: 29, 4: 29, 5: 25, 7: 24), you picked 64 → **92 skipped.**

---

## Logic — Ready (7)

### 2-6. PERSON A's son's murderer's controller's manipulator's manipulator's rival's granddaughter is a healer. How did person A die?
*(minor: "person A" → "Person A" for consistency)*

### 2-7. A pervert's student's student's crush's murderer's rival's student's crush is PERSON A. What color is their hair?

### 4-19. Character A is a character (NOT BELOW) that has battled against more of the characters below than anyone else. Select all such characters below that have fought A.

### 5-20. PERSON A's partner's teacher's son's killer's son's rival's student's crush's crush's brother is person B. Select all true statements.
*(minor: "person B" → "Person B")*

### 7-4. Character A's spouse's killer's leader killed Character B whose family member killed the son of Character C. Which statement could not be said by any of A, B, C?
*(strip the "[VERY HARD 5pt]" tag — we have our own scoring)*

### 7-8. Person A and Person B are sibling-teachers of Person C. 3 of the options below are correct, select them.

### 7-13. Person A and Person B both wanted to fight Person C. There is only one false statement below. Select it.
*(add trailing period / question mark)*

---

## Logic — Review (11)

### 1-22. Who is Hinata's husband's dad's sensei's sensei's son's wife's specialty?
`[FLAG]` Mixed pronoun-vs-noun: should be "**What** is Hinata's husband's dad's sensei's sensei's son's wife's specialty?" — currently asks "Who is X's specialty" which is ungrammatical. Fix.

### 2-8. PERSON A's bro's best friend's boss' rival's killer's student is PERSON B. What is the relationship between them?
`[FLAG]` "bro" is colloquial — keep or expand to "brother"? Also "boss' rival" should be "boss's rival" by most modern style guides. Both are minor.

### 3-5. A test subject's captain's student's crush's crush's teammate's brother's birthplace's first-kage's student's rival's student's nature transformation(s) is/are:
`[FLAG]` "(s) is/are" is awkward. Suggest: "...what nature transformation(s) do they have? **(select all)**" with mc-multi.

### 3-10. How many degrees of separation is between Sakura and Kaguya at the start of Shippuden?
*"degrees of separation **are** between..."* (subject-verb agreement). Strip the "(State answer as number of people in between)" if we use a slider; keep if mc-single with ranges.

### 3-13. PERSON A's wife's father's impersonator's sensei's son's killer's partner is PERSON B. PERSON C's mother's successor's husband's sensei is PERSON D whom is a writer. Who is the oldest?
*"who is a writer"* (not "whom"). Strip "[2pts]".

### 4-21. Father's murderer's murderer's sensei's teammate's savior's brother's murderer's father's rival's clan is clan A. How many people in this chain are from this clan?
`[FLAG]` Whose father? The chain has no anchor. Suggest a starting reference: e.g., "**Itachi's** father's murderer's..." or rename to "Person X's father's...".

### 5-4. PERSON A's sons' student's student's student's student's godfather's rival's student's brother's killer. How many unique first names are in this chain?
`[FLAG]` "PERSON A's sons'" — plural "sons" (apostrophe after the s) implies multiple sons; the rest of the chain treats it singular. Should this be "PERSON A's son's" (one son) or genuinely multiple sons (which would branch the chain)? Probably singular — "son's".

### 5-11. A person's dad is PERSON A who saved the tutor of PERSON B whose rival's master's sensei is PERSON C whom knows all basic nature transformations. What is true?
*"who knows"* (not "whom").

### 7-7. Person A and Person B are sibling-students. Person A and Person C are sibling-students of Person B. What is true?
`[FLAG]` Second sentence is ambiguous. "Sibling-students of Person B" — under our glossary definition (share a sensei) — most naturally means A, B, and C all share a sensei. But the literal phrasing reads weirdly. Suggest tightening to: "Person A and Person C **also share their sensei with** Person B." Or just: "Person A, B, and C are all sibling-students."

### 7-21. How many degrees of separation is BETWEEN the 2nd Raikage and Yugito Nii. Two characters are connected if they have met (on panel or stated) before they died.
*"degrees of separation **are** between..."* + missing question mark. Slider would suit this better than mc-single.

### 7-22. Ignoring all instances of Edo Tensei, no more than 1 of Characters A, B, C, D have been alive at once. Exactly 5 statements are true, select them.
`[FLAG]` "no more than 1 ... have been alive at once" reads as "≤1 of the four was ever alive [historically]" — but the intended meaning is "at any given moment, at most 1 was alive simultaneously" (i.e. they never overlapped). Suggest: "...**no two of A, B, C, D were ever alive at the same time.**" Also strip "[VERY HARD 5pt]".

---

## Logic — Revamp (0)

None — every logic question is text-only and works in our existing types.

---

## Fact — Ready (21)

### 1-19. How many Akatsuki members took their own life?
*("akatsuki" → "Akatsuki")*

### 1-21. Which of the following is largest in size?
*(add ?)*

### 1-25. Who predates the others?

### 2-3. Which nature transformations are required for the Rubber Kekkei Genkai? (mc-multi)

### 2-14. How many shinobi have had the ability to fly? (mc-single with ranges, or slider)

### 3-1. Where is DNA applied during the Edo Tensei Process?

### 3-4. What percent of a tailed beast bomb is negative chakra?

### 3-6. What was the cause of the First Shinobi World War?

### 3-7. Which of the following events occurred during the 3rd Shinobi World War? (mc-multi)
*(strip "[3 pts]")*

### 3-17. What is the purpose of Hanzo of the Salamander's mask?

### 3-18. Which of the following people don't wear their forehead protector on their head? (mc-multi)

### 4-2. Where are the location(s) of Shisui's eyes at the time of Neji's death? (mc-multi)

### 4-3. How was the 8 Tails sealed into Killer Bee?

### 4-18. How many people have walked into Kakashi's Chidori intentionally?

### 5-5. What is Naruto's favorite ramen?

### 5-7. Catch Phrases! → categorize: characters as items, phrases as buckets (or vice versa).

### 5-8. Who has been shown to cast a Juinjutsu (Cursed Seals)? (mc-multi)

### 5-13. The first Naruto Popularity Poll → order: rank the 10 characters by poll position.
*(strip "[0.25 ea]")*

### 5-18. Where does Killer Bee not hold a sword in his 8-sword stance?

### 5-23. What was the first thing Kamui was ever used to pass through?

### 7-19. Which chakra types have been seen infused into a blade? (mc-multi)

---

## Fact — Review (17)

### 1-2. Which major military force never employed the Akatsuki?
*(add ?)*

### 1-3. Which is a nature release not required in Dust Release?
*(add ?)*

### 1-24. The Explosion Corps belongs to which village?
*("explosion corps" → "Explosion Corps")*

### 2-4. Without being able to open any gates, a user can only use ___% of the body's full potential.
`[FLAG]` Best as **slider** (0-100). Or could be mc-single with the canonical answers as options. Pick a type.

### 2-15. Who has not been shown to have a water affinity?
*("not shown to" → "not been shown to")*

### 2-19. In which order did the events occur: A. Itachi uses tsukuyomi B. Sasuke uses rigged shuriken C. Itachi steals Sasuke's eye. D. shuriken battle
`[FLAG]` This is naturally an **order** type (drag the four events into chronological order). The original presented as mc-single with letter sequences as options; ours would just have the four events as draggable items.

### 2-22. Which of the following is not a normal reaction of chakra paper?
`[FLAG]` Original ends mid-sentence ("The paper will" + options below). Cleaner phrasing: "Which of the following is **NOT** a normal reaction when chakra paper is applied?" with options "Burns to ash", "Splits in two", "Turns to stone and crumbles", "Becomes damp", "None of the above".

### 2-24. The Puppet Brigade was most active in which era?

### 3-27. Who was the one who first figured out that Pain's eyes are linked?
*("pain" → "Pain")*

### 4-4. How many Jinchūriki were also Kages?
*("Jinjurikis" → "Jinchūriki" — Japanese plural is the same as singular). Slider type.*

### 4-24. Which of these has Konan created with her paper?
*("konan" → "Konan", and rephrase from the awkward "What are things konan has created..."). mc-multi.*

### 5-2. A Leaf and a Cloud ninja are the only known users of the ___ clone. What is true about these two?
*(capitalize villages)* `[FLAG]` The ___ blank refers to a specific clone type — author should fill in (e.g., "Lightning Style: Lightning Clone") or leave as a fill-in. Decide whether to reveal in the prompt.

### 5-16. Select the first four final words in chronological order.
`[FLAG]` Our **order** type sorts ALL items, not "select the first 4". Easiest adaptation: keep the 8 quotes and ask "Order all 8 final words chronologically" with order type. Or simplify to 4 items only.

### 7-12. Select the first four quotes when in chronological order (last-ish words).
`[FLAG]` Same "first N" issue as 5-16. Plus three options are `(truncated in source)` — need full text from somewhere. Recommend trimming to 4 items + order type, OR rebuilding quote list ourselves.

### 7-14. "If Itachi really wanted to kill you, you would most certainly be dead." Said Person A to Person B. What is their relationship?
*("Said person A to B" → "Said by Person A to Person B")*

### 7-17. How many people have cast reincarnation ninjutsu?
*("casted" → "cast"). Slider.*

### 7-18. Of the speakers below, select the 4 youngest characters.
*("Of the quotes speakers" → "Of the speakers below")*. `[FLAG]` Two quotes are `(truncated in source)` — need full text or pick different quotes.

---

## Fact — Revamp (8)

### 1-10. Who is the only known person to hold both the Will of Fire and Curse of Hatred?
`[REVAMP]` No options were visible on the source page. Either supply mc-single options ourselves OR convert to **name** type (autocomplete on character roster). Our call.

### 3-8. Who is looking through this leaf? (Bonus: what were they doing?)
`[REVAMP]` Needs the source image. Without it the question is unanswerable. Also the "(Bonus)" sub-question would need to be a separate question or be dropped.

### 3-25. How did Sasuke find out that this was an imposter?
`[REVAMP]` Prompt references "this" — needs the source image (the imposter scene). Without media the question has no anchor.

### 4-20. Order the characters by how early they discovered that Tobi is NOT Madara.
`[REVAMP]` Original options are letter sequences (A, B, C, D) — but the actual character mapping isn't in the source. We'd need to identify the four characters ourselves before authoring. Once mapped, this is naturally an **order** type.

### 4-27. Select the 2 characters that are currently physically closest to an Uchiha.
`[REVAMP]` Image-only question — no transcribable text in the source. Needs the panel.

### 5-3. Great nation specialist teams.
`[REVAMP]` Two-dimensional matching: each team needs to be matched to (village, superlative-criterion). Our **categorize** is one-dimensional. Could be split into two questions, or simplified to one dimension (just teams → villages).

### 7-16. Order their deaths episode-wise and select the odd placement deaths (1st, 3rd, etc.).
`[REVAMP]` Two-step task: first order all 8, then select the ones at odd indices. Either split into two questions, or just keep the order (drop the "select odd" twist), or pre-compute the odd-indexed deaths and ask "which of these died at an odd-numbered position".

### 7-24. For the following missing words, select the ones that are an odd number of letters.
`[REVAMP]` Each option is paired with an image — without the images the fill-in-the-blank fragments are too sparse to identify reliably.
