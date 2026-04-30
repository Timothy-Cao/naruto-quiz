# Question formats — the full catalog

Master reference for **what shapes a question can take** in this quiz. Use it as inspiration when authoring: pick a format that fits the canon you want to test, then write the question.

Every format below is one of:
- already canonized in the skill,
- a shape you've explicitly listed,
- or a hard-logic structure we've agreed on.

Costume puzzles (logic puzzles in Naruto cosplay) are not on this list. Canon must be load-bearing.

---

## The seven question types (schema primitives)

Every "labeled slot" — the prompt, every option, every categorize item/bucket, every order item — is a **MediaBlock**: text + at most one media (image or audio, local files only). The old `audio-match` type is gone; that shape is now `mc-single` with audio on the prompt.

- **Multiple choice — single** (`mc-single`): pick one option.
- **Multiple choice — multi** (`mc-multi`): pick a subset.
- **Categorize**: drag items into named buckets.
- **Order**: arrange items along an axis.
- **Slider**: pick a number.
- **Name**: type the answer (autocomplete on character names).
- **Letters**: crossword-style — type into a fixed number of letter boxes with a hint above. Author specifies the canonical answer + the hint.

Audio and image attachments work on **prompts and options** alike — so a single `mc-single` covers OST→scene (audio on prompt), scene→OST (audio on options), spot-the-modified (images on options), silhouette ID (image on prompt), and so on.

**Glossary terms.** Recurring jargon ("sibling-student", "sibling-teacher", future canon terms) is registered in `lib/glossary.ts`. Anywhere a registered term appears in quiz Markdown — prompt, option, item, bucket, hint, explanation — it auto-renders with a dotted underline + hover tooltip. No per-quiz config; add a term in code and every quiz that uses it picks it up.

---

## Knowledge — spanning

Tests cross-arc retrieval. The user has to walk through every member of a known set.

### Format 1 — Spanning aggregate
*"How many of [a known set] satisfy [a property]?"*
**Type:** slider.

> *Example:* How many Akatsuki members died intentionally — by suicide, sacrifice, or choosing to lose?

### Format 2 — Spanning set
*"Which of these N satisfy [a property]?"*
**Type:** mc-multi.

> *Example:* Which of the five basic nature types have ever been observed infused into a blade in canon?

---

## Knowledge — bucketed (categorize)

The user assigns characters into named groups. Both formats test which trait *defines* a character vs which they merely possess.

### Format 3 — Superlatives → character
Buckets are extreme labels (*"strongest genjutsu user"*, *"longest serving Hokage"*, *"first to awaken Mangekyo"*). Items are characters. The user assigns each to the superlative they uniquely hold.
**Type:** categorize.

> *Example:*
> Buckets: *most personal kills*, *longest serving Hokage*, *first to awaken Mangekyo*, *only one to seal a tailed beast solo*
> Items: Hashirama, Hiruzen, Madara, Minato

Authoring rule: each superlative must have **exactly one** defensible holder.

### Format 4 — Specialties → character
Buckets are specialties (*Wind Release*, *medical*, *sealing*, *sensor*). Items are characters. The user assigns each to their *primary* specialty.
**Type:** categorize.

> *Example:*
> Buckets: *Sealing*, *Medical*, *Sensor*, *Lightning Release*
> Items: Tsunade, Karin, Jiraiya, Sasuke

Tighter than superlatives — many characters dabble. Pick characters whose primary affiliation is unambiguous.

---

## Knowledge — thematic / quote

### Format 5 — Quote attribution
A line of dialogue in the prompt. Pick or name the speaker. Covers ordinary memorable quotes *and* last words (final lines hit harder, but the format is the same).
**Type:** mc-single or name.

> *Example:* "Wherever someone thinks of you, that is where home is." → Jiraiya.

Distractor speakers should share era, archetype, or arc with the real speaker.

---

## Knowledge — chronological

### Format 6 — Chronological ordering
*"Order these events / characters from earliest to latest."* The criterion is **time, stated explicitly**.
**Type:** order.

> *Example:* Order these Hokage from earliest reign to latest — Hashirama, Tobirama, Hiruzen, Minato, Tsunade.

### Format 7 — First use of a shared ability
An ability multiple characters share. Order them by who used it first in canon, or pick the first user.
**Type:** order or mc-single.

> *Example:* Order these characters by when they first used Susanoo on screen — Itachi, Sasuke, Madara, Kakashi.

The cheeky version: include a character famously associated with the ability who was *not* the first to display it.

---

## Logical — simple

