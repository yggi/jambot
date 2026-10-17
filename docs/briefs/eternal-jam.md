# Eternal jam sessions: Jambot and Cell studio back together

The owner's brief of 14 October 2026, then its reading and the plan the owner agreed to.
Cell studio ([yggi/cell-studio](https://github.com/yggi/cell-studio)) started as a spike out of Jambot, to research and define the language.
It is now time to bring the two back together.
Facts about Cell studio itself, and how to read it, are in [`memory/cell-studio.md`](../memory/cell-studio.md).
The live thread is the handshake: #309 here, and [yggi/cell-studio#406](https://github.com/yggi/cell-studio/issues/406) for Cell studio's side.
The owner ruled where the code lives (D1, 2026-10-14): three repositories, the language a core of its own in [yggi/cells](https://github.com/yggi/cells), extracted by [yggi/cells#1](https://github.com/yggi/cells/issues/1).
The family of music projects this sits in has a hub, [yggi/music-commons](https://github.com/yggi/music-commons): its atlas, charter, glossary and contracts.
Cell studio keeps a twin of this page at `docs/notes/eternal-jam.md`.

## The brief, verbatim

> they work towards a shared goal: infrastructure for 'eternal jam sessions'.
>
> - **cells** is the musical language connecting everything.
>   - it is a superset of strudel and can be played live by emitting MIDI or instrument-level cells-syntax(dough-style), which can be rendered to audio.
> - cells can express whole pieces, instruments, effects, scales, melodies, drum pattern, chords and their sequences, rhythms, arrangements
> - cells can have variable 'freedom of expression' for the performer with free()
> - it can also express **generators** for any of the above, also configurable by free
> - all pieces and fragments are mapped to a 'phase space of music', with a **style-vector** and might carry other metadata (origin, timestamp, uid, ...) metrics and classifiers too. (we avoid any top-level hierarchy of 'this is a drum pattern' though and avoidable absolute values, nothing is tied to a scale yet. a drum pattern has no tempo, a melody is relative to a scale and a scale relative to a key. idea is 'everthing can be plugged into each other at any scale'
> - a **repository** holds these 'cell-cultures'. it can be seeded from one or multiple corpi. fragments can be added and removed, it can be queried and sorted and filterr by various parameters, e.g. search and rank by style vector ('top 10 acid-house-style 16-step basslines")
> - a **composer** (jambot) is essentially a continously running cells-generator, driven by the jam's style-vector.
> - a **jam** is at least a host+composer writing the score, and a client+player performing it. a local (jambot) session has both in one place, a hosted session extends the score to other players, so they share one composer
> - the **muse** listens to each player, transcribing it as cells-fragments, hashes it, adds metadata and style hints and sends it to the repository.
> - in the repository, it is checked for duplicates with the hash, style vector is applied, graded and added to the repo.
> - the composer queries the repo for the parts it needs to continue the current style or guide it toward a new selection.
> - there is a full feedback loop, the conductor holds the session to a shared ruleset, players/performers (human and jambot-native) play it, improvising within the limits given by free(), the muse listens to it and feeds it back to the repository (long-term-memory, persistent, must be queried) and the composer itself (short-term-memory, fading, it's current 'cellular workbench')
> - homeostasis on an axis from 'bored' to 'confused' is the core guide. repeat something so many times it's not confusing anymore, but change it when it becomes boring. this is biased by the style-vector, techno has a higher tolerance for boring than jazz.
> - on its own (no human playing, no environmental input), the whole system should run like a radio-station, soma-fm. slow random-walk around the tip of the jams current style vector.

## The reading

One loop, four roles, one language:

- **The composer** (Jambot) runs without end.
  It writes the score as cells text, steered by the jam's style vector, and it selects rather than generates: it fills an empty workbench by asking the repository for every part, the meter first, and generates only when a query finds nothing (yggi/cells decision 043).
  It keeps a fading short-term workbench of cells and queries a long-term repository.
- **The conductor** holds the session to a shared ruleset.
  `free()` is each performer's licence.
- **The players**, human or Jambot's own, perform the score within their licence.
  What they play goes out as MIDI, or as instrument-level cells rendered to audio.
- **The Muse** transcribes each player into cells fragments, which go to the repository and to the composer's workbench.

**The repository** holds cell cultures: fragments seeded from corpora, deduplicated by hash, placed in the style space, graded, and found by query.
**Everything is relative**: a fragment has no tempo, no key and no declared type, and plugs into any other at any scale.
**The regulator** is homeostasis between bored and confused, with a tolerance the style sets.
**Left alone**, the system is a radio station: a slow random walk around the tip of the jam's style vector.

Both projects were already moving toward it, each from its own side:

- both name cells with `&` and treat the cell as the unit that recurs at every level;
- both say they relate to Strudel as TypeScript relates to JavaScript;
- the operators correspond one to one (the table in [`memory/cell-studio.md`](../memory/cell-studio.md));
- Jambot holds the style space, the Muse, the fading memories and the bored-to-confusing measurement (#237, E22);
- Cell studio holds the language, a headless engine, MIDI to cells conversion, and the radio and jukebox idea (its #234).

## Seven sharpenings the owner agreed to

1. **A fragment's style vector is not the jam's.**
   `bpm` is absolute and `entropy` is the loop's temperature (#237), so a fragment carries a reading without either.
   The reading is partial, with a confidence per axis: a scale has no `sync`, a drum pattern no `harm`.
   Tempo and entropy belong to the jam.
2. **A role is computed, not declared.**
   "16-step basslines" are facets measured on the fragment (length, register, polyphony, pitched or not) and where it was last plugged in.
   A line becomes the bass by being plugged in low.
3. **Identity has three rungs**: the exact text, the canonical spelling (Cell studio's Normalise and α-renaming), and the orbit under the operators (`canonicalOp`).
   Which rungs merge and which only link is a choice; E28 shows it matters (1,036 chromatic shapes against 814 by degree over 1,646 bars).
4. **The score is a stream of pure texts.**
   The composer's state (its machines and fading memories) stays in Jambot, and what it writes is pure cells text, a section at a time.
   A take goes to the memory and the repository, never back into the composer's text, which is C10's displacement.
5. **Generators: cells is the output first.**
   Cells' generators make braids and events, not new cells or forms.
   Jambot's generators are the fallback on a miss: a query that finds nothing generates a fragment, files it under the style it was made for, and uses it, so they seed the repository and fade as it fills (yggi/cells decision 043); generators written in cells (Cell studio's song machine) come later and block nothing.
6. **One clock, owned by the host.**
   The host states `&bar` (meter, tempo, swing) for each section, and tempo-free fragments are spliced onto it, as cells already does with `step=16n`.
7. **Strudel is a superset in its mini-notation and its parameter names**, not in its pattern functions (no `.every`, `.jux`, `.off`, polymeter, samples).
   Strudel is AGPL, and `tooling/licenses.ts` keeps it out of what ships.

## Where each side stands

| Part of the brief       | Jambot                                                                                                                                        | Cell studio                                                                                                                 | Gap                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| The language            | a score of header, harmony, drums, bass, pad and stab; the lead and snare open (#265); not in the band's path (#63 step 5)                     | the language: pure TS, `free()` on any value and on a whole braid                                                           | two languages, drifting apart    |
| Headless player         | its own engine plays events                                                                                                                   | `src/engine/host.ts`: code in, timed events out, in a worker or in node                                                     | Jambot can't play cells yet      |
| Out                     | Web MIDI, the built-in synth, `DoughNote`                                                                                                     | Web MIDI and its clock (lifted from here at 8cdb6b8), Tone.js, MIDI files                                                   | duplicated; no dough renderer    |
| Generators              | the whole composer                                                                                                                            | braid-level only                                                                                                            | as intended for now              |
| Style vector            | 7 axes, presets, glides, the readers of E23–E26                                                                                               | none                                                                                                                        | no reading of a single fragment  |
| Muse and transcription  | the phrase reader with confidence, the fading motif memory, recognition under operators                                                       | the folder (MIDI to cells, shorter and the same notes), the disassembler, `free()` takes                                     | built twice, apart               |
| Identity                | `canonicalOp`; content-addressing discussed on #287                                                                                           | Normalise planned (its #244, #151)                                                                                          | none built                       |
| Repository              | nothing outlives a song                                                                                                                       | pieces in `localStorage`, 77 examples, 88 Bach MIDI files                                                                   | none                             |
| Short-term memory       | `fading.ts`, `history.ts`, the Muse's memory                                                                                                  | none                                                                                                                        | holds motifs, not cells          |
| Host and client         | protocol 10 and the lobby; `WrittenBar` JSON on the wire                                                                                       | none                                                                                                                        | the wire isn't text              |
| Homeostasis             | the observable (share of bars recognised, E20, E22), the knob (the variation rate), each genre's edge by ear                                  | none                                                                                                                        | no controller                    |
| Radio                   | the style never moves alone; the key drifts with no home (Q11)                                                                                | the idea (its #234)                                                                                                         | none                             |

## Where the two decide differently

Each row is the owner's call.
The suggestion takes cells' spelling where it agrees with Strudel, and Jambot's meaning where the question is about meaning.

| Question            | Jambot                                                     | Cell studio                                          | Suggestion                                          |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| Euclid's rotation   | `even(k, n, shift)`, 46 of 120 pairs differ (#8)           | Strudel's                                            | cells' spelling, `even` underneath                  |
| `_`                 | no onset here (#275)                                       | holds the note before, as Strudel                    | cells                                               |
| `^`                 | an octave up                                               | `^n` moves n degrees, `^$n` n grid steps             | cells                                               |
| `shift`             | transposes                                                 | walks the modes (Jambot's `mode`)                    | one name each, settled together                     |
| `cycle=`, `grid=`   | a cell's period; in #306 a bar's groups and a subdivision  | turns until it comes round; the grid is the tuning   | settled with the meter tree                         |
| A cell's name       | a number, never reused (`&0`)                              | a word; renaming keeps the cell                      | words; a hash is the identity                       |
| What a cell holds   | chromatic, degrees a view (#287)                           | an index into its table (degrees)                    | chromatic behind the hash, degrees in the text      |
| Accent grades       | `* + - .`                                                  | `* + .`                                              | cells                                               |
| Swing               | the meter's: a level (`8n`, `16n`) and a share (#360)      | a pair's ratio                                       | settled with the meter tree (#306)                  |
| Loudness            | additive offsets (T18)                                     | a product                                            | open                                                |
| Score and playing   | the text holds what is composed (T4)                       | the text holds everything                            | Jambot's, for the jam's stream                      |

## The plan

Each phase depends on the one before, except radio mode, which can start now.

0. **Agree** (the owner's calls).
   The syntax of #287, #306, #275 and #265 waits; their meaning carries over as what cells has to say.
   Rule on the table above, and on who owns the code Cell studio lifted.
   Where the code lives is ruled (D1): **yggi/cells** is the shared core, holding the language and the repository's code; **Cell studio** is the workbench and **Jambot** the interactive, multi-user frontend, both consuming cells at a pinned tag.
1. **A shared base.**
   Cell studio's pure `src/engine`, with the theory it imports, moves into yggi/cells with its history and is tagged (MIT, so it passes `tooling/licenses.ts`); Jambot depends on the tag, with a test that compiles a cells text and takes its events ([yggi/cells#1](https://github.com/yggi/cells/issues/1)).
   The MIDI layer gets one owner.
2. **Radio mode, alongside.**
   A free walk of the style, through the glides, whose variance the entropy sets and whose tempo the energy leans, slowly; the session carries it (#313, the owner's rulings).
   It gives Q11's key a home (#233), and a station that runs while the rest is built, to measure the homeostat against.
3. **The seam.**
   The band writes cells text a section at a time and plays it through the cells engine (#63 step 5).
   Q1a's round trip moves onto cells; the lead and the snare come in as named cells.
   Porting the band shows what cells lacks: likely a section's meter, harmony as numerals over a key, open fragments that leave `&key` and `&bar` to the host, and imports or a library by hash.
   The session protocol carries cells text (a protocol of its own), and Cell studio can load a stream from outside, to join a jam as a client and a view.
4. **A first repository.**
   A fragment is cells text with an index entry: its hashes, the operator back from the canonical form, the partial style reading with confidences, facets, origin, time and id.
   Seeded from Cell studio's examples, the folded Bach, and Jambot's own output, with POP909 or Lakh once their licences are checked.
   A query tool first, a server later.
5. **The loop closed.**
   One transcriber: Jambot's reader hears, Cell studio's capture law (`capture(play(b)) = b`) and folder write.
   The Muse writes to the repository and the workbench; the composer's memory (#207, M3 and M4) is `fading.ts` over fragment ids, choosing from the repository by context and style.
6. **The homeostat.**
   A controller holds the share of bars recognised within a band whose centre the style sets, with the variation rate or entropy as its output (#237); #244's settings place the edges by ear.
   Radio mode is this loop with nobody playing.
