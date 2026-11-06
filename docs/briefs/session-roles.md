# Session roles: the host sets, everyone else asks

The owner's brief, its reading against the session as it stands, and the groundwork it needs.
The mockups are at <https://claude.ai/artifact/AgJMt8AmXcuHouFcMqBoCs>.

## The brief

Make a clear distinction of who can do what.
The host is omnipotent: it sets everything, which glides there while the band plays and selects it at once while it is stopped.
Clients can only nudge.

- A client sees no button or slider it cannot operate: one that rests looks broken.
- A nudge gives clear feedback that it was made ("Ada wants a slower tempo") and, later, whether it had an effect ("Break: tempo slows down from 120 to 115").
- An events view could show nudges, the Muse's inspirations, joins and leaves, per client.
- No text chat, but emoji reactions: star, heart, +1 and the like.
- Perhaps a music chat later, where fragments are posted.
- The host can make text announcements.
- Capabilities could be granted per join code:
  - co-host: like the host, and takes the session over when the host leaves;
  - player: the current model, nudges but doesn't set;
  - listener: no nudges, no Muse.

## The reading

Four roles, each a subset of the one above: host, co-host, player, listener.
A control a role cannot use is not drawn; each card keeps the controls of its role and nothing else.
The `Nudge` pill already stands on every style axis, the key and the tempo: for a host it steps the value, for a player it asks.
A player's card is the host's with the setting controls (presets, drags, key dots, the meter grid, start and stop) gone; a listener's is a readout.

A nudge is a cue, then an event: one shape in two tenses.
Made, it is a pending cue on the nudger's device and a line in everyone's log ("Ada wants a slower tempo"); when the band moves, the move is an event in the log ("after the break: the tempo dropped to 95 bpm").
**A nudge is a bias, not a request** (the owner, 2026-11-05): the host neither takes nor declines one. Every active nudge leans the style vector, the tonic, the tempo, the meter and the rest, as an extension of the radio's walk: a bias on the associations the composer searches and uses.
- The effective nudge on a parameter is the sum of all active nudges, weighted by the players in the session: one nudge among few players moves it far, one among many moves it little, and many in the same direction move it far. (The reading here: each nudge weighs 1/N of the N players.)
- A nudge fades.
- With no nudges, the band walks by itself, as the radio does now.

This replaces #217's median (C10) as the way nudges combine.

The Session card becomes the Room: who is in it with their role, the log under them, filtered by a tap on a person, the reactions, and the host's line to announce on.
The log takes in the Muse's log, joins and leaves, asks and answers, reactions, announcements and the cues that have passed.

## The session as it stands

