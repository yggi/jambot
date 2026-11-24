/**
 * The lobby under load: `node --experimental-strip-types load.ts [clients…]`.
 *
 * It runs the server in a process of its own and plays sessions against
 * it from this one: a host and 8 clients each, the host sending what the
 * session contract has it send at 120 bpm in 4/4: each bar's conduct of
 * 0.1 KB and a change to the bars ahead of 0.5 KB every 2 s, and each
 * section's score of 2.8 KB every 8 bars, 16 s (the sizes measured from the
 * band: the contract's conduct vector, and the presets' scores, 1.9 to 3.3 KB,
 * `section-texts.test.ts` in the app), each client pinging 4 times a second
 * and its host answering. For each number of clients it measures, over 20 s,
 * how long a conduct and a score take from its host to every client, a
 * ping's round trip, the server's CPU and its memory.
 *
 * The clients share one process and one core, so past some count this end
 * is what saturates, and the numbers say more about the machine than about
 * the server. Its CPU share, printed beside, tells.
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const counts = process.argv.slice(2).map(Number);
const CLIENTS = counts.length > 0 ? counts : [100, 500, 1000, 2000];
const PER_SESSION = 8;
const SECONDS = 20;
const PORT = 8799;
const CONDUCT = 'c'.repeat(100);
const SCORE = 's'.repeat(2800);
const AHEAD = 'y'.repeat(500);
/** How often a host sends a bar's conduct and the bars ahead, and a section's score, in ms: a bar and 8 bars at 120 bpm. */
const BAR_MS = 2000;
const SECTION_MS = 8 * BAR_MS;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const quantile = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? NaN : s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
};

/** The server's CPU seconds and resident memory, from /proc. */
function usage(pid: number) {
  const stat = readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1]!.split(' ');
  const ticks = Number(stat[11]) + Number(stat[12]);
  const rss = Number(readFileSync(`/proc/${pid}/statm`, 'utf8').split(' ')[1]) * 4096;
  return { cpu: ticks / 100, rss };
}

function open(): Promise<WebSocket> {
  const socket = new WebSocket(`ws://127.0.0.1:${PORT}`);
  return new Promise((resolve, reject) => {
    socket.onopen = () => resolve(socket);
    socket.onerror = reject;
  });
}

const first = (socket: WebSocket) =>
  new Promise<{ op: string }>((resolve) => {
    socket.onmessage = ({ data }) => resolve(JSON.parse(String(data)));
  });

async function round(clients: number) {
  const server = spawn(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', 'src/main.ts', '--port', String(PORT)],
    {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      stdio: 'ignore',
    },
  );
  await sleep(800);
  const sessions = Math.ceil(clients / PER_SESSION);
  const fanout: { conduct: number[]; score: number[] } = { conduct: [], score: [] };
  const trips: number[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  const sockets: WebSocket[] = [];
  let measuring = false;

  for (let s = 0; s < sessions; s++) {
    const host = await open();
    sockets.push(host);
    const hosted = first(host);
    host.send(JSON.stringify({ op: 'host', session: `load ${s}` }));
    await hosted;
    host.onmessage = ({ data }) => {
      const m = JSON.parse(String(data));
      if (m.op === 'heard' && m.message.kind === 'ping')
        host.send(
          JSON.stringify({
            op: 'send',
            to: m.from,
            message: { kind: 'pong', sent: m.message.sent, host: 0 },
          }),
        );
    };
    const members = Math.min(PER_SESSION, clients - s * PER_SESSION);
    for (let c = 0; c < members; c++) {
      const client = await open();
      sockets.push(client);
      const joined = first(client);
      client.send(JSON.stringify({ op: 'join', session: `load ${s}` }));
      await joined;
      client.onmessage = ({ data }) => {
        const m = JSON.parse(String(data));
        if (!measuring || m.op !== 'said') return;
        if (m.message.kind === 'conduct' || m.message.kind === 'score')
          fanout[m.message.kind as 'conduct' | 'score'].push(performance.now() - m.message.at);
        if (m.message.kind === 'pong') trips.push(performance.now() - m.message.sent);
      };
      timers.push(
        setInterval(
          () =>
            client.send(
              JSON.stringify({ op: 'tell', message: { kind: 'ping', sent: performance.now() } }),
            ),
          250,
        ),
      );
    }
    timers.push(
      setInterval(() => {
        host.send(
          JSON.stringify({
            op: 'send',
            message: { kind: 'conduct', at: performance.now(), sent: CONDUCT },
          }),
        );
        host.send(JSON.stringify({ op: 'send', message: { kind: 'forecast', sent: AHEAD } }));
      }, BAR_MS),
      setInterval(
        () =>
          host.send(
            JSON.stringify({
              op: 'send',
              message: { kind: 'score', at: performance.now(), sent: SCORE },
            }),
          ),
        SECTION_MS,
      ),
    );
  }

  await sleep(2000);
  measuring = true;
  const before = usage(server.pid!);
  const self = process.cpuUsage();
  await sleep(SECONDS * 1000);
  const after = usage(server.pid!);
  const selfCpu = process.cpuUsage(self);
  measuring = false;
  for (const t of timers) clearInterval(t);
  for (const s of sockets) s.close();
  server.kill();
  await sleep(300);

  const ms = (x: number) => `${x.toFixed(1)} ms`;
  console.log(
    `${clients} clients in ${sessions} sessions: ` +
      `conduct to client p50 ${ms(quantile(fanout.conduct, 0.5))}, p99 ${ms(quantile(fanout.conduct, 0.99))}, max ${ms(Math.max(...fanout.conduct))}; ` +
      `score to client p50 ${ms(quantile(fanout.score, 0.5))}, max ${ms(Math.max(...fanout.score))}; ` +
      `ping p50 ${ms(quantile(trips, 0.5))}, p99 ${ms(quantile(trips, 0.99))}; ` +
      `server CPU ${((100 * (after.cpu - before.cpu)) / SECONDS).toFixed(0)} %, ` +
      `memory ${(after.rss / 2 ** 20).toFixed(0)} MB; ` +
      `load CPU ${((100 * (selfCpu.user + selfCpu.system)) / 1e6 / SECONDS).toFixed(0)} %`,
  );
}

for (const clients of CLIENTS) await round(clients);
