# Brief: host and client mode

A plan sketch, not a decision. Nothing here is built yet, and every number
in it is to be measured (#27) before it is claimed.

## What is asked

- **Solo**, the base case: the app runs on its own, as it does now.
- **Host**: the app starts a session under a name. Other Jambot instances
  find it by that name (globally, to begin with) and join it.
- **Client**: a joined app runs no composer of its own. It plays the
  host's bars, with its own band: its own synth, its own MIDI out to its
  own instruments, and its own performance. Its players feed the Muse, and
  what the Muse hears reaches the host.
- The Muse filters and rates on both sides.
- Low-latency links between host and clients. Audio streaming, in one or
  both directions, comes later.

The root node (#20) is the same role as a browser host: a host that is a
Linux box with MIDI ports. So the host is designed once, as pure code that
runs in a tab or on the root node.

## Where the seams already are

The engine is pure, every level is a `Machine` whose state survives a JSON
round trip (`lawBreaks`), and time is laid by exact maps. Three seams
already sit where a host and a client split:

1. **Written against played.** The band writes notes (`WrittenNote`) over
   one `BarEnv`, and only then plays each through the performance
   (`perform`) and colours the bar (`soundOf`), in `band.ts`. A `BandBar`
   is `BarEnv + written + events + sound`. The host sends
   `BarEnv + written`; the client performs. That is the score seam of #63:
   today the bar goes over the wire as JSON, and once the score package
   exists, as the bar's score text, the contract between composer and
   player. Legible all the way down, across the network too.
2. **Judging against taking.** The Muse judges each source's bar on its
   own (`judgeBar`) and takes one motif of them all (`taken`). The client
   judges; the host takes.
3. **Laying time.** Steps are laid from the style track, the song's start
   and the seed (`TransportEnv`), through `tempoMap` and `swingMap`. Given
   the same track and start on a shared clock, a client lays the same
   steps at the same moments without being told them.

## The shape

```
 client                              host (tab, later the root node)
 ──────                              ────────────────────────────────
 players ─▶ capture ─▶ judgeBar ──── judgements ──▶ muse: take, weigh
                          │                              │ offer
                    own Muse panel                       ▼
                                                band: plan, chords, parts
 transport (follower) ◀─────── bars (BarEnv + written), a bar ahead
   lays steps from the          track (style glides), start, seed
   shared clock                 forecast (for the HUD), Muse log
   perform ─▶ synth / MIDI out
 clock sync ◀──────────────── ping / pong ──────────────▶ host clock
```

### The engine: a transport over a bar source

The transport runs the band itself. It becomes a transport over a source of
bars: the host's source is the band, as now; a client's source is its inbox
of bars from the host. That is a contraction, not a special case: solo
play is a host nobody joined, and a client is the same transport with
another source.

- A bar missing from the inbox when its first step is laid is passed, as a
  bar a stall passed is passed. The clock never waits for the network. The
  client counts such bars, and that count is the first measure of the link.
- The Muse's input becomes judgements rather than notes. The transport
  judges its own players' notes (`judgeBar`) before the Muse takes, so a
  judgement from a player in the room and one from a client across the
  network enter the same way.
- The client performs each bar itself (`perform`, `soundOf`). By default
  that gives what the host would have played. Per-client expression
  (which parts it plays, its MIDI routing, its synth, later humanising or a
  velocity curve) lives there and changes nothing on the host.

### The Muse on both sides

The user's preference, both, follows the law of recursion: the same form at
two levels.

- **Client**: judges its own players' bars. It rejects mashing, too few
  and too wide there, shows its own judgements at once in its Muse panel,
  and sends only judgements (the motif, the player's level, the source and
  the bar) upstream. Each source is named by client and instrument.
- **Host**: takes one motif of all judgements, its own players' and every
  client's. Today that is the most notes and the first to arrive; weighing
  several players is already the open A3 (confidence) on #79, and the
  host is where it is decided.
- **Timing.** A motif heard in bar k plays from bar k + 2 (F7). The host
  takes it as it composes bar k + 2, on the last beat of bar k + 1. A
  client can judge bar k once it ends, so a judgement has most of a bar to
  arrive. One that arrives later is logged as late and dropped.
- A client's forget goes to the host as an intent; the host decides.

Whether clients may send raw notes as well, for the analyzer and the
learned Muse encoder (#16), is open.

### Controls

The host conducts: style, presets and the key wish are the host's. A
client's style panel shows the host's style. Whether clients may send
wishes (a key, a nudge of energy) that the host weighs, as it weighs
motifs, is open.

### Time

A shared clock is the core of this, and it is the host's.

- **Offset.** A client pings the host and keeps the offset from the pings
  with the shortest round trips (Cristian's method, filtered by minimum
  delay). The estimator is pure and tested with simulated jitter.
- **Drift.** Two audio clocks drift apart by some parts per million. The
  offset is re-estimated all the time and slewed, never stepped: nothing
  jumps.
- **Output latency.** Each device already knows the moment it is heard
  (`clockOffset`). A client schedules each event its own output latency
  early, so the sound leaves every device at the shared moment, not only
  the scheduling.
- **Sending ahead.** The band composes a bar a beat ahead
  (`COMPOSE_AHEAD`, at least 333 ms), and the transport schedules 120 ms
  ahead. That leaves a client a few hundred milliseconds for a bar to
  arrive: enough on a LAN, tight over the internet. In host mode the band
  may compose further ahead (a bar), at the cost of a style change
  reaching the drums a bar later. Which is measured, not guessed.
- **MIDI clock.** Every client can derive a MIDI clock from the shared
  timeline, so hardware at every station is in step. Who is the master
  when a root node exists is #27's open question.

## Links and protocols

Browsers cannot send UDP, so RTP as such is out of reach from a tab. The
options:

| Link                  | Fits                                                    | Against                                                                  |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| WebSocket             | Simplest; any server; works through every NAT and proxy | TCP: a lost packet holds up the ones after it; all traffic via a server  |
| WebRTC data channels  | Peer to peer, so traffic stays on the LAN; UDP beneath, with unordered and unreliable channels for pings | Needs signalling (a server) to connect; more moving parts            |
| WebRTC media tracks   | RTP under the hood, Opus, jitter buffers: the audio streaming of later | Audio only                                                        |
| WebTransport (QUIC)   | Datagrams, no head-of-line blocking                     | Client to server only, needs HTTP/3 and a certificate; no peer to peer  |
| RTP-MIDI (AppleMIDI)  | The standard for MIDI over a network                    | Not in browsers; a root-node concern, for hardware                       |
| BroadcastChannel      | Tabs of one browser, no server                          | One machine only: for tests and demos                                    |

The recommendation:

- The protocol sits behind one `Link` interface, as the output sits behind
  `Output` and the browser behind `Surroundings`. The design already
  tolerates latency (bars go a beat or more ahead, judgements have most of
  a bar), so the link can start simple and get faster without touching
  anything above it.
- **First, WebSocket** through a small lobby server that also relays.
- **Then, WebRTC data channels**, with the same lobby as signalling: one
  reliable, ordered channel for bars and the track; one unreliable,
  unordered channel for clock pings. Traffic stays on the LAN at an event.
- **Audio later, on WebRTC media tracks**, which is where RTP arrives: the
  same peer connections carry it.
- **The root node** runs the lobby itself on the LAN (found by mDNS as,
  say, `jambot.local`), speaks the same protocol from Node, and drives
  hardware directly. RTP-MIDI is an option there, not in the browser.

### Discovery

The app is a static site on Pages, so finding a session by name needs a
server somewhere: the lobby. It maps a session name to its host, lists the
open sessions, and relays or signals. Where it runs (a small hosted
service, or only the root node and a laptop at the event) is the owner's
decision. Names are global and first come, first served to begin with; a
join code or a password is open.

Public signalling networks (for example, rooms over public relays) avoid a
server of our own, but put the event on infrastructure nobody here
controls. Not recommended for a live event.

### Messages

Plain data, each carrying the protocol's version. A client and host of
different versions refuse each other, since a cached PWA may be old.

- Host to client: `welcome` (version, session, seed, start on the shared
  clock, track), `track` (on a change), `bar` (bar k's `BarEnv` and
  written notes, sent as it is composed), `forecast` (the bars ahead, for
  the HUD's song map), `muse` (the offer and the log), `stop`, `pong`.
- Client to host: `join` (version, name), `judgement` (bar, source, the
  judgement), `intent` (a forget; later wishes), `ping`.

## Where the code goes

- `packages/engine`: the transport over a bar source; the Muse over
  judgements. Pure, as now.
- `packages/session`, new and pure: the messages and their codec, the
  clock estimator, and the host's and the client's session machines (who
  has joined, the inbox of bars, the judgements waiting). Machines, so
  `lawBreaks` holds them, and they run in a tab or on the root node.
- `apps/web/src/net/`: the links (BroadcastChannel, WebSocket, later
  WebRTC) and the lobby client. The `Player` gains a mode (solo, host,
  client); the HUD shows the session and who has joined.
- The lobby: a small Node service, later part of the root node (#20).

## Tests

- **The engine refactor changes nothing solo.** The existing unit tests
  and `pnpm e2e` pass unchanged; a test says a transport over the band as
  its source gives exactly the events it gives now.
- **Host and clients agree.** In one test, a host and clients over a
  simulated link with delay, jitter, loss and reordering: every client
  plays the host's written notes on the same steps, and a bar that
  arrives late is passed, never played late.
- **The clock estimator converges**, and a test shows it can fail: on
  asymmetric delay it is off by half the asymmetry, which is the known
  limit.
- **Two browsers in step**, end to end: two Chromium pages on one session,
  and the onsets they sound are measured against each other. That number is
  the claim.

## Steps

1. The engine seams: a transport over a bar source, the Muse over
   judgements. No network. Solo stays the same.
2. `packages/session`: messages, the clock estimator, the host and client
   machines, and the simulated-link tests.
3. A BroadcastChannel link, so host mode runs across two tabs with no
   server, and the two-page e2e measures it.
4. The lobby and the WebSocket link; host mode in the UI (a session name,
   who has joined; join by name).
5. WebRTC data channels, the lobby as signalling.
6. The root node speaks the protocol (#20).
7. Audio over WebRTC media tracks.

v0 is due on Thursday, 1 October 2026, and is the prototype plus bonuses.
Steps 1 to 3 are a demo of host mode on one machine; step 4 is the first
across machines. What fits by Thursday is the owner's call.

## Open

- Where the lobby runs, and whether sessions need a join code.
- Whether the host composes further ahead in host mode, and by how much.
- Whether clients send wishes, and raw notes as well as judgements.
- How the host weighs several players' motifs (A3 on #79).
- What a client plays for a bar that did not arrive: rest, as now
  proposed, or something that doesn't sound like a hole.
- Who masters the MIDI clock when a root node exists (#27).
