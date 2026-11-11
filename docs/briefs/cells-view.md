# The Cells view as the composer's workbench

## The owner's brief

> revisit cells/fragments-view.
> default should be 'what the band is currently playing' (based on retrieved)
> IMHO It should be a tabular tree, a projection of the composor's workbench, with all fragments and how they fit into each other, maybe a bit like a scratch-program?
> all kinds of fragments that are currently used should be in there (melodies, basslines, drum patterns, instruments,...) and everything above and everything reasonable in its envoronmen should be already expressed as cells-fragments or have an issue to do it.
>
> investigate first, this is part ui/ux work, part survey along the main epic.

## The mock

The mock is [`cells-view/tree.html`](cells-view/tree.html), one HTML file with no dependencies, in the app's tokens, light and dark; `?only=wide` and `?only=phone` show one frame each, `?theme=dark` forces the dark theme.
Its screenshots are `cells-view/tree-light.png`, `cells-view/tree-dark.png` and `cells-view/tree-phone.png`.
Its scene is made up for the mock: Funk, section 3, a Groove, bar 5 of 8, in D dorian, with a player, Maya, in the session.
The ids are real cells ids at v0.23.0; the distances and weights are not measured.

What it shows:

- **Playing is the default.** The section heard, as a tree with one block to a row, each part nested in the part it is taken on. The rows stay in step with the section, as the Retrieved log is today.
- **The nesting is the workbench's order.** The composer fills an empty workbench by asking for every part, the meter first (yggi/cells decision 043). So the meter holds the drums (only rhythms that fit it rank, `fitsAs`) and the key. The drums hold the clave that layers on them. The key holds the harmony (`&harm from … &key`). The harmony holds the bass (`&bassline from … &harm`) and the comp. The melodic scale holds the lead, and the lead holds the motif a player offers it.
  A block's rail is the colour of the block it nests in, so it reads as a Scratch C-block holding what it takes.
