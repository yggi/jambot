// The globals vite's `define` makes (vite.config.ts, vitest.config.ts).

/** What this build is: commit, branch, date, dependencies (src/buildInfo.ts). */
declare const __BUILD__: import('./buildInfo.ts').BuildInfo;

/**
 * The dev readout (#399): how the band played through cells since the page opened (#469),
 * what the outputs played lately, event by event, from the one numbered `from` on, and the
 * transport's counters (#446), and a client's network pair (#509);
 * and the homeostat's song, none where it is off (#495).
 */
interface Window {
  jambot?: {
    readonly shadow: import('./shadow.ts').ShadowReadout;
    readonly homeostat: import('./hearing.ts').HearingReadout | null;
    played(from?: number): ReturnType<import('./played.ts').PlayedLog['since']>;
    readonly timing: import('@jambot/session').TransportTiming;
    readonly network: import('./session/client.svelte.ts').NetworkTiming | null;
  };
}
