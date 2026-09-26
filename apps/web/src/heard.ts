/**
 * Positions waiting to be heard. The transport schedules ahead of the
 * speakers, so what it schedules waits here until the audio clock reaches
 * it. Only the latest position heard is ever shown, so anything older is
 * dropped, in one splice.
 */

export class Heard<T> {
  #items: { seconds: number; value: T }[] = [];

  /** How many positions wait. */
  get size(): number {
    return this.#items.length;
  }

  /** Add a position, in time order. */
  push(seconds: number, value: T) {
    this.#items.push({ seconds, value });
  }

  /** The latest position at or before `seconds`, if any; it and everything older go. */
  take(seconds: number): T | undefined {
    const next = this.#items.findIndex((item) => item.seconds > seconds);
    const heard = next === -1 ? this.#items.length : next;
    if (heard === 0) return undefined;
    const latest = this.#items[heard - 1]!.value;
    this.#items.splice(0, heard);
    return latest;
  }

  /** Drop everything before `seconds`, which can no longer be shown. */
  drop(seconds: number) {
    const keep = this.#items.findIndex((item) => item.seconds >= seconds);
    this.#items.splice(0, keep === -1 ? this.#items.length : keep);
  }

  clear() {
    this.#items = [];
  }
}
