// @vitest-environment node
import { readFileSync } from 'node:fs';
import { playerSource } from '@jambot/session';
import { describe, expect, it } from 'vitest';
import { SOURCE_COLOURS, credit, sourceColour } from './attribution.ts';

describe('a source’s colour', () => {
  it('gives every player of a session its own colour, up to the whole palette, in the order they joined', () => {
    for (let count = 1; count <= SOURCE_COLOURS; count++) {
      const ids = ['host', ...Array.from({ length: count - 1 }, (_, i) => `c${i * 7}`)];
      const players = Object.fromEntries(ids.map((id, i) => [id, `Player ${i}`]));
      const colours = ids.map((id) => sourceColour(playerSource(id, 'the computer keys'), players));
      expect(colours).toEqual(ids.map((_, i) => i));
    }
  });

  it('gives a player’s every instrument the player’s colour', () => {
    const players = { host: 'Ada', c3: 'Bo' };
    expect(sourceColour(playerSource('c3', 'the drum pads'), players)).toBe(
      sourceColour(playerSource('c3', 'LK Mini/1'), players),
    );
  });

  it('keeps a player’s colour when the name changes, and when a player joins after', () => {
    const before = { host: 'Ada', c3: 'Bo' };
    const after = { host: 'Ada', c3: 'Bea', c9: 'Cy' };
    expect(sourceColour(playerSource('c3', 'keys'), after)).toBe(
      sourceColour(playerSource('c3', 'keys'), before),
    );
  });

  it('comes round the palette again past its last colour', () => {
    const ids = Array.from({ length: SOURCE_COLOURS + 1 }, (_, i) => `c${i}`);
    const players = Object.fromEntries(ids.map((id) => [id, id]));
    expect(sourceColour(playerSource(ids.at(-1)!, 'keys'), players)).toBe(0);
  });

  it('gives the one player outside a session the first colour, whatever the instrument', () => {
    expect(sourceColour('the computer keys', {})).toBe(0);
    expect(sourceColour('LK Mini/1', {})).toBe(0);
  });

  it('gives a player the session hasn’t named yet a colour of the palette, the same each time', () => {
    const colour = sourceColour(playerSource('c42', 'keys'), { host: 'Ada' });
    expect(colour).toBeGreaterThanOrEqual(0);
    expect(colour).toBeLessThan(SOURCE_COLOURS);
    expect(sourceColour(playerSource('c42', 'keys'), { host: 'Ada' })).toBe(colour);
  });

  it('has a token for every colour in the light theme and both dark ones, none of them the band’s amber', () => {
    const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');
    const blocks = [...css.matchAll(/(:root[^{]*)\{([^}]*)\}/g)].filter(([, , body]) =>
      body!.includes('--amber'),
    );
    expect(blocks).toHaveLength(3);
    for (const [, , body] of blocks) {
      const amber = /--amber:\s*([^;]+);/.exec(body!)![1];
      const colours = Array.from({ length: SOURCE_COLOURS }, (_, i) => {
        const value = new RegExp(`--source-${i}:\\s*([^;]+);`).exec(body!)?.[1];
        expect(value, `--source-${i}`).toBeDefined();
        return value;
      });
      expect(new Set(colours).size).toBe(SOURCE_COLOURS);
      expect(colours).not.toContain(amber);
    }
  });
});

describe('a motif’s credit', () => {
  it('names its source by player and gives the player’s colour, keeping the source’s id and the bar', () => {
    const players = { host: 'Ada', c1: 'Bo' };
    const source = playerSource('c1', 'the computer keys');
    expect(credit({ source, bar: 6 }, players)).toEqual({
      source,
      name: "Bo's computer keys",
      colour: 1,
      bar: 6,
    });
  });
});
