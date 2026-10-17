<!--
  The door: the lobby and its extras, in the same shell as the band (#327).
  The header is what the view plays: on Play the page's name, the person's
  and how many sessions are open; on Tune, Meter and Timing their own
  transport, its button starting and stopping the tuner, the metronome and
  the timing test. Hanging from it, the drawer holds what belongs to the
  person and the device (Sound, You, Settings, About, and Counters where the
  address asks for them); below, the views are the lobby (Play) and the
  extras (Tune, Meter, Timing). It shows what it is given and sends what the
  person does; it opens no session and holds no device.
-->
<script lang="ts">
  import { METERS, STEPS_PER_EIGHTH } from '@jambot/theory';
  import type { ComponentProps, Snippet } from 'svelte';
  import About from '../components/About.svelte';
  import Settings from '../components/Settings.svelte';
  import Shell, { type Place } from '../components/Shell.svelte';
  import Transport from '../components/Transport.svelte';
  import You from '../components/You.svelte';
  import Logo from '../components/glyphs/Logo.svelte';
  import Version from '../components/Version.svelte';
  import type { MeterPlayer } from '../meter/meter-player.svelte.ts';
  import { patternById } from '../timing-test/pattern.ts';
  import { describeOffset } from '../timing-test/match.ts';
  import type { TimingTest } from '../timing-test/session.svelte.ts';
  import type { LiveCorrection } from '../tune/live-correction.svelte.ts';
  import type { ToneSender } from '../tune/sender.svelte.ts';
  import type { Tuner } from '../tune/tuner.svelte.ts';
  import Lobby from './Lobby.svelte';
  import MeterScreen from './Meter.svelte';
  import TimingTestScreen from './TimingTest.svelte';
  import TuneScreen from './Tune.svelte';

  interface Props {
    /** What the lobby shows and sends; see `Lobby`. */
    lobby: ComponentProps<typeof Lobby>;
    /** The person's name; see `You`. */
    you: ComponentProps<typeof You>;
    /** The theme and the lobby server; see `Settings`. */
    settings: ComponentProps<typeof Settings>;
    /** A session kept from before is being taken up again, and how to let it go. */
    restoring: boolean;
    ondrop: () => void;
    tuner: Tuner;
    sender: ToneSender;
    correction: LiveCorrection;
    metronome: MeterPlayer;
    test: TimingTest;
    /** The timing test's runs, as a file. */
    onexport: (kind: 'json' | 'csv') => void;
    /** How this device sounds: the page's Sound card, which is on both sides of the door. */
    sound: Snippet;
    /** The timing counters, where the address asks for them (`?timing`). */
    counters?: Snippet | undefined;
    /** The view shown: the page runs an extra only while its view shows. */
    view?: string;
  }

  let {
    lobby,
    you,
    settings,
    restoring,
    ondrop,
    tuner,
    sender,
    correction,
    metronome,
    test,
    onexport,
    sound,
    counters,
    view = $bindable('play'),
  }: Props = $props();

  const DRAWER: readonly Place[] = [
    { id: 'sound', title: 'Sound', icon: 'sound' },
    { id: 'you', title: 'You', icon: 'you' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
    { id: 'about', title: 'About', icon: 'about' },
  ];
  const drawer = $derived(
    counters ? [...DRAWER, { id: 'counters', title: 'Counters', icon: 'timing' } as const] : DRAWER,
  );
  const VIEWS: readonly Place[] = [
    { id: 'play', title: 'Play', icon: 'play' },
    { id: 'tune', title: 'Tune', icon: 'tune' },
    { id: 'meter', title: 'Meter', icon: 'meter' },
    { id: 'timing', title: 'Timing', icon: 'timing' },
  ];

  const open = $derived(lobby.found?.sessions.length ?? null);

  const reading = $derived(tuner.reading);
  const listening = $derived(tuner.status === 'listening');
  const cents = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(Math.round(x))} ¢`;

  /** The metronome's bar: the one heard while it plays, else the one chosen. */
  const shown = $derived(
    metronome.playing && metronome.heard ? metronome.heard.name : metronome.name,
  );
  const eighth = $derived(
    metronome.playing && metronome.heard?.name === shown ? metronome.heard.eighth : null,
  );

  const testing = $derived(test.phase === 'playing');
  const last = $derived(test.last);
</script>

{#snippet header()}
  {#if view === 'tune'}
    <Transport
      main={reading ? `${reading.name} · ${cents(reading.cents)}` : 'Tuner'}
      sub={reading
        ? `${reading.hz.toFixed(2)} Hz · A4 = ${tuner.reference}`
        : listening
          ? 'Listening'
          : tuner.status === 'starting'
            ? 'Starting…'
            : 'Not listening'}
      meter={null}
      step={null}
      phase={null}
      playing={listening}
      labels={{ start: 'Start', stop: 'Stop' }}
      cadence={false}
      loop={false}
      busy={tuner.status === 'starting'}
      ontoggle={() => (listening ? tuner.stop() : void tuner.start())}
    />
  {:else if view === 'meter'}
    <Transport
      main={shown}
      sub="{metronome.bpm} BPM · swing {Math.round(metronome.swing * 100)} %"
      meter={METERS[shown]}
      step={eighth === null ? null : eighth * STEPS_PER_EIGHTH}
      phase={null}
      playing={metronome.playing}
      labels={{ start: 'Play', stop: 'Stop' }}
      cadence={false}
      loop={false}
      ontoggle={() => (metronome.playing ? metronome.stop() : void metronome.start())}
    />
  {:else if view === 'timing'}
    <Transport
      main={testing
        ? last === null
          ? 'Follow every hit'
          : last.offsetMs === null
            ? 'No hit near that tap'
            : describeOffset(last.offsetMs)
        : 'Timing test'}
      sub="{patternById(test.pattern).name} · {test.bpm} BPM"
      meter={null}
      step={null}
      phase={null}
      playing={testing}
      labels={{ start: test.phase === 'done' ? 'Run again' : 'Start the test', stop: 'Stop' }}
      cadence={false}
      loop={false}
      ontoggle={() => (testing ? test.stop() : void test.start())}
    />
  {:else}
    <section class="banner" aria-label="Lobby">
      <span class="mark"><Logo /><Version /></span>
      <div class="what">
        <b>Jambot</b>
        <span>{you.name.trim() || 'You'} · in the lobby</span>
      </div>
      {#if open !== null}<span class="open">{open} open</span>{/if}
    </section>
  {/if}
{/snippet}

{#snippet sheet(id: string)}
  {#if id === 'sound'}
    {@render sound()}
  {:else if id === 'you'}
    <You {...you} />
  {:else if id === 'settings'}
    <Settings {...settings} />
  {:else if id === 'about'}
    <About />
  {:else if id === 'counters' && counters}
    {@render counters()}
  {/if}
{/snippet}

{#snippet stage(id: string)}
  {#if id === 'play'}
    {#if restoring}
      <p class="message" role="status">Taking up your session again…</p>
      <button type="button" class="drop" onclick={ondrop}>Drop session</button>
    {:else}
      <Lobby {...lobby} />
    {/if}
  {:else if id === 'tune'}
    <TuneScreen {tuner} {sender} {correction} />
  {:else if id === 'meter'}
    <MeterScreen player={metronome} />
  {:else if id === 'timing'}
    <TimingTestScreen {test} {onexport} />
  {/if}
{/snippet}

<Shell {header} {drawer} {sheet} views={VIEWS} {stage} bind:view />

<style>
  /* The Play view's header: the transport's frame and height, so nothing moves between views. */
  .banner {
    height: 64px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px 0 8px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
  }
  .mark {
    flex: none;
    width: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .mark :global(.glyph) {
    width: 34px;
    height: 34px;
  }
  .what {
    flex: 1;
    min-width: 0;
    line-height: 1.15;
  }
  .what b,
  .what span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .what b {
    font-size: 20px;
  }
  .what span,
  .open {
    font-size: 12.5px;
    color: var(--muted);
  }
  .open {
    flex: none;
    font-variant-numeric: tabular-nums;
  }
  .message {
    color: var(--muted);
    font-size: 14px;
  }
  .drop {
    margin-top: 8px;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
</style>
