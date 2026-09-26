import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { page, shoot } from '../../../tooling/screenshot.ts';

/**
 * The screenshot tool (`tooling/screenshot.ts`), in the Chromium these
 * checks pin: it writes a picture of a page, waits for a page that renders
 * late and keeps what it hands back, and fails on a page that breaks.
 */
const PNG = [0x89, 0x50, 0x4e, 0x47];

test('screenshots a page, waits for one that renders late, and keeps the files it hands back', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'screenshot-e2e-'));
  try {
    writeFileSync(
      join(dir, 'plain.html'),
      page(
        'Plain',
        '<svg width="100" height="40"><rect width="80" height="20" fill="var(--s1)"/></svg>',
      ),
    );
    writeFileSync(
      join(dir, 'late.html'),
      page(
        'Late',
        `<script type="module">
          const ctx = new OfflineAudioContext(1, 2205, 22050);
          const osc = ctx.createOscillator(); osc.connect(ctx.destination); osc.start();
          const samples = (await ctx.startRendering()).getChannelData(0).length;
          window.__files = { 'samples.txt': btoa(String(samples)) };
          window.__done = true;
        </script>`,
        { wait: true },
      ),
    );
    const shots = await shoot([join(dir, 'plain.html'), join(dir, 'late.html')]);
    expect(shots.map((s) => s.png)).toEqual([join(dir, 'plain.png'), join(dir, 'late.png')]);
    for (const shot of shots) expect([...readFileSync(shot.png).subarray(0, 4)]).toEqual(PNG);
    expect(shots[1]!.files).toEqual([join(dir, 'samples.txt')]);
    expect(readFileSync(join(dir, 'samples.txt'), 'utf8')).toBe('2205');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails on a page that raises an error, or never says it is done', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'screenshot-e2e-'));
  try {
    writeFileSync(
      join(dir, 'broken.html'),
      page('Broken', '<script>Math.max(...new Array(1e6).fill(0))</script>'),
    );
    await expect(shoot([join(dir, 'broken.html')])).rejects.toThrow(/broken\.html: RangeError/);
    writeFileSync(join(dir, 'stuck.html'), page('Stuck', '', { wait: true }));
    await expect(shoot([join(dir, 'stuck.html')], { timeout: 500 })).rejects.toThrow(
      /stuck\.html: the page never set window.__done/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
