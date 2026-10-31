/**
 * Keeps the screen awake while the band plays (the Screen Wake Lock API), so a
 * tablet on a stand doesn't dim and lock in the middle of a jam. The browser
 * lets the lock go whenever the page hides, so it is asked for again when the
 * page shows while still wanted. A browser without wake locks, or one that
 * refuses (a low battery, a page not focused), leaves the screen to its own
 * timeout: nothing breaks.
 */

/** A held lock, as the browser hands it out (`WakeLockSentinel`). */
export interface Sentinel {
  readonly released: boolean;
  release(): Promise<void>;
}

/** The part of `navigator.wakeLock` this uses. */
export interface ScreenLocks {
  request(type: 'screen'): Promise<Sentinel>;
}

/** The part of `document` this uses: whether the page shows, and when that changes. */
export interface Visibility {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: () => void): void;
}

export class Awake {
  #locks: ScreenLocks | undefined;
  #page: Visibility;
  #wanted = false;
  #sentinel: Sentinel | null = null;
  #asking = false;

  constructor(locks: ScreenLocks | undefined, page: Visibility) {
    this.#locks = locks;
    this.#page = page;
    page.addEventListener('visibilitychange', () => this.#sync());
  }

  /** Whether the screen should stay awake from now on. */
  hold(wanted: boolean) {
    this.#wanted = wanted;
    this.#sync();
  }

  /** Whether a lock is held now. */
  get held(): boolean {
    return this.#sentinel !== null && !this.#sentinel.released;
  }

  #sync() {
    if (!this.#wanted) {
      const sentinel = this.#sentinel;
      this.#sentinel = null;
      if (sentinel && !sentinel.released) sentinel.release().catch(() => {});
      return;
    }
    if (this.held || this.#asking || !this.#locks || this.#page.visibilityState !== 'visible')
      return;
    this.#asking = true;
    this.#locks.request('screen').then(
      (sentinel) => {
        this.#asking = false;
        this.#sentinel = sentinel;
        this.#sync();
      },
      () => {
        this.#asking = false;
      },
    );
  }
}
