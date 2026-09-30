# The shape: the negative and the positive shape of the language, side by side

Kept alive by #255.
The catalogues ([`language.md`](language.md) and its layer files, [`quinetic.md`](quinetic.md)) hold the negative shape: what constrains the internal language, one claim each.
The code and #63 hold the positive shape: what plays and what is built.
Each reads well alone, and gaps between them show only when both are read at once.
This page lays them over each other in #116's layout, one row per level and one column each for pitch and time.

It holds no claim of its own, so every cell points at ids, and the catalogue is where a claim lives.
The level of an entry is a reading, since the entries name no level: where #116's table names the entry, that is used, and the rest is judged and can be moved.
An id on this page that no catalogue defines is a mistake (`tooling/pawl.ts` does not check it yet, see "Keeping it").

Counts are `pnpm ratchet` on `main` at 21779fb: 87 entries and 8 aliases, 67 measured (15 failing in some scope), 11 open, 3 derived, 2 speculative, 4 without evidence.

## The grid of levels

`both` is where an entry binds pitch and time together (a token grammar, a memory, a loop).
An id in bold has a failing scope.

| Level                | Pitch                    | Time                            | Both                                                      |
| -------------------- | ------------------------ | ------------------------------- | --------------------------------------------------------- |
| **grid**             | P5, **P10**              | T2, T3, T7, L1, L8              | C2, C7                                                    |
| **frame**            | P1, U3, **P9**           | **T6**, T10                     | F2                                                        |
| **change of frame**  | U1                       | T4, T11, T14, T16, Q1b, Q1c, A6 | C1, F3, **Q1a**                                           |
| **helix on a frame** | P3, P4, P6, P7, F6 (Q5b) | **T12**                         |                                                           |
| **element**          | U2                       | L6, R4                          | U4, U6, S3, C4, F5                                        |
| **turn**             | **S2**, Q4b              | T5, T10                         | S1                                                        |
| **above the turn**   | C6 (Q9), A4 (Q7a), Q11   | T15, C3, C5                     | C8, **C9**, C10, Q7b, Q8, Q12, A3, F1 (Q4a), F7 (Q6), Q5a |
| **T and I**          | Q5c                      |                                 | U5                                                        |
| **played through**   |                          | T17, T18, T19, T20, L2, L5      | L7, A1, Q1d, Q1e, Q3, Q10, A2, F4 (Q2)                    |
| **other**            | P2, P8                   | T1, T8, T9, T13, F8, A5         | L3, R1, R2, R3                                            |

Read the grid for what is missing as much as for what is there:

- **The grid row is thin on the pitch side.**
  The pitch cycle is fixed in every key change, and only P5 and its failing spill-over P10 say anything about it (tension 7).
- **The T and I row has no time entry of its own.**
  T and I on the time tower are `late` and `rev`, and they sit inside U5 and Q5c together with the pitch operators.
  No entry says what T and I do to a meter, which is the row #116 expects to be the same form.
- **The turn row is nearly empty for pitch.**
  The register is the pitch tower's turn (S2), and S2 is the one entry there, failing in the prototype.
