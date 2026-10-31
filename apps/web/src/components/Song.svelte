<!--
  The Song view: the plan and the chords read from where a person plays
  along, large enough to read at arm's length with an instrument in hand
  (#327). The key heard, and the key the band heads for where it differs;
  the chord sounding, large, with its numeral, and the next with the beats
  until it; the notes that sit over the bar heard; and the sections from the
  one heard on, each a line of its name (and what changes in it) over its
  bars in one row, a bar its chords laid as wide as they last (those played
  dim, the one heard filling with its beats, a bar that plays a person's
  motif ringed in their colour). Every part is one size whatever it says, so
  nothing moves while a person reads it. Colour is pitch (`pitch.ts`): each
  chord wears its root's colour as a stripe, and spells its notes in theirs,
  the chord sounding and the next always, and where there is room every
  chord of the section heard and the first of each section after it; the
  notes over the bar are spelled in theirs too.
-->
<script lang="ts">
  import { SONG_METER } from '@jambot/engine';
  import { type Meter, meterOnSteps } from '@jambot/theory';
  import type { Hud } from '../hud.ts';
  import { keyName } from '../noteNames.ts';
  import { beatsToNext, nextChord } from '../planView.ts';
  import { pitchColour, type Spelled } from '../pitch.ts';
  import { overThis, songSections } from '../songView.ts';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'chord' | 'next' | 'sections' | 'heading'>;
    /** The meter of the bar heard. */
    meter?: Meter | undefined;
  }

  let { hud, meter = SONG_METER }: Props = $props();

  const heard = $derived(hud.beat !== null);
  const clock = $derived(meterOnSteps(meter));
  const beats = $derived(meter.heights.length);
  /** The chord sounding, or before anything is heard, the one the band opens on. */
  const now = $derived(hud.chord ?? hud.bar?.chords[0] ?? null);
  const coming = $derived(nextChord(hud));
  const count = $derived(beatsToNext(hud, clock.heights, clock.cycle));
  const heading = $derived(hud.heading && keyName(hud.heading));
  const keys = $derived(
    hud.bar
      ? heading && heading !== hud.bar.key
        ? `${hud.bar.key} → ${heading}`
        : hud.bar.key
      : '',
  );
  const sections = $derived(songSections(hud.sections, heard ? (hud.bar?.bar ?? null) : null));
  const over = $derived(overThis(hud.bar));
  const overText = $derived(
    [over.notes.map((n) => n.name).join(' '), over.scale].filter(Boolean).join(' · '),
  );
  /** A chord's root colour, none for a chord without notes. */
  const rootOf = (notes: readonly Spelled[]) =>
    notes[0] ? pitchColour(notes[0].pitchClass) : null;
</script>

