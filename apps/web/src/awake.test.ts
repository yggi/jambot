// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Awake, type ScreenLocks, type Visibility } from './awake.ts';

/** A browser's wake locks: each request answered by hand, each sentinel kept. */
function fakeLocks() {
  const sentinels: { released: boolean; release(): Promise<void> }[] = [];
  const pending: { grant(): void; refuse(): void }[] = [];
  const locks: ScreenLocks = {
    request: () =>
      new Promise((resolve, reject) => {
        pending.push({
          grant: () => {
            const sentinel = {
              released: false,
              release: async () => void (sentinel.released = true),
            };
            sentinels.push(sentinel);
            resolve(sentinel);
          },
          refuse: () => reject(new Error('NotAllowedError')),
        });
      }),
  };
  return { locks, sentinels, pending };
}

/** A page whose visibility a test sets, telling its listeners. */
function fakePage(): Visibility & { show(state: 'visible' | 'hidden'): void } {
  const listeners: (() => void)[] = [];
  const page = {
    visibilityState: 'visible' as 'visible' | 'hidden',
    addEventListener: (_type: 'visibilitychange', listener: () => void) =>
      void listeners.push(listener),
    show(state: 'visible' | 'hidden') {
      page.visibilityState = state;
      for (const listener of listeners) listener();
    },
  };
  return page;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('keeping the screen awake', () => {
  it('asks for a lock while wanted, and lets it go when not', async () => {
    const { locks, sentinels, pending } = fakeLocks();
    const awake = new Awake(locks, fakePage());
    expect(pending).toHaveLength(0);
    awake.hold(true);
    expect(pending).toHaveLength(1);
    pending[0]!.grant();
    await settle();
    expect(awake.held).toBe(true);
    awake.hold(false);
    expect(sentinels[0]!.released).toBe(true);
    expect(awake.held).toBe(false);
  });

  it('asks once, however often it is told to hold', async () => {
    const { locks, pending } = fakeLocks();
    const awake = new Awake(locks, fakePage());
    awake.hold(true);
    awake.hold(true);
    expect(pending).toHaveLength(1);
    pending[0]!.grant();
    await settle();
    awake.hold(true);
    expect(pending).toHaveLength(1);
  });

  it('lets a lock go that arrives after it stopped being wanted', async () => {
    const { locks, sentinels, pending } = fakeLocks();
    const awake = new Awake(locks, fakePage());
    awake.hold(true);
    awake.hold(false);
    pending[0]!.grant();
    await settle();
    expect(sentinels[0]!.released).toBe(true);
    expect(awake.held).toBe(false);
  });

  it('asks again when the page comes back, since the browser let the lock go when it hid', async () => {
    const { locks, sentinels, pending } = fakeLocks();
    const page = fakePage();
    const awake = new Awake(locks, page);
    awake.hold(true);
    pending[0]!.grant();
    await settle();
    page.show('hidden');
    sentinels[0]!.released = true;
    expect(pending).toHaveLength(1);
    page.show('visible');
    expect(pending).toHaveLength(2);
    pending[1]!.grant();
    await settle();
    expect(awake.held).toBe(true);
  });

  it('does not ask while the page is hidden, nor when the page comes back and none is wanted', () => {
    const { locks, pending } = fakeLocks();
    const page = fakePage();
    const awake = new Awake(locks, page);
    page.show('hidden');
    awake.hold(true);
    expect(pending).toHaveLength(0);
    awake.hold(false);
    page.show('visible');
    expect(pending).toHaveLength(0);
  });

  it('takes a refusal quietly, and can ask again later', async () => {
    const { locks, pending } = fakeLocks();
    const awake = new Awake(locks, fakePage());
    awake.hold(true);
    pending[0]!.refuse();
    await settle();
    expect(awake.held).toBe(false);
    awake.hold(false);
    awake.hold(true);
    expect(pending).toHaveLength(2);
  });

  it('does nothing where the browser has no wake locks', () => {
    const awake = new Awake(undefined, fakePage());
    awake.hold(true);
    expect(awake.held).toBe(false);
  });
});
