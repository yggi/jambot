/**
 * `@strudel/mini` ships no types (L4): the surface a conformance test reads
 * from `mini(text).queryArc(begin, end)`, an event's start and its value.
 */
declare module '@strudel/mini' {
  export function mini(pattern: string): {
    queryArc(begin: number, end: number): { whole: { begin: unknown }; value: unknown }[];
  };
}
