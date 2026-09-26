import { describe, expect, it } from 'vitest';
import { Heard } from './heard.ts';

describe('Heard', () => {
  it('gives the latest position heard, and lets go of it and everything older', () => {
    const heard = new Heard<string>();
    heard.push(1, 'a');
    heard.push(2, 'b');
    heard.push(3, 'c');
    expect(heard.take(0.5)).toBeUndefined();
    expect(heard.take(2.5)).toBe('b');
    expect(heard.size).toBe(1);
    expect(heard.take(2.9)).toBeUndefined();
    expect(heard.take(3)).toBe('c');
    expect(heard.size).toBe(0);
  });

  it('drops what can no longer be shown', () => {
    const heard = new Heard<number>();
    for (let i = 0; i < 10; i++) heard.push(i, i);
    heard.drop(6);
    expect(heard.size).toBe(4);
    expect(heard.take(100)).toBe(9);
  });

  it('takes four hours of positions in one go without stalling the tab', () => {
    // 142,000 steps: four hours at 148 bpm, as a hidden tab would pile up
    // without dropping. One shift() at a time took 26 s.
    const heard = new Heard<number>();
    for (let i = 0; i < 142_000; i++) heard.push(i / 10, i);
    const started = Date.now();
    expect(heard.take(1e9)).toBe(141_999);
    expect(Date.now() - started).toBeLessThan(50);
  });
});