- **A block is a fragment or says why it isn't.** A solid chip is a cells fragment, and the Fragment column shows its `from` line as cells writes it. A dashed chip is a part the band still decides in code. Its file is named, beside the issue that makes it a fragment, or a dashed amber chip where no issue exists yet (proposed below).
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
| Mode | `mode-repository.ts` `presetMode`, at a preset's choice only | yes, but its id is dropped | no | none for the id |
| Tonic and key moves | `plan.ts` `bandWish`, `key.ts` `nextKey` | no | as the key | #233, cells#647 |
| Melodic scale | `licence.ts` | no | as its name | none |
| Progression (theme) | `harmony-query.ts` `composedHarmony`; on a miss `themes.ts` | yes, `PlanCarried.themeFragments` | no, host only | #425 |
| Chord colour (sevenths, V/x) | `chords.ts` `barChords` | no | as chords | #425 (in part) |
| Drums | `rhythm-query.ts` `composedRhythm`, the ladder in `plan.ts` `climbed`; on a miss `drums.ts` | yes, `Plan.rhythmFragment` | yes | #634, #615, #632 |
| Clave | chosen with the drums (`LAYER_DISTANCE`) | yes, `Plan.claveFragment` | yes | #439 |
| Fills | `drums.ts`, the drummer's | no | – | **none** |
| Kit and drum notes | `gm_kit`; `drums.ts` `DRUM_NOTES` | the kit yes, the note table no | in the section text | #615 |
| Bass line | `bass-query.ts` `composedLine`; on a miss `bass.ts` | yes, `PlanCarried.bassFragment` | no, host only | **none for the id** |
| Lead line | `lead-query.ts` `composedLead`; on a miss `lead.ts` | yes, `PlanCarried.leadFragment` | no, host only | #547, **none for the id** |
| The lead's form | `lead-lines.ts` `LEAD_FORM`, fixed to `call_and_answer` | a fragment by name, never asked for | no | #547 rung 4 |
| Comp: pad and stab | `comp.ts` | no (cells' stab facet is never asked) | – | #541 |
| Instruments | `instruments.ts` `instrumentsAt`, facet `instrument` | yes, `FoundInstrument.id` | only in the section text | #531 item 5 (`timbreOf`) |
| Performers | `section-text.ts` `performerOf` | yes, by name | in the section text | #107 |
| Feel and timing licence | `performer.ts`, `licence.ts` | no | – | #324, #107 |
| Dynamics and energy | `dynamics.ts`, `form.ts` `barEnergy` | no | as energy | cells#571, **no Jambot twin** |
| Ending and count-in | `ending.ts` | no | – | **none** (or #633) |
| The Muse's motifs | `muse.ts` | no (her lead lines are filed) | yes, as her memory | #547 rung 6, #580 |
| Style | cells' `STYLES` (#596) | a preset is a cells style | as its name | #597, #598 |
| Short-term memory | `short-term.ts` | ids of fragments | no, host only | #443 |

Three findings change how the view can be built:

- **A client can draw the top of the tree but not the middle.** The meter, the drums and the clave ride on the plan. The progression, the bass line and the lead line are carried in `PlanCarried` and stay on the host, as do the short-term memory and the boredom. No issue asks for those ids to travel: #444 and #445 carry distances and the filed fragments, not the section's picks.
- **The nesting is already written down, in cells.** Cells' `from` lines say what takes what (`&harm from vamp_to_the_seventh &key`, `&bassline from walking_bass &harm`), and since cells#638 `references(text)` reads a text's `from` lines without compiling it.
  Today the band's section text, which does reach every client (protocol 14), writes its parts out note by note. Its only `from` lines are the performers. #531 (`* from band`) and #553 (the score carries the fragments a client lacks, the Muse filing by reference) move it toward writing the parts by reference.
  Once it does, the tree is `references(sectionText)` on any device, and no id needs a field of its own on the plan.
- **One comment is stale.** `fragmentsView.ts` says the Muse's motifs are "not cells fragments yet (#309)". #309 is closed; their issues are #547 rung 6 and #580.

## Recommendation

Build the view's model from one record of the section's picks, `SectionFragments` (meter, drums, clave, mode, progression, bass, lead, lead form, instruments). A pure function turns it into rows with a depth, the way `fragmentRows` turns the log into rows today. The Library tab keeps `fragmentRows` as it is.

Fill the record in two steps, so the view doesn't wait on the score:

1. **Now:** carry the progression, bass, lead and mode ids on the plan. This is a protocol bump, and a client then draws the whole tree, as the host does.
2. **Later:** when the section text writes its parts by reference (#531, #553), read the record off `references(text)` and retire the plan's id fields.

Step 2 is the general form, and step 1 is the special case it removes.
The other way is to wait for step 2 and draw a client's middle as *host* until then.
The owner chooses between the two.

## Issues

These already exist and the view leans on them: #443 (In mind), #444 (Dist.), #445 (the Library on a client), #624 (the inventory), #541 (the comp), #547 (the lead's form, the Muse's motifs), #633 (form), #531 and #553 (the score by reference).

Proposed, not yet filed:

- The Cells view as the band's workbench: the Playing tree by default, with Next §, In mind and Library as tabs (this brief and its mock).
- The section's progression, bass, lead, mode and instrument ids reach the screen: on the plan, then read from the section text.
- The drummer's fills as fragments of the drums (facet `fill`, or a line of the rhythm the drummer keeps today, `GROOVE_KEEP`).
- The melodic scale from the key's fragment, not the licence's table.
- Section energy and the dynamics curve as cells' intensity offset: the Jambot twin of cells#571.
- The ending and the count-in as fragments, or a line in #633 that says they stay code.

## Open questions

- Should the tree run from the ground up, as the mock does (the meter holds what fits on it), or in Scratch's direction, from the output down (the performer holds the line it plays)? The ground-up order is the composer's, and it keeps the tree shallow, since the performers and instruments become a column.
- Should Next § show the section composed ahead with its differences marked, or only its picks?
- Should the tempo, which stays out of fragments by ruling, show as a block at all, or as a figure in the section's row?
