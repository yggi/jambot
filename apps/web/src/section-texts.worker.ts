/**
 * The worker a section's cells text is built, compiled and played in
 * (`section-texts.ts`, #406): it answers every ask with `answerAsk`, and
 * nothing else.
 */

import { type Answer, type Ask, answerAsk } from './section-texts.ts';

interface WorkerScope {
  onmessage: ((event: { data: Ask }) => void) | null;
  postMessage(answer: Answer): void;
}

const scope = self as unknown as WorkerScope;
scope.onmessage = ({ data }) => scope.postMessage(answerAsk(data));
