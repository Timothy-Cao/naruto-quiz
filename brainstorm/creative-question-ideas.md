# Creative question ideas

Companion to `hard-logic-structures.md`. Catches ideas that aren't strict hard-logic but are unique, cool, or do something a normal quiz question can't. Some of these need new question types or new player features — flagged where so.

---

## Format-bending — what a "question" can be

### C1. Blind-options question
- **Concept:** Show only the answer choices, no prompt. The user infers what's being asked from the options themselves.
- **Why it's cool:** Requires the user to find the *axis* the options share. *(Naruto, Killer B, Gaara, Yagura)* → "obviously jinchuriki." But *(Naruto, Killer B, Gaara, Roshi, Han)* → not just jinchuriki, also "introduced in Shippuden" or "fought in the Fourth War."
- **Canon-load:** the user has to find the *most specific* property all options share, which only works if you know the full canon properties of every option.
- **Implementation:** `mc-single` where the prompt is "What do these have in common?" (or omitted entirely). New variant we'd need: a prompt that reveals only after answering.

### C2. Mid-quiz callback
- **Concept:** Question N's answer is the same character/event as Question M's answer (M < N), and the prompt explicitly says so: *"The character from Q3 — what's their...?"*
- **Why it's cool:** Rewards the user for *holding answers in working memory* across the quiz. Punishes guessing on Q3.
- **Canon-load:** real, because the link is canon.
- **Implementation:** doable today with careful authoring; no schema change.

### C3. Cumulative answer set
- **Concept:** Three questions, same six answer options. Constraint: each option can be used as a correct answer **at most once** across the three questions.
- **Why it's cool:** Each question becomes harder as the answer space shrinks. The user has to think about *future* questions to avoid burning the right answer early.
- **Canon-load:** requires real canon to know which option is uniquely right for which question.
- **Implementation:** new question type or a "question group" wrapper. Tabled until we model it; worth the design work.

### C4. Reveal-on-scroll difficulty knob
- **Concept:** A long question where scrolling down reveals more clues *and* costs points. The user can submit early for max points, or scroll for hints.
- **Why it's cool:** Lets us write questions with a wide difficulty range without forcing the user into one. Self-pacing.
- **Implementation:** new question type. Worth a design pass.

### C5. The unreliable narrator
- **Concept:** Prompt is a quoted in-character monologue. The character *says* something canonically false (Madara's revisionism, Obito's framing, Kabuto's bait). The actual question is "what part of this is the lie?"
- **Why it's cool:** Reads like a flashback, plays like a deduction puzzle. Forces the user to fact-check a beloved monologue.
- **Canon-load:** maximum — the only way to identify the lie is to know what canon-truth says.
- **Implementation:** `mc-single` over the spans of the monologue. Markdown-rich prompt.

---

## Audio / sensory shapes

### C6. Audio cipher — degraded OST
- **Concept:** OST clip played reversed, half-speed, or layered with another track. Identify the source.
- **Why it's cool:** Tests *deep* familiarity with the score, not just recognition. Casual fans bounce off; superfans love it.
- **Canon-load:** only the listener who knows the OST's melodic shape can identify it through degradation.
- **Implementation:** existing `audio-match` type with pre-processed mp3 files.

### C7. Two-character voice ID
- **Concept:** A short clip of dialogue between two characters. Identify both speakers from voice alone (no character names mentioned in the clip). Extra-hard variant: dub-voice match.
- **Why it's cool:** Voice acting is part of the canon experience, and we don't currently test it.
- **Implementation:** `audio-match` with two correct slots, or a future "multi-pick" audio type.

### C8. Score-as-spoiler
- **Concept:** Play an OST. Ask: *"Which character's death scene plays this?"* — but several characters have death scenes scored to the same theme (sad music gets reused). The puzzle is identifying the *first* canonical use, or the most iconic use.
- **Canon-load:** requires knowing every scene a track was used in, not just one.
- **Implementation:** `audio-match`.

### C9. Silent-frame question
- **Concept:** A single manga panel with all dialogue removed. Identify the chapter / scene / what's being said.
- **Why it's cool:** The visual cues (background, character expression, framing, who's adjacent to whom) become the only data. Like a Where's Waldo for canon.
- **Implementation:** `mc-single` with image as central image. Existing tooling.

---

## Logical-but-not-hard-logic

### C10. Spoiler-safe ordering
- **Concept:** Order events from a single arc by *what was revealed to the audience first*, not what happened in-universe first. Flashbacks-of-flashbacks let us rank canon reveals across the timeline of the read, not the timeline of the story.
- **Why it's cool:** Two valid timelines (in-universe and reading order) exist for every flashback. Most quizzes only ever ask the in-universe one.
- **Implementation:** `order`.

### C11. Power-curve calibration
- **Concept:** *"At which point in canon could character X have defeated character Y?"* Show three timeline checkpoints (early Shippuden, mid-war, post-war). Pick the earliest.
- **Why it's cool:** Forces the user to track *power growth* across canon, not just snapshot strength. Sasuke at the end of Part 1 vs Sasuke at Land of Iron is a different fighter.
- **Canon-load:** requires multi-checkpoint familiarity with both characters.
- **Implementation:** `mc-single` with checkpoint options.

### C12. The "every X has Y, except one" question
- **Concept:** *"Every Hokage has personally killed someone in canon. Which one is the exception?"* The puzzle is verifying the rule across N–1 cases plus identifying the exception.
- **Why it's cool:** Canon-spanning + sharp, with a clear payoff.
- **Implementation:** `mc-single`. Nudge: the rule itself should be non-obvious.

---

## Meta / structural

### C13. Live-music coupling
- **Concept:** A question that uses *whatever track is currently playing in the audio system* as its prompt. *"This music is playing — when did it last appear in canon?"*
- **Why it's cool:** Bridges the music-pack system into the questions themselves. Dynamic — same quiz feels different depending on the user's pack/track.
- **Implementation:** new question type that reads from the audio context.

### C14. Difficulty-rating-aware questions
- **Concept:** A question whose prompt varies based on the average rated difficulty of the prior questions. Easy quiz so far → harder version of this question. Hard quiz so far → easier version. Adaptive.
- **Why it's cool:** Quiz pacing handles itself.
- **Implementation:** significant — needs runtime branching. Probably out of scope unless we revisit player architecture.

### C15. Author-as-distractor
- **Concept:** A `mc-single` where one of the distractors is *a thing the quiz author thought was canon but isn't*. The explanation calls this out: "If you picked X, you're remembering the anime-only filler from arc Y."
- **Why it's cool:** Turns common misconceptions into the trap. Educational on miss.
- **Canon-load:** the right answer requires knowing the manga; the wrong answer is the "remembered version."
- **Implementation:** `mc-single` with no schema change, just authorial discipline.

---

## Selection notes

Of this list, the ones I'd promote first:

- **C5 (unreliable narrator)** — highest canon-load, highest cheek, no new tech.
- **C1 (blind options)** — most novel format, no new tech, infinite reusable axes.
- **C10 (spoiler-safe ordering)** — uses an existing question type in a way we haven't yet, immediately authorable.
- **C12 (every X has Y, except one)** — a clean canonical shape we should formalize.

Tech-cost ones that might justify the build:
- **C3 (cumulative answer set)** — opens a whole new question genre.
- **C4 (reveal-on-scroll)** — adaptive difficulty per-question.
- **C13 (live-music coupling)** — a unique selling point of this quiz site that no other quiz can do.
