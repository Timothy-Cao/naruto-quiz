---
name: naruto-quiz-authoring
description: Use when creating, reviewing, or answering quiz questions for the naruto-quiz repo. Establishes the four question buckets (knowledge-facts, logical-simple, logical-hard, knowledge-association), what makes a good question vs a bad one, and the workflows for authoring with the user vs reviewing their drafts.
---

# Naruto Quiz Authoring

Playbook for working on quiz questions in this repo. Read this whenever the user asks for help **creating**, **reviewing**, or **solving** questions.

## North star

> **No obvious questions.** A casual fan on autopilot should not get the answer right. Every question should reward careful reading and either deep canon knowledge or genuine deduction.

If a question can be answered correctly in under 5 seconds by someone who's only seen the show casually, it's not the question we want. Push back.

## The four buckets

Every question belongs to exactly one bucket. The bucket determines the test, the difficulty model, and the kind of distractors that work.

### 1. Knowledge facts

**What it tests:** Recall of specific canon details that aren't broadly known.

**Good fits:**
- "Who is the Fourth Hokage's father?" *(not a household-name fact)*
- "How many fingers did Jugo's Sage Mode form take in the Land of Iron arc?" *(forces verification, not vibes)*
- "True or false: Itachi was promoted to Jonin before the Uchiha massacre." *(specific date-bound fact)*

**Bad fits:**
- "Who is the Fourth Hokage?" — every viewer knows this
- "Who killed Itachi?" — too famous

**Distractor strategy:** Pick options that *almost* could be right — same era, same clan, same archetype. Avoid options that are obviously absurd.

**Implementation:** Usually `mc-single`, sometimes `mc-multi` ("which of these are Akatsuki?"), occasionally `slider` ("how many tailed beasts has X sealed?"). `name` for "type the character" recall.

### 2. Logical simple

**What it tests:** One or two layers of indirect reference, solvable in your head in under 30 seconds.

**Good fits:**
- "Naruto's sensei's sensei's sensei is the Hokage during which Great Ninja War?"
- "Which of these characters has fought all three Sannin?"
- "Sasuke's brother's killer was killed by whom?"

**Distractor strategy:** Each distractor should resolve a *different* chain plausibly — i.e., if the user mistakes one link in the reference chain, they should land on a specific wrong answer. This makes the question diagnostic of *where* their reasoning broke.

**Implementation:** Often `mc-single` with deductive prompts. Sometimes `categorize` when the deduction yields a set.

### 3. Logical hard

**What it tests:** Multi-statement constraint satisfaction, multi-hop reference chains, or set-construction problems. Should require pen and paper or genuine deliberation. The answer is often *the question itself* (you have to identify the hidden set before you can answer).

**Canonical examples** (from the user):

#### Example A — constraint satisfaction
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

The trick: the user must **first deduce the hidden set** from the constraints, then check each statement against it. Constraint #1 (never alive at the same time) prunes the universe; the rest of the statements both describe the set AND distinguish the true ones from the false one.

When authoring this style:
- The hidden set should be uniquely determined by the explicit + implicit constraints
- Exactly one statement should be the lie; the other 5 must hold for the hidden set
- The lie should be plausible — close enough that the user can't dismiss it as a freebie

#### Example B — chained reference
> Character A's source's killer's leader killed character B, whose family member killed the son of character C. Which statement could **not** be said of A, B, and C?
>
> 1. Every known member of my clan has a famous nickname
> 2. I've sealed a tailed beast into someone before
> 3. I've fought the current leader of a hidden village
> 4. I specialize in genjutsu
> 5. I am the only one of us who has fought 2 or more Uchiha in the past
> 6. I've known character A since I was young

The trick: the user must decode A, B, C through the multi-hop reference chain ("A's source's killer's leader" = a 3-hop reference), THEN evaluate each statement against the trio.

When authoring this style:
- Each reference hop must be unambiguous in canon — only one valid interpretation
- Statements must be evaluable against ALL THREE characters in the answer set ("could be said of A, B, and C" = true for at least one of them, or true for the speaker if the speaker is one of them — disambiguate carefully)
- Avoid statements that hinge on filler/anime canon

**Distractor strategy:** All distractors should plausibly *resolve* — i.e., the user can't dismiss any without doing the work. The wrong ones should be true of two but not the third, or true under a slight misreading.

