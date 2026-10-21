// The globals vite's `define` makes (vite.config.ts, vitest.config.ts).

/** What this build is: commit, branch, date, dependencies (src/buildInfo.ts). */
declare const __BUILD__: import('./buildInfo.ts').BuildInfo;

/**
 * The dev readout (#399): what the band through cells found, in shadow, since the page opened,
 * what the outputs played lately, event by event, from the one numbered `from` on, and the
 * transport's counters (#446).
 */
interface Window {
  jambot?: {
    readonly shadow: import('./shadow.ts').ShadowReadout;
    played(from?: number): ReturnType<import('./played.ts').PlayedLog['since']>;
    readonly timing: import('@jambot/session').TransportTiming;
  };
}