One layer of inference on top of canon retrieval.

### Format 8 — Reference chain (1–2 hops)
*"Sasuke's brother's killer was killed by whom?"* Resolve the chain, name the target.
**Type:** mc-single.

> *Example:* The leader of the village that produced the Sannin's traitor — who killed them?

Each distractor should be the answer the user lands on if they break at a *specific* link in the chain.

### Format 9 — Constraint check
*"Which of these characters has done all of A, B, and C?"* Three checks per option.
**Type:** mc-single.

> *Example:* Which of these characters has fought all three Sannin?

### Format 10 — Graph traversal (degrees of separation)
*"How many degrees of separation between X and Y?"* Edge rule defined explicitly (met on screen, fought, shared a teacher).
**Type:** slider.

> *Example:* Degrees of separation between the Second Raikage and Yugito Nii.

The user does heuristic search and submits the shortest path they found, knowing it might not be optimal.

### Format 11 — Pair that never met
*"Which of these character pairs never appeared together on-page?"* Four pairs; three had at least one canonical interaction; one pair never did.
**Type:** mc-single.

> *Example:* (a) Hashirama & Hiruzen, (b) Tsunade & Sasuke, (c) Jiraiya & Konan, (d) Minato & Itachi

Inverse of graph traversal. Tests *absence* of a connection — the hardest direction because the user has to rule out a path rather than find one.

---

## Logical — hard

Multiple layers of inference. Pen-and-paper or genuine deliberation.

### Format 12 — Constraint-satisfaction set ("4 chars, 5-of-6 true")
A hidden N-tuple of characters constrained by an over-arching framing rule, plus K statements where K-1 are true. The user identifies the set first, then the lie.
**Type:** mc-multi (pick the 5 true statements, or pick the 4 characters).

> *Example:* These 4 unique characters were **never alive at the same time** (ignoring revival jutsu). Five of these six statements about them are true:
> 1. Exactly 2 of them are Kage
> 2. Exactly 3 of them are jinchuriki
> 3. They all have different hair colors
> 4. When sorted by birth, their relative strengths are also sorted
> 5. Exactly 2 share the same first letter of their first name
> 6. 3 of them have had children
>
> *(Hidden answer set: Hagoromo, Hashirama, Minato, Konohamaru.)*

### Format 13 — Multi-hop chain + statement evaluation
Decode A, B, C through chained canon references in the prompt. Then evaluate which of N statements applies to all/some/none of them.
**Type:** mc-single.

> *Example:* "Character A's source's killer's leader killed character B, whose family member killed the son of character C. Which statement could **not** be said of all three?" — followed by 5–6 statements like *"I've sealed a tailed beast"*, *"I've fought the current leader of a hidden village"*, etc.

Each hop must be canonically unambiguous. One bad hop sinks the question.

### Format 14 — Hidden-criterion ordering ⭐
*"Order these from first to last."* The criterion isn't chronology — it's a canon fact the user has to **infer**.
**Type:** order.

> *Example:* Order Team 7 by **when each first learned the truth about the Uchiha massacre.**

The default mental model is the chronology of the *event*, not chronology of the *learning*. The list has to be long enough — about 7 items — that the unique correct ordering is the only canon-defensible one.

### Format 15 — Quartet that covers a property set ⭐
Show 12 characters and 4 candidate sets of 4. Below them, list 8 canonical criteria. Exactly one of the 4 sets has the property that **its 4 characters collectively satisfy all 8 criteria** (each criterion satisfied by at least one of the four). Pick that set.
**Type:** mc-single (over the four candidate quartets).

> *Example sketch:*
> 12 characters: Naruto, Sasuke, Sakura, Kakashi, Itachi, Killer B, Gaara, Minato, Hashirama, Tobirama, Hiruzen, Tsunade
> 8 criteria: *has used a kekkei genkai*, *has been Hokage*, *has been a jinchuriki*, *was on Team 7*, *has fought a tailed beast solo*, *has used Wind Release*, *has used Wood Release*, *has lost to Naruto on screen*
> Four candidate quartets — one of them collectively covers all 8.

Wrong quartets each fail a *different* criterion, so a wrong answer tells you which canon fact the user blanked on.

### Format 16 — Smallest covering set
*"What is the smallest number of characters needed such that every Akatsuki member has fought at least one of them?"* — minimum cover over a canonical relationship graph.
**Type:** slider for the count, or mc-multi for the set itself.

> *Example:* Pick the smallest set of Konoha shinobi such that every Akatsuki member has been fought by at least one of them.

