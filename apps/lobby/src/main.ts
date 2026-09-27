/**
 * Runs the lobby: `pnpm lobby [--port 8787]`, or with `PORT` set, as a host
 * sets it. It listens on every interface and says the addresses a player on
 * the LAN can give their app.
 */

import { networkInterfaces } from 'node:os';
import { parseArgs } from 'node:util';
import { startLobby } from './lobby.ts';

const { values } = parseArgs({ options: { port: { type: 'string' } } });
const port = Number(values.port ?? process.env.PORT ?? 8787);
const lobby = await startLobby({ port });

const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === 'IPv4' && !a.internal)
  .map((a) => `ws://${a!.address}:${lobby.port}`);
console.log(`Jambot lobby on port ${lobby.port}.`);
console.log(`On this machine: ws://localhost:${lobby.port}`);
for (const address of addresses) console.log(`On the LAN: ${address}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => void lobby.close().then(() => process.exit(0)));
