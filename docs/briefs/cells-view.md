# The Cells view as the composer's workbench

## The owner's brief

> revisit cells/fragments-view.
> default should be 'what the band is currently playing' (based on retrieved)
> IMHO It should be a tabular tree, a projection of the composor's workbench, with all fragments and how they fit into each other, maybe a bit like a scratch-program?
> all kinds of fragments that are currently used should be in there (melodies, basslines, drum patterns, instruments,...) and everything above and everything reasonable in its envoronmen should be already expressed as cells-fragments or have an issue to do it.
>
> investigate first, this is part ui/ux work, part survey along the main epic.

And on the first draft of this brief:

> attach cells, check how much of this can live as a general mechanism in the language repo itself
>
> I think the shallow form is right for the jambot cells-view, maybe switchable to the other, out-based one.
>
> we should push for 531 and 553, not build around them
>
> revise the plan and file issues, then open a pr

## The mock

The mock is [`cells-view/tree.html`](cells-view/tree.html), one HTML file with no dependencies, in the app's tokens, light and dark; `?only=wide` and `?only=phone` show one frame each, `?theme=dark` forces the dark theme.
Its screenshots are `cells-view/tree-light.png`, `cells-view/tree-dark.png` and `cells-view/tree-phone.png`.
Its scene is made up for the mock: Funk, section 3, a Groove, bar 5 of 8, in D dorian, with a player, Maya, in the session.
The ids are real cells ids at v0.23.0; the distances and weights are not measured.

What it shows:

- **Playing is the default.** The section heard, as a tree with one block to a row, each part nested in the part it is taken on. The rows stay in step with the section, as the Retrieved log is today.
- **The nesting is the workbench's order.** The composer fills an empty workbench by asking for every part, the meter first (yggi/cells decision 043). So the meter holds the drums (only rhythms that fit it rank, `fitsAs`) and the key. The drums hold the clave that layers on them. The key holds the harmony (`&harm from … &key`). The harmony holds the bass (`&bassline from … &harm`) and the comp. The melodic scale holds the lead, and the lead holds the motif a player offers it.
  A block's rail is the colour of the block it nests in, so it reads as a Scratch C-block holding what it takes.
- **A block is a fragment or says why it isn't.** A solid chip is a cells fragment, and the Fragment column shows its `from` line as cells writes it.
  A dashed chip is a part the band still decides in code. The mock names its file and the issue that makes it a fragment, which is the survey's view; in the app, such a part is one the score writes out, and the view shows it as written.
