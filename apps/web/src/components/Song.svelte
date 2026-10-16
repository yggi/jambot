<!--
  The Song view: the plan and the chords read from where a person plays
  along, large enough to read at arm's length with an instrument in hand
  (#327). The key heard, and the key the band heads for where it differs;
  the chord sounding, large, with its numeral, and the next with the beats
  until it; the notes that sit over the bar heard; the section heard bar by
  bar (those played dim, the one heard filling with its beats, a bar that
  plays a person's motif ringed in their colour); and the two sections after
  it as their bars' first chords, a new key or meter named. Every part is one
  size whatever it says, so nothing moves while a person reads it.
-->
<script lang="ts">
  import { SONG_METER } from '@jambot/engine';
  import { type Meter, meterOnSteps } from '@jambot/theory';
  import type { Hud } from '../hud.ts';
  import { keyName } from '../noteNames.ts';
  import { beatsToNext, nextChord } from '../planView.ts';
  import { overThis, sectionBars, sectionsAhead } from '../songView.ts';

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
  const bars = $derived(sectionBars(hud.sections, heard ? (hud.bar?.bar ?? null) : null));
  const ahead = $derived(sectionsAhead(hud.sections));
  const over = $derived(overThis(hud.bar));
</script>

<div class="song">
  <p class="where">
    <span title={keys}>{keys}</span>
    <span>{hud.bar?.meterName ?? ''}</span>
  </p>

  <div class="big" class:waiting={!heard}>
    <p class="now">
      <b class="chord" title={now?.symbol}>{now?.symbol ?? '—'}</b>
      <span class="numeral">{now?.numeral ?? ''}</span>
    </p>
    <p class="next">
      <small>next</small>
      <b title={coming?.symbol}>{coming?.symbol ?? ''}</b>
      <span class="in" aria-label={count === null ? undefined : `in ${count}`}>
        {#each { length: beats }, i (i)}
          <i class:left={count !== null && i >= beats - count}></i>
        {/each}
      </span>
    </p>
  </div>

  <p class="over">Over this: <b title={over}>{over}</b></p>

  <ol class="bars" aria-label="This section, bar by bar">
    {#each bars as bar (bar.bar)}
      <li
        class={bar.state}
        class:motif={bar.motif !== null}
        style:--motif={bar.motif ? `var(--source-${bar.motif.colour})` : null}
      >
        <span class="number">{bar.number}</span>
        <b title={bar.chords}>{bar.chords}</b>
        <span class="numeral">{bar.numeral}</span>
        {#if bar.state === 'heard' && hud.beat !== null}
          <i class="progress" style:width="{((hud.beat + 1) / beats) * 100}%"></i>
        {/if}
      </li>
    {/each}
  </ol>

  <div class="later">
    {#each ahead as section (section.index)}
      <div class="section">
        <p class="name">
          <b>{section.name}</b>
          <small class:change={section.change !== ''}>{section.change || 'same key'}</small>
        </p>
        <ol aria-label="{section.name}, bar by bar">
          {#each section.chords as chord, i (i)}
            <li title={chord}>{chord}</li>
          {/each}
        </ol>
      </div>
    {/each}
  </div>
</div>

<style>
  .song {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto minmax(136px, 1fr) auto;
    grid-template-areas: 'where' 'big' 'over' 'bars' 'later';
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
  .bars {
    grid-area: bars;
  }
  .later {
    grid-area: later;
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
    height: 104px;
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
  .next b {
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
  .over b {
    color: var(--teal);
    letter-spacing: 0.08em;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: minmax(64px, 1fr);
    gap: 6px;
  }
  .bars li {
    position: relative;
    display: grid;
    align-content: start;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }
  .bars b {
    font-size: 22px;
    line-height: 1.15;
  }
  .bars .numeral {
    font-size: 12px;
    color: var(--muted);
  }
  .bars .number {
    position: absolute;
    top: 5px;
    right: 8px;
    font-size: 10px;
    color: var(--muted);
  }
  .bars .played {
    opacity: 0.5;
  }
  .bars .heard {
    border-color: var(--amber);
    background: color-mix(in srgb, var(--amber) 12%, var(--surface));
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
    transition: width 0.1s linear;
  }
  .later {
    display: grid;
    gap: 6px;
  }
  .section {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
  }
  .name {
    display: grid;
    line-height: 1.15;
  }
  .name b {
    font-size: 13px;
  }
  .name small {
    font-size: 11px;
    color: var(--muted);
  }
  .name small.change {
    color: var(--teal);
    font-weight: 700;
  }
  .section ol {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 3px;
  }
  .section li {
    padding: 4px 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    color: var(--muted);
  }
  /* A phone on its side: the chord at the left, the section and those after it at the right. */
  @media (max-height: 500px) and (orientation: landscape) {
    .song {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
      grid-template-rows: auto minmax(120px, 1fr) auto;
      grid-template-areas: 'where where' 'big bars' 'over later';
      column-gap: 16px;
    }
    .big {
      grid-template-columns: minmax(0, 1fr);
      align-content: center;
      height: auto;
    }
    .next {
      justify-items: start;
      max-width: none;
    }
    .bars {
      grid-auto-rows: minmax(52px, 1fr);
    }
    .bars b {
      font-size: 18px;
    }
  }
</style>