- **Time's bulk is in "played through", pitch has none there.**
  Licence, accent and swing sit on time, and the pitch side has velocity only through S3 and T17.
  Whether pitch has a played-through layer (tuning, vibrato, voicing, #107's fill) is not asked anywhere yet.
- **"Other" holds the clock and the network.**
  T1, T8, T9, T13 and F8 belong to no level of the two towers, since they are about the machine that runs the towers and not about music.
  If more of them arrive, they want a tower of their own.

## Where the towers are not alike, and who owns it

#116 §1 lists four places where the analogy breaks.
Here is where each stands in the entries.

| Difference                                                     | Entries      | State                                                                                                  |
| -------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| The pitch cycle is fixed, the time cycle is not                | T10, T14, T6 | (l): option (A) has a witness, (B) and (C) unmeasured; the owner has not chosen                        |
| An alteration means different things on each tower             | T12, P5, U6  | dissolved for time: an onset is a plain step and carries none (U6)                                     |
| Onsets were absolute, pitches relative                         | U6, T12      | the bass's onsets are steps of the bar in the score (#263); the engine's rhythms are still on 16 steps |
| A motif's cycle was the bar, a phrase is the turn one level up | T15, U4      | measured on the family, the band writes nothing across a bar line                                      |

## Decided, and not yet in the code

The widest gap between the two shapes.
Each row is a rule the owner took, and the code that would witness it.

| Rule                                                             | Entries          | What is missing in the code                                                                                                    |
| ---------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| (k) an onset is relative to the meter                            | U6, T12          | #260: the parts write their onsets on the meter; the score writes a bass's as steps of the bar (#263)                          |
| A meter in the bar's header                                      | T6, T10          | #63 step 6: bars are 4/4 (`SONG_METER`) and the header states no meter                                                         |
| The signature is the composer's, the metrum the players' licence | T6, T10, T18, C8 | #261: a section carries its meter and the metrum shows it read-only; tempo, swing and the accents' spread are nudged within it |
| Swing on the pulse                                               | T11, T16         | the transport plays no meter change (T14): `swingMap` is meter-aware, the transport is not                                     |
| The text step between band and player                            | Q1a, F3          | #63 step 5: `compile(encode(written))` is tested, not in the path of the band                                                  |
| Pitch lines written and read back                                | U1, S2           | #63 step 3: header, harmony, six drum sounds, the bass, the pad and the stab; the lead and the snare open                      |

## Claims with no witness

An entry no test can fail is worse than none (law of meaningful tests).
Those with no code and no test named:

- **Inherited from the prototype or the brief, unmeasured:** L1, L3, L5, R1, R2, R3, P1, P8.
- **Open, by name:** C10 (the style axes' wish as a displacement, #217), T2 (exact fractions), T3 (the 24 ppqn grid against real triplets, E5), A2 (every MIDI input has an IM), A5 (accents), F4 and Q2.
- **The quine's own chain:** Q1d (MIDI out and back), Q1e (the analyzer on Jambot's own output), Q3 (a loss pinned to its layer).
  Q10's ladder has two rungs of six, and the external corpus is undecided.
- **Speculative by design:** T20 (a longer chain of deltas), the analyzer's style following (A4).

Two of these carry more weight than their status shows.
Q1e and Q3 are the test that the loop closes, and the loop is what the project is about.
Q10's rungs 2 to 5 are where they get their witnesses, one rung at a time.

## Stress points

Where two entries pull apart, or one says more than its evidence.

- **The song's clock, T6 against T10.**
  T6 says the song bar is 16 steps and open, T10 says the song reads its clock as the meter helix, measured.
  Both are true (T10 holds in 4/4 only), and a reader needs both sentences.
- **Swing, T11 against T14.**
  T11 says swing never moves a pulse start, which holds in `swingMap`.
  T14 says nothing plays a meter change and swing still moves pulses, which holds in the transport.
- **P5 reads stronger than its reach.**
  P5 is measured over the key's own scale, and P10 fails for a borrowed chord outside 12.
  The status names both, and the first line of the claim does not.
- **L4's headline against its measured scope.**
  The shared mini-notation "behaves identically" and the entry's own `:` case fails.
- **The loop, Q7b.**
  The claim says a self-hearing band drifts recognisably, and the closed lead loop locks on its first motif and oscillates.
  The failing scope is honest, and the title is the prototype's guess.
- **Tempo, C8 against C9.**
  C8 has the tempo licence measured, and C9 has tempo failing, since the fill is read from the style alone.
  Different claims on one quantity, and only the scopes separate them.
- **The key, F3 and Q11.**
  The key fails where the harmony is thin (F3), and has no plan to return above entropy 0 (Q11).
  One cause, two entries: the centre of the harmony trails a key change (C9, E19).

## Rules made ahead of the evidence

Ten, and none has been dissolved yet (#43).
The ones a measurement could dissolve soonest, in the order the owner could look at them:

| Rule          | Measurement that would settle it                              | Where              |
| ------------- | ------------------------------------------------------------- | ------------------ |
| T16           | a real ternary feel, played against straight 8ths             | #144               |
| U4 (accents)  | A5 over POP909: are accents notation or fill                  | #128, question (m) |
| C8 (reaches)  | do harm, entropy, swing and artic reach what the licence says | #176, closed       |
| Q7b, Q11, Q12 | the loop experiments (E22), a planned cycle of keys           | #237, #233         |
| T17, T18, T19 | one entry or three; a composer that writes a non-lead accent  | #107               |

## Candidates to contract

The law of generalization prefers one form to several.
Each pair that looked like a repeat was read entry against entry, and an alias is only right where the claim is the same.
Only one pair was: A1 is Q1a's first half, so A1 is an alias of Q1a now, and its prototype facts moved into Q1a's witness.

The others are neighbours that make different claims, and stay as they are:

- **T17, T18, T19, T20** are the licence widening with the feel (T17), an accent as an offset on the base (T18), which layer owns the base (T19), and a longer chain of deltas (T20).
  They are one chain seen from four sides.
  If T20 is ever taken up, T18 and T19 want a covering entry for the chain, and that is a generalization to make then, with a test.
- **T8 and T9** are two different clients of `outputClock`: a client's sound against its host, and MIDI out and capture.
- **P5 and P10, P7 and P9** are a claim and the counterexample filed beside it (P10 refutes P5's open scope, P9 was a probe on P7).
  Filed apart on purpose, since a counterexample lives where it refutes (`ratchet` skill, N3).
- **S2 and S3:** S3 is `Decided: S2, dissolved`, a rule that stands only if S2 carries it, and S2 carries no rule.
- **C3 and C5** are the rate a value lives at (C3) and the bound within which a change is heard (C5), which follows from the rates but is measured on its own.
- **C8 and C9:** C8 is the licence a level below moves within, and C9 is the default, fill and fading memory a level keeps inside it.
  C9 leans on C8's reach and adds the memory.
- **Q1b and Q1c** are the round trips of the two time maps, each with its own test.
  F3's time bullet points at them, and T4 is the map's claim.
- **Q5a and F1:** F1 is the law each level keeps, and Q5a is that a slower level's output is held as the faster one's environment.

What the read did find is that the catalogue names its neighbours in prose ("as for T4", "(A1)") more often than by alias, so a reader has to follow prose to see the chain.
A "see also" line in an entry's fields would carry it, but that is a change to the form, which the owner takes.

## Suggestions from tradition and hunch

Speculative, and labelled so until a test can fail on them.
Each names the test that would decide it.
One that passes goes into a catalogue as an entry and leaves this page.

- **Hemiola is a change of frame in time.**
  Regrouping six eighths from 2+2+2 to 3+3 keeps the bar and moves the pulses, which is `parallel` in T6.
  Test: `parallel` on 6/8 and 3/4 gives exactly the two hemiola groupings, and `relative` keeps the pulses.
- **Standard timelines and the helix.**
  Whether the timelines of the tradition (tresillo, clave, the bell patterns) are modes of one `even(k, n)` or of two composed helices is a count, not a claim.
  Test: enumerate a fixed list of timelines against `even` and composition, and record which fit.
  A pattern that fits neither is a counterexample to P3 at the rhythm end.
- **A bar and a beat, for (l).**
  Notated music counts a bar and a beat, never an absolute position, which is option (B).
  Test: the same 4/4 to 7/8 song read through (A) and (B); does either lose a round trip that the other keeps.
- **A cadence is a turn.**
  Tradition ends a phrase on a cadence and brings the key home at the section's end, which is Q11's "the key comes home".
  Test: the plan's last bar of a section is a cadence in the key, measured over every preset and plan (Q11 lists the theme's last-bar cadence as unmeasured).
- **Voice-leading distance for "nothing jumps".**
  C1 is measured for the style axes only, and a chord change is a jump in pitch space too.
  Test: the size of the band's chord moves, by voice-leading distance on the helix, against a shuffled progression.
- **Canon as the Muse's operator.**
  The offer under `strans`, `mirror`, `late` or `rev` is a canon (per tonos when the operator moves the key).
  Test: E13's 97% of variation bars is already this; whether a canon of two entries at a bar's offset stays inside the licence is not measured.

## Keeping it

- **Each ratchet round** re-reads this page against `pnpm ratchet` and the code, and changes only what moved.
  The round's count goes to #43, and what the page found goes to the catalogue or an issue.
- **A cell that stays empty** across rounds is a question about the layout.
- **The check on the ids** is not built.
  A pawl-style check that every id on this page is defined in a catalogue would need its own test that it can fail, and is worth adding once the first round shows the page is kept.