- **The tree runs from the ground by default, and a switch flips it to the outputs.** From the ground, a part sits under what it is taken on, and performers and instruments are a column, so the tree stays shallow. From the outputs, each performer holds the line it plays, and the line holds what it reads.
- **The columns:**
  - what the fragment plays on (its performer and instrument);
  - how it came: found in the repository, a variation and how (`drop &hat 6`), layered, a player's via the Muse, invented on a miss, asked for, or code;
  - its distance from the query (#444);
  - its weight in the composer's short-term memory (#443).
  The tag *host* marks an id that a client doesn't receive today.
- **The other views are tabs over the same rows:**
  - **Next §**: the section composed ahead, where the plan reaches.
  - **In mind**: the short-term memory, its ids and weights (#443).
  - **Library**: today's table, with its All, Filed, Retrieved and Muse filters, kept as it is.
- **Picking a row opens it below**, as today: its text, where it was found, what it carries, and what it was used together with.
- **On a phone each block takes two lines:** the part, with its `from` line beneath it, and on the right how it came and its weight.

## What the band plays from, and what of it is a fragment

The survey was taken at `main` @ a34d13c, with cells v0.23.0, and read off `packages/engine/src` and `packages/score/src`.
It feeds #624, the inventory by part, but not that issue's numbers (the share of each part that comes from cells).

| Part | Decided by | A fragment? | Reaches a client | Issue |
| --- | --- | --- | --- | --- |
| Song form | `form.ts` `form`, a Markov chain over 6 section types | no | the section's name | #633, #547 rung 5 |
| Section length | `form.ts` `SECTION_BARS` = 8 | no | – | #633 |
| Meter and swing | `meter-query.ts` `composedMeter` | yes, `Plan.meterFragment`, `Plan.share` | yes | #444 (distance) |
| Tempo | the style's `bpm`, `tempo.ts` | no, by ruling (D6) | as bpm | #617 |
| Mode | `mode-repository.ts` `presetMode`, at a preset's choice only | yes, but its id is dropped | no | #531 (asked) |
| Tonic and key moves | `plan.ts` `bandWish`, `key.ts` `nextKey` | no | as the key | #233, cells#647 |
| Melodic scale | `licence.ts` | no | as its name | #644 |
| Progression (theme) | `harmony-query.ts` `composedHarmony`; on a miss `themes.ts` | yes, `PlanCarried.themeFragments` | no, host only | #425 |
| Chord colour (sevenths, V/x) | `chords.ts` `barChords` | no | as chords | #425 (in part) |
| Drums | `rhythm-query.ts` `composedRhythm`, the ladder in `plan.ts` `climbed`; on a miss `drums.ts` | yes, `Plan.rhythmFragment` | yes | #634, #615, #632 |
| Clave | chosen with the drums (`LAYER_DISTANCE`) | yes, `Plan.claveFragment` | yes | #439 |
| Fills | `drums.ts`, the drummer's | no | – | #643 |
| Kit and drum notes | `gm_kit`; `drums.ts` `DRUM_NOTES` | the kit yes, the note table no | in the section text | #615 |
| Bass line | `bass-query.ts` `composedLine`; on a miss `bass.ts` | yes, `PlanCarried.bassFragment` | no, host only | #531 (asked) |
| Lead line | `lead-query.ts` `composedLead`; on a miss `lead.ts` | yes, `PlanCarried.leadFragment` | no, host only | #547, #531 (asked) |
| The lead's form | `lead-lines.ts` `LEAD_FORM`, fixed to `call_and_answer` | a fragment by name, never asked for | no | #547 rung 4 |
| Comp: pad and stab | `comp.ts` | no (cells' stab facet is never asked) | – | #541 |
| Instruments | `instruments.ts` `instrumentsAt`, facet `instrument` | yes, `FoundInstrument.id` | only in the section text | #531 item 5 (`timbreOf`) |
| Performers | `section-text.ts` `performerOf` | yes, by name | in the section text | #107 |
| Feel and timing licence | `performer.ts`, `licence.ts` | no | – | #324, #107 |
| Dynamics and energy | `dynamics.ts`, `form.ts` `barEnergy` | no | as energy | #645, cells#571 |
| Ending and count-in | `ending.ts` | no | – | #646 |
| The Muse's motifs | `muse.ts` | no (her lead lines are filed) | yes, as her memory | #547 rung 6, #580 |
| Style | cells' `STYLES` (#596) | a preset is a cells style | as its name | #597, #598 |
| Short-term memory | `short-term.ts` | ids of fragments | no, host only | #443 |

Three findings shape the plan:

- **A client can draw the top of the tree but not the middle.** The meter, the drums and the clave ride on the plan. The progression, the bass line and the lead line are carried in `PlanCarried` and stay on the host, as do the short-term memory and the boredom.
- **The nesting is already written down, in cells.** Cells' `from` lines say what takes what (`&harm from vamp_to_the_seventh &key`, `&bassline from walking_bass &harm`).
  Today the band's section text, which does reach every client (protocol 14), writes its parts out note by note, and its only `from` lines are the performers.
- **One comment was stale.** `fragmentsView.ts` said the Muse's motifs are "not cells fragments yet (#309)". #309 is closed; it now names #547 and #580.

## What lives in cells

Most of the mechanism is the language's, not Jambot's: what a score takes, from where, and how its parts read each other is the same question for Cell studio's fragments (yggi/cell-studio#621).

Cells holds already:

- `references(text)` (yggi/cells#638): each `from` line, its id, names and arguments, without compiling;
- `catalogue()` (yggi/cells#638): each fragment's facets, signature and the ids it takes;
- `expansion(text).takes`: what each `from` line gave the piece, what the piece overrode and its arguments;
- `expansion(text).origins` (yggi/cells#639): each given name's chain of `{ id, line }`;
- `writtenGraph(result)`: the program's cells and links, its depth growing outward from the roots, which is the ground-up order at the level of cells;
- the lockfile a piece file carries (`uses:`, each id and hash), which #553 puts on the wire.

Cells lacks one pure function, the piece's **outline**: its parts, each the head of a `from` line or a line the piece writes itself, linked by what reads what, with two projections of the same graph, from the ground and from the outputs.
That is yggi/cells#695.

What stays Jambot's is what only the composer knows, joined to the outline by fragment id:

- a query's distance (#444);
- a fragment's weight in mind and its boredom (#443);
- how a part came: found, varied, layered, a player's via the Muse;
- the tabs, the transport and the drawing.

## The plan

The view is not built around the plan's fields. It reads the score, so the work goes into the score:

1. **#531 writes each part the repository found as its `from` line** (asked there): the meter, the key with its mode, the harmony, the drums, the clave, the bass and the lead, with the argument each is taken on. A part generated on a miss stays written out, and so does a line the band changes (a fill, the levels), the piece's own line winning over the fragment's.
2. **#553 sends the lockfile:** each id and hash, and the text of each fragment a client lacks, a filed variation's among them (asked there).
3. **yggi/cells#695 gives the outline,** in a cells release that Jambot pins.
4. **#642 builds the view on these:** Playing by default, from the ground with a switch to the outputs; Next §, In mind (#443) and Library as tabs.
   The Library tab and #443 don't wait on 1 to 3.

The parts with no fragment get one through their own issues:

- #643, the drummer's fills;
- #644, the melodic scale;
- #645, a section's intensity and the dynamics (the twin of yggi/cells#571);
- #646, the ending and the count-in;
- and, already open, #633 (form), #541 (the comp), #547 (the lead's form, the Muse's motifs), #233 and yggi/cells#647 (the tonic), #425 (the chord colour).
  The tempo stays out of fragments by ruling (D6, #617).

## Open questions

- Should Next § show the section composed ahead with its differences marked, or only its picks?
- Should the tempo, which stays out of fragments by ruling, show as a block at all, or as a figure in the section's row?
