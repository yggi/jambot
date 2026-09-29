/**
 * The runs kept in this browser (#204, A7): every finished timing test,
 * saved as it ends, so they can be downloaded together and analysed
 * outside. One key of `localStorage` holds them all as a JSON list; a
 * browser that refuses (a private window, a full quota) keeps them for the
 * page's life and says so.
 */

import { type TimingRun, isRun } from './run.ts';

export const RUNS_KEY = 'jambot:timing-runs';

/** The part of `Storage` this needs. */
export interface KeptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const browserStorage = (): KeptStorage | null => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};

export class TimingRuns {
  #storage: KeptStorage | null;
  #runs: TimingRun[] = [];
  /** Why the last save failed, or null. */
  problem: string | null = null;

  constructor(storage: KeptStorage | null = browserStorage()) {
    this.#storage = storage;
    this.#runs = this.#read();
  }

  #read(): TimingRun[] {
    try {
      const text = this.#storage?.getItem(RUNS_KEY);
      if (!text) return [];
      const parsed: unknown = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.filter(isRun) : [];
    } catch {
      return [];
    }
  }

  #write(): boolean {
    if (!this.#storage) {
      this.problem = 'This browser keeps nothing: download the runs before leaving the page.';
      return false;
    }
    try {
      this.#storage.setItem(RUNS_KEY, JSON.stringify(this.#runs));
      this.problem = null;
      return true;
    } catch {
      this.problem =
        'This browser could not keep the runs (its storage is full or refused): download them now.';
      return false;
    }
  }

  /** The runs kept, oldest first. */
  list(): readonly TimingRun[] {
    return this.#runs;
  }

  /** Keep a run; false if the browser wouldn't (it is still held for the page's life). */
  add(run: TimingRun): boolean {
    this.#runs = [...this.#runs, run];
    return this.#write();
  }

  remove(id: string): void {
    this.#runs = this.#runs.filter((r) => r.id !== id);
    this.#write();
  }

  clear(): void {
    this.#runs = [];
    this.problem = null;
    try {
      this.#storage?.removeItem(RUNS_KEY);
    } catch {
      // Nothing was kept that could not be dropped.
    }
  }
}

/** A name for a run that is unique among `runs`: when it was taken, and a counter if two share a second. */
export function runId(taken: string, runs: readonly Pick<TimingRun, 'id'>[]): string {
  const base = taken.replace(/[:.]/g, '-');
  let id = base;
  for (let n = 2; runs.some((r) => r.id === id); n++) id = `${base}-${n}`;
  return id;
}
