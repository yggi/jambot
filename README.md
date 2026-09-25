# Jambot

> You play, the Muse listens, the band answers.

Jambot is a generative backing band that runs in the browser. It composes
drums, bass, chords and a lead line bar by bar, steers them through a
continuous *style space* (swing, syncopation, harmony, articulation, energy,
tempo), and listens to what you play: a phrase you play becomes a motif that
the lead picks up and develops. Everything it plays is written down first as a
small text score, which you can read and take over part by part.

It plays through a built-in Web Audio synth, drives external gear over Web
MIDI (notes on per-part channels, clock, start and stop), and accepts input
from MIDI controllers, the on-screen keyboard or the computer keyboard.

## Status

Early. The working reference is a single-file prototype:

- [`prototype/jambot-prototype.html`](prototype/jambot-prototype.html) — open
  it in a browser (Chrome or Edge for Web MIDI) and press **Start the band**.

The next step is to port it to a maintainable project structure. The toolchain
is being decided; see [`docs/`](docs/).

## Documentation

- [Prototype evaluation](docs/prototype-evaluation.md) — what the prototype
  does, how it is built, and what to keep or change when porting it.
- [Architecture](docs/architecture.md) — the intended layering, including the
  planned sync/MIDI server.
- [Decisions](docs/decisions/) — architecture decision records.

## Repository layout

```
prototype/   the original single-file prototype, kept as a reference
docs/        design notes and decision records
```
