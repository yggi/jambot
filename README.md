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

Two things run today:

- The **[prototype](prototype/jambot-prototype.html)** is where Jambot
  started and still the fullest playable version: composer, compiler,
  scheduler and HUD in one self-contained HTML file. Open it in Chrome or
  Edge and press **Start the band**; the web app also serves it at
  `/prototype.html`. Its own [README](prototype/README.md) explains the
  concept, the style space and the score language it plays from.
- A **typed rebuild** is replacing it, test-first, one module at a time:
  - [`packages/theory`](packages/theory) is settled. One primitive,
    `even(k, n, shift)`, gives the Euclidean rhythms and the diatonic scales
    as the same structure, and the package names notes, intervals, chords,
    keys and modes around it.
  - [`packages/engine`](packages/engine) composes the prototype's style
    space and form as pure, deterministic machines: glides per style axis,
    swing and tempo as invertible time maps, a section chain that carries a
    key and its themes, and the drums. Bass, comp and lead voices, and a
    ported score text, are still ahead.
  - [`apps/web`](apps/web) is a Svelte PWA that runs the new engine's
    transport live — presets, sliders, a conductor readout of section, key
    and bar — with drums as its only voice so far.

  Where the design isn't settled yet, such as the score's text format and
  its relation to [Strudel](https://strudel.cc), it is worked out as a
  catalogue of constraints before any syntax: see
  [`docs/language.md`](docs/language.md) and the method behind it,
  [`docs/ratchet.md`](docs/ratchet.md).

Where the project is heading, and the two milestones on the way, are in the
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
