<!--
  The page: the container. It holds what belongs to the person and the
  device whichever screen is showing (their name, the MIDI and sound
  settings, the player, the sessions) and picks the screen: the lobby, the
  door, or the band that stands behind it (`screenOf`). The screens take
  props and send intents, and know nothing of the sessions or the device.
-->
<script lang="ts">
  import Drawer from './components/Drawer.svelte';
  import MidiPanel from './components/MidiPanel.svelte';
  import TimingPanel from './components/TimingPanel.svelte';
  import Band from './screens/Band.svelte';
  import Lobby from './screens/Lobby.svelte';
  import { Device } from './device.svelte.ts';
  import { Instruments } from './instruments.svelte.ts';
  import { Metronome } from './metronome.svelte.ts';
  import { Player } from './player.svelte.ts';
  import { Profile } from './profile.svelte.ts';
  import { screenOf } from './screen.ts';
  import { broadcastLobby } from './session/broadcast.ts';
  import { type Found, Sessions, type Where } from './session/sessions.svelte.ts';
  import { browserKept } from './session/storage.ts';
  import { websocketLobby } from './session/websocket.ts';
  import { type TimingReport, timingFile, timingReport } from './timing.ts';

  /** How often, in milliseconds, the lobby looks again for open sessions. */
  const LIST_EVERY = 3000;

  const device = new Device();
  const player = new Player(device.surroundings);
  const instruments = new Instruments(player, device);
  const profile = new Profile();
  const sessions = new Sessions(player, device.clocks, {
    tabs: broadcastLobby(),
    server: websocketLobby,
    address: import.meta.env.VITE_LOBBY_URL ?? '',
    kept: browserKept,
  });
  const hostSession = sessions.asHost;
  const clientSession = sessions.asClient;

  // A page that was reloaded, or an app a phone closed in the background, takes
  // its session up again.
  void sessions.restore(Date.now() / 1000);

  /**
   * The metronome: client-only, so it runs on its own next to the band
   * rather than through it, at whatever tempo the band is set to now — a
   * client keeps this even while its own controls rest.
   */
  const metronome = new Metronome(() => player.track.bpm.to);

  /** The timing counters, read now: shown with `?timing` in the address (#27). */
  const timingShown = new URLSearchParams(location.search).has('timing');
  const takeTiming = (): TimingReport =>
    timingReport(
      {
        mode: player.mode,
        transport: player.timing,
        output: device.offsetEstimate,
        network: clientSession.timing,
        lacked: player.lacked,
      },
      { taken: new Date().toISOString(), userAgent: navigator.userAgent },
    );
  let timing: TimingReport = $state.raw(takeTiming());
  $effect(() => {
    if (!timingShown) return;
    const id = setInterval(() => (timing = takeTiming()), 500);
    return () => clearInterval(id);
  });
  function exportTiming() {
    const { name, text } = timingFile(takeTiming());
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** MIDI notes in play along with the band, on the instruments. */
  const connectMidi = () => device.connect(instruments.onMidiNote);

  // A port chosen before is remembered (`MidiSettings`); reconnect to it without
  // waiting for a click, since a granted Web MIDI permission needs no gesture.
  if (device.remembersPorts) void connectMidi();

  /** Whether the person chose to play alone: not kept, so a reload lands on the door. */
  let soloChosen = $state(false);

  const screen = $derived(
    screenOf({
      mode: player.mode,
      clientStatus: clientSession.status,
      restoring: sessions.restoring,
      soloChosen,
    }),
  );

  // A session takes the place of the choice to play alone.
  $effect(() => {
    if (player.mode !== 'solo') soloChosen = false;
  });

  // Back at the door nothing plays on: a session that ended on its own, or
  // the way out, leaves the band as it was.
  $effect(() => {
    if (screen !== 'door') return;
    player.stop();
    metronome.stop();
  });

  // The sessions open, while the door shows, and again when the lobby server changes.
  let found: Found | null = $state.raw(null);
  $effect(() => {
    if (screen !== 'door') return;
    let live = true;
    const look = async () => {
      const seen = await sessions.list();
      if (live) found = seen;
    };
    void look();
    const id = setInterval(() => void look(), LIST_EVERY);
    return () => {
      live = false;
      clearInterval(id);
    };
  });

  /** The name the person goes by, made up again if they left it empty. */
  const named = () => {
    profile.settle();
    return profile.name.trim();
  };

  const host = (where: Where, session: string) => sessions.host(where, session, named());
  const join = (where: Where, session: string) => void sessions.join(where, session, named());
  const solo = () => {
    sessions.dismiss();
    soloChosen = true;
  };
  /** Close the session, leave it, or go back from solo to the lobby. */
  const leave = () => {
    sessions.end();
    soloChosen = false;
  };

  $effect(() => {
    // A phone or a tab suspended mid-note can leave hardware sounding one
    // whose release a frozen clock never got to schedule; silence it on wake.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        player.panicMidi();
        // Its sockets may have been closed, or left open and dead, meanwhile.
        clientSession.wake();
      } else hostSession.persist();
    };
    const onWake = () => clientSession.wake();
    const onGone = () => hostSession.persist();
    document.addEventListener('visibilitychange', onVisible);
    addEventListener('pageshow', onWake);
    addEventListener('online', onWake);
    addEventListener('pagehide', onGone);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      removeEventListener('pageshow', onWake);
      removeEventListener('online', onWake);
      removeEventListener('pagehide', onGone);
    };
  });

  // The computer's keys play along with the band, behind the door only.
  $effect(() => {
    if (screen === 'band') return instruments.listen();
  });
</script>

{#snippet sound()}
  <Drawer name="MIDI and sound" status={device.access ? 'MIDI connected' : 'Built-in synth'}>
    <MidiPanel
      settings={device.settings}
      access={device.access}
      message={device.message}
      onconnect={connectMidi}
      onpanic={() => player.panicMidi()}
    />
  </Drawer>
{/snippet}

<main>
  <header>
    <h1>Jambot</h1>
    <p>You play, the Muse listens, the band answers.</p>
  </header>

  {#if screen === 'band'}
    <!-- What isn't the music: how this device sounds, folded until wanted. -->
    <div class="settings">
      {@render sound()}
    </div>
    <Band
      {player}
      {metronome}
      {instruments}
      session={{
        hosting: { session: hostSession.session, guests: hostSession.guests },
        following: {
          status: clientSession.status,
          session: clientSession.session,
          name: clientSession.name,
          hostPlaying: clientSession.hostPlaying,
          hostAway: clientSession.hostAway,
          trip: clientSession.trip,
          lacked: player.lacked,
        },
      }}
      onend={leave}
    />
  {:else if screen === 'restoring'}
    <p class="message" role="status">Taking up your session again…</p>
  {:else}
    <Lobby
      name={profile.name}
      onname={(name) => (profile.name = name)}
      onsettle={() => profile.settle()}
      address={sessions.address}
      onaddress={(url) => (sessions.address = url)}
      {found}
      joining={clientSession.status === 'joining'}
      notice={sessions.ended}
      onsolo={solo}
      onhost={host}
      onjoin={join}
    />
    <div class="settings">
      {@render sound()}
    </div>
  {/if}

  {#if timingShown}
    <div class="settings">
      <TimingPanel report={timing} onexport={exportTiming} />
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 14px;
    display: grid;
    gap: 22px;
  }
  main > * {
    min-width: 0;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .settings {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  header p,
  .message {
    color: var(--muted);
    font-size: 14px;
  }
</style>
