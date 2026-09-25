# Jambot

> You play, the Muse listens, the band answers.

Jambot is a generative backing band that runs in the browser. It composes
drums, bass, chords and a lead line bar by bar, steers them through a
continuous _style space_ (swing, syncopation, harmony, articulation, energy,
tempo), and listens to what you play: a phrase you play becomes a motif that
the lead picks up and develops. Everything it plays is written down first as a
small text score, which you can read and take over part by part.

It plays through a built-in Web Audio synth, drives external gear over Web
MIDI (notes on per-part channels, clock, start and stop), and accepts input
from MIDI controllers, the on-screen keyboard or the computer keyboard.

## Status

The playable version is the single-file
[prototype](prototype/jambot-prototype.html). Open it in a browser (Chrome
or Edge for Web MIDI) and press **Start the band**. The web app also serves
it at `/prototype.html`.

The prototype is being ported, test-first, into a typed engine package and a
Svelte app. See [the prototype page](docs/prototype.md) for what is ported so
far.

## Development

```sh
pnpm install
pnpm dev      # web app with hot reload
pnpm test     # all tests
pnpm verify   # lint, format check, typecheck, tests, build
```

More in [docs/development.md](docs/development.md).

## Layout

```
packages/engine/   the musical engine: pure TypeScript, no I/O
apps/web/          the browser app: Svelte 5, Vite, PWA
prototype/         the original single-file prototype, the reference for the port
docs/              architecture, development and the prototype
```

## Documentation

- [Architecture](docs/architecture.md): the layers, and the planned sync and
  MIDI server.
- [Development](docs/development.md): the toolchain, why it was chosen, and
  how we work.
- [The prototype](docs/prototype.md): what it does, what the port keeps and
  changes, and how the port is checked.
