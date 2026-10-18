# The score language

Facts about `packages/score` and the score language (#7).

## Score language

- The language design (#7) collects constraints before syntax, in [`language.md`](../language.md).
  An entry there is a claim in the `ratchet` skill's form: witness, counterexample, test, source, status, where it lands.
- Jambot's shapes have exact names in functional programming and category theory: a level is a Mealy machine, `compile` and `encode` are a retraction and a section, helices under `compose` are a category.
  The table is `language.md`, "Nomenclature".
- `packages/score` writes a bar as text and reads it back (`encodeBar`, `compileBar`), so far its header, `style`, `harm` and its drums.
  Its spelling is frozen (yggi/music-commons#14, ruling 4): it takes fixes only, no new forms, until the seam (#309) replaces it with cells, since a form grown here would be one more spelling to migrate.
  A new form is said in cells, as an issue there (D5, cells decision 037).
  Its `ScoreBar` is its own type: the engine is only a dev dependency, for `seam.test.ts`, which reads back every bar the band writes (Q1a).
  The cells language ([yggi/cells](https://github.com/yggi/cells), `@yggi/cells`, pinned to its tag `v0.5.0`) is a dev dependency too (and the engine's dependency for its repository of meters, `@jambot/engine/repository`, #375), for `cells.test.ts`: a cells text compiles and plays its events, and cells' Euclid is `even` up to a rotation (#309, phase 1).
  It is also what `experiments/drums-in-cells.ts` states the band's drums in and plays them by (E31), `experiments/pitch-in-cells.ts` their harmony (E32), `experiments/bar-in-cells.ts` a whole bar, every part but the lead, through the transport (E33), and `experiments/section-in-cells.ts` a whole section, every part and the lead as its notes (E35); each runs under vitest, its test holding what it found, and node imports cells too since v0.5.0 (cells decision 045).
  A chord `chordScale` gives no scale for, such as `Isus4`, is written like any other: the score states no scale and no line reads one (U3, vitrified).
- In the port's drums only the snare needs its role written: every other sound has one role (E16).
  Where the backbeat and a fill meet, the backbeat stays.
  E16's own form is decided (owner, on measured options): one line per sound, its own word (`bd`, `hh`, `oh`, `ph`, `rd`, `rim`), each hit held one step, `~` the rest between (L8).
  A sound with a fixed role writes none; the snare's (backbeat, fill or ghost) is still open, so `sd` has no line yet.
  `packages/analyzer`'s `notation.ts` carries a parsed hit the rest of the way there: `toDrumNotation` to a `WrittenNote`, `toScoreDrums` to `DrumLines`, and the ladder's rung 0 (#150) round-trips a real kick pattern through actual score text end to end.
- The prototype's score is not self-contained: 68% of bars compile differently from their text alone, always in register (octave, voicing), never in harmony or rhythm (`language.md`, S1 and E1).
- To run the prototype headless from Node, load it in jsdom as `prototype/experiments/cold-warm.mjs` does, and end with `process.exit`: the page's own timers keep the process alive.
- The engine's parts write notes, not events: a `WrittenNote` is a step, a note, a length in whole steps and, for a drum hit, its role, with no velocity.
  The band plays each through `perform` (`perform.ts`), which reads the velocity and the gated length from the bar (`language-time.md`, T4, and `language-experiments.md`, E9).
  A test that reads a velocity or a played length goes through `perform`.
- The band reads its style on a grid of 3 decimals (`writtenStyle`, C7), so a `BandBar`'s `style` is the written one, not what the track gave.
  A test that compares a bar's style or energy with its input writes it first.
- A part is one voice (L6): the comp writes two parts, `pad` and `stab`, and the synth's chords voice plays both.
- To show measured options as pictures, draw a page per question from the experiment's JSON and screenshot it with `tooling/screenshot.ts` (the `screenshot` skill).
  The pages and pictures stay in the scratchpad; the experiment and its numbers are what the repository keeps.
- To measure the port headless, run a script under `packages/engine/experiments/` with `node --experimental-strip-types --no-warnings`; it imports the engine from `../src/index.ts`.
  The full description is in
  [`prototype/README.md`](../../prototype/README.md#the-score-language-the-ir).
- One bar per block, 16 steps per bar, 4/4, and the song reads it from one place: `events.ts`'s `SONG_METER` (4/4) on the steps, `BEATS`, whose readings `barAt`, `barStart`, `stepInBar`, `beatAt`, `beatStart`, `beatInBar` and `onBeat` are what every reader of bar and beat calls (T10).
  A new reader uses them, never `/ 16`, `% 16` or `/ 4`; tests keep the literals, as a check that 4/4 still plays as it did.
  The rhythms the parts write (the backbeat on steps 4 and 12, the 16-long tables) are content on the 16 steps, not readings.
  Nothing composes in anything but 4/4 yet, and how bars of different lengths join is #122.
  The metronome (`packages/engine/src/metronome.ts`) has no bar of its own: it clicks the eighths of the steps the transport laid, on `SONG_METER`, through the swing they were laid with (`clicksOf`).
- A header's `bpm=` counts its bar's meter's beats, as cells' does (decision 040) and as the engine's `stepSeconds` does: 4/4's quarters, 6/8's dotted quarters, 7/8's three unequal beats (`beatsOf`, T7, #367).
  A bar lasts beats × 60 / bpm with its steps equal, so its beats keep their proportions, and the seam states the bpm as it is.
  The style track's bpm counts the beats of the transport's `tempoMeter`, which the player keeps the meter of the bar decided next: when the meter changes, the number converts once (`rebeat`, the felt tempo kept: 108 in 4/4 is 72 in 6/8), before the first bar in the new meter is composed.
  The Meter screen's metronome still counts quarters.
- Layers refer upward: pitch is relative to the chord, the chord to the key, the key to the section.
  Only compiled events are absolute.
- `harm`: Roman numerals in the bar's key (minor, dorian, major, mixolydian), with `° ø + 7 maj7 9 maj9`, borrowed `b`/`#` and secondaries `V7/iv`.
  A `9` is a tension on the seventh: a chord is a helix of one turn plus the tensions above it (#38).
- `bass`, `lead`: interval numbers from the chord root, counting degrees of the scale the chord implies.
  `1 3 5 7` name the chord's helix and `9` a tension over it, `2 4 6` are the scale tones between, and `b`/`#` alter them.
  A number sounds whether or not the chord holds it, as `7` does over a triad.
  A note goes to the octave nearest the previous one, `^`/`v` force the direction, then it folds into the part's range (bass 33–57, lead 60–88, or `range=lo-hi`).
  Absolute notes such as `A4` are an escape hatch, written in upper case so that `b3` is always a flat third (U2); the prototype still reads `a4`.
- The port writes the bass as a `bass` line of `step=pitch` pairs, `bass 0=0 4=0 7=7 12=0^` (U6, #263).
  A step is a 0-based step of the bar, a pitch the semitones above the root of the chord in force (0–11), and `^` the octave above the nearest to the register.
  A note has no length: it lasts to the next onset or the bar's end. A loop, a group, a rest, a hold and a finer grid are refused until the tree of #275.
- The port writes the comp as `pad 0=ch 8=ch` and `stab 4=ch 14=nx`: the steps it sounds a chord on, `ch` the chord in force and `nx` the next bar's first chord, which a `next V7` line states (with `key=G:ionian` where that bar's key differs) exactly when a stab plays it (#264).
  A chord is voiced close in 50–79 from the voicing before it. A pad lasts to the next chord and a stab one step, so neither states a length.
- A `frame` pins what a part's hand would decide: `frame bass=28 comp=12,16,19`, each an integer above the tonic at or below the part's floor (33 and 50), so a pin moves with the key.
  A text without one compiles from the default hand (the bass from E2, the comp from nothing), and a bar states a pin only where its hand is not the default.
  The bass's pin is the register its next note is nearest to, which is the last note before an octave jump, not the last note sounded.
- `pad`, `stab`: `ch` is the current chord and `nx` the next one.
- `drums`: `bd sd gh rim hh oh rd ph`.
- Rhythm is mini-notation: sequence, `[sub]`, `<alt per bar>`, `@weight`, `*n`, `(k,n,rot)`, `?`, `,` layers, `~` rest.
- The text holds what is composed, and the compiler adds how it is played.
  `legato=` and `:1`–`:9` state deviations only.
- Two lessons shaped the pitch syntax.
  Chord-tone tokens like `c0` collided with the absolute note C0, so pitch became interval numbers.
  And "nearest octave" alone made melodies climb forever, so each part now has a home range.
