- A bar's meter travels in its plan (`Plan.meter`, #261), so `WrittenBar` leaves `BarEnv.meter` out and the client gives it back from the plan (`follow.ts`); that shape bumped the protocol to 8.
  A host sends each bar with where it starts from the clock of the bars it composed (`sentBars`, `clockOfTransport`), and a client's ear judges by the same clock (`earListen`).
  A client's clock is its own transport's, built from the bars it was sent (`followSource.meterOf` gives a bar's meter before it plays).

# Host and client mode

Facts about `packages/session` and the app's sessions: clocks, the fault kit and the timing panel.

- Host and client mode ([brief](../briefs/host-mode.md)): the pure parts are in `packages/session`, the app's in `apps/web/src/session/` (a `Lobby`, `HostSession`, `ClientSession`) and the player's `mode`.
  A client runs `transportOver(followSource)` in the host's time and plays each event `skew` earlier on its own clock; the skew is the host's heard moment less its own, so output latency needs no term of its own.
  It is three pairs of clocks composed (`skewOf`): pings are stamped with the page clocks, which never jump, and each side adds its output's offset from its page clock, which follows a dropped buffer within three ticks.
  The player reads the skew every tick while following.
  In a session a note's source is a player's id and the instrument (`playerSource`), never a name; screens read it by name through `sourceName` and the players' names the host sends with the Muse.
  An output's clock pairing steps while it starts, so `clockOffset` reads no pairing for its first 0.2 s (`PAIRED_AFTER`).
  To try it, open the app in two windows of one browser, host in one and join in the other; `session.e2e.ts` measures the two.
  It holds one page's audio (`holdAudio`, a `suspend` and `resume`): 40 ms is a jump of some 30 ms, 80 of some 70; holds of 20 ms or less jump the pairing anywhere from −10 to +11 ms, as the output settles again.
  It stalls a page's main thread with a busy loop.
  `heard` reads when a note sounded through the pairing sampled as it sounded (a median of five, as a single reading can blip); `clockJumps` finds each jump of a page's clock, and `stalls` each stall of its main thread, from its 5 ms sampler coming late.
  So a check bounds every note by the jumps settling as it sounds and excuses exactly the notes a host's stall dropped, on any machine, rather than count notes out.
  A clock's discontinuity is a jump, so a step stays the grid's.
  Across machines, run `pnpm lobby` on one and give its `ws://` address as the lobby server on each; every machine loads the app from its own `localhost`, where Web MIDI works without HTTPS.
- A host tells its clients the song as its count-in begins, a bar before the song's first step (`start`'s `Song.start` is in that bar's future), so a client has that bar to pair its clocks and to receive bar 0, which the host has composed already; a client clicks the rest of the count-in and plays the song from the host's start.
  A host that is asked to stop plays through a last bar that closes on a cadence and tells its clients which bar it is (`finale`); a client plays through it too and halts when its ring has run out, as the host does, so nobody lacks a bar past the end, and the host's `stop` follows when it halts.
  A second stop, or any stop that isn't a person's (leaving a session, following a host), halts at once (`Player.halt`).
- `Sessions` (`apps/web/src/session/sessions.svelte.ts`) is the page's one place for opening, joining, ending and restoring: a session is `local` (the tabs lobby) or `global` (the lobby server at `address`, kept for next time, empty for none), and a page is in one at a time.
  It lists both lobbies with each session's players (`list`), and a lobby it can't reach is a `problem` beside the ones it could.
  The lobby server counts the host and every client socket it holds; a client whose link dropped is not counted while away, and present and away are not told apart.
  The tabs lobby counts who said they joined and left, so a tab closed without leaving is counted until the session closes.
  Tested against `memoryLobby` (`session/fixtures.ts`), without a component.
- A test of anything that reads a clock runs it on `simulatedDevice` (`packages/session/src/faults.ts`, #27): real time is the test's, and each fault is named, else off: drift, dropped buffers (the output's clock stands still for the buffer), the render quantum, latency, the pairing's jitter and blips, page stalls, and a link's legs, holds and loss.
  `device.view(() => t)` gives the `clock` and `now` the app reads, and `{ paired: false }` a platform with no pairing.
  The quantum reaches only `currentTime`, so a reader of the pairing meets it only on its fallback.
  A claim is a bound the component promises, and a test shows its checker firing.
  Measured here in headless Chromium, the pairing is within about 0.4 ms but a busy machine blips a reading by up to 4 ms, which the next takes back; a dropped buffer jumps it for good.
  Where a component doesn't keep its promise, the scene is kept as a known break, a test that finds it, until it does.
- The web tests resolve `ws` to its Node build (`apps/web/vitest.config.ts`): resolved for the browser it is a stub, and `websocket.test.ts` runs the real lobby server, in Node's environment.
  Its devices' clocks are the test's and stand still, so a ping comes back at once and the skew is exact on any machine; the clocks under delay are the pure tests'.
- `jam` (`packages/session/src/session.test.ts`) runs a host and a client over a link that drops bars, or, given a `recovery`, keeps order as TCP does (`orderedArrival` in the fault kit): a lost message is sent again after the recovery and holds up everything behind it, and the pings' answers, the bars ahead and the Muse share the stream.
  A bar is lacked exactly where the stream held it past a beat (T13).
- `?timing` in the address shows the timing panel (`TimingPanel.svelte`, #27): the transport's tick intervals on the page clock, how far ahead of the clock each event was scheduled, the steps laid and missed, the output pair's jumps (its dropped buffers), a client's round trips and skew, bars too late and judgements dropped.
  Export saves them as `jambot-timing-….json` (`timingReport`), the file to attach to a timing issue.
  They count from the song's start, and a client's clock from its join, and are kept after a stop until the next start.
  A spread keeps whole-millisecond bins up to a second, so a quantile is good to half a millisecond at any length of run.
  `timing.e2e.ts` holds the export to what the harness measures of the same page.
- The radio (#313) is the session's, not the band card's (the owner): the player's `station` (`packages/session/src/station.ts`, a seed and the sections walked) is on the air from `tuneRadio`, which the Session card's "Leave the band on the radio" switches, for a host or a band alone.
  At the first bar of each section after the song's first the player walks the style (`#walkRadio`): `walkRadio` from where the track is going, the players' tempo nudge taken out (`radioStyle`), and the track glides there over one section from the later of the bar's start and the head (`conductRadio`, `RADIO_GLIDE`), so what is scheduled stays as it is; the nudge is held within the new style's licence.
  The walk's state is the style track's targets, with no second copy, so a slider moved is the walk moved; energy and entropy are its dials, and the tempo, key and swing nudges leave it on, while a preset or an axis it walks (`takesFromRadio`) takes the track back and takes it off the air.
  The station survives a stop and a reload (`HostSnapshot.station`, absent when off), and a client has none: the glides travel in the `track` message as the host's player made them, exact doubles through JSON, so a client follows the walk to the last bit, and one that joins mid-walk gets the track in its welcome (`session.test.ts`); the protocol is unchanged.
  The card names where the band is and where it heads, as the nearest presets (`nearestPreset`, `stationLine`), from the track alone, so a client reads it as the host does: "Techno, drifting toward Ambient".
- A timing claim is tested by the work it bounds, never by the wall clock: an advance of the transport passes at most `CATCH_UP` bars (a day's stall is some 30,000), and the ticks after carry on, so no advance outlasts its lookahead on a slow machine (T1).
- A link that drops is no leaving (`docs/briefs/host-mode.md`, "When a link drops"): the roster (`roster.ts`) seats a player by the token its welcome gave, the lobby holds a session for its host's secret (`LOBBY.hostGrace`), and the host's snapshot (`snapshot.ts`, `session/storage.ts`) is what a reload needs.
  `lost`, `away` and `back` are said by a lobby adapter, never read off the wire (`readClientMessage` and `readHostMessage` refuse them).
  A client's ids are the lobby's per socket (`c0`, `c1`, …), and restart from `c0` with the lobby, so the roster never gives a new player an id an away one holds.
  The web tests' `memoryLobby` has `cut()` to drop every client's link and `refusing` to refuse joins; the real-socket ones wrap `WebSocket` to close one as a phone's system would, without a word.
  `memoryLobby` answers at once, but a client's `join` returns as soon as the join is sent, before the host's welcome: a test of what shows in between holds the host's answers (`held`, `sessions.test.ts`, #202).
  The host's kept snapshot and the client's resume have versions of their own (`snapshot.ts`): a change to a shape inside one, such as `KeyWish` in the host's, bumps that one's version alone, so a client can still rejoin across a deploy (#226).
  A field added that an older record can lack, such as the host's `meter`, keeps the version: reading takes its absence as the default.
  Explicit close sends `end` to the lobby: without it the name would be held for the grace.
- A browser holds an audio context suspended until a click, and on a reloaded page `resume` stays pending for good, so a restore must not wait for it: opening and joining ask for the output in the click's turn but wait `OUTPUT_WAIT` at most (`Player.prepareWithin`), and a song's start waits for it by itself.
  A restore that gets no answer is given up after `RESTORE_WAIT`, forgotten, with its reason in `ended`; `Sessions.drop` (the restoring screen's "Drop session") lets a person do the same at once, and a restore or join that was dropped meanwhile closes or ends itself when it arrives.
