# Question Philosophy

What we believe about quizzes, and the questions that go in them. The companion playbook for agents working on questions lives at [.claude/skills/naruto-quiz-authoring/SKILL.md](.claude/skills/naruto-quiz-authoring/SKILL.md) — this doc is for humans.

## North star

**No obvious questions.** A casual fan on autopilot should not get the answer right. Every question rewards either deep canon knowledge, careful deduction, or a lit-up emotional beat — preferably a mix across a quiz.

## What makes a question good

A draft question must do at least one of:

1. **Stretch knowledge.** Force the user to aggregate across many points in canon — multi-arc recall, set-membership reasoning. *"How many Akatsuki died intentionally?"* and *"Which nature types have ever been infused into a blade?"* are great because the answer requires walking through the whole roster, not pulling a single fact.
2. **Reward deduction.** Logic questions are sudoku or mystery puzzles — hidden variables constrained by relationships in the prompt, deducible to a unique (or near-unique) answer. *"These 4 characters were never alive at the same time, and 5 of these 6 statements about them are true — pick the 5."*
3. **Earn an emotional beat.** Sparingly, questions are thematically fun: a beautiful quote, a quirky callback. They serve as palate cleansers between hard logic, leaving the user smiling whether they got it right.

If a question does none of those three, it's filler. Replace it.

## Pacing matters

Hard logic back-to-back burns the user out. Good quizzes interleave cognitive load: a spanning knowledge question to warm up, a logical-simple, a thematic breather, a logical-hard for the climax, an audio-match for sensory variety. Each hard question is sandwiched between easier ones.

We aim for roughly **4–5 knowledge / 2–3 logical-simple / 1–2 logical-hard / 1 association** per 10 questions. The exact ratio matters less than the rhythm — never two hard puzzles in a row.

## Multi-media is a feature, not decoration

We deliberately mix multi-media into our quizzes — MP3 audio clips, images, and eventually short video — as prompts and answer spaces. An OST asks the user to recall a scene through music. An image asks them to recognize a character mid-action. A video clip might ask them to spot a detail flashing past.

The point is not aesthetic. **The combination of multi-media with logic questions forces the user to rethink and rewire their canon knowledge in fresh sensory contexts.** A character you "know" by their narrative arc feels different when you hear their theme. A scene you remember in summary reads differently when you see one frame of it. The mix produces the deepest engagement — closer to re-experiencing the show than recalling it.

## Logic questions ideally have one solution

Logic questions aim for a unique answer, like a well-formed sudoku. We accept that occasionally a clever player finds an alternate valid set we didn't see; when they do, we update the question's accepted answers in the source JSON and push a fix. The bar is "solvable by deduction," not "trivially verifiable" — and we credit clever counter-solutions retroactively.

## What we avoid

- **Surface trivia.** *"Who is the Fourth Hokage?"* — every viewer knows this. Either bury the fact in something deeper or skip it.
- **Filler / anime-only / Boruto-only.** Manga canon (Naruto + Naruto: Shippuden) only.
- **Spoiler scrambles within a quiz.** Don't give away question 5's punchline in question 1's prompt.
- **Distractors that are obviously wrong.** Every distractor should plausibly resolve under a slight misreading; the user shouldn't be able to dismiss any without doing the work.

That's the bar.
