# Index

Every doc and code area, as a tree. Add a line when you add one.

- [`README.md`](../README.md): what Jambot is and how to run it
- [`AGENTS.md`](../AGENTS.md): house rules and core structure (`CLAUDE.md`
  imports it)
- [`LICENSE`](../LICENSE): MIT
- `docs/`
  - [`MEMORY.md`](MEMORY.md): persistent facts and the cheatsheet, the entry
    point
  - [`INDEX.md`](INDEX.md): this tree
  - [`ROADMAP.md`](ROADMAP.md): where the project is heading
  - [`architecture.md`](architecture.md): the workspace, the theory, layers
    (engine and its rates, transport, renderers, UI), delivery, languages, nodes
    (web clients, root node, rendering nodes), related projects, timing, and
    what has settled and what is open
  - [`development.md`](development.md): setup, toolchain and why it was chosen
  - [`prototype.md`](prototype.md): what the port keeps and changes, and how the
    port is checked
  - [`language.md`](language.md): the language design (#7) as a negative shape:
    the catalogue of constraints on Jambot's internal musical expression, each a
    claim with a witness, a counterexample and a test; tensions, candidates,
    experiments, and the names functional programming and category theory give
    its shapes
  - [`quinetic.md`](quinetic.md): #39's catalogue of quinetic properties (round
    trips, machine laws, convergence), each a claim with a test, or an alias of
    the `language.md` entry that already holds it
  - [`ratchet.md`](ratchet.md): how a working track and a negative track drive
    each other, with tests as the pawl (#37 and #7)
  - [`theory.md`](theory.md): the mathematics under `packages/theory` (circle,
    helix, generator, modes, composition, meter), each relation with the test
    that holds it
  - `briefs/`: task briefs, kept verbatim
    - [`analyzer.md`](briefs/analyzer.md): the MIDI → score analyzer (#3)
    - [`host-mode.md`](briefs/host-mode.md): a plan sketch for host and client
      mode: the seams, the Muse on both sides, time, links
- `prototype/`: the baseline the port is oriented by
  - [`README.md`](../prototype/README.md): concept, spirit, prototype
    architecture, the score language, the plan for learned models, open threads
  - [`jambot-prototype.html`](../prototype/jambot-prototype.html): the playable
    single-file prototype
  - `experiments/`: measurements on the prototype for the language design
    - [`cold-warm.mjs`](../prototype/experiments/cold-warm.mjs): E1, whether a
      bar's text is self-contained
    - [`census.mjs`](../prototype/experiments/census.mjs): E8, the numerals and
      pitch tokens the composer writes
- `packages/`
  - `theory/`: music theory on one primitive, pure TypeScript (#28)
    - `src/helix.ts`: the `Helix`, its two views (`positions`, `heightOf`,
      `wrap`, `lift`), the adjoints and `snap`, and `shift`, `gaps`, `compose`,
      `mirror` and `complement`
    - `src/even.ts`: `even(k, n, shift)`, the maximally even set, `isEven` and
      `generator`
    - `src/circle.ts`: `fifthsIndex`, a pitch class's place on the circle of
      fifths, built on `generator(7, 12)`
    - `src/modes.ts`: `mode`, `modes`, `brightness`, and the diatonic modes by
      name
    - `src/notes.ts`, `src/intervals.ts`: note names (spelling, octaves),
      intervals, generic and specific, `sizes`, degree names and partials
    - `src/chords.ts`: the named chord qualities, each a stack above the root,
      and the `Chord` type, a helix plus tensions (`splitChord`, `joinChord`)
    - `src/scales.ts`, `src/rhythms.ts`: named scales and rhythms
    - `src/words.ts`: how names in words compare (case, ordinals, accidentals,
      abbreviations)
    - `src/spelling.ts`: `spell` and `genericsOf`, the letter and accidental of
      each note from a spelled tonic
    - `src/keys.ts`: `relative` and `parallel` keys, and `chordScale`, the scale
      a chord implies in a key (#10), its tensions setting their own degrees
      (#38)
    - `src/numerals.ts`: Roman numerals, a chord as a degree of its key, read
      and written (U1), in a key of any cycle (P5); `alteredDegree`, how a note
      off the key is written, for a numeral's root and a motif's note
    - `src/motifs.ts`: motifs, a rhythm and a contour with rests and altered
      degrees, and the operators on them: `strans`, `mirror`, `late` and `rev`
      as a group, `head` as a monoid, each result's canonical operator (Q5c, U4,
      U5), and `joinBars` and `splitBars`, a phrase across bars as one motif
      (T15)
    - `src/meter.ts`: meter, a helix of pulses over the bar's eighths, most of
      them `even(pulses, eighths)`: one formula for a simple, compound or
      additive bar (3/4, 6/8, 5/8 as 3+2), 10/8's 3+3+2+2 by its heights,
      `meterWeights` (downbeat, another pulse, or between them) and
      `meterOnSteps`, a meter on a bar's steps
    - `src/read.ts`: `read`, `readings` and `nameOf`, across all of these
    - `src/sister-names.test.ts`: every theory name play-aeiou, lib-aeiou and
      quintenzirkel use, checked to mean the same here
    - `src/second-opinion.test.ts`: the primitive, the names and the spelling
      checked against tonal
    - `src/index.ts`: the package's barrel, everything above re-exported
    - `experiments/`: measurements on the theory for the language design,
      outside the pure `src/`
      - [`cycles.ts`](../packages/theory/experiments/cycles.ts): E12, the
        numerals read over tunings of 12 to 53 notes, against the line of fifths
  - `engine/`: the musical engine, pure TypeScript
    - `src/machine.ts`: the contract every level keeps,
      `advance(env, carried, input)`, and `lawBreaks`, which checks it
    - `src/muse.ts`: the Muse (#79): each source's notes in a bar, heard at
      exact positions, judged as mashing, too few, too wide or a motif;
      `admissible`, the same gates checked of a judgement made elsewhere; and
      `muse`, the machine at bar rate over a bar's judgements, which offers the
      motif it took until another is taken, it is asked to forget, or 16 bars
      pass with nobody playing
    - `src/events.ts`: written notes (`WrittenNote`, the drum roles,
      `writtenProblems`) and the note events they play as (`eventProblems`), and
      the song's clock: its meter on the steps (`SONG_METER`, `BEATS`) and the
      readings of bar and beat every reader calls (`barAt`, `stepInBar`,
      `beatAt`, …; T10), and `clockOf`, the clock of a song whose meter changes
      (T14)
    - `src/perform.ts`: the performance, how a written note is played: its
      velocity and the length it sounds, read from the bar (T4)
    - `src/random.ts`: keyed deterministic randomness, and quantised `chance`
      and `pick`
    - `src/style.ts`: the style axes, their ranges and glide spaces, the
      presets, glides (`glideTo`, `styleAt`), and the style as the score writes
      it and the band reads it (`writtenStyle`, C7)
    - `src/swing.ts`: time maps, and swing as one (`swingMap`, and `swingOf` a
      style track, per beat)
    - `src/tempo.ts`: tempo as a time map from positions to seconds
    - `src/form.ts`: the section chain as a machine, and `barEnergy`
    - `src/key.ts`: the four modes the composer knows, and `nextKey`, which
      moves a key toward the players' wish
    - `src/themes.ts`: themes, a section's harmony as degree slots
    - `src/plan.ts`: the section plan (form, key and theme), the machine at
      section rate
    - `src/chords.ts`: the chords of a bar, from its theme's slots, the key and
      the harmony, their lead-sheet names and their Roman numerals
    - `src/bar.ts`: `BarEnv`, what every part reads for a bar
    - `src/drums.ts`: the drums, a function of the bar
    - `src/bass.ts`: the bass, a machine that carries its last note
    - `src/comp.ts`: the comp, the pad and the stab parts, a machine that
      carries its last voicing
    - `src/lead.ts`: the lead, a machine that carries its last note, its phrase
      and its themes' melodies, each a motif of one bar (U4); `leadRests` says
      where it rests; `realize` plays a motif, its own fitted to the chords, and
      one the Muse offers whole
    - `src/sound.ts`: how the style colours the synth's voices (`soundOf`)
    - `src/band.ts`: the band, the machine at bar rate: it plays a bar and
      decides the next (`passBar` for a bar it doesn't play), and `lookAhead`
      decides the bars ahead without playing them; `playBar` plays a bar's
      written notes, where writing ends and playing starts
    - `src/transport.ts`: the transport, the machine at tick rate, over a source
      of bars (`transportOver`, `BarSource`): the band's (`bandSource`) composes
      a beat before each bar; it schedules on a clock, and `bandEnvAt` is what
      the band reads for a bar; `forecast` gives the bars ahead, composed or
      not; `writtenAt` reads a moment on the clock back through the steps as
      laid; the notes played, and bars judged elsewhere, arrive as its input,
      and it runs the Muse two bars behind the band
    - `src/metronome.ts`: the metronome, an independent click track at tick rate
      on its own meter (`@jambot/theory`'s `meterWeights`), since the
      transport's own bar is always 16 steps in 4/4; reads its tempo live
    - `experiments/`: measurements on the port for the language design, outside
      the pure `src/`
      - [`performance.ts`](../packages/engine/experiments/performance.ts): E9,
        what the port writes and what it plays (lengths, velocities, the
        header's precision, the pad's and the stab's overlaps)
      - [`header.ts`](../packages/engine/experiments/header.ts): E10, how a
        bar's header states its style, over the app's own glides
      - [`pad-stab.ts`](../packages/engine/experiments/pad-stab.ts): E11, what
        pad and stab lose on one channel, in a join, or on two
      - [`motifs.ts`](../packages/engine/experiments/motifs.ts): E13, how far
        the lead's variations are the motif operators
      - [`onsets.ts`](../packages/engine/experiments/onsets.ts): E15, how many
        of the band's onsets and lines the meter writes, and how many need the
        step grid (#123)
    - `src/index.ts`: the package's barrel, everything above re-exported
  - `session/`: host and client mode, pure TypeScript
    ([brief](briefs/host-mode.md))
    - `src/lobby.ts`: what an app and a lobby server say (`ToLobby`,
      `FromLobby`), and how a session's name is compared
    - `src/protocol.ts`: what a host and its clients say (`HostMessage`,
      `ClientMessage`), a bar as written and sent, and the version a join names
    - `src/host.ts`: the bars a host sends, each with where it starts
    - `src/follow.ts`: `followSource`, a client's band: it plays the bars a host
      sent, and passes one that is late
    - `src/ear.ts`: a client's ear, which judges its players' bars a beat after
      they end, for the host's Muse
    - `src/clock.ts`: `clockPair`, one estimator for every pair of clocks (least
      bound, drift slewed, a confirmed jump followed); `outputClock`, a device's
      output against its page clock; `hostClock`, the host's page clock as a
      client reads it from pings; `skewOf`, the three composed
    - `src/faults.ts`: the fault kit (#27): simulated devices and links with
      each clock fault explicit, for tests of whatever reads a clock;
      `faults.test.ts` runs every fault against a client's clock and the
      transport, each claim a bound
    - `src/forecast.ts`: the bars ahead, sent as what changed
    - `src/session.test.ts`: a host and a client over a link with delay, jitter
      and loss, playing the same notes at the same moments
    - `src/index.ts`: the package's barrel, everything above re-exported
- `tooling/`: tests for the repository's own gates
  - `lint.test.ts`: each rule that keeps the pure packages pure, shown firing
  - `docs-wrap.test.ts`: docs wrap at 80 columns (#45), `.prettierrc.json`'s
    `proseWrap` for `*.md`, shown firing on prose and leaving a table and a code
    fence at their own width
  - `hooks.test.ts`: the pre-push hook, blocking and letting through
  - `quantized-math.ts`: the audit of every `Math.pow`, `Math.sin` and similar
    call in the pure packages' own sources, outside tests, with why its result
    is safe from a last-bit difference on another engine (#45);
    `quantized-math.test.ts` shows an unaudited one firing and runs it over the
    repository
  - `review-pr.test.ts`: the review skill's `prepare.sh`, against a throwaway
    origin
  - `pawl.ts`: the ratchet's pawl check, which holds the catalogues' statuses,
    rules, tests, aliases and citations together (#42); `pawl.test.ts` shows
    each rule firing and runs it over the repository
  - `history.ts`: the catalogues read at any version, the gate that evidence
    only rises and rules go only with a reason, and the report behind
    `pnpm ratchet` (#43)
  - `index-coverage.ts`: the check that every source file under a package's, the
    app's, `tooling/`'s or `.claude/`'s own tree has a line in this index (#45);
    `index-coverage.test.ts` shows it firing and runs it over the repository
  - `licenses.ts`: the license gate over what the web app ships, and the
    `licenses.txt` it writes; `licenses.test.ts` shows it refusing copyleft and
    unknown licenses
  - `pages.ts`: the GitHub Pages deploy by hand (`pnpm pages`): builds for the
    sub-path, checks that the site resolves there, commits it to `gh-pages` and
    checks the live site; `pages.test.ts` shows the check failing on each kind
    of broken reference
  - `screenshot.ts`: screenshots of measurement pages in Playwright's Chromium,
    with `page`, the shared frame and palette, and `inlineModule`, a repository
    module for a page's script; `screenshot.test.ts` checks the module inlining
    and `apps/web/e2e/screenshot.e2e.ts` the browser run
- `apps/`
  - `lobby/`: the lobby server, sessions found by name and relayed over
    WebSockets (`pnpm lobby`)
    - `src/lobby.ts`: `startLobby`; `src/main.ts` runs it
    - `load.ts`: the load test, sessions of a host and 8 clients
    - `Dockerfile`: the server as a container, for hosting
    - `fly.toml`: the server on Fly.io, one machine never stopped
      (`pnpm lobby:deploy`)
  - `web/`: the browser app (Svelte 5, Vite, PWA); serves the prototype at
    `/prototype.html`
    - `vite.config.ts`: the build, with the prototype and the license gate as
      plugins
    - `src/main.ts`: mounts `App.svelte` on `#app`
    - `src/app.css`: the page's styles and its design tokens (`--amber`,
      `--teal`, `--line` …), which the prototype's components reuse
    - `src/test-setup.ts`: `@testing-library/jest-dom`'s matchers, loaded once
      for every component test
    - `src/App.svelte`: the page, which holds the player and hands each
      component its props; components take props and send intents
      - `src/components/Transport.svelte`: start and stop, and the tempo
      - `src/components/StylePanel.svelte`: the presets, the style sliders, and
        a line saying where the style is: a preset playing, a glide under way,
        or a custom style
      - `src/components/Stage.svelte`: the section, the bar in it, the key, the
        chord heard with its numeral, the beats, the song map, the next four
        bars and what the lead is doing; before the start, the bar the band
        opens on
      - `src/components/Performers.svelte`: one `Performer` row per band
        performer, drums, bass, chords and lead
      - `src/components/Performer.svelte`: one band performer, collapsed to its
        status, expandable to its last bar as a `PianoRoll`, what is sounding on
        it, and, while the lead plays a motif, whose it is
      - `src/components/PianoRoll.svelte`: a performer's last bar, drawn a row
        per pitch sounding, low at the bottom; generalizes `MusePanel`'s rows of
        a scale degree to rows of a raw note
      - `src/components/KeyPicker.svelte`: the key the band is heading for: a
        mode select, and the full-sized circle of fifths as the tonic picker; a
        toggle bares an experiment, the same wheel as a live radar of the
        harmonic history over it
      - `src/components/CircleOfFifths.svelte`: the circle of fifths: the
        current scale lit and threaded as a figure from the tonic, the tonic
        ringed; a dot is also a button when given `onintent` and `mode`; with
        `history`, a filled radar under the wheel shows every pitch class's
        weight
      - `src/components/MusePanel.svelte`: the Muse: the motif on offer, drawn a
        row per degree, where it came from, Forget, and the log
      - `src/components/NextBars.svelte`: the next four bars, with cues where
        the section or the key changes
      - `src/components/SongMap.svelte`: the section playing and the three after
        it, their bars as tall as their energy, and their chord loops
      - `src/components/Keyboard.svelte`: the on-screen keyboard, C4 to E5, laid
        out over the white keys' width (`midi/surfaces.ts`); a pointer holds a
        note until it lifts, cancels, or the capture is lost; a dot marks the
        current scale and amber flashes the band's own lead
      - `src/components/DrumPads.svelte`: one pad per General MIDI drum sound,
        played the same way as the keyboard; amber flashes the band's own drum
        hits, showing the rhythm as it plays
      - `src/components/MidiPanel.svelte`: connecting, the output and input
        ports, the channel each part sends on, and the built-in synth, clock and
        thru toggles
      - `src/components/MetronomePanel.svelte`: the metronome: on/off, a meter
        picker, a volume slider, a two-state blinker and a steps-in-bar counter,
        client-only and independent of the band
      - `src/components/SessionPanel.svelte`: host a session, join one, leave or
        close it; who joined, and how far the host is
    - `src/player.svelte.ts`: runs the transport on the audio clock and plays
      its events; the screen follows what is heard. Starting, playing and
      stopped, with a stop that cancels a pending start. It keeps the bars
      decided ahead and shows everything through one snapshot, `hud`.
      `writtenPosition`, `humanNoteOn` and `humanNoteOff` place a played note
      where it was heard, through the steps laid in the last seconds, exactly
      and with its release, kept in `humanNotes`; the keyboard's go to the
      transport, for the Muse (#79), whose log is `museLog`, and `forgetMotif`
      asks it to forget. `playAlong` plays a note at once, on the same clock and
      synth, from an instrument, a computer key or MIDI; `sounding` is only the
      band's own notes heard sounding, one entry per band performer, never what
      was played along with it; `pattern` is each performer's last bar finished,
      for its piano roll; `harmonicHistory` is every pitch class's weight,
      decaying, for the key wheel's radar. It plays alone, hosts (telling
      `hosting` what it does) or follows a host (`follow`, and the `follow…`
      calls), on the host's clock through `skew`
    - `src/session/`: host and client mode in the app
      ([brief](briefs/host-mode.md))
      - `lobby.ts`: `Lobby`, where sessions are found, and the links it gives a
        host and a client
      - `broadcast.ts`: `broadcastLobby`, across the tabs and windows of one
        browser
      - `host.svelte.ts`: `HostSession`, admitting clients and telling them what
        the player does
      - `client.svelte.ts`: `ClientSession`, following a host on its clock
      - `clocks.ts`: `DeviceClocks`, a device's page clock and its output's
        offset from it, as a session reads them
      - `websocket.ts`: `websocketLobby`, through a lobby server
    - `src/hud.ts`: the view model, `hudOf`: the bar heard and the bars ahead as
      `BarView`s and the song map's sections of them, the chord sounding, the
      key's tonic and scale, the style's preset and glide, and the Muse's motif
      and log in the prototype's words, as plain data; `leadStatus` and
      `styleStatus` are the lead's and the style's status lines, reused by the
      stage's performers
    - `src/circleLayout.ts`: pure geometry for a circle-of-fifths wheel:
      `wheelAngle`, `wheelPoint`, `figureOrder` (the scale's pitch classes
      ordered to trace its figure from the tonic) and `wheelOrder` (all twelve,
      for a shape spanning the whole wheel)
    - `src/harmonicHistory.ts`: `HarmonicHistory`, every pitch class's weight
      from the notes the band has actually played, drums excluded, decaying by
      the bars silent between one push and the next
    - `src/noteNames.ts`: `TONIC_NAMES`, the twelve pitch classes' names, as the
      prototype spells them, and `scaleNoteNames`, a key's notes named ascending
      from its tonic
    - `src/performers.ts`: the stage's performers, `performersOf`: one
      `PerformerView` per band performer, drums, bass, chords and lead, each a
      status line, the Muse's source while the lead plays that same motif
      (`hud.bar.motif`, not just any offer the Muse holds now), what is sounding
      on it and its last bar's pattern, built the same way whether the player
      hosts, follows or plays alone
    - `src/heard.ts`: the positions waiting to be heard, bounded
    - `src/sounding.ts`: `Sounding`, the band's own notes heard sounding right
      now on each of its four performers, from a hit's scheduled time and
      duration; `performerOf` maps the comp's `pad` and `stab` onto the one
      chords performer
    - `src/pattern.ts`: `Pattern`, the last bar each performer finished, kept
      whole once the next bar's first note arrives, for a performer's piano roll
    - `src/audio/output.ts`: what the player plays on, and the Web Audio one
    - `src/audio/midi-out.ts`: MIDI out, one channel per part; a note-off is
      answered by its note-on's decision, never by what else is sounding at
      release, so a stab sharing a pad's channel and pitch retriggers rather
      than cutting the pad short (#5)
    - `src/audio/clock-offset.ts`: `clockOffset`, the device's output pair, read
      once a tick: MIDI timestamps and their inverse, the moment heard, and the
      offset a session reads
    - `src/audio/band-output.ts`: `bandOutput`, the built-in synth and MIDI out
      together or either alone, riding on one shared clock
    - `src/conductor.ts`: intents (presets, sliders, keys) into glides on the
      style track and the key wished for
    - `src/audio/drums.ts`: the built-in drum kit
    - `src/audio/voices.ts`: the built-in pitched voices: bass, chords and lead,
      coloured by the bar's sound
    - `src/audio/metronome-click.ts`: the metronome's click, three oscillator
      timbres, one per weight (downbeat, pulse, subdivision)
    - `src/metronome.svelte.ts`: `Metronome`, on its own audio context and
      ticker, driving the engine's metronome at the band's live tempo; volume
      and meter saved to `localStorage`; `pulse` and `downbeat` follow what is
      heard, the way `player.heard` does
    - `src/ticker.ts`: the scheduler's tick, from a Worker
    - `src/midi/surfaces.ts`: the playing surfaces that reach the Muse, as pure
      functions: a raw MIDI message (with its channel), the computer keys' maps
      for the keyboard and the pads, `partOf` (channel 10 plays the pads, every
      other the keyboard), and the on-screen keyboard's layout
    - `src/midi/access.ts`: Web MIDI access: connecting, listing ports, and
      turning what a listened input plays into notes
    - `src/midi/routing.ts`: `routeNote`, a note from any source (on-screen
      keys, computer keys, Web MIDI in) into playing along, capture and MIDI
      thru together, pulled out of `App.svelte` so the wiring has a test;
      `connectMidi`, connecting and adopting the ports already chosen
    - `src/midi/settings.svelte.ts`: MIDI preferences, saved to `localStorage`
      on every change
    - `src/midi/drum-presets.ts`: named drum note maps `MidiPanel` offers (GM,
      Novation Circuit), and which one a `DrumNotes` matches, if any
    - `e2e/band.e2e.ts`, `playwright.config.ts`: the end-to-end checks, the
      built app in Chromium with its audio measured
    - `e2e/pages.e2e.ts`: the app and the prototype on the Pages sub-path,
      online and offline
    - `e2e/session.e2e.ts`: two pages on one session, their kicks measured
      against each other, and a client's motif in the host's Muse
    - `e2e/audio.ts`: listening to the app in the browser, for the checks
- `.github/workflows/ci.yml`: lint, format check, typecheck, tests, e2e, build;
  started by hand while #4 is open
- `.claude/settings.json`: the session-start and pre-push hooks, and the checks
  agents may run without a prompt
  - `.claude/hooks/session-start.sh`: installs dependencies, warms music21 and
    fetches `origin/main` when an agent session starts or resumes
  - `.claude/hooks/verify-before-push.sh`: runs `pnpm verify` before an agent's
    `git push`, and blocks the push if it fails
- `.claude/skills/`: project skills for agents
  - [`music-theory/`](../.claude/skills/music-theory/SKILL.md): checks theory
    claims against music21 (`oracle.py`) and tonal (`tonal.mjs`), and compares
    the two (`compare.mjs`)
  - [`ratchet/`](../.claude/skills/ratchet/SKILL.md): claims in the Dialectica
    form and the moves both sides of a ratchet pair make (#41)
  - [`review-pr/`](../.claude/skills/review-pr/SKILL.md): reviews a pull request
    against the house rules; `prepare.sh` fetches it into its own worktree and
    runs `pnpm verify` there
  - [`screenshot/`](../.claude/skills/screenshot/SKILL.md): measured options
    shown side by side, as screenshots of pages drawn from an experiment's
    numbers, and as audio through the app's synth
- [`.github/pull_request_template.md`](../.github/pull_request_template.md): the
  checklist every pull request fills in
