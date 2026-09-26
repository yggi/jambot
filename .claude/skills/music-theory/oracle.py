# /// script
# requires-python = ">=3.10"
# dependencies = ["music21==10.5.0"]
# ///
"""A second opinion on music-theory claims, from music21.

Run with `uv run .claude/skills/music-theory/oracle.py <command> ...`.
Every answer is one JSON object per line, so it can be pasted into a test as
a literal. Input is written the way Jambot writes it (`Eb`, `Bb7`, `A:minor`);
the script translates it to music21's notation, where `-` is a flat, and
refuses anything it cannot translate without guessing.
"""

import argparse
import json
import re
import sys
import warnings

warnings.filterwarnings("ignore")

from music21 import (  # noqa: E402
    analysis,
    chord,
    converter,
    harmony,
    key,
    pitch,
    roman,
)

NOTE_RE = re.compile(r"^([A-Ga-g])(##|bb|#|b|♯♯|♭♭|♯|♭|x|𝄪|𝄫)?(-?\d)?")
ACCIDENTALS = {
    "": "", "#": "#", "♯": "#", "x": "##", "𝄪": "##", "##": "##", "♯♯": "##",
    "b": "-", "♭": "-", "bb": "--", "♭♭": "--", "𝄫": "--",
}
MODES = ["lydian", "major", "mixolydian", "dorian", "minor", "phrygian", "locrian"]


class Refused(Exception):
    """The input cannot be read without guessing."""


def split_note(text, octave=True):
    """A Jambot note name as (music21 name, rest of the text).

    With `octave=False` a trailing number is left in the rest: `Bb7` is a
    chord, not B-flat in octave 7.
    """
    match = NOTE_RE.match(text)
    if not match:
        raise Refused(f"{text!r} does not start with a note name")
    letter, accidental, octave_text = match.groups()
    name = letter.upper() + ACCIDENTALS[accidental or ""]
    if octave and octave_text:
        return name + octave_text, text[match.end():]
    return name, text[match.end(2) if accidental else match.end(1):]


def m21_key(text):
    """`A:minor`, `D:dorian` or `f#` (lower case is minor, as in music21)."""
    tonic, _, mode = text.partition(":")
    name, rest = split_note(tonic, octave=False)
    if rest:
        raise Refused(f"{text!r} is not a key")
    if not mode:
        mode = "minor" if tonic[0].islower() else "major"
    mode = {"ionian": "major", "aeolian": "minor"}.get(mode, mode)
    if mode not in MODES:
        raise Refused(f"{mode!r} is not a diatonic mode")
    return key.Key(name, mode)


def names(pitches):
    return [p.nameWithOctave.replace("-", "b") for p in pitches]


def relative(pitches, root):
    return sorted({(p.pitchClass - root.pitchClass) % 12 for p in pitches})


def cmd_note(args):
    for text in args.items:
        name, rest = split_note(text)
        if rest:
            raise Refused(f"{text!r}: {rest!r} is not part of a note name")
        p = pitch.Pitch(name)
        out = {"note": text, "pitchClass": p.pitchClass}
        if p.octave is not None and any(c.isdigit() for c in text):
            out["midi"] = p.midi
        yield out


def cmd_chord(args):
    for text in args.items:
        root, symbol = split_note(text, octave=False)
        if symbol.startswith("-"):
            raise Refused(f"{text!r}: music21 reads '-' as a flat; write 'm' for minor")
        try:
            cs = harmony.ChordSymbol(root + symbol)
        except ValueError as error:
            yield {"chord": text, "unreadable": str(error).split(";")[0]}
            continue
        if cs.root().name != root:
            raise Refused(f"{text!r}: music21 read the root as {cs.root().name}")
        yield {
            "chord": text,
            "kind": cs.chordKind,
            "intervals": relative(cs.pitches, cs.root()),
            "pitches": names(cs.pitches),
        }


def cmd_roman(args):
    k = m21_key(args.key)
    for figure in args.items:
        rn = roman.RomanNumeral(figure, k)
        yield {
            "roman": figure,
            "key": args.key,
            "root": rn.root().name.replace("-", "b"),
            "intervals": relative(rn.pitches, rn.root()),
            "pitches": [p.name.replace("-", "b") for p in rn.pitches],
            "name": rn.commonName,
        }


def cmd_scale(args):
    k = m21_key(args.key)
    ps = k.getPitches()[:-1]
    yield {
        "key": args.key,
        "pitches": [p.name.replace("-", "b") for p in ps],
        "set": relative(ps, ps[0]),
    }


