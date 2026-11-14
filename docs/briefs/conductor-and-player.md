# Brief: the conductor and the player

The owner, on #531 item 3 (2026-11-12): split Jambot into a host, composer and conductor part that runs in solo or host mode, and a client part that runs always, except in a host-only mode, where Jambot runs a session but can't play in it.
"Investigate if that is a split that would help the architecture or if it is just a headache. The feature itself is of secondary importance, use it as an investigation towards a clean architecture for Jambot."
Jambot is the original implementation: cells split out of it and comes back in a new shape, and there is debt left from that history.

This brief maps `main` @ a84c8e6 plus #531's first commit (8c903c9), read: `apps/web/src/player.svelte.ts` in full, `shadow.ts`, `section-texts.ts`, `session/{host,client,sessions}.svelte.ts`, `packages/session/src/{follow,host,clock}.ts`, and `packages/engine/src/transport.ts`.
Nothing here is built yet.

## The answer in short

The split helps, if it is cut along the line the code already has inside it, and the wire it is cut on is the score (session 2.0), not today's bars.

- **Cut on version 1's messages** (a loopback lobby carrying `bar` and `section`), it is a headache.
  The client would keep everything the cut is meant to remove: the host's written notes and plans, the band's own events in a gap, a second compile of every text, and the clock handshake.
  Solo would get worse: more gaps, and a player's chords lost on the way to the Muse.
- **Cut on the score and the conduct** (`score`, `conduct`), the client side needs nothing of the band's.
  The conductor writes scores and conducts each bar.
  The player lays a score on a clock and sounds it, and hears its own players.
  Solo is a conductor and a player in one page, joined by direct calls, not a socket.
  Host-only is a conductor alone, and a client is a player alone.

## What the code already splits

- **The sounding path is shared.**
  Both ticks end in the same sink: `shadow.tick` or `shadow.follow`, then `#schedule` (`player.svelte.ts` 1624, 1683).
  The ear (`#followHeard`), the metronome, the looper's own rhythm, the timing panel, the pattern, `sounding` and the mix serve both.
- **Shadow is two halves already.**
  `tick` asks for texts from the bars it composed (`#composed`, `#state`, `#tell`): the conductor's work.
  `follow` lays the texts it is given (`#sent`, `given`).
  Both lay cells' events through one `#laid` (`shadow.ts` 390–412).
- **The transport is one function over two sources.**
  `transport` and `follower` are the same `transportOver`, over `bandSource` and `followSource` (`player.svelte.ts` 315, `transport.ts` 1009).
- **Out and in are typed**: `Hosting` and `Following` (`player.svelte.ts` 263–298), and the inbound `follow*` methods (1295–1401).

## What `Player` holds, by side

About 95 members, counted from the code.

- **The conductor's:** the station and radio, nudges, the wish, the learned layer, the tempo nudge, the loop and its menu, the meter asked for, hosting, hearing (the homeostat), the four repositories, the band's carried state, the seed, the forecast's `foreseen`, `lastBar`, and the methods that steer them (`setMeter`, `tuneRadio`, `askSection`, `tapBars`, `nudgeFrom`, `apply`, `restore`, `hosted`, `stop`'s ending, `#decide`, `#learned`).
- **The player's:** the count-in, what was heard, the player's own notes and rhythm, `sounding`, the pattern, the mix, `lacked`, the skew, what was played, the metronome, the output, the ticker, `#laid`, the timing panel, and the methods that sound or hear (`humanNoteOn`/`Off`, `playAlong`, `panicMidi`, `prepare`, `#countIn`, `#tickFollowing`, `#schedule`, `#followHeard`).
- **What crosses** (on the wire today): the style track, the swing and the tempo meter (`track`), the song's start, the forecast and the clock built from it, the Muse's offer, memory and log (`muse`), the players, the ending.
- **What is both, and needs the cut:** `start` and `#begin` (which reset both sides together), `#opening`, `halt`, `#thenClock`, `#finished`, and `#tick`, which composes and sounds in one method.
- **The seam buffers:** `#arrived`, `#arrivedDrums`, `#arrivedBass` and `#arrivedChords` are filled on the sounding side and drained by the conductor's transport (1530–1550), or by a client's ear (1688).

Today the side a member belongs to is decided by guards: `mode === 'client'` returns early from nine of the conductor's methods (`#startFrom`, `setMeter`, `tuneRadio`, `askSection`, `tapBars`, `nudgeFrom`, `apply`, `start`, `restore`), and `#follow` is tested in a dozen more.
After the cut, a guard becomes the absence of a conductor.

## Where solo and a client part today

These are what the cut has to settle, not move.