{#snippet spell(notes: readonly Spelled[], cls: string)}
  <span class="spell {cls}" aria-label={notes.map((n) => n.name).join(' ')}>
    {#each notes as note, i (i)}<b style:color={pitchColour(note.pitchClass)}>{note.name}</b>{/each}
  </span>
{/snippet}

<div class="song">
  <p class="where">
    <span title={keys}>{keys}</span>
    <span>{hud.bar?.meterName ?? ''}</span>
  </p>

  <div class="big" class:waiting={!heard}>
    <div class="here">
      <p class="now">
        <b class="chord" title={now?.symbol} style:--root={now && rootOf(now.notes)}
          >{now?.symbol ?? '—'}</b
        >
        <span class="numeral">{now?.numeral ?? ''}</span>
      </p>
      {@render spell(now?.notes ?? [], 'big-notes')}
    </div>
    <p class="next">
      <small>next</small>
      <b title={coming?.symbol} style:--root={coming && rootOf(coming.notes)}
        >{coming?.symbol ?? ''}</b
      >
      {@render spell(coming?.notes ?? [], 'next-notes')}
      <span class="in" aria-label={count === null ? undefined : `in ${count}`}>
        {#each { length: beats }, i (i)}
          <i class:left={count !== null && i >= beats - count}></i>
        {/each}
      </span>
    </p>
  </div>

  <p class="over" title={overText}>
    Over this:
    {@render spell(over.notes, 'over-notes')}
    {#if over.scale}<small>· {over.scale}</small>{/if}
  </p>

  <div class="sections">
    {#each sections as section, s (section.index)}
      <section class="block" aria-label="{section.name}, bar by bar">
        <p class="name">
          <b>{section.name}</b>
          {#if section.change}<small>{section.change}</small>{/if}
        </p>
        <ol class="bars">
          {#each section.bars as bar, b (bar.bar)}
            <li
              class={bar.state}
              class:motif={bar.motif !== null}
              class:near={s === 0}
              style:--motif={bar.motif ? `var(--source-${bar.motif.colour})` : null}
            >
              {#each bar.chords as chord, c (c)}
                <span
                  class="part"
                  style:flex-grow={chord.share}
                  style:--root={rootOf(chord.notes)}
                  title="{chord.symbol} · {chord.numeral}"
                >
                  <b>{chord.symbol}</b>
                  <small>{chord.numeral}</small>
                  {#if s === 0 || (b === 0 && c === 0)}{@render spell(
                      chord.notes,
                      'bar-notes',
                    )}{/if}
                </span>
              {/each}
              {#if bar.state === 'heard' && hud.beat !== null}
                <i class="progress" style:width="{((hud.beat + 1) / beats) * 100}%"></i>
              {/if}
            </li>
          {/each}
        </ol>
      </section>
    {/each}
  </div>
</div>

<style>
  .song {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto 1fr;
    grid-template-areas: 'where' 'big' 'over' 'sections';
    gap: 10px;
    min-height: 100%;
  }
  .where {
    grid-area: where;
  }
  .big {
    grid-area: big;
  }
  .over {
    grid-area: over;
  }
  .sections {
    grid-area: sections;
  }
  p {
    margin: 0;
  }
  b,
  small,
  span,
  li {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .where {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .big {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 10px;
    height: 132px;
  }
  .big.waiting {
    opacity: 0.55;
  }
  .now {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }
  .chord {
    font-size: 84px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .now .numeral {
    flex: none;
    font-size: 18px;
    color: var(--muted);
  }
  .next {
    display: grid;
    justify-items: end;
    max-width: 40vw;
    padding-bottom: 6px;
    color: var(--muted);
  }
  .next small {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .next > b {
    max-width: 100%;
    font-size: 36px;
    line-height: 1.05;
    font-weight: 800;
    color: var(--ink);
    opacity: 0.8;
  }
  .in {
    display: flex;
    gap: 5px;
    margin-top: 6px;
    min-height: 13px;
  }
  .in i {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid var(--line);
  }
  .in i.left {
    border-color: var(--amber);
  }
  .over {
    font-size: 13px;
    color: var(--muted);
    display: flex;
    gap: 6px;
  }
  .over small {
    font-size: 12px;
  }
  .spell {
    display: inline-flex;
    gap: 0.3em;
    font-weight: 800;
    letter-spacing: 0;
  }
  .over .spell {
    gap: 0.45em;
  }
  .here {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .big-notes {
    font-size: 18px;
  }
  .next-notes {
    font-size: 13px;
  }
  .bar-notes {
    justify-content: center;
    gap: 1px;
    font-size: 10px;
    line-height: 1.1;
  }
  /* A chord's notes show where its tile has room for them: a narrow one keeps its symbol and numeral. */
  .part {
    container-type: inline-size;
  }
  @container (max-width: 40px) {
    .bar-notes {
      display: none;
    }
  }
  /* The root's colour, under the chord: the big one's underline, a bar's chord's stripe. */
  .chord,
  .next > b {
    text-decoration: underline var(--root, transparent) 5px;
    text-underline-offset: 6px;
  }
  .next > b {
    text-decoration-thickness: 3px;
  }
  .part {
    box-shadow: inset 0 -3px 0 var(--root, transparent);
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sections {
    display: grid;
    align-content: start;
    gap: 8px;
  }
  .block {
    display: grid;
    gap: 3px;
  }
  .name {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
  }
  .name b {
    color: var(--ink);
    font-size: 13px;
  }
  .name small {
    color: var(--teal);
    font-weight: 700;
    font-size: 12px;
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 3px;
  }
  .bars li {
    position: relative;
    display: flex;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
  }
  .bars li.near {
    height: 52px;
  }
  .part {
    flex-basis: 0;
    display: grid;
    align-content: center;
    padding: 0 1px;
    text-align: center;
    letter-spacing: -0.01em;
  }
  .part + .part {
    border-left: 1px dashed var(--line);
  }
  .part > b {
    font-size: 13px;
    line-height: 1.15;
  }
  .near .part > b {
    font-size: 15px;
  }
  .part small {
    font-size: 10px;
    color: var(--muted);
  }
  .bars .played {
    opacity: 0.45;
  }
  .bars .heard {
    border-color: var(--amber);
    background: color-mix(in srgb, var(--amber) 14%, var(--surface));
  }
  .bars .motif {
    box-shadow: inset 0 0 0 2px var(--motif);
  }
  .progress {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    background: var(--amber);
    border-radius: 0 0 0 8px;
    transition: width 0.1s linear;
  }
  /* A phone or a tablet on its side: the chord at the left, the section and those after it at the right. */
  @media (max-height: 500px) and (orientation: landscape),
    (pointer: coarse) and (orientation: landscape) {
    .song {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
      grid-template-rows: auto 1fr auto;
      grid-template-areas: 'where where' 'big sections' 'over sections';
      column-gap: 16px;
    }
    .big {
      grid-template-columns: minmax(0, 1fr);
      align-content: start;
      height: auto;
    }
    .next {
      justify-items: start;
      max-width: none;
    }
    .sections {
      gap: 4px;
    }
    .bars li,
    .bars li.near {
      height: 40px;
    }
  }
  /* A tablet on its side has the height for a bar's notes. */
  @media (min-height: 501px) and (pointer: coarse) and (orientation: landscape) {
    .bars li {
      height: 46px;
    }
    .bars li.near {
      height: 56px;
    }
  }
  /* A short screen has no room for a bar's notes: the chord sounding and the next still spell theirs. */
  @media (max-height: 500px) {
    .bar-notes {
      display: none;
    }
  }
</style>
