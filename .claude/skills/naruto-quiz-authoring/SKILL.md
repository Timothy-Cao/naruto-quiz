---
name: naruto-quiz-authoring
description: Use when creating, reviewing, or answering quiz questions for the naruto-quiz repo. Establishes the four question buckets (knowledge-facts, logical-simple, logical-hard, knowledge-association), the recurring question patterns (spanning, thematic, constraint-satisfaction, chained-reference, graph-traversal), what makes a good question vs a bad one, quiz-level pacing rules, and the workflows for authoring with the user vs reviewing their drafts.
---

# Naruto Quiz Authoring

Playbook for working on quiz questions in this repo. Read this whenever the user asks for help **creating**, **reviewing**, or **solving** questions.

## North star

> **No obvious questions.** A casual fan on autopilot should not get the answer right. Every question should reward careful reading and either deep canon knowledge or genuine deduction.

If a question can be answered correctly in under 5 seconds by someone who's only seen the show casually, it's not the question we want. Push back.

## What makes a good question (the deeper rule)

Beyond "not obvious," the goal is one of three things per question:

1. **Stretch knowledge.** Force the user to *aggregate* across many points in canon — multi-arc recall, set-membership reasoning, "which of these N have property P." A great knowledge question requires the user to mentally walk through several scenes/characters and synthesize, not just recognize.
2. **Reward deduction.** Logic questions are sudoku/mystery — there are hidden variables, but the *constraints* uniquely (or near-uniquely) pin down the answer. The user uses what they know AS DATA to deduce.
3. **Earn an emotional beat.** Occasionally — sparingly — a question is just thematically fun: a beautiful quote, a quirky callback. These are palate cleansers, not the bulk.

If a draft question doesn't do at least one of those three, it's filler. Replace it.

## Multi-media is intentional

MP3 clips, images, and (eventually) video are part of the design, not garnish. Each multi-media question forces the user to **rethink and rewire** their canon knowledge in a fresh sensory context — a character you "know" by their arc feels different when you hear their theme; a scene you summarize from memory reads differently when you see a single frame of it.

Reach for multi-media when:
- An OST or sound effect *defines* a scene more than the dialogue does → `audio-match`.
- A visual detail (a hand sign, a clothing change, a background) is the actual answer → image as central image with `mc-single`/`mc-multi`.
- A short video clip would let you ask "what just happened?" or "spot what's wrong" — pending tooling, but the design is intentional toward video over time.

The combination of multi-media stimulus + logical deduction is the highest-quality pairing in this quiz — leans on canon knowledge AND sensory memory AND reasoning all at once. Lean into it.

## Quiz-level pacing

Hard questions in a row burn the user out. A good quiz **interleaves cognitive load** so each hard problem is followed by a breather.

Rough mix for a 10-question quiz:
- 4–5 knowledge questions (mostly *spanning*, occasionally *thematic*)
- 2–3 logical simple
- 1–2 logical hard
- 1 knowledge association (audio-match or image)

Sequencing rules:
- **Never two logical-hard back-to-back.** Sandwich each between an easier knowledge or a thematic.
- **Open with something accessible** so the user warms up. Not the hardest puzzle.
- **End strong.** A satisfying question last — either a logical-hard that closes the quiz with a payoff, or a thematic-fun that lands emotionally.
- **Vary the answer mechanic too.** Don't ship 5 mc-single in a row even if they're each interesting; mix in slider, categorize, name, audio-match.

This applies to quizzes, not individual questions — when reviewing one question in isolation, don't critique it for its placement; critique it for its merit.

## The four buckets

Every question belongs to exactly one bucket. The bucket determines the test, the difficulty model, and the kind of distractors that work.

### 1. Knowledge facts

**What it tests:** Recall + synthesis of specific canon details. Two strong subtypes plus one rare exception.

#### 1a. Spanning (the bulk of knowledge questions)

Forces the user to walk through *many* points in canon and aggregate. The question is about a *property over a set*, not a single fact.

**Examples:**
- *"How many Akatsuki members died intentionally (suicide, sacrifice, or chose to lose)?"* — user must consider every Akatsuki member's death scene.
  - **slider** answer (0–10).
