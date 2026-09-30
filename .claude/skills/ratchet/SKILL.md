---
name: ratchet
description: Run Jambot's ratchet, where a working track and a negative track
  drive each other through claims (witness, counterexample, a test on main as
  the pawl). Use when writing or changing a catalogue entry in
  docs/language-*.md or docs/quinetic.md, when filling a pull request's Findings
  section, when a step on a paired track ends and its findings need
  harvesting, or when a failure above must be placed in the layer below.
---

# Ratchet: witnesses forward, counterexamples back

Two tracks move each other without waiting. The **working track** builds
something that runs. The **negative track** gathers what constrains it. What
crosses between them is written as a claim with a test, and a test on `main`
holds it, so progress only goes one way. The pattern, the rules and the history
that shows it working are in [`docs/ratchet.md`](../../../docs/ratchet.md). The
pairs, and which issue plays which side, are in the ratchet map (#41).

This skill gives both sides one form to write in and the moves each side makes.

## The claim form

Gödel's Dialectica interpretation (1958) reads a statement as a game between
someone who must produce a **witness** and someone who tries to produce a
**counterexample**, with a decidable test between them:

```
claim  =  ∃ witness  ∀ counterexample  test(witness, counterexample)
```

The test has no quantifiers left in it. It is a check that runs and can come out
false, which is the law of meaningful tests. The counterexample may be chosen
after the witness is seen, so probes are aimed at the code that exists, not at
an imagined one.

Every catalogue entry is written in this form:

```
**<id>. <claim, one sentence>.**
Witness: <what makes it true: a function, a machine, a value, a run>.
Counterexample: <the shape of a case that would refute it>.
Test: <the decidable check, and where it lives, or "open: how it would run">.
Source: <issue, probe or finding>. Status: <evidence>.
Decided: <where>, <how>. Lands in: <issue, step>.
```

`Decided:` is there only when the claim is a rule, and an entry that is only a
rule, with no evidence yet, leaves out `Status:`.

The ids are one space across the catalogues (the layer files
`docs/language-*.md`, indexed in `docs/language.md`, and `docs/quinetic.md`). A claim another catalogue already makes is written as an
alias, `**Q2. <claim>.** Same as F4.`, with no status or test of its own, so it
is tracked once.

A claim of the form "for every x there is a y" becomes "there is a function from
x to y": the witness is a function. "Every MIDI input has some form" (A2) is
witnessed by the analyzer itself, and a counterexample is one MIDI file.

The **status** is the evidence, and it only rises: `speculative`, `open`,
`derived` or `measured` (or `measured, failing`), with scopes where they differ,
such as `measured (drums); open (compile)`.
`Decided:` says where a rule was taken and how: `inherited`, `dissolved`,
`on measured options`, `in the working track` or `ahead of the evidence`.
A rule is withdrawn only with `Retired: <reason>`, never removed silently.
What each word means, with the tables, is in
[`reference.md`](reference.md).

## Dependencies carry both directions

When one claim builds on another (the engine on the theory, the text step on the
machines, the analyzer on the compiler), the dependency is a Dialectica map. It
has two parts:

- **Forward, witnesses:** the lower layer's witness builds the upper one's. The
  theory's helix becomes the engine's chord type.
- **Backward, counterexamples:** a case that fails above is pulled back to a
  case below. It depends on the witness in hand.

The condition is: if the lower claim passes the case pulled back, the upper
claim passes the original case. So a failure above means one of two things:

1. the lower claim fails on the pulled-back case: it is the lower claim's
   counterexample, and it is filed there. The ninth chord failed "a chord is a
   helix" in #37, and was filed against the theory as #38; or
2. the lower claim passes it: then the map between them is wrong (the port, the
   lowering, the encoding), and the counterexample is filed against that map.

A counterexample is filed where it refutes, never only where it was seen.

## Moves for the working side

- **W1. Offer the smallest witness that runs.** Build test-first, and defer
  every decision the witness doesn't need.
- **W2. Answer a counterexample.** A new witness passes the new test and every
  test before it. The old tests stay: they are the pawl.
- **W3. Bridge a seam with the identity.** When something the negative side
  hasn't settled is needed, use the identity and pin the seam with a round trip.
  #37 plays raw events, and `compile ∘ encode = id` is the seam where the text
  step goes later.
- **W4. Harvest.** At the end of each step, list what the step needed, hit or
  disproved that no catalogue holds yet: a law it needed, a limit it ran into, a
  claim about the baseline that turned out false. Each goes up in the claim
  form, with status measured when a test showed it.

## Moves for the negative side

- **N1. Aim at the witness that exists.** Read the code or run it (E1 ran the
  prototype headless) and pick the case most likely to fail. A probe that can't
  fail is not a probe.
- **N2. Write each constraint in the claim form.** If no decidable test can be
  written, the status is speculative, and it says so.
- **N3. Pull counterexamples back.** When a finding arrives from above, place it
  along the dependency as in the section above, and name the layer it refutes.
- **N4. Levy.** Every entry that can bind code says where it lands: the issue
  and step that will carry its test.

## Moves both sides make

- **B1. Don't wait.** Read the other side's last published state: a commit, an
  entry, an issue comment. A wait that can't be avoided is a dependency, and it
  goes into `docs/ROADMAP.md`'s graph.
- **B2. The pawl is a test on `main`.** A test on an unmerged branch holds
  nothing yet. Merge small and often. The pawl check (`tooling/pawl.ts`) runs in
  `pnpm verify`: it refuses a status off the ladder, a named test that doesn't
  exist, a measured entry that names no file, an id cited but not defined or
  defined twice, a citing test whose file the entry doesn't name, "decided"
  written in a status, a rule that doesn't say how, an alias with fields of its
  own, and a doc under `docs/` that holds entries but is no catalogue. `tooling/history.ts` adds time: against the merge base with
  `origin/main` (on `main`, the first parent), no evidence falls, overall or in
  a scope both versions name, no rule goes and no entry disappears without
  `Retired:`, and an alias is held to the entry it names. `pnpm ratchet` shows
  the catalogues over `main`'s history.
- **B3. Dissolve before deciding.** Before a decision, ask which move would
  measure the options: a witness (W1), a probe (N1) or a pull-back (N3). If the
  options are measured and still pull apart, send them to the owner with the
  measurements, as #38 does. The score language changes only after asking.
- **B4. Don't hold the clock.** At a deadline, take the option that is easiest
  to reverse and mark it so.
- **B5. Record the crossing on both issues.** A comment in the crossing form
  below, on the issue it leaves and the issue it reaches.

## Writing it down

A **crossing comment**, on both issues of a pair:

```
**Crossing (<up | down | back>): <id or short name>.**
From <issue, step or experiment> to <issue, catalogue section>.
Claim: <one sentence>. Witness: <…>. Counterexample: <…>.
Test: <where, or open>. Status: <before> → <after>. Decided: <if it is a rule>.
```

A pull request's **Findings** section lists the harvest (W4) of the change in
the same form, or says "none".

## At the end of a step

- [ ] Harvested: each finding is an entry, or a comment on the negative track's
      issue, in the claim form (W4).
- [ ] Every counterexample is filed where it refutes (N3).
- [ ] Every new test cites the entry it holds in a group at the end of its
      description, such as `(T4, Q1c)`, and the entry names its file.
- [ ] Every status moved up or stayed, and no entry disappeared.
- [ ] Every decision taken says whether it dissolved or was made, and with which
      measurements (B3).
- [ ] The crossing is on both issues, and the ratchet map (#41) lists the pair
      (B5).

## What this is not

The Dialectica form here is exact for the claim form and its status: a decidable
test between a witness and a counterexample. That the design work as a whole
converges is not claimed. Whether it does is one of the ratchet's open questions
(`docs/ratchet.md`, "Open"). The reference for the categorical form is de Paiva,
"The Dialectica categories" (1989): objects are witnesses, counterexamples and a
relation between them, and a map sends witnesses forward and counterexamples
back.