def cmd_stack(args):
    """Stack every other degree of each diatonic mode; count the qualities."""
    for mode in MODES if args.mode == "all" else [args.mode]:
        sc = key.Key("C", mode).getScale()
        census = {}
        for degree in range(1, 8):
            ps = [sc.pitchFromDegree((degree - 1 + 2 * i) % 7 + 1) for i in range(args.size)]
            name = chord.Chord(ps).commonName
            census[name] = census.get(name, 0) + 1
        yield {"mode": mode, "size": args.size, "census": dict(sorted(census.items()))}


def cmd_name(args):
    """Name a set of MIDI notes or note names, e.g. `60 64 67` or `C4 E4 G4`."""
    ps = [pitch.Pitch(midi=int(t)) if t.isdigit() else pitch.Pitch(split_note(t)[0]) for t in args.items]
    c = chord.Chord(ps)
    yield {
        "notes": args.items,
        "name": c.commonName,
        "root": c.root().name.replace("-", "b"),
        "quality": c.quality,
        "forte": c.forteClass,
    }


def cmd_key(args):
    """Key estimates for a MIDI or MusicXML file, by five profiles."""
    s = converter.parse(args.file)
    profiles = [
        analysis.discrete.KrumhanslSchmuckler,
        analysis.discrete.TemperleyKostkaPayne,
        analysis.discrete.AardenEssen,
        analysis.discrete.BellmanBudge,
        analysis.discrete.SimpleWeights,
    ]
    for profile in profiles:
        k = profile(s).getSolution(s)
        yield {
            "profile": profile.__name__,
            "key": f"{k.tonic.name.replace('-', 'b')}:{k.mode}",
            "correlation": round(k.correlationCoefficient, 3),
        }


SELFTEST = [
    # The translation layer, including the traps it exists for.
    (["chord", "Bb7"], {"intervals": [0, 4, 7, 10], "pitches": ["Bb2", "D3", "F3", "Ab3"]}),
    (["chord", "C-7"], {"refused": "'C-7': music21 reads '-' as a flat; write 'm' for minor"}),
    (["chord", "F#m7b5"], {"kind": "minor-seventh", "intervals": [0, 3, 6, 10]}),
    (["chord", "Cmaj9"], {"unreadable": "Invalid chord abbreviation 'maj9'"}),
    (["note", "E7"], {"midi": 100}),
    (["note", "Fx3"], {"midi": 55}),
    # Conventions shared with the prototype: b lowers the mode's own degree.
    (["roman", "A:minor", "bVI"], {"root": "Fb"}),
    (["roman", "G:mixolydian", "VII"], {"root": "F"}),
    (["roman", "A:minor", "V7/iv"], {"pitches": ["A", "C#", "E", "G"]}),
]


def cmd_selftest(args):
    """Answers this script must keep giving; a failure means music21 moved."""
    for argv, expected in SELFTEST:
        parsed = build_parser().parse_args(argv)
        try:
            answer = next(globals()[f"cmd_{parsed.command}"](parsed))
        except Refused as refusal:
            answer = {"refused": str(refusal)}
        wrong = {k: answer.get(k) for k, v in expected.items() if answer.get(k) != v}
        yield {"selftest": " ".join(argv), "ok": not wrong, **({"got": wrong} if wrong else {})}
        if wrong:
            args.failed = True


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    for name, helptext in [
        ("note", "pitch class and MIDI number: Eb4 F# Bbb"),
        ("chord", "chord symbols: Bb7 F#m7b5 Csus4"),
        ("name", "name a set of notes: 60 63 66 70 or C4 E4 G4 D5"),
    ]:
        sub.add_parser(name, help=helptext).add_argument("items", nargs="+")
    p = sub.add_parser("roman", help="Roman numerals in a key: A:minor i7 V7/iv bVI")
    p.add_argument("key")
    p.add_argument("items", nargs="+")
    sub.add_parser("scale", help="a diatonic mode: D:dorian").add_argument("key")
    p = sub.add_parser("stack", help="qualities of stacked thirds in each mode")
    p.add_argument("mode", nargs="?", default="all")
    p.add_argument("--size", type=int, default=3)
    sub.add_parser("key", help="key estimates for a MIDI or MusicXML file").add_argument("file")
    sub.add_parser("selftest", help="check the translation layer and its traps")
    return parser


def main():
    args = build_parser().parse_args()
    args.failed = False
    try:
        for answer in globals()[f"cmd_{args.command}"](args):
            print(json.dumps(answer, ensure_ascii=False))
    except Refused as refusal:
        print(json.dumps({"refused": str(refusal)}, ensure_ascii=False))
        sys.exit(2)
    if args.failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
