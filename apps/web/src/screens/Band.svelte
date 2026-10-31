<!--
  The band: what stands behind the lobby's door, in the shell (#327). The
  transport heads it; hanging from it, the drawer holds what conducts and
  sets up the band (Sound, Session, Style, Time, Key, Muse, and the timing Counters where
  the address asks for it); below, the views are where a person reads and
  plays along: Song (the plan and the chords read from where one plays), Melody (a roll of the lead
  falling onto the keys), Rhythm (the bar as a grid over the pads, and a pattern of one's own), Mix (the band's tracks)
  and Cells (every cells fragment the band took, filed or heard, as one table).
  It shows the player it is given and sends what the person does; it opens
  no session and holds no device.
-->
<script lang="ts">
  import { swingTarget } from '@jambot/engine';
  import type { ComponentProps, Snippet } from 'svelte';
  import KeyPicker from '../components/KeyPicker.svelte';
  import Melody from '../components/Melody.svelte';
  import Rhythm from '../components/Rhythm.svelte';
  import Metrum from '../components/Metrum.svelte';
  import Muse from '../components/Muse.svelte';
  import Session from '../components/Session.svelte';
  import Shell, { type Place } from '../components/Shell.svelte';
  import Song from '../components/Song.svelte';
  import StylePanel from '../components/StylePanel.svelte';
  import BandCard from '../components/BandCard.svelte';
  import Cells from '../components/Cells.svelte';
  import CueStrip from '../components/CueStrip.svelte';
  import { cuesOf } from '../cues.ts';
  import { STYLE_AXES } from '../hud.ts';
  import Transport from '../components/Transport.svelte';
  import { keyReachOf, melodicReachOf, tempoView } from '../conductor.ts';
  import type { Instruments } from '../instruments.svelte.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { raised, toggled } from '../mix.ts';
  import type { Player } from '../player.svelte.ts';
  import { tracksOf } from '../tracks.ts';
  import { transportCells, transportHeard, transportLine } from '../transportView.ts';

  interface Props {
    player: Player;
    metronome: Metronome;
    instruments: Instruments;
    /** What the session card says; see `Session`. */
    session: {
      hosting: ComponentProps<typeof Session>['hosting'];
      following: ComponentProps<typeof Session>['following'];
      onadmit?: ComponentProps<typeof Session>['onadmit'];
    };
    /** Close the session, leave it, or go back to the lobby. */
    onend: () => void;
    /** How the Cells view carries what the band learned (#398): exported, its fragments exported, imported. */
    layers?: Omit<NonNullable<ComponentProps<typeof Cells>['carry']>, 'playing'>;
    /** How this device sounds: the page's Sound card, which is on both sides of the door. */
    sound: Snippet;
    /** The timing counters, where the address asks for them (`?timing`). */
    timing?: Snippet | undefined;
  }

  let { player, metronome, instruments, session, onend, layers, sound, timing }: Props = $props();

  const DRAWER: readonly Place[] = [
    { id: 'sound', title: 'Sound', icon: 'sound' },
    { id: 'session', title: 'Session', icon: 'session' },
    { id: 'style', title: 'Style', icon: 'style' },
    { id: 'time', title: 'Time', icon: 'time' },
    { id: 'key', title: 'Key', icon: 'key' },
    { id: 'muse', title: 'Muse', icon: 'muse' },
  ];
  const drawer = $derived(
    timing ? [...DRAWER, { id: 'counters', title: 'Counters', icon: 'timing' } as const] : DRAWER,
  );
  const VIEWS: readonly Place[] = [
    { id: 'song', title: 'Song', icon: 'song' },
    { id: 'melody', title: 'Melody', icon: 'melody' },
    { id: 'rhythm', title: 'Rhythm', icon: 'rhythm' },
    { id: 'mix', title: 'Mix', icon: 'mix' },
    { id: 'cells', title: 'Cells', icon: 'cells' },
  ];

  /** Whether this device follows a host, whose song, style and key it plays. */
  const following = $derived(player.mode === 'client');

  const phase = $derived(player.counting ? 'counting' : player.ending ? 'ending' : null);
  /** The meter of the bar heard, or before anything is, of the bar the song opens on (the count-in's). */
  const meter = $derived(player.hud.bar?.meter ?? player.opening);
  const step = $derived(
    player.counting
      ? player.countStep
      : player.heard === null || player.hud.beat === null
        ? null
        : player.clock.stepInBar(player.heard),
  );
  const line = $derived(
    transportLine({
      bpm: player.track.bpm.to,
      bar: player.hud.bar,
      phase,
      playing: player.playing,
      heard: player.hud.beat !== null,
      beatsLeft: player.counting
        ? transportCells(meter).length - (transportHeard(meter, player.countStep)?.cell ?? 0)
        : null,
    }),
  );

  /** The heads-ups, read from the plan a few bars early, and from the transport's phase. */
  const cues = $derived(
    cuesOf({
      hud: player.hud,
      counting: player.counting
        ? {
            left:
              transportCells(meter).length - (transportHeard(meter, player.countStep)?.cell ?? 0),
            of: transportCells(meter).length,
          }
        : null,
      ending: player.ending,
      last: player.lastBar,
      radio: player.station !== null,
    }),
  );

  const tracks = $derived(
    tracksOf({
      hud: player.hud,
      sounding: player.sounding,
      pattern: player.pattern,
      ahead: player.foreseen,
      heard: player.heard,
      clock: player.clock,
      humanNotes: player.humanNotes,
      playerId: player.playerId,
      players: player.players,
      mix: player.mix,
    }),
  );
