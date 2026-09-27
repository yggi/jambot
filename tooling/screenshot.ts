/**
 * Screenshots of measurement pages: a page per question, drawn from an
 * experiment's numbers, rendered in Playwright's Chromium, for a person to
 * compare options by eye. The `screenshot` skill says when and how
 * (`.claude/skills/screenshot/SKILL.md`).
 *
 *   node --experimental-strip-types --no-warnings tooling/screenshot.ts <page.html>... [--out dir] [--width 1200]
 *
 * Each page is screenshotted in full, at twice its CSS pixels, as
 * `<name>.png` beside it or in `--out`. A page that renders asynchronously
 * (audio in an `OfflineAudioContext`, say) marks its body `data-wait`, and
 * sets `window.__done = true` when it is ready. A page may hand files back
 * as `window.__files = { name: base64 }`, which are written beside the
 * screenshot. An error on any page fails the run: a page that broke is not
 * a picture of the numbers.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/**
 * The page's frame: the palette's roles as CSS variables (the dataviz
 * skill's reference palette, light mode), and the layout the pages share.
 * `--s1`–`--s3` are the categorical slots that hold apart pairwise;
 * `--bad` and `--good` are status, used only beside a label or a sign.
 */
export const PAGE_CSS = `
:root { --surface:#fcfcfb; --panel:#ffffff; --ink:#0b0b0b; --ink2:#52514e; --muted:#8a8984; --grid:#e7e6e1;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --bad:#d03b3b; --good:#006300; }
* { box-sizing:border-box }
body { margin:0; background:var(--surface); color:var(--ink);
  font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
main { width:1200px; padding:28px 32px 36px; }
h1 { font-size:22px; margin:0 0 4px } h2 { font-size:15px; margin:22px 0 8px }
.sub { color:var(--ink2); margin:0 0 20px } .note { color:var(--ink2); font-size:13px; margin:6px 0 0 }
.panel { background:var(--panel); border:1px solid var(--grid); border-radius:8px; padding:14px 16px; margin:0 0 12px }
.row { display:flex; gap:12px } .row > .panel { flex:1; min-width:0 }
table { border-collapse:collapse; width:100%; font-variant-numeric:tabular-nums }
th, td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--grid); vertical-align:top }
th { color:var(--ink2); font-weight:600; font-size:12px } .nw td, .nw th { white-space:nowrap }
code, .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px }
.key { display:inline-flex; align-items:center; gap:6px; margin-right:16px; color:var(--ink2); font-size:12.5px }
.sw { width:14px; height:10px; border-radius:2px; display:inline-block }
.bad { color:var(--bad) } .good { color:var(--good) }
svg text { font-family:ui-sans-serif,system-ui,sans-serif }
`;

/** A whole page: a title, and a body inside the shared frame. */
export function page(title: string, body: string, options: { wait?: boolean } = {}): string {
  const wait = options.wait ? ' data-wait' : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${PAGE_CSS}</style></head><body${wait}><main>${body}</main></body></html>`;
}

/**
 * A module of the repository as JavaScript a page can inline in a
 * `<script type="module">`: its types stripped, its exports kept. Only a
 * module with no imports but `import type` inlines, since a page has no
 * resolver; `apps/web/src/audio/voices.ts`, the synth's voices, is one.
 */
export function inlineModule(path: string): string {
  const file = resolve(root, path);
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/^\s*import\s+(?!type\b)[^;]*?from\s+['"]([^'"]+)['"]/gm)];
  if (imports.length)
    throw new Error(
      `${path} imports ${imports.map((m) => m[1]).join(', ')}, and a page has no resolver: inline only a module whose imports are types`,
    );
  return stripTypeScriptTypes(source);
}

/** What a run wrote: each page's screenshot and the files it handed back. */
export interface Shot {
  page: string;
  png: string;
  files: string[];
}

interface Browser {
  newContext(options: object): Promise<{
    newPage(): Promise<{
      on(
        event: string,
        listener: (value: { type?: () => string; text?: () => string }) => void,
      ): void;
      goto(url: string): Promise<unknown>;
      evaluate<T>(expression: string): Promise<T>;
      waitForFunction(
        expression: string,
        arg: null,
        options: { timeout: number },
      ): Promise<unknown>;
      screenshot(options: { path: string; fullPage: boolean }): Promise<unknown>;
    }>;
  }>;
  close(): Promise<void>;
}

/** Playwright's Chromium, as the web app's end-to-end checks pin it. */
function chromium(): { launch(): Promise<Browser> } {
  const load = createRequire(join(root, 'apps/web/package.json'));
  return (load('@playwright/test') as { chromium: { launch(): Promise<Browser> } }).chromium;
}

/** Screenshots every page; throws if any page raised an error. */
export async function shoot(
  pages: readonly string[],
  options: { out?: string; width?: number; timeout?: number } = {},
): Promise<Shot[]> {
  const browser = await chromium().launch();
  const shots: Shot[] = [];
  const problems: string[] = [];
  try {
    const context = await browser.newContext({
      viewport: { width: options.width ?? 1200, height: 900 },
      deviceScaleFactor: 2,
    });
    for (const path of pages) {
      const file = resolve(path);
      const out = options.out ?? dirname(file);
      const name = basename(file).replace(/\.html?$/, '');
      const tab = await context.newPage();
      const errors: string[] = [];
      tab.on('pageerror', (error) => errors.push(String(error)));
      tab.on('console', (message) => {
        if (message.type?.() === 'error') errors.push(message.text?.() ?? '');
      });
      await tab.goto(pathToFileURL(file).href);
      // Expressions, not functions: they run in the page, not here.
      if (await tab.evaluate<boolean>('document.body.hasAttribute("data-wait")'))
        await tab
          .waitForFunction('window.__done === true', null, { timeout: options.timeout ?? 60_000 })
          .catch(() => errors.push('the page never set window.__done'));
      const handed = await tab.evaluate<Record<string, string>>('window.__files ?? {}');
      const files = Object.entries(handed).map(([fileName, base64]) => {
        const target = join(out, basename(fileName));
        writeFileSync(target, Buffer.from(base64, 'base64'));
        return target;
      });
      const png = join(out, `${name}.png`);
      await tab.screenshot({ path: png, fullPage: true });
      shots.push({ page: file, png, files });
      problems.push(...errors.map((error) => `${basename(file)}: ${error}`));
    }
  } finally {
    await browser.close();
  }
  if (problems.length) throw new Error(`the pages raised errors:\n${problems.join('\n')}`);
  return shots;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const value = (flag: string) => {
    const at = args.indexOf(flag);
    return at < 0 ? undefined : args.splice(at, 2)[1];
  };
  const out = value('--out');
  const width = value('--width');
  if (!args.length) {
    console.error('usage: tooling/screenshot.ts <page.html>... [--out dir] [--width 1200]');
    process.exit(2);
  }
  shoot(args, { ...(out && { out }), ...(width && { width: Number(width) }) }).then(
    (shots) => {
      for (const shot of shots) console.log([shot.png, ...shot.files].join('\n'));
    },
    (error: unknown) => {
      console.error(String(error instanceof Error ? error.message : error));
      process.exit(1);
    },
  );
}
