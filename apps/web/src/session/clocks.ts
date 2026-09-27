/**
 * A device's clocks, as a session reads them (#27).
 *
 * Pings are stamped with the page's clock, `performance.now()`, which never
 * jumps, so the network's offset is read cleanly however the audio fares.
 * What each device hears is its output's offset from that page clock, the
 * output pair `clockOffset` estimates: a host answers each ping with its
 * own, and a client composes the three into the skew it plays by
 * (`skewOf`).
 */
export interface DeviceClocks {
  /** The page's clock, in seconds. */
  page(): number;
  /** The moment the output is heard less `page()`, in seconds, once trusted: reading it reads the clocks once more. */
  heardOffset(): number | null;
}
