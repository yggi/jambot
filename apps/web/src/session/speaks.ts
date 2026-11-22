/**
 * The version of the session contract this app speaks (#553), the one switch
 * for both sides: a host speaks it and admits a client of it (`HostSession`),
 * and a client joins at it and leaves a host of another (`ClientSession`), as
 * the contract's rollout has Jambot's host and client move in one deploy.
 *
 * Version 2 since rung 4. Version 1's code stays behind the classes' `speaks`
 * option, which only tests set, until it is removed.
 */

/** The version of the session contract this app speaks, as a host and as a client. */
export const SESSION_SPEAKS: 1 | 2 = 2;
