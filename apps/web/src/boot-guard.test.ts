import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The boot guard is the classic script inline in `index.html`: it runs where
 * the app's module can't, so it is tested as the page has it, in a page of its own.
 */
const html = readFileSync(join(import.meta.dirname, '../index.html'), 'utf8');
const guard = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

/** A page with the guard run in it: a document and a window of its own, its timer held for the test to fire. */
function page() {
  const doc = document.implementation.createHTMLDocument('Jambot');
  const window = Object.assign(new EventTarget(), { jambotBooted: false });
  let late: (() => void) | undefined;
  const run = new Function('window', 'document', 'navigator', 'setTimeout', guard) as (
    ...args: unknown[]
  ) => void;
  run(window, doc, navigator, (fn: () => void) => void (late = fn));
  const report = () => doc.getElementById('boot-failure');
  return { window, report, late: () => late?.() };
}

describe('the boot guard', () => {
  it('is in the page', () => {
    expect(guard).toContain('boot-failure');
  });

  it('shows an error that comes before the app starts, with the browser it came in', () => {
    const { window, report } = page();
    window.dispatchEvent(new ErrorEvent('error', { message: 'SyntaxError: Unexpected token' }));
    expect(report()?.textContent).toContain('SyntaxError: Unexpected token');
    expect(report()?.textContent).toContain(navigator.userAgent);
  });

  it('says so when the app hasn’t started in time, with no error to show', () => {
    const { report, late } = page();
    expect(report()).toBeNull();
    late();
    expect(report()?.textContent).toContain('did not start');
  });

  it('stays quiet once the app has started', () => {
    const { window, report, late } = page();
    window.jambotBooted = true;
    window.dispatchEvent(new ErrorEvent('error', { message: 'later' }));
    late();
    expect(report()).toBeNull();
  });

  it('offers to clear what the browser kept of the app and load it again', () => {
    const { report, late } = page();
    late();
    expect(report()?.querySelector('button')?.textContent).toMatch(/reset/i);
  });
});
