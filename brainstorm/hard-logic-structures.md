# Hard-logic question structures

Working list of **shapes** for difficult questions where the logic is load-bearing on deep Naruto canon. The test we apply: *if you swapped Naruto names for generic placeholders, would the puzzle still work?* If yes, it's a costume puzzle and it's out. The logic must require canon to even **set up** the deduction.

A separate file tracks broader question ideas that aren't hard-logic but still cool: see `creative-question-ideas.md`.

---

## Already canonized in the skill

### A1. Constraint-satisfaction set (the "4 characters, 5-of-6 true" puzzle)
Hidden N-tuple of canon characters constrained by an over-arching framing rule plus K-1-of-K true statements. Canon is the data: who's a kage, who's a jinchuriki, when each was alive.

### A2. Multi-hop reference chain + statement evaluation
Decode A, B, C through chained canon references (*"A's source's killer's leader"*), then evaluate statements about them. The chain only resolves if the user has internalized character relationships.

### A3. Graph traversal — degrees of separation
Shortest path between two distant canon figures under a defined edge rule (met on screen, fought, shared a teacher).

---

## New proposals (in priority order)

### N1. Hidden-criterion ordering ⭐ top pick
- **Mechanic:** *"Order these from first to last."* The user must infer the *criterion* — and the criterion is itself a canon fact, not chronology. Example: *order Team 7 by when each first learned the truth about the Uchiha massacre.*
- **Why canon-load-bearing:** Five separate canon reveals across multiple arcs, each with a different on-page beat. The user has to retrieve every reveal and rank them.
- **Cheek:** The default mental model is the chronology of the *event*, not chronology of the *learning*. Wrong default → wrong answer.
- **Authoring discipline:** the list has to be **long enough** that the unique correct ordering is the only canon-defensible one. Five items barely works; seven is safer. Privately verify no permutation is a near-miss tie under a different reading.
- **Implementation:** `order`.

### N2. Quartet that covers a property set
- **Mechanic:** Show 12 characters. Below them, 4 candidate sets of 4. Below those, 8 canonical criteria (e.g., *has used Wind Release on screen*, *has fought a tailed beast*, *was once on Team 7*, *killed an Akatsuki member*, etc.). Exactly one of the 4 candidate sets has the property that **its 4 characters collectively satisfy all 8 criteria** (each criterion satisfied by at least one of the 4). Pick that set.
- **Why canon-load-bearing:** Each criterion is a canon attribute. Each of the 12 characters has a hidden 8-bit canon profile. The user has to verify 8 covers per candidate set × 4 candidates = up to 32 canon retrievals. No way to brute-force without the data.
- **Authoring discipline:** the *wrong* candidate sets must each fail a different criterion (so distractors are diagnostic — wrong answer X means the user blanked on criterion Y). Verify no character is "load-bearing" in two candidate sets — that would let the user shortcut.
- **Implementation:** `mc-single` over the 4 candidate quartets, with rich Markdown layout for the criteria list.

### N3. Smallest covering set
- **Mechanic:** *"What is the smallest number of characters needed such that every Akatsuki member has fought at least one of them?"* — minimum vertex cover over a canonical fight graph. Or: *"Pick 3 characters so that each of these 9 properties is held by at least one."*
- **Why canon-load-bearing:** The graph / property matrix is *only* knowable from canon. Compressing to a minimum cover requires holding the bipartite map in mind and pruning.
- **Authoring discipline:** privately enumerate the graph, compute the minimum cover, verify uniqueness or accept defined ties. Pick a graph dense enough that the minimum is small (3–4) but sparse enough that finding it is non-trivial.
- **Implementation:** `slider` (size of smallest cover) or `mc-multi` (pick the cover).

> **Family note:** N2 and N3 are the same family — "characters covering canonical criteria." N2 fixes the cover size and asks which set; N3 fixes nothing and asks for the minimum. Authoring one informs the other.

### N4. Composite identity with vague clues
- **Mechanic:** *"My eyes were once X's, my master shared a master with Y's master, my last command came from somewhere Z had recently been, my first kill was on a battlefield W also stood on."* User backsolves the unique character whose canonical profile satisfies all four loose cross-references.
- **Why canon-load-bearing:** Each clue is a *transitive* fact that only resolves if you know the full timelines of X, Y, Z, W.
- **Authoring discipline:** **clues must be deliberately vague.** "My eyes were Itachi's" admits one or two answers — too easy. "I once held eyes that had previously seen the Tsukuyomi" admits dozens, and the intersection across four such loose clues is what makes it a puzzle. The whole point is that no single clue narrows the search; the four together do.
- **Verification:** privately enumerate the candidate set after each clue. After clue 1: ~30 candidates. After 2: ~10. After 3: ~3. After 4: 1.
- **Implementation:** `mc-single` (with near-miss distractors who satisfy 3 of 4 clues) or `name`.

---

## Selection criteria

Before promoting a structure to a real quiz question:

1. **Canon-load test:** strip Naruto names, replace with placeholders. Is the puzzle still solvable? If yes → costume puzzle, kill it.
2. **3-instance test:** can we author 3 distinct concrete questions in this shape?
3. **Counter-solution test:** try to break it. If we find a defensible alternative answer, tighten constraints or downgrade.
4. **Solve-time test:** target 30s–3min of genuine deliberation.