- *"Which nature types have ever been observed infused into a blade?"* — Wind (Asuma's chakra blades), Lightning (Sasuke's chokuto), Yin via Shadow (Shikamaru lending Asuma's chakra blade against Hidan/Kakuzu — easy to miss), etc.
  - **mc-multi** answer over the 5 nature types + yin/yang.
- *"Which of the Konoha 11 have used a forbidden jutsu in canon?"*
  - **mc-multi**.

The win condition: the user can't answer without cross-referencing several memories. If they can answer from a single recalled scene, the question's not spanning enough.

**Authoring:** decide the *property* first (e.g., "died intentionally"), enumerate every set member, score each as yes/no/uncertain, and resolve the uncertain ones from canon. Use the resulting count or sub-set as the answer. The explanation should list every member and how it scored — that's the payoff for the user who got it.

#### 1b. Thematic / fun

The exception. Used sparingly (≤1 per quiz of 10). A beautiful quote, a quirky moment, a clever callback. Should leave the user smiling whether they got it right or not.

**Examples:**
- *"Who said: 'Wherever someone thinks of you, that is where home is'?"* — Jiraiya. **mc-single**.
- *"Which character has the longest name?"* — quirky aggregation. **mc-single**.

Used to break tension between hard logic puzzles. Don't overuse — they lose their punch when frequent.

#### 1c. Surface (mostly avoid)

Single-fact questions like *"Who is the Fourth Hokage?"* are too obvious. Allowed only as bait setups for harder questions later in the quiz, or when the "fact" is itself genuinely obscure (*"Who is Naruto's second cousin?"*).

**Distractor strategy across all knowledge subtypes:** options are *near misses* — same era, same clan, same archetype, plausible-but-wrong. For spanning slider questions, the distractor is the user mis-counting; tune `min`/`max` so common wrong counts (off by 1, off by 2) sit visibly on the slider.

**Implementation:** spanning is usually `mc-multi` (which-of-set) or `slider` (how-many-of-set). Thematic is usually `mc-single` or `name`.

### 2. Logical simple

**What it tests:** Constrained deduction the user can hold in their head. The user takes their canon knowledge and applies *one* layer of logic on top.

Three recurring patterns:

#### 2a. Reference chain (1–2 hops)

*"Sasuke's brother's killer was killed by whom?"* — Itachi → Sasuke (via Itachi's brother) → "killed by Madara/Black Zetsu after Sasuke killed him in a fight Itachi let him win" — gets to a target.

#### 2b. Constraint check

*"Which of these characters has fought all three Sannin?"* — for each option, recall: did they fight Jiraiya? Tsunade? Orochimaru? Three checks per option.

#### 2c. Graph traversal — degrees of separation

*"How many degrees of separation between the Second Raikage and Yugito Nii?"* (connection = met on screen or stated to have met) — user does heuristic graph search through Cloud Village, tailed-beast politics, etc., trying to minimize the path.

This pattern is rich because:
- The user doesn't know the target distance (1, 2, 3, 4+) — they have to **search**.
- Wrong answers come from finding *a* path but not the *shortest*. The slider answer space (0–10) lets the user submit what they found while knowing it might not be optimal.
- Implementation: `slider` from 0 to ~6 (anything more is a writeup-quiz, not a quiz question).

**Distractor strategy** (for mc variants): each distractor should be the answer the user lands on if they make a *specific* misstep. Mistakes should be diagnostic — wrong answer X tells you the user broke at link Y of the chain.

**Implementation:** `mc-single` for chains and constraint checks; `slider` for graph distances and counts; occasionally `categorize` when the deduction yields a labeled set.

### 3. Logical hard

**What it tests:** Multi-statement constraint satisfaction, multi-hop reference chains, or set-construction problems. Should require pen and paper or genuine deliberation. The answer is often *the question itself* — you have to identify the hidden set/chain before you can answer the explicit question.

The framing: **logic questions are sudoku or mystery puzzles.** Hidden variables (which 4 characters? which 3 references?) are constrained by relationships in the prompt to a unique (or near-unique) solution.

> "These answers can be part of the coupling/constraints, but also be just an aggregate of the true answer into a single answer."

Translation: sometimes the user must *identify the variables* themselves; other times the variables are clear and the user just *aggregates over them*.

#### Canonical examples (from the user)

##### Example A — constraint satisfaction (5-of-6 statements true)
> These 4 unique characters were never alive at the same time (ignoring revival jutsu). 5 out of the 6 statements below are true. Select the 5:
>
> 1. Exactly 2 of them are Kage
> 2. Exactly 3 of them are jinchuriki
> 3. They all have different hair colors
> 4. When sorted by birth, their relative strengths are also sorted
> 5. Exactly 2 of them share the same first letter of their first name
> 6. 3 of them have had children
>
> *(Hidden answer set: Hagoromo, Hashirama, Minato, Konohamaru)*

The user **first deduces the hidden set** from the constraints, then checks each statement against it. Constraint #1 (never alive at the same time) prunes the universe; the rest of the statements both describe the set AND let the user identify the lie.

When authoring this style:
- The hidden set should be uniquely determined by the explicit + implicit constraints.
- Exactly one statement should be the lie; the other 5 must hold for the hidden set.
- The lie should be plausible — close enough that the user can't dismiss it as a freebie.
- **Verification check:** privately enumerate every alternative set that satisfies the framing constraint ("never alive at the same time, distinct, plausible 4-tuple"). Confirm only one such set satisfies *5 of the 6* statements.

##### Example B — chained reference + statement evaluation
> Character A's source's killer's leader killed character B, whose family member killed the son of character C. Which statement could **not** be said of A, B, and C?
>
> 1. Every known member of my clan has a famous nickname
> 2. I've sealed a tailed beast into someone before
> 3. I've fought the current leader of a hidden village
> 4. I specialize in genjutsu
> 5. I am the only one of us who has fought 2 or more Uchiha in the past
> 6. I've known character A since I was young

The user decodes A, B, C through the multi-hop reference chain (e.g., "A's source's killer's leader" = a 3-hop reference), THEN evaluates each statement against the trio.

When authoring this style:
- Each reference hop must be unambiguous in canon — only one valid interpretation.
- Statements must be evaluable against ALL THREE characters in the answer set. Quantifier scope matters ("could be said" = at least one? exactly one? all three?). Disambiguate carefully in the prompt.
- Avoid statements that hinge on filler/anime canon.

#### Verification: ideally one solution

> "Logic questions should have ideally one unique solution, but sometimes it's difficult to verify and that's okay. If a user comes up with another answer, we can correct for it."

Aim for unique. Accept that occasionally a clever user finds a second valid set we didn't anticipate. When reviewing, attempt to find counter-solutions; if you find one, either tighten constraints to exclude it or expand the accepted-answers list.

**Workflow for handling alternate-answer disputes** (the user has confirmed this approach): edit the question's JSON in `data/quizzes/<slug>.json` directly to broaden `acceptedAnswers` (for `name`/`mc-multi`) or accept the alternate `correctId` (for `mc-single`/`audio-match`), commit, push. The user re-takes the quiz to update their localStorage best score. No in-app override UI is planned — the source JSON is the source of truth and is the simplest audit trail. Eventually we may build a logical solver that pre-indexes character connections to verify uniqueness automatically; until then, manual re-edit on dispute is the workflow.

**Distractor strategy:** all distractors should plausibly *resolve* — the user can't dismiss any without doing the work. Wrong ones should be true of two but not the third, or true under a slight misreading of a constraint.

**Implementation:** `mc-multi` for "select 5 of 6 true statements" or "select the 4 characters"; `mc-single` for "which could not be said." Always with rich Markdown prompts so the constraint structure is readable.

### 4. Knowledge association

**What it tests:** Sensory/contextual recall. Match a stimulus (audio clip, image, descriptive scene) to its canon source.

**Good fits:**
- *"Which scene plays this OST?"* — `audio-match`.
- *"Which character does this theme accompany?"* — `audio-match`.
- *"In which arc does this image appear?"* — `mc-single` with the image as the central image.

**Bad fits:**
- OSTs famous enough to be obvious (Sadness and Sorrow → "this is sad" doesn't test anything). Pick the *deeper* cuts.

**Implementation:** `audio-match` for music. Image association uses `mc-single` with the image as the question's central image.

---

## Pattern catalog (cuts across buckets)

When the user asks for "another like the X one," map to the pattern, not the bucket:

| Pattern | Bucket | Mechanic | Example |
|---|---|---|---|
| Spanning aggregate | knowledge | "How many of N satisfy P?" | Akatsuki who died intentionally |
| Spanning set | knowledge | "Which of N satisfy P?" | Nature types infused into blades |
| Thematic / quote | knowledge | "Who said X?" | Jiraiya's home quote |
| Reference chain (1–2 hops) | logical-simple | "X's Y's Z" | Sasuke's brother's killer's killer |
| Constraint check | logical-simple | "Has X done all of A, B, C?" | Fought all three Sannin |
| Graph traversal | logical-simple | "Degrees of separation between X and Y" | 2nd Raikage ↔ Yugito |
| Constraint satisfaction set | logical-hard | "Which N satisfy properties P1..Pk simultaneously?" | The 4 never-alive-together puzzle |
| Multi-hop chain + evaluation | logical-hard | Decode A/B/C, then evaluate statements about them | The "could not be said" puzzle |
| OST → scene/character | knowledge-assoc | Audio match | Itachi's theme → which scene |

---

## Workflows

### Workflow A: User asks me to *create* a question with them

1. **Pick the bucket and pattern.** Don't write anything until we agree on both. The pattern catalog above narrows the design space fast.
2. **Define the cognitive task** in one sentence. *"Force the user to recall every Akatsuki death and judge which were intentional."* — concrete, falsifiable.
3. **Sketch the answer first.** For spanning: pick the property and enumerate the set, score every member. For logical: write down the hidden variables and verify there's exactly one solution. Don't write distractors before knowing the answer.
4. **Build the world.** For logical-hard, list the implicit constraints that uniquely identify the hidden set/chain.
5. **Write distractors** that are *near misses* per the bucket's distractor strategy. Push back if any distractor is "obviously wrong."
6. **Write the explanation** that walks through the deduction step-by-step. For spanning questions, list every set member and how it scored. This is the second-most-important field after the prompt.
7. **Self-review** with the checklist below.

### Workflow B: User asks me to *review* a question they wrote

Apply this checklist in order:

1. **Bucket fit + pattern fit.** Does the question test what its bucket claims? A "logical-hard" question that resolves in 10 seconds is mislabeled — probably logical-simple or knowledge.
2. **Obviousness check.** Could a casual fan get this right without thinking? Red flag.
3. **Stretch / deduction / emotion check.** Does the question do at least one of: stretch knowledge across canon, reward deduction, deliver an emotional beat? If none, it's filler.
4. **Canon check.** Manga-only (Naruto + Naruto: Shippuden). Filler arcs, anime-only, Boruto-only → flag and suggest replacement.
5. **Resolution check.** For logical questions, does the prompt uniquely determine the hidden set/chain? Try to find a counter-solution; if you do, flag it.
6. **Statement consistency** (logical-hard, 5-of-6 style): verify each statement against the proposed hidden set. Authors often miss an edge case.
7. **Distractor quality.** Per bucket strategy. Flag any freebie distractor or near-duplicate.
8. **Explanation quality.** Walks through deduction, not just states the answer. For spanning: enumerates the set with each member's status.
9. **Pacing fit** (only when reviewing in the context of a full quiz): does this question sit next to others that overload the user with consecutive hard logic?

Output as a numbered list of findings, ranked by severity (broken / important / nit). Be willing to say "this question is good as-is."

### Workflow C: User asks me to *solve* a question

1. Read the prompt twice — once for content, once for constraints/qualifiers ("never alive at the same time", "could not be said", "intentionally").
2. Decode any reference chains explicitly. Write out "A's source's killer's leader = ..." with each hop labeled.
3. For logical-hard: identify the hidden set first, then evaluate statements one by one. Don't shortcut.
4. For spanning: enumerate the set explicitly (every Akatsuki member, every nature type, etc.), score each, then aggregate.
5. State your answer with the deduction shown, not just the result. The user is using me as a thinking partner; show the work.
6. If the question seems broken (ambiguous, multiple valid answers, references filler-only events), call that out instead of guessing.

---

## Style

- **Markdown prompts are encouraged.** Bold for emphasis, italic for character names being referenced, bullet lists for statement sets. Reach for structure when it makes the question *clearer*, not just prettier.
- **Character names:** prefer first-name-last-name on first reference per question (e.g., "Itachi Uchiha"). After that, single-name is fine.
- **No filler:** every fact must come from the manga. The autocomplete data list is filtered accordingly; if you reference a character not in `data/characters.json`, double-check they're manga-canon.
- **No spoiler scrambles within a quiz:** if Quiz N references events from late Shippuden and Quiz N+1 has earlier events, that's fine. But within a single quiz, don't reveal a major plot point in question 1 that's the punchline of question 5.

## Maintenance

Update this file when:
- A question reveals a new authoring pattern worth canonizing → add to the Pattern Catalog
- We identify a category of bad question we keep needing to push back on → add to Bad Fits
- A new question type is added to the schema (currently: `mc-single`, `mc-multi`, `categorize`, `order`, `slider`, `name`, `audio-match`)
- The user shares a new opinion about question design → reflect it in the relevant section, don't just append

The skill is checked into the repo at `.claude/skills/naruto-quiz-authoring/SKILL.md` and is the source of truth.
