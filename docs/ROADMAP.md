# Roadmap

Where Jambot is heading. The concept and the reasoning behind it are in
[`prototype/README.md`](../prototype/README.md). Concrete work lives on the
[issue board](https://github.com/yggi/jambot/issues).

## Now

**Port the prototype** into the engine package and the web app, test-first
and pinned to the prototype's output (#2).

## Next

**The analyzer: MIDI files → score text** (#3,
[brief](briefs/analyzer.md)). It is deterministic and rule-based, and it is
the foundation of the learned models: everything trained later sees music
only through it. It is also the biggest risk, because messy MIDI turned into
clean score text decides the quality of everything downstream. Its first
milestone extracts the score core as a shared package, and that overlaps with
the port.

## Later

### Learned models

Models never touch MIDI or audio directly; they read and write the score. The
rule composer stays permanently, as the fallback, the prior and the
baseline. Inference runs in a Worker, a section ahead, and if a model is
late, the rules play.

1. **Critic** (score → style vector and genre probabilities): calibrates the
   round trip, and reranks the rule composer's candidates.
2. **Muse encoder**: the critic applied to human playing, steering style
   toward the players.
3. **Writers**, one per layer (harmony, lead, drums and bass): small
   transformers over score tokens, conditioned on the style axes, with
   grammar-constrained decoding.
4. **Form author**: a large LLM writes forms and themes offline or between
   songs. Only small models run live.

Risk as assessed in the prototype README: the analyzer and critic are
solid, the Muse encoder and lead writer plausible, and a fully learned band
that beats rules plus reranking speculative. The architecture does not
depend on the last one.

### Server

A server that several Jambots sync to and that drives MIDI interfaces
directly. Its language and design are open; the options are laid out in
[architecture](architecture.md#server).

### Open threads

Listed in full in
[`prototype/README.md`](../prototype/README.md#open-threads), grouped as
language, music, system, and a separate speculative track.

## Milestones and dates

_Open._
