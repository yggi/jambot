import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { recordedPath, recordedText, recorder } from './recorded.ts';

const dirs: string[] = [];
const testFile = () => {
  const dir = mkdtempSync(join(tmpdir(), 'jambot-recorded-'));
  dirs.push(dir);
  return join(dir, 'walk.test.ts');
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('an experiment’s recorded numbers (yggi/music-commons#68)', () => {
  it('keeps them beside the test, a name to a line', () => {
    expect(recordedPath('/x/experiments/lead-loop.test.ts')).toBe(
      '/x/experiments/lead-loop.recorded.json',
    );
    expect(recordedPath('file:///x/experiments/lead-loop.test.ts')).toBe(
      '/x/experiments/lead-loop.recorded.json',
    );
    expect(recordedText({ share: ['-21.44', '1.97'], sections: 5374 })).toBe(
      '{\n  "share": ["-21.44","1.97"],\n  "sections": 5374\n}\n',
    );
  });

  it('writes what a run measured with RECORD=1, and holds the next run to it', () => {
    const test = testFile();
    const first = recorder(test, true);
    first.hold('share', ['-21.44', '1.97']);
    first.hold('sections', 5374);
    first.end();
    expect(JSON.parse(readFileSync(recordedPath(test), 'utf8'))).toEqual({
      share: ['-21.44', '1.97'],
      sections: 5374,
    });
    const same = recorder(test, false);
    same.hold('share', ['-21.44', '1.97']);
    same.hold('sections', 5374);
    // A number that moved fails, naming what it is and how it is recorded.
    const moved = recorder(test, false);
    expect(() => moved.hold('sections', 5375)).toThrow(/sections \(pnpm record writes/);
    // A run that only compares writes nothing.
    moved.end();
    expect(JSON.parse(readFileSync(recordedPath(test), 'utf8'))).toEqual({
      share: ['-21.44', '1.97'],
      sections: 5374,
    });
  });

  it('fails on a name with nothing recorded, and on one recorded twice', () => {
    const test = testFile();
    expect(() => recorder(test, false).hold('share', 1)).toThrow('nothing is recorded as "share"');
    writeFileSync(recordedPath(test), recordedText({ share: 1 }));
    const twice = recorder(test, false);
    twice.hold('share', 1);
    expect(() => twice.hold('share', 1)).toThrow('recorded twice');
  });

  it('records only the names the run held, so one a test no longer measures leaves the file', () => {
    const test = testFile();
    writeFileSync(recordedPath(test), recordedText({ gone: 1, share: 2 }));
    const run = recorder(test, true);
    run.hold('share', 3);
    run.end();
    expect(JSON.parse(readFileSync(recordedPath(test), 'utf8'))).toEqual({ share: 3 });
  });
});
