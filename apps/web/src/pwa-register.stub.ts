// `virtual:pwa-register` in the tests, where vite-plugin-pwa isn't loaded: a worker that never has an update to offer.
export function registerSW(): (reload?: boolean) => Promise<void> {
  return () => Promise.resolve();
}
