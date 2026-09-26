/**
 * Machines: the shape of every level of the engine.
 *
 * A machine advances one position at a time, such as a bar or a section.
 * Each advance reads an environment, carries state on to the next advance,
 * hears an input and writes an output:
 *
 *     advance(env, carried, input) → { carried', output }
 *
 * - The **environment** is what follows from the position: the seed, the
 *   style there, the plan. Randomness is keyed by seed and position
 *   (`random.ts`), so it is read, never carried.
 * - The **carried state** is what depends on the path taken, such as where
 *   the voices were. It is plain data, so a snapshot can be stored, sent or
 *   replayed, and composing can resume from any snapshot.
 * - The **input** is what people did: a preset, a slider, notes played.
 *
 * This is a Mealy machine, and it is the whole contract: the same arguments
 * give the same result, nothing is kept out of sight, and nothing given is
 * changed. `lawBreaks` checks exactly that.
 */

export interface Transition<Carried, Output> {
  readonly carried: Carried;
  readonly output: Output;
}

export interface Machine<Env, Carried, Input, Output> {
  /** The carried state before the first advance. */
  readonly initial: Carried;
  advance(env: Env, carried: Carried, input: Input): Transition<Carried, Output>;
}

/** What a machine is run over: an environment and an input per advance. */
export type Script<Env, Input> = readonly { readonly env: Env; readonly input: Input }[];

/**
 * The machine's laws that a run over the script breaks, once per law, at the
 * first advance that breaks it:
 *
 * - advancing leaves the environment, the carried state and the input as
 *   they were;
 * - the carried state survives JSON unchanged;
 * - running the script twice gives the same outputs and carried states;
 * - advancing from a JSON snapshot of the carried state gives what the run
 *   gave.
 */
export function lawBreaks<Env, Carried, Input, Output>(
  machine: Machine<Env, Carried, Input, Output>,
  script: Script<Env, Input>,
): string[] {
  const breaks = new Map<string, string>();
  const report = (law: string, message: string) => {
    if (!breaks.has(law)) breaks.set(law, message);
  };

  const run = () => {
    let carried = machine.initial;
    return script.map(({ env, input }, i) => {
      const given = copyData({ env, carried, input });
      const next = machine.advance(env, carried, input);
      if (!sameData(given, { env, carried, input }))
        report('given', `advance ${i}: advancing changed what it was given`);
      const before = carried;
      carried = next.carried;
      return { before, ...next };
    });
  };

  const first = run();
  const second = run();
  first.forEach((advanced, i) => {
    if (!sameData(advanced, second[i]))
      report('same', `advance ${i}: the same inputs gave another output`);
  });

  first.forEach(({ before, carried, output }, i) => {
    const snapshot = throughJson(before);
    if (!sameData(snapshot, before)) {
      report('json', `before advance ${i}: the carried state does not survive JSON`);
      return;
    }
    const { env, input } = script[i]!;
    const resumed = machine.advance(env, snapshot as Carried, input);
    if (!sameData(resumed, { carried, output }))
      report(
        'resume',
        `advance ${i}: advancing from a snapshot of the carried state gave another output`,
      );
  });

  return [...breaks.values()];
}

/** x written as JSON and read back; a value JSON cannot write at all comes back as a symbol. */
function throughJson(x: unknown): unknown {
  const text = JSON.stringify(x);
  return text === undefined ? Symbol('not JSON') : JSON.parse(text);
}

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' &&
  x !== null &&
  [Object.prototype, null].includes(Object.getPrototypeOf(x) as object | null);

/** A deep copy of arrays and plain objects; anything else is shared. */
function copyData(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(copyData);
  if (isPlainObject(x))
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, copyData(v)]));
  return x;
}

/**
 * Whether two values are the same data: primitives by `Object.is`, arrays and
 * plain objects by their contents. Anything else is the same only as itself.
 */
function sameData(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => sameData(x, b[i]));
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((k) => Object.hasOwn(b, k) && sameData(a[k], b[k]))
    );
  }
  return false;
}
