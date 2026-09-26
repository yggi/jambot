# The ratchet: two tracks that drive each other

Jambot's design work runs as pairs of tracks that don't wait for each other
but move each other forward. One builds a **working shape**: code that plays,
deciding only what it can't put off. The other gathers a **negative shape**:
the constraints every system around the work places on it, each with an id, a
source, a status and a test. They are coupled by what crosses between them.
Each crossing is held by a test, so progress only goes one way. Decisions tend
to dissolve into structure that the two tracks find, rather than being made
ahead of the evidence.

The pair this doc is drawn from is #37 (the working shape of the app) and #7
(the negative shape of the language, catalogued in `docs/language.md`). The
theory (#28) ran the same way with #7 before it. Every pair, and which side
each issue plays, is in the ratchet map, #41. Both sides apply the `ratchet`
skill ([`SKILL.md`](../.claude/skills/ratchet/SKILL.md)), which gives them one
form to write in and the moves each side makes.

## The parts

| Part              | What it is                                                                            | In #37 and #7                                          |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Working track     | Builds something that runs, test-first, and defers every decision it can              | #37: engine contract, style space, then the band       |
| Negative track    | Gathers constraints from probes; makes no thing and chooses no syntax                 | #7: the catalogue, its tensions and experiments        |
| Finding (up)      | Something the working track needed, hit or disproved, entered in the catalogue        | The machine contract became F1                         |
| Constraint (down) | A catalogue entry that binds code, landing as a test in the working track             | C2 (glide spaces) became the tempo-midpoint test       |
| Pawl              | A test on `main`. What it holds can't slip back without the test failing              | `lawBreaks`, `swingMap`'s inverse test                 |
| Seam              | Where the working track needs an undecided thing: an identity, pinned by a round trip | Raw events now; `compile ∘ encode = id` slots in later |

## How it runs

1. **Pair the tracks.** A track that builds names the track that constrains
   it, and the reverse, in their issue bodies, and the pair goes on the map
   (#41).
2. **Neither waits.** Each reads the other's last published state (a commit, a
   catalogue entry, an issue comment) and never waits for the next. A wait
   that can't be avoided is a real dependency, and it goes into the graph in
   [`ROADMAP.md`](ROADMAP.md#dependencies).
3. **Findings go up.** A step of the working track ends by asking what it
   found that the catalogue doesn't hold yet: a law it needed, a limit it
   hit, a baseline claim that turned out false. Each one becomes an entry with
   a source and a status. The pull request template asks this question.
4. **Constraints come down.** An entry that can bind code says where it lands,
   and it becomes a test in the next step of the working track that touches
   it.
5. **The pawl is a test on `main`.** The evidence moves from speculative to
   open to derived to measured. Whether the owner took a claim as a rule is
   its own field, `Decided:`, which says where and how. Neither moves back
   except when an entry is retired with its reason written next to it. A
   test on an unmerged branch doesn't hold anything yet. The pawl check
   (`tooling/pawl.ts`, #42) runs in `pnpm verify` and holds the catalogues
   to their tests: evidence on the ladder, rules that say how they were
   decided, named tests that exist, and citations that agree both ways.
   `tooling/history.ts` holds them in time: against the merge base with
   `origin/main`, no evidence falls, no rule goes and no entry disappears
   without `Retired:`. `pnpm ratchet` reports the catalogues over `main`'s
   history.
6. **Seams are identities.** Where the working track needs something the
   negative track hasn't settled, it uses the identity and pins the seam with
   a round-trip test. #37 plays the composer's raw events. The text step goes
   in later as `compile ∘ encode`, which the round trip already requires to be
   the identity, so nothing has to be torn out.
7. **Decisions dissolve before they are made.** An open decision first asks
   which track could measure it. When the options are measured and still pull
   apart, it goes to the owner with them. The score language still changes
   only after asking (`AGENTS.md`).
8. **The ratchet never holds the clock.** A deadline doesn't wait for the
   evidence. The working track then takes the option that is easiest to
   reverse, and marks it so.

## What crossed between #37 and #7

| Crossing                                                                                              | Direction | Result                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Every level is a Mealy machine, `advance(env, carried, input)`                                        | up        | F1, and the nomenclature: coalgebra; reader, state and writer                                 |
| E1 (68% of the prototype's bars compile differently cold, only in register) meets #37's carried state | both      | F2: the compiler carries what the composer carries. Tension 1 narrows to two concrete options |
| C1 and C2: a change is a trajectory, and a parameter declares the space it glides in                  | down      | `style.ts`, with glide spaces tested (tempo's midpoint from 60 to 180 is 104)                 |
| T4: written and played time are separate, joined by a time map                                        | down      | `swingMap`, with exact inverses                                                               |
| The prototype's `swingDelay` and `unswing` are not inverses (up to 0.04 steps)                        | up        | F3 measured, Q1b                                                                              |
| The README's claim that presets reach both ends of every axis fails for syncopation, energy and tempo | up        | The spans are recorded in a test, as literals                                                 |
| A chord is a helix, but a ninth chord isn't one                                                       | up        | Decided in #38: a helix plus tensions, and a tension sets its degree of the scale (P6, P7)    |
| Properties neither track owned alone                                                                  | both      | #39: `quinetic.md`, the quinetic properties, each a claim                                     |

Before that, the theory settled what #7 had been going to decide: the Euclid
form, key names, modes, the chord vocabulary, and that the score text needs no
spelling (#7, "State after #33").

## Claims in the Dialectica form

Gödel's Dialectica interpretation (1958) reads a statement as a game. One
side must produce a **witness**, the other tries to produce a
**counterexample**, and a test without quantifiers decides between them:

```
claim  =  ∃ witness  ∀ counterexample  test(witness, counterexample)
```

The working track plays the witness and the negative track the
counterexample. The test is decidable and can come out false, which is the
law of meaningful tests. The counterexample is chosen after the witness is
seen, so probes are aimed at the code that exists. Every catalogue entry is
written this way, and its status says how far through the game it has gone.

A dependency between claims carries both directions, as a map in de Paiva's
Dialectica categories does (1989): witnesses go forward, and counterexamples
come back, each pulled back to a case in the layer below. The helix went
forward into the engine's chord type, and the ninth chord came back as a
counterexample to "a chord is a helix" (#38). If the lower layer passes the
pulled-back case, the fault is in the map between the layers, such as a port or
a lowering. So a counterexample is filed where it refutes, not only where it
was seen.

The skill gives the entry form, the moves for each side, a crossing comment
for the issues, and a checklist for the end of a step.

## The same shape at every level

The ratchet is the law of recursion applied to the work itself.

- **Inside a track.** #7's experiments are small working tracks (E1 runs the
  prototype headless). #37's steps end in "Finding:" bullets, which are small
  negative tracks.
- **In the product.** The composer writes down (`compile`) and the analyzer
  reads up (`encode`), with a round trip at the boundary (Q1a–Q1e). A finding
  going up is an `encode`, a constraint coming down is a `compile`, and a
  settled entry is a fixed point: its round trip changes nothing.
- **In the loop.** Players → Muse → composer → players needs a delay on it to
  have a meaning (F7). So does working track → catalogue → working track: the
  delay is rule 2, where each track reads the other's last published state. A
  track that waited for the other would make the loop instantaneous, and it
  would stall.

## Open

These are not known yet:

- **More than two tracks.** The analyzer (#3) and the web client (#22) will
  feed #7 too, and `quinetic.md` (#39) already gathers properties across
  tracks. Whether the rules above hold unchanged for that is not tested
  yet.
- **Whether the ratchet makes progress** (#43). `pnpm ratchet` counts
  entries by evidence and rules by how over `main`'s history, but a few
  hours of history show no trend yet. Crossings per pair, and how long each
  takes to land as a test, live in issue comments and are counted by hand.
- **Convergence.** The Dialectica form is exact for a single claim and its
  test. Whether the design as a whole converges is not claimed.