**Implementation:** `mc-multi` for "select 5 of 6 true statements"; `mc-single` for "which could not be said." Always with rich prompts (Markdown).

### 4. Knowledge association

**What it tests:** Sensory/contextual recall. Match a stimulus (audio clip, image, descriptive scene) to its canon source.

**Good fits:**
- "Which OST plays during this scene: [scene description]?" — `audio-match`
- "Which character does this theme accompany?" — `audio-match`
- "In which arc does this image appear?" — needs hotspot or mc-single with image

**Bad fits:**
- Music questions where the OST is famous enough to be obvious (Sadness and Sorrow → "this is sad" doesn't test anything)

**Implementation:** `audio-match` for music. Image association uses `mc-single` with the image as the question's central image (existing pattern).

---

## Workflows

### Workflow A: User asks me to *create* a question with them

1. **Pick the bucket first.** Don't write anything until we agree on which bucket. The bucket determines everything else.
2. **Define the cognitive task** in one sentence. *"This tests whether the user knows the chronology of the Sannin's training arcs"* — concrete, falsifiable.
3. **Sketch the answer first.** Decide the correct answer (and for `mc-multi`, the correct set). Don't write distractors before knowing the answer.
4. **Build the world.** For logical-hard questions, write down the implicit constraints that uniquely identify the hidden set/chain.
5. **Write distractors** that are *near misses* per the bucket's distractor strategy. Push back if any distractor is "obviously wrong."
6. **Write the explanation** that walks through the deduction step-by-step. This is the second-most-important field after the prompt.
7. **Self-review** with the checklist below.

### Workflow B: User asks me to *review* a question they wrote

Apply this checklist in order:

1. **Bucket fit.** Does the question actually test what its bucket claims? A "logical-hard" question that resolves in 10 seconds is mislabeled.
2. **Obviousness check.** Could a casual fan get this right without thinking? If yes, raise it as a red flag.
3. **Canon check.** Is everything from manga (Naruto + Naruto: Shippuden)? Filler arcs, anime-only events, Boruto-only material → flag and suggest replacement.
4. **Resolution check.** For logical questions, does the prompt uniquely determine the hidden set/chain? If there are multiple valid interpretations, the question is broken.
5. **Distractor quality.** Per bucket strategy. Flag any distractor that's a freebie ("clearly wrong") or a duplicate ("two distractors are essentially the same").
6. **Statement consistency** (for logical-hard): if 5 of 6 are true, verify each one against the proposed hidden set. The user often misses an edge case.
7. **Explanation quality.** Does it actually walk the reader through the deduction, or does it just state the answer? Latter is insufficient.

Output your review as a numbered list of findings, ranked by severity (broken / important / nit). Be willing to say "this question is good as-is."

### Workflow C: User asks me to *solve* a question

1. Read the prompt twice — once for content, once for constraints/qualifiers ("never alive at the same time", "could not be said").
2. Decode any reference chains explicitly. Write out "A's source's killer's leader = ..." with each hop labeled.
3. For logical-hard: identify the hidden set first, then evaluate statements one by one. Don't shortcut.
4. State your answer with the deduction shown, not just the result. The user is using me as a thinking partner; show the work.
5. If the question seems broken (ambiguous, multiple valid answers, references filler-only events), call that out instead of guessing.

---

## Style

- **Markdown prompts are encouraged.** Bold for emphasis, italic for character names being referenced, bullet lists for statement sets. Don't drown the prompt in formatting; reach for structure when it makes the question *clearer*, not just prettier.
- **Character names:** prefer first-name-last-name on first reference per question (e.g., "Itachi Uchiha"). After that, single-name is fine.
- **No filler:** every fact must come from the manga. The autocomplete data list is filtered accordingly; if you reference a character not in `data/characters.json`, double-check they're manga-canon.
- **No spoiler scrambles:** if Quiz N references events from late Shippuden and Quiz N+1 has earlier events, that's fine. But within a single quiz, don't reveal a major plot point in question 1 that's the punchline of question 5.

## Maintenance

Update this file when:
- A question reveals a new authoring pattern worth canonizing
- We identify a category of bad question that we keep needing to push back on
- A new question type is added to the schema (currently: `mc-single`, `mc-multi`, `categorize`, `order`, `slider`, `name`, `audio-match`)

The skill is checked into the repo at `.claude/skills/naruto-quiz-authoring/SKILL.md` and is the source of truth.