</script>

{#snippet header()}
  <Transport
    main={line.main}
    sub={line.sub}
    {meter}
    {step}
    {phase}
    last={player.lastBar !== null && player.hud.bar?.bar === player.lastBar}
    playing={player.playing}
    {following}
    ontoggle={() => (player.playing ? player.stop() : player.start())}
  />
{/snippet}

{#snippet sheet(id: string)}
  {#if id === 'sound'}
    {@render sound()}
  {:else if id === 'session'}
    <Session
      mode={player.mode}
      hosting={session.hosting}
      following={session.following}
      onadmit={session.onadmit}
      players={player.players}
      playerId={player.playerId}
      {phase}
      bar={player.hud.beat === null ? null : (player.hud.bar?.bar ?? null)}
      {onend}
    />
  {:else if id === 'style'}
    <StylePanel
      track={player.track}
      style={player.hud.style}
      {following}
      radio={player.station !== null}
      ontune={(on) => player.tuneRadio(on)}
      onintent={(intent) => player.apply(intent)}
    />
  {:else if id === 'time'}
    <Metrum
      tempo={tempoView(player.track, player.tempoNudge)}
      swing={player.meter === null && player.hud.bar?.swingShare != null
        ? { level: player.hud.bar.swingLevel, share: player.hud.bar.swingShare }
        : swingTarget(player.swing)}
      level={player.hud.bar?.swingLevel}
      {metronome}
      heard={player.heard}
      meter={player.hud.bar?.meter}
      clock={player.clock}
      playing={player.playing}
      {following}
      onintent={(intent) => player.apply(intent)}
      asked={following ? (player.hud.headingMeter ?? player.meter) : player.meter}
      onmeter={(meter) => player.setMeter(meter)}
    />
  {:else if id === 'key'}
    <KeyPicker
      {following}
      heading={player.hud.heading}
      heard={player.hud.bar}
      reach={keyReachOf(player.track)}
      home={player.home}
      melodic={player.hud.headingMelodic}
      melodicReach={melodicReachOf(player.track)}
      history={player.harmonicHistory}
      onintent={(intent) => player.apply(intent)}
    />
  {:else if id === 'muse'}
    <Muse
      muse={player.hud.muse}
      pulse={player.humanNotes.length}
      onforget={() => player.forgetMotif()}
    />
  {:else if id === 'counters' && timing}
    {@render timing()}
  {/if}
{/snippet}

{#snippet stage(id: string)}
  {#if id === 'song'}
    <Song hud={player.hud} meter={player.hud.bar?.meter} />
  {:else if id === 'melody'}
    <Melody
      {tracks}
      bar={player.hud.bar}
      chord={player.hud.chord}
      down={instruments.heldLead}
      sounding={player.sounding.lead}
      onnote={(note, velocity, on) => instruments.toLead(note, velocity, on, 'the on-screen keys')}
    />
  {:else if id === 'rhythm'}
    <Rhythm
      {tracks}
      rhythm={player.rhythm}
      plays={player.rhythmPlays}
      down={instruments.heldDrums}
      sounding={player.sounding.drums}
      onnote={(note, velocity, on) => instruments.toDrums(note, velocity, on, 'the drum pads')}
      ontoggle={(note, step) => player.toggleHit(note, step)}
      onrecord={(note) => player.recordHit(note)}
      onplays={(plays) => (player.rhythmPlays = plays)}
      onclear={() => (player.rhythm = [])}
    />
  {:else if id === 'mix'}
    <BandCard
      {tracks}
      ontoggle={(which, performer) => (player.mix = toggled(player.mix, which, performer))}
      onlevel={(performer, level) => (player.mix = raised(player.mix, performer, level))}
    />
  {:else if id === 'cells'}
    <Cells
      bar={player.hud.beat === null ? null : player.hud.bar}
      layer={following ? null : player.layer}
      memory={player.hud.muse.memory}
      players={player.players}
      carry={layers && !following ? { playing: player.playing, ...layers } : null}
    />
  {/if}
{/snippet}

{#snippet overlay()}
  <CueStrip
    {cues}
    beat={player.hud.beat}
    axes={STYLE_AXES.map((axis) => player.hud.style.axes[axis])}
  />
{/snippet}

<Shell {header} {drawer} {sheet} views={VIEWS} {stage} {overlay} />
