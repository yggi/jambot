import { readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/; CI sets BASE_PATH accordingly.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    svelte(),
    prototype(),
    VitePWA({
      registerType: 'autoUpdate',
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
  ],
});
