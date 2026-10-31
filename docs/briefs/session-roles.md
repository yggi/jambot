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

An ask is a cue, then an event: one shape in two tenses.
Asked, it is a pending cue on the asker's device and a line in everyone's log; planned, it is the cue of the section that takes it; done or declined, it is an event in the log, with the reason where it had no effect.
How asks combine is #217's (C10): whole steps, sent as each player's running total, the band settling on the median within the licence, only syncopation, harmony, articulation and energy taking wishes; the host's set is not in the median.
Whether a wish fades or holds is open on #217, to be decided by ear.

The Session card becomes the Room: who is in it with their role, the log under them, filtered by a tap on a person, the reactions, and the host's line to announce on.
The log takes in the Muse's log, joins and leaves, asks and answers, reactions, announcements and the cues that have passed.

## The session as it stands

- A client is host or client (`mode`); a client admitted without a code listens (`listens`, `packages/session/src/roster.ts`, #461), and the host drops a listener's `judged`, `played` and `forget`.
- A client sends the host its ear's motif judgement, its drums and bass, and Forget; there is no nudge message, and `Player.apply` drops every client intent.
- Joins and leaves are not logged; the Muse's log keeps its last five lines.
- There is no handover: a host away for the lobby's 30 s grace ends the session; a reloaded host restores from its own `HostSnapshot`.
- The lobby server relays session messages unread, so a new kind needs no lobby deploy, and an older client drops a kind it doesn't know.
- Protocol 16 is the hub's session contract at minor 3 (`docs/memory/session.md`).

## The groundwork

Each step is one protocol minor and one pull request; the hub's session contract (yggi/music-commons) takes a vector for each new kind first.

1. **Roles.** A member's `role` (co-host, player, listener) in place of `listens`, in the roster and the welcome; a code per role, joining without one a listener or turned away; a host's `role` message to change one. The app reads one `can` per device in place of the `following` flag, and draws only what it allows.
2. **Asks** (#217 step 3). A client's `wish`: the target and its running total in steps, clamped by the host and dropped from a listener; `Player.apply` folds the median in at the section line, as the radio's walk is folded.
3. **The log.** A host's `event`: the bar, who, the kind (joined, left, asked, answered, declined, Muse, reacted, announced) and a short text; the host keeps the last 200 and the welcome carries the tail. `cuesOf` grows an asked kind, and a cue whose moment passes becomes an event.
4. **Reactions and announcements.** `react` from anyone (an emoji of a fixed set, the bar, the event it answers if any) and `announce` from a host or co-host, relayed as events.
5. **Co-host.** A co-host's set as an `intent` the host applies outright; the host shares its reclaim secret and a periodic `HostSnapshot` with co-hosts, so one can reclaim the session within the lobby's grace and restore the song by today's path.
6. **Music chat**, later: a `post` carrying a cells fragment, as the section texts (#446) carry theirs.

Steps 1 and 2 are the core; the rest follow in any order.

## Open

- Whether a wish fades or holds (#217).
- Whether a host's "take it now" on an ask sets the median at once or the asker's wish alone.
- The emoji set, and whether a listener's reactions are counted with the players'.
- How long a co-host's snapshot may be old before a takeover is refused.