Same family as Format 15 — both are "characters covering canonical criteria." Format 15 fixes the size; Format 16 makes the size itself the puzzle.

### Format 17 — Composite identity (vague clues)
Four loose clues that each individually admit dozens of candidates. The intersection is a single canon character. Backsolve who.
**Type:** mc-single or name.

> *Example:*
> "I once held eyes that had previously seen the Tsukuyomi.
> My master shared a master with the Fourth Hokage's master.
> My last command came from someone who had recently been to the Land of Iron.
> My first kill happened on a battlefield where Shikaku Nara also stood."

Clues must be **deliberately vague**. "I had Itachi's eyes" is too narrow. The work is intersecting four loose filters across canon.

---

## Knowledge association — sensory

Match a stimulus (audio, image) to its canon source.

Audio-match is **bidirectional** — the audio can be the stimulus *or* the options. Three concrete shapes below.

### Format 18 — Audio/video stimulus → text options
A single audio (or video) clip plays. Options are text labels — scenes, characters, arcs.
**Type:** audio-match (today: `audioSrc` on the question, text options).

> *Example:* This track plays. Which character's death scene is it from?

Pick deeper cuts. *Sadness and Sorrow* is too obvious. Video stimulus opens the door to *"what just happened?"* and *"spot what's wrong"* once we have the tooling.

### Format 19 — Image stimulus → audio options
Show a still frame from canon. The options are themselves **playable audio clips**. The user listens to each candidate track and picks the one that scored that scene.
**Type:** audio-match — but inverted relative to Format 18. **Schema gap:** options today are text-only; this format requires per-option `audioSrc`.

> *Example:* (image of Itachi's final smile) Which of these tracks plays during this beat?
> 🎵 Option A · 🎵 Option B · 🎵 Option C · 🎵 Option D

This is a meaningfully different test from Format 18: the user has to *recall the sound*, then verify it against four playable candidates. Memory-first, recognition-second. Format 18 is the reverse.

### Format 20 — Audio stimulus → audio options
Optional further variant: the prompt is a clip *and* every option is a clip. Useful for "which of these four is the same character's theme?" or "which is the original cue this remix is built on?"
**Type:** audio-match. Same schema gap as Format 19.

### Format 21 — Spot the modified image
Four near-identical canon panels. Three are unchanged. One has a subtle alteration — a hand sign changed, a clothing detail flipped, a Sharingan tomoe count off, an extra character inserted. Pick the modified one.
**Type:** mc-single (with per-option images).

> *Example:* Four versions of the cover of chapter 1 of Shippuden. One has Naruto's headband off-center.

Tests sharp visual recall.

> **Schema gap:** options today are text-only. Per-option images would need a small schema extension. Worth doing if we author this seriously.

### Format 22 — Silhouette or partial visual ID
An image with most identifying detail stripped — a silhouette, a single hand visible from off-panel, a character mid-transformation, a back-only shot. Identify them.
**Type:** mc-single (with central image).

> *Example:* A silhouette wielding a curved sword with a chain. Pick who.

Tests how much of canon visual identity lives in body proportions, weapon shape, characteristic posture, a specific scar.

### Format 23 — Voice recognition / speech-pattern match
Short excerpt of dialogue with proper nouns and topical content redacted. Match excerpts to speakers by speech pattern alone — Killer B's rhymes, Jiraiya's bombast, Hidan's aggression, Itachi's measured cadence.
**Type:** categorize (excerpts → characters) or mc-single per excerpt. Audio variant: play the line, no character name spoken.

> *Example (text):* "...you ███, you ████, fool of a ████, ya know what I'm sayin'?" → Killer B.
> *Example (audio):* short clip of dialogue, no name dropped — pick the speaker.

Tests voice as canon — does the user know how a character *talks*, distinct from what they say?

---

## Format index

**By type:**
- **mc-single:** 5, 7, 8, 9, 11, 13, 14, 15, 16, 17, 21, 22, 23
- **mc-multi:** 2, 12, 16
- **categorize:** 3, 4, 23
- **order:** 6, 7, 14
- **slider:** 1, 10, 16
- **name:** 5, 17
- **audio-match:** 18, 19, 20, 23 *(audio variant)*

**By difficulty:**
- **Knowledge breathers:** 1, 2, 3, 4, 5, 6, 18, 19
- **Logical-simple:** 7, 8, 9, 10, 11
- **Logical-hard:** 12, 13, 14, 15, 16, 17
- **Sensory specials:** 18, 19, 20, 21, 22, 23
