/**
 * The worker the tuner's analysis runs in (`analysis.ts`): it answers every
 * request with `answer`, and nothing else.
 */

import { answer, type Reply, type Request } from './analysis.ts';

interface WorkerScope {
  onmessage: ((event: { data: Request }) => void) | null;
  postMessage(reply: Reply): void;
}

const scope = self as unknown as WorkerScope;
scope.onmessage = ({ data }) => scope.postMessage(answer(data));
