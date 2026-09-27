# Brief: host and client mode

Host and client mode, from the owner's brief to where it stands. Steps 1
to 4 below are built but for hosting the lobby: a host and its clients
across the tabs of one browser, and across machines through a lobby
server on the local network. What is measured is said so; what is
estimated is marked as an estimate.

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

Decided by the owner:

- **A hosted lobby service**, developed first against a local server.
- **WebSocket first, then WebRTC**, behind one link abstraction.
- **Local jamming**: the two-bar delay of the Muse gives the headroom, and
  a host too far away is dropped rather than played with.
- **No join code**: a session is found by its name alone.
- **A bar that did not arrive rests** on the client.

The root node (#20) is the same role as a browser host: a host that is a
Linux box with MIDI ports. So the host is pure code where it can be, and
runs in a tab or on the root node.

## The seams

The engine is pure, every level is a `Machine` whose state survives a JSON
round trip (`lawBreaks`), and time is laid by exact maps. Three seams sit
where a host and a client split:

1. **Written against played.** The band writes notes (`WrittenNote`) over
   one `BarEnv`, and `playBar` plays them: each through the performance,
   the bar coloured by `soundOf`. The host sends `BarEnv + written`
   (`WrittenBar`); the client plays it through `playBar` itself, so its
   notes are the host's and its instruments its own. That is the score
   seam of #63: today the bar goes as data, and once the score package
   exists it can go as the bar's score text.
2. **Judging against taking.** The Muse judges each source's bar
   (`judgeBar`) and takes one motif of all it hears (`taken`). A client
   judges; the host takes.
3. **Laying time.** Steps are laid from the style track and the song's
   start, through `tempoMap` and `swingMap`. With the host's track and
   start, a client lays the host's steps at the host's moments.

## The shape

```
 client                                 host (a tab, later the root node)
 ──────                                 ─────────────────────────────────
 players ─▶ capture ─▶ ear (judgeBar) ─ judged ─▶ Muse: takes one of all
                                                        │ offer
                                                        ▼
                                                band: plan, chords, parts
 transport over followSource ◀──── bar: WrittenBar + where it starts
   on the host's clock               start (seed, start, track), track,
   playBar ─▶ synth / MIDI out       forecast (what changed), muse, stop
 hostClock ◀──────────────────────── ping / pong, each output's heard moment
```

### The engine: a transport over a source of bars

The transport runs over a source of bars (`BarSource`): the band
(`bandSource`), or a client's inbox of the host's bars (`followSource`).
Solo play is a host nobody joined, and a client is the same transport with
another source.

- The band composes a bar a beat before it starts (`COMPOSE_AHEAD`). The
  follower takes a bar as its first step is laid (`ahead: 0`), so a bar has
  the host's beat to arrive: at least 333 ms, at 180 bpm.
- A bar missing when its first step is laid is passed, as a stall passes
  one: the clock doesn't wait for the network. The client counts them
  (`lacked`), and shows the count.
- Each bar goes with where it starts on the host's clock (`sentBars`), and
  the follower lays its first step there. A tempo glide that reaches a
  client after it has laid a few steps on the old tempo so can't leave it
  behind for longer than a bar.
- The Muse hears judgements (`MuseInput.judgements`): those of the notes
  played on the host, then those clients sent (`BarJudgement`), in the
  order they arrived. One for a bar it has already heard is dropped.

### The Muse on both sides

The same form at two levels:

- **Client**: its ear (`ear.ts`) judges its players' bars a beat after
  each ends (`EAR_AFTER`), in the bar's key, and sends the judgements. So
  mashing, too few and too wide stay on the client.
- **Host**: takes one motif of all judgements, its own players' and every
  client's, and names a client's source by its player ("Ada's computer
  keys"). Today it takes the motif with the most notes; how it weighs
  several players is the open A3 on #79.
- **Timing.** A motif heard in bar k plays from bar k + 2 (F7). The host
  hears bar k as it composes bar k + 2, on the last beat of bar k + 1. A
  client judges bar k a beat after it ends, so a judgement has about half a
  bar to arrive.
- **The host checks** what it takes. The transport drops a client's
  judgement that no ear would have made in the bar's key (`admissible`,
  the same gates `judgeBar` applies), one for a bar not yet composed, and
  one that comes after the Muse heard its bar. Each is said in the Muse's
  log, on the host and its clients ("What Ada's computer keys played came
  too late to be heard."), so a player can tell a lost motif from one that
  lost to another.
- **Every source has a player's name** in a session: a client's by its
  player, and the host's own by the name its player gives, or "the host",
  so no client reads the host's keys as its own.
- A client's forget goes to the host, which forgets.

The client shows the host's Muse: its offer and its log.

### Controls

The host conducts: the style, the presets, the key wish, start and stop. A
client's controls rest (a disabled fieldset), and show the host's style.
Whether clients may send wishes that the host weighs is open.

### Time

A client plays on the host's clock:

- **Heard moments.** Both sides read the moment their output is heard
  (`heardNow`, from the output's pairing of its clock with
  `performance.now()`). A client's pings compare those, so a note leaves
  every device's speakers at once, whatever each output's latency.
- **Offset.** Of the latest 16 pings, the one with the shortest round trip
  is trusted (`hostClock`). A ping that came back before it was sent is
  dropped: an output's clock steps as it first pairs.
- **Drift.** The offset played by moves toward the estimate by at most
  0.5 ms a ping, so it never jumps. Pings go every 50 ms until the clock
  is trusted (4 pings), then every 250 ms.
- **Too far.** A host whose best round trip is over 100 ms is dropped: a
  client leaves, saying why.
- **Measured.** Two pages in one headless Chromium, 30 kicks: the client
  sounds a median of 0.1 ms from the host, 0.3 ms at worst
  (`session.e2e.ts`). Now and then one kick is a buffer (10 ms) out, where
  one of two bands in one browser slipped a buffer.
- **MIDI clock.** Every client can derive one from the shared timeline.
  Who masters it when a root node exists is #27's open question.

## Links and protocols

Browsers cannot send UDP, so RTP as such is out of reach from a tab. The
options:

| Link                 | Fits                                                              | Against                                                        |
| -------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| WebSocket            | Simplest; any server; works through every NAT and proxy           | TCP: a lost packet holds up the ones after it; all via server  |
| WebRTC data channels | Peer to peer, so traffic stays on the LAN; unreliable channels    | Needs signalling (a server) to connect; more moving parts      |
| WebRTC media tracks  | RTP under the hood, Opus, jitter buffers: the audio of later      | Audio only                                                     |
| WebTransport (QUIC)  | Datagrams, no head-of-line blocking                               | Client to server only, HTTP/3 and a certificate; no P2P        |
| RTP-MIDI (AppleMIDI) | The standard for MIDI over a network                              | Not in browsers; a root-node concern, for hardware             |
| BroadcastChannel     | Tabs of one browser, no server                                    | One machine only: for tests and demos                          |

- Everything sits behind one `Lobby` (`apps/web/src/session/lobby.ts`): it
  lists the open sessions, opens one under a name or joins one, and gives
  a link, the host's to its clients or a client's to its host, and says
  when the lobby is lost.
- **`broadcastLobby`** reaches the tabs and windows of one browser, with
  no server: what the app uses when no lobby server is given.
- **`websocketLobby`** reaches a lobby server (`apps/lobby`, `pnpm lobby`)
  that finds sessions by name and relays, without reading the session's
  messages. Its own few words (`packages/session/src/lobby.ts`): a name
  is taken or open, a client joined or left, a host is gone. A socket
  that misses a ping for 15 s, or falls 512 KB behind, is closed.
- **Next, WebRTC data channels**, the same lobby signalling: a reliable,
  ordered channel for bars and the track; an unreliable one for pings.
  Traffic stays on the LAN at an event.
- **Audio later, on WebRTC media tracks**: where RTP arrives.
- **The root node** runs the lobby on the LAN, speaks the same protocol
  from Node, and drives hardware directly.

### A local server without HTTPS

It works, with one rule: load the app from `localhost` on every machine.

- A page on `http://` can open a plain `ws://` WebSocket to a server on
  the LAN. A page on `https://`, as on Pages, can't (mixed content), but
  for `ws://localhost`.
- Web MIDI, the service worker and AudioWorklet need a secure context.
  `http://localhost` is one; `http://192.168.1.20:5173` is not, and there
  Web MIDI is missing. So each machine runs the app itself (`pnpm dev` or
  `pnpm preview`) and points it at the lobby's LAN address. Loading the
  app from one machine across the LAN works for the built-in synth only,
  unless Chromium is told to trust that origin
  (`--unsafely-treat-insecure-origin-as-secure`).
- The hosted lobby serves `wss://` with a certificate, and the page on
  Pages reaches it. `apps/lobby/Dockerfile` builds the server for any host
  that runs a container; it serves plain `ws://` on `$PORT`, and the
  host's proxy gives it TLS. Which host runs it is still to be chosen, so
  the app ships with no lobby address of its own: a build names one with
  `VITE_LOBBY_URL`, and a player can type any.

At an event, one laptop runs `pnpm lobby`, which prints the addresses to
give; every player runs the app on their own machine and types that
address as the lobby server.

### Messages

Plain data (`protocol.ts`). A join names the protocol's version, and a host
refuses another version, since a cached app can be older than its host.

- Host to client: `welcome` (the song, if playing, with the bars composed
  and not yet played; the bars ahead; the Muse), `refused`, `start`,
  `track`, `bar`, `forecast` (the bars that changed, `forecastDelta`),
  `muse`, `stop`, `pong`, `closed`.
- Client to host: `join` (version, name), `judged` (bar, judgement),
  `forget`, `ping`, `leave`.

A host drops a client silent for 3 s. A client gives up if no welcome
comes within 2 s.

## Capacity

Measured: a bar as sent is 2.8 KB of JSON on average (3.8 KB at most), the
whole forecast 37 KB, and a bar's change to it about 0.5 KB. A client
pings 4 times a second. At 120 bpm, a bar every 2 s, a client takes about
2 KB/s (16 kbit/s) and sends about 0.2 KB/s; a preset change sends the
whole forecast once.

**The session manager, measured** (`apps/lobby/load.ts`): the server in a
process of its own, sessions of a host and 8 clients each, bars and
changes every 2 s and pings at 4 Hz, 20 s a round, on a 4-core container:

| Clients | Sessions | Bar to client, p50 / p99 / max | Ping, p50 / p99 | Server CPU | Memory |
| ------- | -------- | ------------------------------ | --------------- | ---------- | ------ |
| 100     | 13       | 0.4 / 1.6 / 4.3 ms             | 0.3 / 1.2 ms    | 6 %        | 107 MB |
| 500     | 63       | 0.3 / 1.0 / 4.6 ms             | 0.3 / 2.1 ms    | 12 %       | 118 MB |
| 1,000   | 125      | 0.3 / 1.5 / 12 ms              | 0.4 / 3.5 ms    | 19 %       | 133 MB |
| 2,000   | 250      | 0.4 / 3.2 / 43 ms              | 0.9 / 6.3 ms    | 35 %       | 145 MB |
| 4,000   | 500      | 0.9 / 14 / 75 ms               | 2.4 / 24 ms     | 62 %       | 254 MB |

The server's CPU grows by about 16 % of a core per 1,000 clients, and it
runs on one core. The load came from one process on the same machine,
itself at 66 % by 4,000. So a small instance (1 vCPU, 512 MB) carries
about 3,000 clients with every bar well inside a beat, and bandwidth is
then 6 MB/s (50 Mbit/s): on a small host, the bandwidth allowance is the
bound. Hosting on slower cores will read lower; the load test runs
against any address to measure it there.

Estimated, not yet measured:

- **A host tab**: composing costs the same for any number of clients. With
  a relaying lobby it sends each bar once; what grows with clients is
  answering pings, 4 a second each, microseconds apiece. It must stay well
  inside the transport's slack (a tick every 25 ms, 120 ms ahead), which
  holds past 100 clients. Over WebRTC it sends each bar to each peer, and
  a tab holds tens of peer connections comfortably: about 20 to 30.
- **The music** gives out first. The Muse takes one motif a bar from all
  it hears, so beyond about 8 players playing at once the choice is noise
  until A3 (#79) weighs players. For local jamming, a host and 2 to 16
  clients is the range to design and measure for.

## Tests

- **The engine seam changes nothing solo**: the existing tests and `pnpm
e2e` pass unchanged, and a transport over bars the band composed, given
  back, lays the same steps at the same times (`transport.test.ts`).
- **Host and client agree** (`session.test.ts` in `packages/session`):
  over a simulated link with delay, jitter and loss, a client plays the
  host's notes at the host's moments, passes a lost or late bar and never
  plays one late, and follows a tempo change that reached it late from
  the bar after the next.
- **The clock** (`clock.test.ts`): within 1 ms over held-up pings, follows
  drift at no more than the slew, drops a ping that came back before it
  was sent, and is off by half the difference on a link slower one way:
  the known limit, shown.
- **The app** (`apps/web/src/session/session.test.ts`): a host and a
  client session wired through a lobby in memory, and the BroadcastChannel
  lobby.
- **The lobby server** (`apps/lobby/src/lobby.test.ts`): names, relaying
  each way, leaving and going, refusals, and a socket closed for missing
  pings or falling behind, each shown firing.
- **The WebSocket lobby** (`apps/web/src/session/websocket.test.ts`):
  against the real server, the session's words each way, a lost lobby, a
  refusal that is no loss, and a host and client session joined through
  it.
- **Two pages in step** (`session.e2e.ts`): the kicks each sounds, on the
  clock both pages share, over the tabs and over the server from another
  browser context (a median of 0.1 to 0.2 ms, 0.4 ms at worst); the
  sessions listed; and a client's motif named in the host's Muse.

## Steps

1. The engine seams: a transport over a bar source, the Muse over
   judgements. Built.
2. `packages/session`: messages, the host's bars, the follower, the ear,
   the clock, the forecast's delta, and the simulated-link tests. Built.
3. The BroadcastChannel lobby, host mode in the app (session name, who
   joined, join by name, leave, close), and the two-page e2e. Built.
4. The WebSocket lobby: the server, its load test and its container, and
   the app reaching it. Built; hosting it is the owner's choice of host.
5. WebRTC data channels, the lobby as signalling.
6. The root node speaks the protocol (#20).
7. Audio over WebRTC media tracks.

## Open

- Whether clients send wishes. A client sends the ear's reading, not raw
  notes (a position from review on #89): today a judgement; it would grow
  into the judgement plus the bar's style metrics (density, register,
  velocity, syncopation: the analyzer's stage 7, #3) run on the client,
  which the host weighs per source, where A3's confidence belongs. A
  player's notes stay on their device; raw notes can be added for the Muse
  encoder (#16) if it needs them.
- Whether two clients may join under one name: their judgements then share
  a source, which the log and a weighing per source can't tell apart.
- How the host weighs several players' motifs (A3 on #79).
- Who masters the MIDI clock when a root node exists (#27).
- Per-client expression beyond its own instruments and MIDI (humanising, a
  velocity curve), which would make a client's notes its own.
