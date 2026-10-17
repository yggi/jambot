import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { buildInfo } from './src/readBuild.ts';
import {
  licenseProblems,
  notices,
  packageDirOf,
  readShipped,
  workboxPackages,
} from '../../tooling/licenses.ts';

/** What this build is: its commit, branch and date, and the versions of what the app ships, as the version sheet lists them. Name a dependency here before it is one (`webmidi`): it shows once it is. */
const build = buildInfo(
  {
    dirs: ['.', '../../packages/score'].map((dir) => fileURLToPath(new URL(dir, import.meta.url))),
    env: process.env,
    git: (args) => {
      try {
        return execSync(`git ${args.join(' ')}`, { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim();
      } catch {
        return '';
      }
    },
    now: new Date(),
  },
  ['@yggi/cells', 'svelte', 'webmidi'],
);

const prototypeFile = new URL('../../prototype/jambot-prototype.html', import.meta.url);

/** Serves the original prototype at /prototype.html, in dev and in the build. */
function prototype(): Plugin {
  return {
    name: 'jambot-prototype',
    configureServer(server) {
      server.middlewares.use('/prototype.html', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(prototypeFile));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'prototype.html',
        source: readFileSync(prototypeFile),
      });
    },
  };
}

/** The directory of `name`, as `from` (a package.json path) resolves it. */
function packageDir(name: string, from: string): string | undefined {
  try {
    return dirname(createRequire(from).resolve(`${name}/package.json`));
  } catch {
    return undefined;
  }
}

/**
 * The license gate (`tooling/licenses.ts`) over what the build ships: the
 * packages behind the bundle's modules, and those of the service worker
 * vite-plugin-pwa writes after it (workbox's runtime, and the loader that
 * workbox-build takes from rollup-plugin-off-main-thread). Fails the build
 * on a package that isn't permissive, and writes their licenses to
 * `licenses.txt`.
 */
function licenses(): Plugin {
  const app = fileURLToPath(new URL('package.json', import.meta.url));
  const dirs = new Set<string>();
  let outDir = '';
  return {
    name: 'jambot-licenses',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const id of Object.keys(chunk.modules)) {
          const dir = packageDirOf(id, (name) => packageDir(name, app));
          if (dir !== undefined) dirs.add(dir);
        }
      }
    },
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const pwa = packageDir('vite-plugin-pwa', app)!;
        const workboxBuild = join(
          packageDir('workbox-build', join(pwa, 'package.json'))!,
          'package.json',
        );
        const worker = readdirSync(outDir)
          .filter((file) => file.endsWith('.js'))
          .map((file) => readFileSync(join(outDir, file), 'utf8'))
          .join('\n');
        const names = workboxPackages(worker);
        if (names.length > 0) names.push('@trickfilm400/rollup-plugin-off-main-thread');
        for (const name of names) {
          const dir = packageDir(name, workboxBuild);
          if (dir === undefined)
            throw new Error(`cannot find ${name}, which the service worker ships`);
          dirs.add(dir);
        }
        const shipped = [...dirs].map(readShipped);
        const problems = licenseProblems(shipped);
        if (problems.length > 0) throw new Error(`license gate:\n${problems.join('\n')}`);
        const own = readFileSync(new URL('../../LICENSE', import.meta.url), 'utf8');
        writeFileSync(join(outDir, 'licenses.txt'), notices(own, shipped));
      },
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; `pnpm pages` sets BASE_PATH accordingly.
  base: process.env.BASE_PATH ?? '/',
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [
    svelte(),
    prototype(),
    VitePWA({
      // 'prompt': a new service worker waits until the person accepts (UpdateToast), so a band is never cut off by a reload
      registerType: 'prompt',
      manifest: {
        name: 'Jambot',
        short_name: 'Jambot',
        description: 'You play, the Muse listens, the band answers.',
        theme_color: '#131a2e',
        background_color: '#131a2e',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,woff2}'],
      },
    }),
    licenses(),
  ],
});
