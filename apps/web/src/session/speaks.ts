/**
 * The version of the session contract this app speaks (#553), the one switch
 * for both sides: a host speaks it and admits a client of it (`HostSession`),
 * and a client joins at it (`ClientSession`), reading each host by the
 * version its welcome says. 1 until the protocol moves to version 2 (rung 4).
 *
 * An address with `?speaks=2` speaks version 2 on that page alone
 * (`speaksIn`), so the end-to-end checks can play a session of version 2
 * before it is the default.
 */

/** The version of the session contract this app speaks, as a host and as a client. */
export const SESSION_SPEAKS: 1 | 2 = 1;

/** The version a page speaks: the one its address asks for (`?speaks=1` or `?speaks=2`), else `SESSION_SPEAKS`. */
export function speaksIn(search: string): 1 | 2 {
  const asked = new URLSearchParams(search).get('speaks');
  return asked === '2' ? 2 : asked === '1' ? 1 : SESSION_SPEAKS;
}
