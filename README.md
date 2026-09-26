# Jambot

> You play, the Muse listens, the band answers.

A cybernetic bandleader for live maker events. Left alone, it plays an
endless, evolving jam. When people join in (hardware keyboards, on-screen
keys, phones), it listens, takes their motifs, bends its style toward theirs
and conducts the collective output. It produces **MIDI and a score, not
sound**: hardware synths, grooveboxes or a small built-in Web Audio synth
make the sound.

Genres are points in a continuous _style space_ (swing, syncopation,
harmony, articulation, energy, tempo), and every change glides instead of
cutting. The band plays from a human-readable score, one bar at a time,
which you can read and take over part by part.

## Status

The playable version is the single-file
[prototype](prototype/jambot-prototype.html). Open it in Chrome or Edge and
press **Start the band**. The web app also serves it at `/prototype.html`.
The prototype's own [README](prototype/README.md) explains the concept and
how it works.

The prototype is being ported, test-first, into a typed engine package and a
Svelte app. Where the project is heading is in the
[roadmap](docs/ROADMAP.md).

## Development

```sh
pnpm install
pnpm dev      # web app with hot reload
pnpm test     # all tests
pnpm verify   # lint, format check, typecheck, tests, build
```

House rules are in [AGENTS.md](AGENTS.md). Setup and toolchain are in
[docs/development.md](docs/development.md).

## Documentation

Start at [docs/MEMORY.md](docs/MEMORY.md) (facts and cheatsheet).
[docs/INDEX.md](docs/INDEX.md) lists every doc and code area. Work is tracked
in [GitHub issues](https://github.com/yggi/jambot/issues).