1. **The player's own notes.**
   In solo and on a host, raw notes go into the transport's Muse (1541–1551): chords, the bass's register read off the keys, hands (#580), the lead's and the harmony's readings.
   A client judges locally and sends judgements, and drum and bass bars (`played`); its chords are dropped (995).
   A solo player put through a client would lose what the Muse reads of them.
2. **Texts.** A host lays its own texts with no hop; a client compiles each again (`playText`), and a bar sent otherwise than foreseen waits for the host's next text and a second compile, so a client has more gaps.
3. **The gap.** A host plays the band's own events where no text states a bar; a client plays the host's written notes again (`playBar` over `SentBar.written`, `follow.ts` 40–46).
4. **The count-in's meter.** A host counts in the meter it opens in (`#opening`); a client counts in bar 0's meter once that has arrived, else 4/4 (`SONG_METER`, 1189).
   At a live start the client's count-in may begin before bar 0 arrives, so it may count 4/4 against a host in 6/8: read in the code, not measured.
5. **The finale.** A client hears `ends` and sets `ending`, but never `lastBar` (only the host's path sets it, 1553), so it has no bar to count down to.
6. **Loops (#648).** A client never has the loop or its menu: the loop arrives applied in the bars, and no message names it.
7. **The clock.** A host rebuilds its clock at each bar it decides (`#thenClock`); a client at each forecast and meter change (1684).
8. **The harmonic history.** A host reads it off the band's carried state; a client folds the bars it was sent (1626 against 1675).

## Debt the cut would remove

- **The client's dependence on the band's bars:** `SentBar.written`, `playBar`, the plan's meter, key and chords read off each bar, and the gap's reasons `no bar` and `joining` (`shadow.ts` 39–48).
  A score states its meter, key and harmony; a conduct carries the seed, the entropy and the offer; and a bar no score states plays silent and is counted (session 2.0).
- **Dead work on a client:** a full `TransportEnv` (repositories, layer, wish) that `followSource` ignores, and `listen` and `bandEnvAt` run each bar on empty input (`transport.ts` 862–873).
- **Things done twice:** the `Song` built three times (1126, 1276, read at 1334), the Muse's fields set in two places (1568 and 1374), the harmonic history computed two ways, `#drumsHeard` and `#bassHeard` copied, and `judgedElsewhere` without the guard its siblings have (1218 against 1224).
- **A name doing two jobs:** `told` is the text a shadow sends (`shadow.told`) and the `Following` a follow holds (`Follow.told`), against the law of true names.
- **`hud` as an input:** the UI's derived state is read by the conductor (`home`, `#stepKey`).

## The shape

- **`Conductor`**: the band's carried state, the transport over `bandSource`, the repositories and the layer, the Muse and the homeostat, the radio, the loop and the nudges, and shadow's asking half.
  It emits what session 2.0 sends: a `score` a section, a `conduct` a bar, the `track`, the `forecast`, the Muse, the finale.
  `Hosting` becomes a fan-out of the same emissions to the lobby.
- **`Player`**: a clock, the transport over the scores and conducts it is given, shadow's laying half, the performer's feel, the outputs, the mix, the metronome, the ear and the player's own instruments.
  It sends what a client sends: judgements, and `played` bars.
- **In one page** the conductor calls the player directly, as a lobby would deliver, with the skew 0, which `skewOf` gives exactly when both read one output.
  It hands over what it compiled (`SectionStated`) beside the score, so nothing compiles twice.
  None of `ClientSession`'s pings, waits or outages applies in one page.
- **The Muse hears every player alike**: a player sends the notes it heard (`played`), every part, not only the drums and the bass, and the conductor's Muse reads them, its own page's player and a client's.
  That gives a client's chords and hands to the Muse too, which they don't reach today, and it is a minor of the session contract.
- **Modes become what is present**: solo is a conductor and a player, a host is both plus the lobby, a client is a player, and host-only is a conductor with no output.
  Host-only needs a clock that isn't an output's: the page's, published as heard at offset 0, so `skewOf` admits its clients.

## The order

1. **The wire first: session 2.0 (#553, yggi/music-commons#43).**
   The client plays from the score and the conduct, and the band's bars and the gap's fallback go.
   This is the debt's largest part, and it doesn't need the cut.
2. **The cut: `Conductor` out of `Player`**, behind the emissions above, with solo on direct calls.
   `player.svelte.ts` (1,769 lines) parts into about 750 and 700, and shadow's halves move with it.
3. **One ear for every player**: `played` for every part, and the Muse reading clients as she reads her own page's player.
4. **Host-only**, last: a conductor with the page's clock.

Rough size: 10 to 15 files and 3,000 to 5,000 lines touched, and `pnpm e2e`, since what plays and when moves.
`player.test.ts` (2,123 lines), `session.test.ts` (1,223) and `shadow.test.ts` (946) carry most of it.

## Risks

- **What the Muse reads of the page's own player.**
  Through a client's channel it would lose the chords, the hands and the bass's register until step 3 widens `played`.
  So step 2 keeps a direct channel for the page's player, and step 3 makes it the general one.
- **Composing and laying in one tick.**
  The conductor composes a beat ahead inside the loop that lays steps (`composeAhead`, `transport.ts` 938).
  Cut, the conductor's transport runs only to compose, its events unplayed, and composing stays tied to its head.
- **Timing.** Solo moves onto the client's path: the count-in's meter, the finale's countdown and the loop menu (items 4 to 6 above) must be settled first, or solo regresses where clients already differ.