- A client is host or client (`mode`); a seat is a player or a listener (`role`, `packages/session/src/roster.ts`), a client admitted without a code a listener (#461), and the host drops a listener's `judged`, `played` and `forget`.
- A client sends the host its ear's motif judgement, its drums and bass, and Forget; there is no nudge message, and `Player.apply` drops every client intent.
- The session has one log (step 3, below), which says joins and leaves; the Muse's own log beside it keeps its last five lines.
- There is no handover: a host away for the lobby's 30 s grace ends the session; a reloaded host restores from its own `HostSnapshot`.
- The lobby server relays session messages unread, so a new kind needs no lobby deploy, and an older client drops a kind it doesn't know.
- Protocol 17 is the hub's session contract at minor 4 (`docs/memory/session.md`).

## The groundwork

Each step is one protocol minor and one pull request; the hub's session contract (yggi/music-commons) takes a vector for each new kind first.

1. **Roles.** A member's `role` in place of `listens`; a code per role, joining without one a listener or turned away; a host's `role` message to change one. The app reads one `can` per device in place of the `following` flag, and draws only what it allows.
   It is built, but for a code per role, which waits for a second role to admit by (step 5): a seat's `role` (player or listener; co-host comes with step 5, when it has something of its own to do), kept in the host's snapshot, and `Can` (`canOf`, `apps/web/src/sessionState.ts`), by which the Style, Key and Metrum cards and the transport draw no control a client can't use.
   And, at protocol 17 (#567), the host's `role` message and its control on the Session card, "Let play" and "Make listen" by each player (`HostSession.cast`, `recast` in `roster.ts`): the hub's session contract at minor 4 (yggi/music-commons#48); a welcome carries no `role`, since its `listening` already says it.
2. **Nudges** (#217 step 3). A client's `wish`: a parameter and a direction, dropped from a listener; the host sums the active ones weighted by the players present, lets each fade, and `Player.apply` folds the bias into the radio's walk at the section line.
   Built for the four axes the radio walks and the tempo, at protocol 18, version 1's minor 5 (yggi/music-commons#52), as `nudge` rather than `wish`, since it is a bias and not a request:
   - a player's Style card has a nudge on syncopation, harmony, articulation and energy, and its Metrum one on the tempo, each sending `nudge` (`ClientSession.nudge`) and saying under it what was nudged; entropy stays the host's;
   - the host weighs each nudge a step over the players present, itself among them, and drops a listener's (`HostSession`, `nudged` in `packages/session/src/nudges.ts`);
   - each section line releases half of what is pending, and the rest whole once it is under a hundredth of a step, so a lone player's nudge moves its axis one step in all, half at the next section, and is gone after 7 (`releaseNudges`, `NUDGE_FADE`, `NUDGE_LEAST`);
   - the style leans by it on top of the radio's walk, or alone off the air, by whole steps (a tenth of an axis, the Metrum's step of the tempo), clamped at the axis's ends (`leaned` in `packages/engine/src/lean.ts`, `Player`'s section line).

   - the key and the meter, at protocol 19, minor 6 (yggi/music-commons#57: version 1 grows on, and version 2 starts at 30): a player's Key card nudges a fifth, and its Metrum a beat a bar; both move only by whole steps, one at a section line where the players' nudges come to half a step or more (`releaseNudges`), the key's as the wish's tonic a fifth from where the band is heading, within the style's reach, and the meter's as the meter asked for a pulse more or fewer, only where that is a meter the band offers (`meterNudged`).

   Each nudge is a line of the session's log (step 3) for everyone.
3. **The log.** A host's `event`: the bar, who, the kind (joined, left, nudged, moved, Muse, reacted, announced) and a short text; the host keeps the last 200 and the welcome carries the tail. `cuesOf` grows an asked kind, and a cue whose moment passes becomes an event.
   Built at protocol 20, minor 7 (yggi/music-commons#57), human-readable and like a chat, as the owner asked (2026-11-06):
   - the players' lines (`HostSession`): joined, to play or to listen, back, left, lost the link, let in or made to listen, nudged what;
   - the band's voices (`apps/web/src/session/log-lines.ts`): the conductor says what each section line moved, the style's axes, the tempo, a key step and a meter asked for (`Player`'s section line, `movedLine`); the composer each section as it comes next, its type, key and meter (`composedLine`); the Muse the motif she takes up, a player she hears play one again, and what she forgets (`museLines`);
   - the host keeps the last 200 (`LOG_KEPT`), says each line to every client, and a welcome carries the last 50 (`LOG_TAIL`, `packages/session/src/log.ts`); the Session card shows the log under the players, newest at the bottom, the speaker's name beside a line that doesn't name them (`speakerOf`).

   Not yet: a filter by a tap on a person, the host's own sets (a preset, a slider) as lines, and the cues that pass as lines.
4. **Reactions and announcements.** `react` from anyone (an emoji of a fixed set, the bar, the fragment playing it answers) and `announce` from a host or co-host, relayed as events. A reaction leans too: it is associated with the fragment it answers (a drum pattern, a melody, a bass line), and changes the chance of that fragment playing again.
5. **Co-host.** A co-host's set as an `intent` the host applies outright; the host shares its reclaim secret and a periodic `HostSnapshot` with co-hosts, so one can reclaim the session within the lobby's grace and restore the song by today's path.
6. **Music chat**, later: a `post` carrying a cells fragment, as the section texts (#446) carry theirs.

Steps 1 and 2 are the core; the rest follow in any order.

## The owner's answers (2026-11-05, on #566)

- **A wish fades** (#217's question).
- **The host takes and rejects nothing:** a nudge biases the style, the tonic, the tempo and the meter, summed and weighted by the players present (above), so there is no "take it now".
- **The reactions:** start with a set of smilies.
  - Positive: 🥰 🤩 🥳.
  - Strange: 🫪 👾 🤖.
  - Negative, read as "clashes with the style" and "should stop": 🫩 boring, 🫨 dissonant, 😵‍💫 confusing.

  A reaction goes to the fragment playing (a drum pattern, a melody, a bass line): a positive one raises its chance of appearing, a negative one lowers it.
- **A co-host's snapshot:** "we have to see; in any case, it will be better to pick up a session somehow than to just drop it." So a takeover is tried with the latest snapshot, however old, and its bound is measured in step 5.

## Open

- Whether a listener's reactions count with the players'.
- What a strange reaction does to a fragment's chance, beside the positive and the negative.
