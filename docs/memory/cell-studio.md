# Cell studio

Jambot's sister project and the home of the cells language: what it is, how to read it, and where its words and Jambot's part.
The plan that brings the two together is the [eternal jam brief](../briefs/eternal-jam.md).

## What it is

- [yggi/cell-studio](https://github.com/yggi/cell-studio) started as a spike out of Jambot, to research and define the language.
- The owner's direction (14 October 2026): cells becomes Jambot's score language, Cell studio's engine its player, and Jambot the composer.
- It is a browser app (Svelte 5, TypeScript, Tone.js, npm, not pnpm) whose code editor and graph are two views of one text.
- A piece is a set of cells, one per line: `&name`, attributes, and a braid of steps in Strudel's mini-notation.
  A cell reads through a table (`over=&key`), has its own clock (`step=&bar*4`), and mixes with `+` and `*`.
- `src/engine/` is pure TypeScript, and a test holds it so.
  `src/engine/host.ts` takes code and answers with timed events a window at a time, in a worker or in node.
- It has no license file yet, so `tooling/licenses.ts` would refuse it as a dependency.

## Reading it

- In a cloud session, add the repository (`add_repo`) and clone it beside this one.
- Its entry is `AGENTS.md`, then `docs/MEMORY.md` (a cheatsheet of the language and one line per decision).
- `docs/language/` says what each form means, `docs/language/reference.md` lists every form, and `docs/decisions/` holds the rationale.
- Its checks are `npm test`, `npm run check`, `npm run lint` and `npm run format:check`; agents open pull requests and never merge.

## What came from here

- Its Web MIDI layer (ports, routing, surfaces, drum maps, MIDI out and clock out), keyboard and drum pads were lifted from `apps/web` and `packages/session` at 8cdb6b8.
  Each lifted file's header names its source.
- Who owns that code from now on is a question for the handshake (#309).

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
