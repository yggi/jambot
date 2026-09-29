<!--
  The timing test (#204, A7): a drum pattern of two sounds, a kick and a
  snare, plays for eight bars after a count-in, and the person follows every
  hit with any input: the computer's keys, the tap button, a pad or a MIDI
  key. Each tap shows at once how early or late it was, on the bar as it
  runs and in words, and the whole run is kept in this browser to download
  with every timing detail for analysis elsewhere. It takes the test as a
  prop and sends intents; the page runs it.
-->
<script lang="ts">
  import Segmented from '../components/Segmented.svelte';
  import { describeOffset, verdictOf } from '../timing-test/match.ts';
  import { TEMPOS, TEST_PATTERNS, type PatternId, type Tempo } from '../timing-test/pattern.ts';
  import { TAP_SOURCE, type RunTap, type TimingRun } from '../timing-test/run.ts';
  import type { TimingTest } from '../timing-test/session.svelte.ts';

  interface Props {
    test: TimingTest;
    /** Back to the lobby. */
    onback: () => void;
    /** The runs kept, as a file. */
    onexport: (kind: 'json' | 'csv') => void;
  }

  let { test, onback, onexport }: Props = $props();

  /** Where the pattern is, in seconds from its first bar, redrawn with the screen. */
  let position: number | null = $state(null);
  $effect(() => {
    if (test.phase !== 'playing') {
      position = null;
      return;
    }
    let frame = 0;
    const step = () => {
      position = test.position();
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  });

  const plan = $derived(test.plan);
  const barSeconds = $derived(plan?.barSeconds ?? 1);
  const counting = $derived(position !== null && position < 0);
  /** The bar shown: the one heard, or the first while counting in. */
  const bar = $derived(
    position === null || !plan
      ? 0
      : Math.min(plan.bars - 1, Math.max(0, Math.floor(position / barSeconds))),
  );
  const hits = $derived(plan?.expected.filter((e) => e.bar === bar) ?? []);
  const taps = $derived(
    test.taps.filter(
      (t) =>
        t.heardAt >= bar * barSeconds - barSeconds / 10 &&
        t.heardAt < (bar + 1) * barSeconds + barSeconds / 10,
    ),
  );
  const across = (seconds: number) =>
    Math.min(100, Math.max(0, ((seconds - bar * barSeconds) / barSeconds) * 100));
  const playhead = $derived(position === null || counting ? 0 : across(position));
  const beat = $derived(
    position === null || !plan ? 0 : Math.floor((position + barSeconds) / (barSeconds / 4)) + 1,
  );

  const kindOf = (tap: RunTap) =>
    tap.offsetMs === null ? 'stray' : verdictOf(tap.offsetMs).replace(' ', '-');
  const signed = (ms: number | null) =>
    ms === null ? '–' : `${ms >= 0 ? '+' : '−'}${Math.round(Math.abs(ms))} ms`;
  const percent = (share: number | null) => (share === null ? '–' : `${Math.round(share * 100)} %`);

  const last = $derived(test.last);
  const said = $derived(
    last === null
      ? null
      : last.offsetMs === null
        ? 'No hit near that tap'
        : `${last.sound} · ${describeOffset(last.offsetMs)}`,
  );
  const stats = $derived(test.stats);

  const inputsOf = (run: TimingRun) =>
    [...new Set(run.taps.map((t) => t.source))].join(', ') || 'no taps';
  const when = (run: TimingRun) => new Date(run.taken).toLocaleString();

  let confirming = $state(false);

  function tap(e: PointerEvent | MouseEvent) {
    // A click from the keyboard has no pointer; the computer's keys are taken elsewhere.
    if (e instanceof MouseEvent && !(e instanceof PointerEvent) && e.detail !== 0) return;
    if (e instanceof PointerEvent) e.preventDefault();
    test.tap({ source: TAP_SOURCE, kind: 'tap', eventMs: e.timeStamp });
  }
</script>

<div class="test">
  <section class="card" aria-label="Timing test">
    <div class="head">
      <h2>Timing test</h2>
      <button type="button" class="quiet" onclick={onback}>Back to the lobby</button>
    </div>
    <p class="message">
      A drum pattern of two sounds, a kick and a snare, plays after a bar of hats. Follow every hit
      for eight bars with the computer's keys (a–l, 1–7), the button below, a pad or a MIDI key, and
      see at once how early or late each one was. Every run is kept in this browser.
    </p>

    {#if test.phase !== 'playing'}
      <Segmented
        label="Pattern"
        value={test.pattern}
        options={TEST_PATTERNS.map((p) => ({
          value: p.id,
          text: p.name,
          name: `${p.name}: ${p.about}`,
        }))}
        onselect={(id: PatternId) => (test.pattern = id)}
      />
      <Segmented
        label="Tempo"
        value={`${test.bpm}`}
        options={TEMPOS.map((bpm) => ({ value: `${bpm}`, text: `${bpm} bpm` }))}
        onselect={(bpm) => (test.bpm = Number(bpm) as Tempo)}
      />
      <button type="button" class="primary" onclick={() => void test.start()}>
        {test.phase === 'done' ? 'Run again' : 'Start the test'}
      </button>
    {:else}
      <button type="button" class="quiet" onclick={() => test.stop()}>Stop</button>
    {/if}

    {#if test.notice}
      <p class="notice" role="status">{test.notice}</p>
    {/if}
  </section>

  {#if test.phase === 'playing' || test.phase === 'done'}
    <section class="card" aria-label="The run">
      {#if test.phase === 'playing'}
        <p class="where" aria-live="off">
          {#if counting}Count-in · {Math.min(4, Math.max(1, beat))}{:else}Bar {bar + 1} of {plan?.bars}{/if}
        </p>
      {/if}

      <div class="strip" role="img" aria-label="The bar, its hits and your taps">
        {#each [0, 4, 8, 12] as step (step)}
          <span class="beat" style:left="{(step / 16) * 100}%"></span>
        {/each}
        {#each hits as hit (hit.index)}
          <span class="hit {hit.sound}" style:left="{(hit.step / 16) * 100}%" title={hit.sound}
          ></span>
        {/each}
        {#each taps as t (t.index)}
          <span class="dot {kindOf(t)}" style:left="{across(t.heardAt)}%"></span>
        {/each}
        {#if test.phase === 'playing' && !counting}
          <span class="playhead" style:left="{playhead}%"></span>
        {/if}
      </div>
      <p class="legend">
        <span class="key kick"></span> kick <span class="key snare"></span> snare
        <span class="key dot on-time"></span> on time <span class="key dot early"></span> early
        <span class="key dot late"></span> late
      </p>

      {#if test.phase === 'playing'}
        <button type="button" class="tap" onpointerdown={tap} onclick={tap} aria-label="Tap along">
          Tap
        </button>
      {/if}

      <p class="said {last?.verdict.replace(' ', '-') ?? ''}" role="status" aria-live="polite">
        {said ?? (test.phase === 'playing' ? 'Waiting for your first tap' : '')}
      </p>
      <p class="figures">
        {test.taps.filter((t) => t.hit !== null).length} of {plan?.expected.length ?? 0} hits · mean {signed(
          stats.mean,
        )} · spread {stats.sd === null ? '–' : `${Math.round(stats.sd)} ms`} ·
        {percent(stats.onTime)} within 25 ms
      </p>

      {#if test.phase === 'done' && test.finished}
        {@const summary = test.finished.summary}
        <div class="result" aria-label="Result">
          <h3>Done</h3>
          <p>
            {summary.answered} of {summary.hits} hits followed, {summary.missed} missed, {summary.extra}
            extra taps. Mean {signed(summary.offsets.mean)}, median {signed(
              summary.offsets.median,
            )}, spread
            {summary.offsets.sd === null ? '–' : `${Math.round(summary.offsets.sd)} ms`}.
          </p>
          <p class="bars">
            By bar: {summary.perBar.map((m) => signed(m)).join(' · ')}
          </p>
          <p class="message">Saved as {test.finished.id}.</p>
        </div>
      {/if}
    </section>
  {/if}

  <section class="card" aria-label="Saved runs">
    <h2>Saved runs</h2>
    {#if test.saved.length === 0}
      <p class="message">No run is kept yet.</p>
    {:else}
      <ul class="runs">
        {#each test.saved as run (run.id)}
          <li>
            <span class="when">{when(run)}</span>
            <span>{run.pattern}, {run.bpm} bpm</span>
            <span>{run.summary.answered}/{run.summary.hits} hits</span>
            <span>mean {signed(run.summary.offsets.mean)}</span>
            <span class="inputs">{inputsOf(run)}</span>
            <button
              type="button"
              class="quiet"
              onclick={() => test.removeRun(run.id)}
              aria-label="Delete the run of {when(run)}">Delete</button
            >
          </li>
        {/each}
      </ul>
      <div class="actions">
        <button type="button" onclick={() => onexport('json')}>Download all (JSON)</button>
        <button type="button" onclick={() => onexport('csv')}>Download taps (CSV)</button>
        {#if confirming}
          <span role="alertdialog" aria-label="Clear the runs" class="confirm">
            Delete all {test.saved.length}?
            <button
              type="button"
              class="danger"
              onclick={() => {
                test.clearRuns();
                confirming = false;
              }}>Delete</button
            >
            <button type="button" class="quiet" onclick={() => (confirming = false)}>Keep</button>
          </span>
        {:else}
          <button type="button" class="quiet" onclick={() => (confirming = true)}>Clear all…</button
          >
        {/if}
      </div>
    {/if}
    <p class="message">
      Kept in this browser's local storage. The JSON file has every hit and tap with the event's own
      time, the audio clock, the output's latency and the clock pairing; the CSV has one row per
      tap.
    </p>
  </section>
</div>

<style>
  .test {
    display: grid;
    gap: 14px;
  }
  .card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  h2,
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }
  h3 {
    font-size: 14px;
  }
  .message,
  .legend,
  .bars {
    font-size: 13px;
    color: var(--muted);
  }
  .notice {
    font-size: 14px;
    color: var(--amber);
  }
  button {
    justify-self: start;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .primary {
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 24px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
  .quiet {
    color: var(--muted);
  }
  .danger {
    border-color: var(--amber);
    color: var(--amber);
  }
  .where {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  .strip {
    position: relative;
    height: 96px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    overflow: hidden;
  }
  .beat {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--line);
  }
  .hit {
    position: absolute;
    width: 6px;
    height: 26px;
    margin-left: -3px;
    border-radius: 3px;
  }
  .hit.snare,
  .key.snare {
    top: 8px;
    background: var(--source-1);
  }
  .hit.kick,
  .key.kick {
    bottom: 8px;
    background: var(--source-0);
  }
  .dot {
    position: absolute;
    top: 42px;
    width: 12px;
    height: 12px;
    margin-left: -6px;
    border-radius: 50%;
  }
  .dot.on-time {
    background: var(--teal);
  }
  .dot.early {
    background: var(--source-3);
  }
  .dot.late {
    background: var(--amber);
  }
  .dot.stray {
    border: 2px solid var(--muted);
  }
  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--ink);
    opacity: 0.6;
  }
  .legend .key {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 0 2px 0 8px;
    border-radius: 2px;
    position: static;
  }
  .legend .key.dot {
    border-radius: 50%;
  }
  .tap {
    justify-self: stretch;
    min-height: 88px;
    border: 2px solid var(--teal);
    border-radius: 12px;
    background: var(--teal-bg);
    font-size: 20px;
    font-weight: 700;
    touch-action: manipulation;
    user-select: none;
  }
  .said {
    min-height: 1.5em;
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .said.on-time {
    color: var(--teal);
  }
  .said.early {
    color: var(--source-3);
  }
  .said.late {
    color: var(--amber);
  }
  .said.no-hit {
    color: var(--muted);
  }
  .figures {
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .result {
    display: grid;
    gap: 4px;
    border-top: 1px solid var(--line);
    padding-top: 8px;
    font-size: 14px;
  }
  .runs {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }
  .runs li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .runs .inputs {
    color: var(--muted);
  }
  .runs button {
    min-height: 28px;
    padding: 0 10px;
    margin-left: auto;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .confirm {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
</style>
