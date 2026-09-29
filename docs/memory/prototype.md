# The prototype

Facts about `prototype/`, the baseline the port is oriented by.

- The full prototype is one file: `prototype/jambot-prototype.html`.
  Open it in Chrome or Edge and press _Start the band_.
  Its code map is in [`prototype/README.md`](../../prototype/README.md#running-and-hacking).
- To drive the prototype headless, define `window.__JAMBOT_TEST__` before its script runs.
  It is then called with the internals (`S`, `composeBar`, `applyPreset`, `evalMini`, `parseRoman`, `checkOverrides`, …).

## Prototype

- Default MIDI channels: lead 1, bass 2, chords 3, drums 10.
  They match the Novation Circuit Tracks.
- Web MIDI works in Chrome and Edge, on desktop and Android.
  Safari has none, and Firefox asks for permission first.
  For hardware MIDI outside an artifact viewer, serve the file from `localhost`.
- Browsers throttle hidden tabs, so keep the page in the foreground.
- Composer events → score → compiled events is exact across all presets and transitions: about 6,000 events, none missing and none extra, lengths within 0.01 steps.
