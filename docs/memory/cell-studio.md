# Cell studio

Jambot's sister project and the home of the cells language: what it is, how to read it, and where its words and Jambot's part.
The plan that brings the two together is the [eternal jam brief](../briefs/eternal-jam.md).

## What it is

- [yggi/cell-studio](https://github.com/yggi/cell-studio) started as a spike out of Jambot, to research and define the language.
- The owner's direction (14 October 2026): cells becomes Jambot's score language and the cells engine its player, with Jambot the composer.
- Where the code lives (D1 on #309): the language moves out into [yggi/cells](https://github.com/yggi/cells), the shared core, which also holds the repository of cell fragments; Cell studio stays the workbench and Jambot the interactive, multi-user frontend, both consuming cells at a tag ([yggi/cells#1](https://github.com/yggi/cells/issues/1)).
- It is a browser app (Svelte 5, TypeScript, Tone.js, npm, not pnpm) whose code editor and graph are two views of one text.
- A piece is a set of cells, one per line: `&name`, attributes, and a braid of steps in Strudel's mini-notation.
  A cell reads through a table (`over=&key`), has its own clock (`step=16n`), and mixes with `+` and `*`.
- The language itself, with its engine, examples and docs, is [yggi/cells](https://github.com/yggi/cells), which Cell studio and Jambot both depend on at a tag, Jambot at `v0.5.0`; it is pure TypeScript, held so by a typecheck with no host types.
  Its `engine/host.ts` takes code and answers with timed events a window at a time, in a worker or in node; a script that imports the package runs under vitest, not node (yggi/cells#11).
- Cell studio and cells are MIT, as Jambot is (D4 on #309).

## Reading it

- In a cloud session, add the repository (`add_repo`) and clone it beside this one.
- Its entry is `AGENTS.md`, then `docs/MEMORY.md` (a cheatsheet of the language and one line per decision).
- The language's pages (`docs/language/`, every form in `reference.md`) and the decisions about it are in yggi/cells; the workbench's decisions stay in Cell studio's `docs/decisions/`.
- Its gate is `npm run verify` before a push; agents open pull requests and never merge.

## What came from here

- Its Web MIDI layer (ports, routing, surfaces, drum maps, MIDI out and clock out), keyboard and drum pads were lifted from `apps/web` and `packages/session` at 8cdb6b8.
  Each lifted file's header names its source.
- It gets one owner when the two copies are merged (D2 on #309, yggi/cells decision 037).

## Where the words correspond

| Jambot                                                 | Cells                                                    |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `compose(inner, outer)`, layers that refer upward      | `over=&t`, a number is an entry of the table it reads    |
| a helix climbs a lap past its cycle                    | a table climbs a lap past its end                        |
| `mode(helix, d)`                                       | `shift=n` on a table                                     |
| `strans`                                               | `&x^n` (degrees)                                         |
| `shift` (chromatic)                                    | `&x^$n` (grid steps)                                     |
| `mirror`                                               | `inverse(&x)`                                            |
| `rev`                                                  | `&x[::-1]`                                               |
| `late`                                                 | a rotation, `&x[1:] &x[:1]`; `[<<n]` climbs a lap        |
| the licence (C8)                                       | `free(default, lo..hi)`; `free(0 2 4 ~)` a braid to fill |
| draws keyed by seed, stream and position (`random.ts`) | chance keyed by seed, cell, lap and step                 |
| a meter's pulses as gaps of a helix                    | `scan(3 2 2)`                                            |

## Where they part

Each is open until the handshake (#309) settles it; the [brief](../briefs/eternal-jam.md#where-the-two-decide-differently) has the table and a suggestion for each.

- Euclid: `even(k, n, shift)` rotates as decided in #8, and cells rotates as Strudel does.
- `_` is "no onset here" in #275, and in cells it holds the note before, as in Strudel.
- `^` is an octave here, and `^n` is n degrees in cells.
- `shift` transposes here, and `shift=` walks the modes in cells.
- `cycle=` is a cell's period here, and in cells the turns before a table comes round.
- A cell is named by a number here (#287), and by a word in cells.
- Accent grades are `* + - .` here, and `* + .` in cells.
- The clock is one song clock here, and each cell's own in cells.
- The score holds what is composed here (T4), and in cells the text holds everything, sound included.
