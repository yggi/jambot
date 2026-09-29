<!--
  The key picker, folded to a header: the key the band is heading for, in
  common terms and spelled in the key ("C major", "G♯ minor"). Unfolded, two
  views of the one key, both shown, that complement each other. The circle
  of fifths selects and nudges the tonic and shows the scale's shape on it,
  over the harmonic history: every pitch class actually played lately,
  weighted and fading. Under it the scale selects the shape, the mode, from
  all seven, of which the band plays four (the others are dimmed), and lays
  it out as a mark on each note and the octave, on the 12 steps of the
  octave; the gaps between the marks are the steps. The selector writes major
  and minor in full and the others short (`MODE_SHORT_NAMES`), never as the
  Roman numerals the chords below are written in. Changing the shape keeps
  the tonic, and nudging the tonic keeps the shape. The host, or a band
  playing alone, sets the key, heard from the next section the band plans,
  and held within the style's licence of the song's home key (`licence.ts`),
  so the tonics beyond it are dimmed. A client can't set or nudge it yet: its
  key intents don't reach the host, so its nudges are disabled and say so.
-->
<script lang="ts">
  import {
    COMPOSER_MODES,
    type ComposerMode,
    INITIAL_KEY,
    type Key,
    intoReach,
    keyHelix,
  } from '@jambot/engine';
  import { mod, positions } from '@jambot/theory';
  import { DIATONIC_MODE_NAMES } from '@jambot/theory';
  import {
    MODE_NAMES,
    MODE_SHORT_NAMES,
    keyName,
    scaleMarks,
    scaleNoteNames,
    scaleSteps,
  } from '../noteNames.ts';
  import type { Intent } from '../conductor.ts';
  import CircleOfFifths from './CircleOfFifths.svelte';
  import Fold from './Fold.svelte';
  import Nudge from './Nudge.svelte';
  import Ruler from './Ruler.svelte';
  import Segmented from './Segmented.svelte';

  interface Props {
    /** The key the band is heading for. */
    heading: Key | null;
    /** One weight per pitch class, 0–11, for the harmonic-history radar. */
    history: readonly number[];
    /** How many fifths from the home key the licence lets the key go (`KEY_REACH`). */
    reach: number;
    /** Whether a client follows its host: it may nudge the key, not set it. */
    following?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { heading, history, reach, following = false, onintent }: Props = $props();

  const key = $derived(heading ?? INITIAL_KEY);
  const scale = $derived(positions(keyHelix(key)));
  /** The tonics the licence doesn't reach, in the mode playing. */
  const beyond = $derived(
    [...Array(12).keys()].filter(
      (tonic) => intoReach({ tonic, mode: key.mode }, INITIAL_KEY, reach).tonic !== tonic,
    ),
  );

  /** Why a client's nudges are disabled: its key intents don't reach the host yet. */
  const HOST_SETS = 'The host sets the key';

  /** A fifth up the wheel (clockwise) or down (counter-clockwise) from the key heard, in its mode. */
  const nudged = (by: 1 | -1) => mod(key.tonic + 7 * by, 12);
  const nudge = (by: 1 | -1) =>
    onintent({ kind: 'key', wish: { tonic: nudged(by), mode: key.mode } });

  const notes = $derived(scaleNoteNames(scale, key.tonic));
  const steps = $derived(scaleSteps(scale, key.tonic));
  const marks = $derived(scaleMarks(scale, key.tonic));
  /** A mark on each note and the octave, the tonic accented at both ends. */
  const notesOnRuler = $derived(
    marks.map((at, i) => ({
      at,
      text: notes[i % notes.length],
      accent: i === 0 || i === marks.length - 1,
    })),
  );
  const playable = (mode: string): mode is ComposerMode =>
    (COMPOSER_MODES as readonly string[]).includes(mode);

  /** All seven modes as segments, brightest to darkest; the band plays four. */
  const shapes = DIATONIC_MODE_NAMES.map((mode) => ({
    value: mode,
    text: MODE_SHORT_NAMES[mode],
    name: MODE_NAMES[mode],
    disabled: !playable(mode),
  }));

  const wish = (tonic: number, mode: ComposerMode) =>
    onintent({ kind: 'key', wish: { tonic, mode } });
</script>

<Fold heading="Key" name={keyName(key)} sub="the key the band is heading for">
  <div class="wheel">
    <CircleOfFifths
      tonic={key.tonic}
      {scale}
      mode={key.mode}
      {beyond}
      onintent={following ? undefined : onintent}
      {history}
    />
  </div>
  <Nudge
    label="Nudge the key"
    down={{
      name: 'Nudge down',
      glyph: '↺',
      title: following ? HOST_SETS : 'A fifth down',
      disabled: following || beyond.includes(nudged(-1)),
    }}
    up={{
      name: 'Nudge up',
      glyph: '↻',
      title: following ? HOST_SETS : 'A fifth up',
      disabled: following || beyond.includes(nudged(1)),
    }}
    onnudge={nudge}>a fifth</Nudge
  >
  <Segmented
    label="Scale"
    value={key.mode}
    options={shapes}
    disabled={following}
    onselect={(mode) => playable(mode) && wish(key.tonic, mode)}
  />
  <Ruler
    label="{keyName(key)}: {notes.join(' ')}, steps {steps
      .map((n) => (n === 1 ? 'half' : 'whole'))
      .join(' ')}"
    span={12}
    marks={notesOnRuler}
  />
</Fold>

<style>
  .wheel {
    width: min(360px, 100%);
    margin-inline: auto;
  }
</style>
