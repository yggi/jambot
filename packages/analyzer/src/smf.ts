/**
 * A Standard MIDI File's bytes, into the `RawMidi` shape `loadMidi` reads.
 * `midi-file`'s `parseMidi` is pure byte-array code — it parses
 * `ArrayLike<number>`, touching no Node or DOM API — so turning a file's
 * bytes into events belongs in this package like everything else. Only
 * reading those bytes off disk is a loader outside it
 * (`experiments/load-file.ts`).
 */
import { parseMidi } from 'midi-file';
import type { TimeSignatureEvent } from './meter.ts';
import type { TempoEvent } from './tempo.ts';
import type { RawMidi } from './load.ts';
import type { RawNote, RawTrack } from './tracks.ts';

const DEFAULT_PPQ = 480;
const MICROSECONDS_PER_MINUTE = 60_000_000;

/** A note-on not yet closed by a note-off, on one channel and pitch. */
interface OpenNote {
  readonly ticks: number;
  readonly velocity: number;
}

/** One track's raw events, turned into a `RawTrack`, and its tempo and meter events appended to the file's own. */
function parseTrack(
  events: ReturnType<typeof parseMidi>['tracks'][number],
  tempos: TempoEvent[],
  timeSignatures: TimeSignatureEvent[],
): RawTrack {
  let ticks = 0;
  let name: string | undefined;
  let program: number | undefined;
  let channel = 0;
  const open = new Map<string, OpenNote[]>();
  const notes: RawNote[] = [];
  const openKey = (eventChannel: number, note: number) => `${eventChannel}:${note}`;

  for (const event of events) {
    ticks += event.deltaTime;
    if (event.type === 'trackName') name = event.text;
    else if (event.type === 'programChange') {
      channel = event.channel;
      program = event.programNumber;
    } else if (event.type === 'setTempo') {
      tempos.push({ ticks, bpm: MICROSECONDS_PER_MINUTE / event.microsecondsPerBeat });
    } else if (event.type === 'timeSignature') {
      timeSignatures.push({
        ticks,
        numerator: event.numerator,
        denominator: event.denominator,
      });
    } else if (event.type === 'noteOn' && event.velocity > 0) {
      channel = event.channel;
      const key = openKey(event.channel, event.noteNumber);
      const stack = open.get(key) ?? [];
      stack.push({ ticks, velocity: event.velocity });
      open.set(key, stack);
    } else if (event.type === 'noteOn' || event.type === 'noteOff') {
      // A `noteOn` with 0 velocity is a `noteOff` (running status); both close the oldest open note of this pitch.
      channel = event.channel;
      const key = openKey(event.channel, event.noteNumber);
      const started = open.get(key)?.shift();
      if (started)
        notes.push({
          midi: event.noteNumber,
          ticks: started.ticks,
          durationTicks: Math.max(1, ticks - started.ticks),
          velocity: started.velocity,
        });
    }
  }

  notes.sort((a, b) => a.ticks - b.ticks);
  return {
    ...(name !== undefined && { name }),
    ...(program !== undefined && { program }),
    channel,
    notes,
  };
}

/** A parsed Standard MIDI File's bytes, into the shape `loadMidi` reads. */
export function parseSmf(bytes: ArrayLike<number>): RawMidi {
  const { header, tracks } = parseMidi(bytes);
  const ppq = header.ticksPerBeat ?? DEFAULT_PPQ;
  const tempos: TempoEvent[] = [];
  const timeSignatures: TimeSignatureEvent[] = [];
  const rawTracks = tracks.map((events) => parseTrack(events, tempos, timeSignatures));
  return { ppq, tempos, timeSignatures, tracks: rawTracks };
}
