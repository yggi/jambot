# Jambot

> You play, the Muse listens, the band answers.

A cybernetic bandleader for live maker events. Left alone, it plays an endless,
evolving jam. When people join in (hardware keyboards, on-screen keys, phones),
it listens, takes their motifs, bends its style toward theirs and conducts the
collective output. It produces **MIDI and a score, not sound**: hardware synths,
grooveboxes or a small built-in Web Audio synth make the sound.

Genres are points in a continuous _style space_ (swing, syncopation, harmony,
articulation, energy, tempo), and every change glides instead of cutting. The
band plays from a human-readable score, one bar at a time, which you can read
and take over part by part.

## Status

Two things run today:

- The **[prototype](prototype/jambot-prototype.html)** is where Jambot started
  and still the fullest playable version: composer, compiler, scheduler and HUD
  in one self-contained HTML file. Open it in Chrome or Edge and press **Start
  the band**; the web app also serves it at `/prototype.html`. Its own
  [README](prototype/README.md) explains the concept, the style space and the
  score language it plays from.
- A **typed rebuild** is replacing it, test-first, one module at a time:
  - [`packages/theory`](packages/theory) is settled. One primitive,
    `even(k, n, shift)`, gives the Euclidean rhythms and the diatonic scales as
    the same structure, and the package names notes, intervals, chords, keys and
    modes around it.
  - [`packages/engine`](packages/engine) composes the prototype's style space
    and form as pure, deterministic machines: glides per style axis, swing and
    tempo as invertible time maps, a section chain that carries a key and its
    themes, the full band (drums, bass, comp and lead), and the Muse, which
    hears players and offers back a motif.
  - [`packages/score`](packages/score) reads and writes a bar as text, and
    [`packages/analyzer`](packages/analyzer) loads MIDI files onto the step
    grid and reads each track's role, swing, key and chords.
    The score's surface syntax is still open (#7, #63).
  - [`packages/session`](packages/session) is the pure part of host and client
    mode: the protocol, the roster, the clocks and the reconnect policy.
  - [`apps/web`](apps/web) is a Svelte PWA that plays the new engine's full band
    live, laid out in the order of the composition: transport, style, metrum,
    key, plan and chords, tracks.
    It has presets and sliders, a key picker with the circle of fifths and a
    scale view, MIDI in and out, on-screen keys and drum pads, and the Muse
    panel, which names whose motif the lead is playing.
    Every part of the band's screen is a card, a summary over details, and the
    lobby is built of the same cards under a title card, with a theme (system,
    dark or light) among its settings.
    Start counts the band in with a bar of clicks, and Stop ends the song on a
    cadence that rings on, in a session too: the host tells its clients which
    bar is the last.
    The lobby's Extras card holds a metronome that loops one bar of any named
    meter, 5/4 to 12/8, with accents graded by a tree over its pulses, to hear
    a meter before the engine plays one.
    It can host or join a session across the tabs of one browser or, through
    [`apps/lobby`](apps/lobby), across machines.
    A client whose link drops rejoins as the same player, and a host that
    reloads keeps its session.

  Where the design isn't settled yet, such as the score's text format and its
  relation to [Strudel](https://strudel.cc), it is worked out as a catalogue of
  constraints before any syntax: see [`docs/language.md`](docs/language.md) (its
  entries are split by layer), [`docs/shape.md`](docs/shape.md), which sets the
  catalogues against the code, and the method behind it,
  [`docs/ratchet.md`](docs/ratchet.md).

Where the project is heading, and the two milestones on the way, are in the
[roadmap](docs/ROADMAP.md).

## Development

```sh
pnpm install
pnpm dev      # web app with hot reload
pnpm test     # all tests
pnpm verify   # lint, format check, typecheck, tests, build
pnpm lobby    # the lobby server, for sessions across machines
pnpm lobby:deploy  # the lobby server to Fly.io
```

House rules are in [AGENTS.md](AGENTS.md). Setup and toolchain are in
[docs/development.md](docs/development.md).

## Documentation

Start at [docs/MEMORY.md](docs/MEMORY.md) (facts and cheatsheet).
[docs/INDEX.md](docs/INDEX.md) lists every doc and code area. Work is tracked in
[GitHub issues](https://github.com/yggi/jambot/issues).

## License

[MIT](LICENSE). The built app lists the licenses of the code it ships from other
packages in `licenses.txt`.
