import { describe, expect, it } from 'vitest';
import { GROUPS, report, verify, type Stage } from './verify.ts';

const stage = (name: string, command: string): Stage => ({ name, command });

describe('verify', () => {
  it('runs the stages of a group at the same time', async () => {
    const started = Date.now();
    const outcomes = await verify([[stage('a', 'sleep 1'), stage('b', 'sleep 1')]]);
    expect(outcomes.map((o) => o.ok)).toEqual([true, true]);
    expect(Date.now() - started).toBeLessThan(1800);
  });

  it('runs the groups one after another', async () => {
    const outcomes = await verify([
      [stage('a', 'sleep 0.3; echo first')],
      [stage('b', 'echo second')],
    ]);
    expect(outcomes.map((o) => o.name)).toEqual(['a', 'b']);
    expect(outcomes[1]!.output).toBe('second\n');
  });

  it('lets the stages of a group all end when one fails, then stops', async () => {
    const groups = [
      [stage('bad', 'echo broken; exit 1'), stage('slow', 'sleep 0.3; echo done')],
      [stage('after', 'echo never')],
    ];
    const outcomes = await verify(groups);
    expect(outcomes.map((o) => [o.name, o.ok])).toEqual([
      ['bad', false],
      ['slow', true],
    ]);
    const text = report(outcomes, groups);
    expect(text).toContain('- after skipped');
    expect(text).toContain('verify failed: bad');
    // The failure is at the end, whole, where a reader of the tail finds it.
    expect(text.indexOf('✓ slow')).toBeLessThan(text.indexOf('✗ bad'));
    expect(text.indexOf('✗ bad')).toBeLessThan(text.indexOf('broken'));
  });

  it('fails a stage whose command does not exist', async () => {
    const [outcome] = await verify([[stage('missing', 'no-such-command-anywhere')]]);
    expect(outcome!.ok).toBe(false);
  });

  it('shows the tests whole when they pass, for their counts, and only a line for the rest', async () => {
    const groups = [
      [stage('lint', 'echo lint noise')],
      [stage('test', 'echo "      Tests  12 passed (12)"')],
    ];
    const text = report(await verify(groups), groups);
    expect(text).toContain('Tests  12 passed (12)');
    expect(text).not.toContain('lint noise');
    expect(text.endsWith('verify passed')).toBe(true);
  });

  it('holds every stage verify is meant to run', () => {
    expect(
      GROUPS.flat()
        .map((s) => s.command)
        .sort(),
    ).toEqual(['pnpm build', 'pnpm check', 'pnpm format:check', 'pnpm lint', 'pnpm test']);
  });
});
