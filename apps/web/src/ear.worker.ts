/**
 * The worker the band is heard in (`ear.ts`, #495): it answers every ask
 * with its one recogniser (`earWorker`), and nothing else.
 */

import { type EarAnswer, type EarAsk, earWorker } from './ear.ts';

interface WorkerScope {
  onmessage: ((event: { data: EarAsk }) => void) | null;
  postMessage(answer: EarAnswer): void;
}

const answer = earWorker();
const scope = self as unknown as WorkerScope;
scope.onmessage = ({ data }) => scope.postMessage(answer(data));
