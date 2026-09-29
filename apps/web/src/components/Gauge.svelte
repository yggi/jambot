<!--
  A gauge: a thin track with a tick at its centre, where a value is at
  rest, and a marker where it stands. It may fill from the centre to the
  marker, and show a band of the track that is within reach. The tempo's
  licence is one (the style's own tempo at the centre, the nudge the marker,
  the licence the band) and so is the swing (the whole range, none at its
  start, the swing the fill).
-->
<script lang="ts">
  interface Props {
    /** What the gauge says to a screen reader. */
    label: string;
    /** The ends of the track, in the value's own units. */
    from: number;
    to: number;
    /** Where the tick stands, the value at rest. */
    centre: number;
    value: number;
    /** A band of the track within reach. */
    reach?: readonly [number, number];
    /** Fill from the centre to the marker. */
    fill?: boolean;
  }

  let { label, from, to, centre, value, reach, fill = false }: Props = $props();

  /** Where a value sits along the track, in percent. */
  const along = (x: number) => ((x - from) / (to - from)) * 100;
</script>

<div class="gauge" role="img" aria-label={label}>
  {#if reach}
    <b class="reach" style="left: {along(reach[0])}%; right: {100 - along(reach[1])}%"></b>
  {/if}
  {#if fill}
    <u
      style="left: {Math.min(along(centre), along(value))}%; right: {100 -
        Math.max(along(centre), along(value))}%"
    ></u>
  {/if}
  <i class="centre" style="left: {along(centre)}%"></i>
  <i class="value" style="left: {along(value)}%"></i>
</div>

<style>
  .gauge {
    position: relative;
    margin-inline: 7px; /* room for the marker at either end */
    height: 8px;
    border-radius: 4px;
    background: var(--line);
  }
  b,
  u {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 4px;
    text-decoration: none;
  }
  .reach {
    background: var(--teal-bg);
    border: 1px solid var(--teal);
  }
  u {
    background: var(--amber);
  }
  i {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .centre {
    width: 2px;
    height: 14px;
    background: var(--muted);
  }
  .value {
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--amber);
    border: 2px solid var(--surface);
  }
</style>
