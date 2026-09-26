# Roadmap

Where Jambot is heading. The concept and the reasoning behind it are in
[`prototype/README.md`](../prototype/README.md). Concrete work lives on the
[issue board](https://github.com/yggi/jambot/issues).

## Targets

- **v0: locally demo-able**, by Thursday, 1 October 2026. Scope: open.
- **v1: event-ready**, by Christmas 2026. This is the deadline. Scope: open
  beyond "event-ready".

## Now

These run in parallel:

- **Language design** (#7). The score language is well reasoned but somewhat
  ad hoc, and it gets a full refinement pass, including how it relates to
  Strudel. It blocks only the language's surface: its syntax, what tokens
  mean, and the text format other code builds on. Everything else goes ahead
  now and feeds the design with the invariants and shapes it finds. That is
  better than deciding ahead of the evidence and building around the
  decision later.
- **Port the prototype**, test-first and pinned to the prototype's output:
  - the recorder and the music theory in `packages/score` (#13);
  - the engine (#2), pinned to the composer's raw events.
- **Web client** (#22): transport (#23), renderers (#24), inputs (#25) and
  UI (#26). Everything except the score and Strudel panels is independent
  of #7.
- **Analyzer** (#3, [brief](briefs/analyzer.md)): the stages that analyse
  without writing score text (loading, grid and swing, part roles, key,
  chords as pitch classes, style metrics). Its closed loop and evaluation run
  on the ported engine.

The analyzer is deterministic and rule-based, and it is the foundation of
the learned models: everything trained later sees music only through it.
It is also the biggest risk, because messy MIDI turned into clean score text
decides the quality of everything downstream.

## Event setup

### Root node (#20)

A dedicated main host appliance, a full Linux machine, that is the central
composer and conductor at an event. Web clients connect to it, and it drives
the physical instruments over USB and physical MIDI ports. Some of the web
client's layers may have parallels there. See
[architecture](architecture.md#nodes).

### Timing (#27)

Timing and latency are a known issue across the system. The work starts by
measuring each path on the real hardware; a hardware MIDI clock is one
mitigation path.

## Later

### Learned models (#14)

Models never touch MIDI or audio directly; they read and write the score. The
rule composer stays permanently, as the fallback, the prior and the
baseline. Inference runs in a Worker, a section ahead, and if a model is
late, the rules play.

1. **Critic** (#15, score → style vector and genre probabilities): calibrates
   the round trip, and reranks the rule composer's candidates.
2. **Muse encoder** (#16): the critic applied to human playing, steering
   style toward the players.
3. **Writers** (#18), one per layer (harmony, lead, drums and bass): small
   transformers over score tokens, conditioned on the style axes, with
   grammar-constrained decoding.
4. **Form author** (#19): a large LLM writes forms and themes offline or
   between songs. Only small models run live.

Risk as assessed in the prototype README: the analyzer and critic are
solid, the Muse encoder and lead writer plausible, and a fully learned band
that beats rules plus reranking speculative. The architecture does not
depend on the last one.

### Root node (#20)

A dedicated main host appliance, a full Linux machine, that is the central
composer and conductor at an event. Web clients connect to it, and it drives the physical
instruments over USB and physical MIDI ports. See [architecture](architecture.md#nodes).

Timing and latency are a known issue across the system. A hardware MIDI
clock is one mitigation path.

### Languages and rendering

Jambot's extensions to Strudel on top of Strudel, on top of MIDI or dough.
MIDI instruments and dough nodes are rendering nodes, side by side. See
[architecture](architecture.md#languages). The Strudel and dough targets get
their issues once #7 is decided.

### Open threads

Listed in full in
[`prototype/README.md`](../prototype/README.md#open-threads), grouped as
language, music, system, and a separate speculative track.

## Dependencies

Only known dependencies are drawn. Each issue lists the ones that are still
unknown. Dotted lines are not blocking.

```mermaid
graph LR
  L7["#7 language design"] -- "surface only" --> S13["#13 packages/score"]
  S13 -- "text step" --> E2["#2 engine"]
  E2 -. "invariants" .-> L7
  E2 --> A3["#3 analyzer"]
  S13 -- "encoding" --> A3
  A3 -. "evidence" .-> L7
  E2 --> W22["#22 web client"]
  E2 --> R20["#20 root node"]
  S13 --> R20
  T27["#27 timing"] --> R20
  W22 -. "possible shared layers" .- R20
  A3 --> C15["#15 critic"]
  E2 --> C15
  C15 --> M16["#16 Muse encoder"]
  E2 --> M16
  A3 --> W18["#18 writers"]
  S13 --> W18
  L7 --> F19["#19 form author"]
```

The engine (#2) is the hub. Everything live and everything learned depends
on it, and it can start now. For v1, the path runs through the engine, the
web client, the root node and timing. Whether v1 also needs anything from
the learning track is open, and so is the path to v0, since its scope is
open.
