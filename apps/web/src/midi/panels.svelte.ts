/**
 * The control panels of the MIDI page (yggi/webmidi decisions 005 and 007):
 * the library kept under `PANELS_KEY` (webmidi's `localPanelStore`), the
 * setup's active panels playing in a `PanelRack`, and what a panel and an
 * input say sent where the patch crosses them.
 *
 * A panel's row is routed like an input's, in the context `band`: a touch
 * goes out to the outputs the row crosses (`forwardsOf`, through `send`) and
 * to the panels whose column it crosses (`panelForwardsOf`); an input's
 * message (raw, from `heard`) goes to the panels its row crosses. Jambot's
 * own rows (the parts, the keys) are sent from notes, not bytes, so no panel
 * crosses them (decision 007). What a panel plays (its row's Plays choice,
 * the amendment to 007) is `plays`'s: `Device` sends a note a panel's choice
 * hears the way an input's note goes.
 *
 * A panel taken out of the setup, or edited, is silenced first, its note-offs
 * sent by the book of before the change, so a held note ends where it began.
 */
import {
  type Forward,
  type SetupBook,
  activeSetup,
  forwardsOf,
  panelForwardsOf,
  panelKey,
  panelsOf,
  withPanelActive,
} from '@yggi/webmidi/core';
import {
  EXAMPLE_MIXER,
  EXAMPLE_PLAY,
  type Panel,
  type PanelLibrary,
  type PanelRuntime,
  type PanelStore,
  PanelRack,
  loadLibrary,
  panelOf,
  removePanel,
  withPanel,
} from '@yggi/webmidi/panels';
import { localPanelStore } from '@yggi/webmidi/web';
import { BAND } from './patch.ts';

/** Where the panels' library is kept. */
export const PANELS_KEY = 'jambot:midi-panels';

export interface PanelDeckOptions {
  /**
   * The book of setups: read for the routes, written to add and take out a panel. Whoever owns it calls `adopt` after
   * a change of it (`MidiSettings`' `onchange`), so a panel gone from the setup is released by the book before.
   */
  readonly settings: { book: SetupBook };
  /** Send each message to its output, by key. */
  readonly send: (forwards: readonly Forward[]) => void;
  /**
   * What a panel's message plays (`Device`: the path an input's note takes to the keys and the instruments, by
   * `panelPartPlayed`), given with the book it is routed by: the panel's own choice decides, none by default.
   */
  readonly plays?: (panel: string, data: ArrayLike<number>, book: SetupBook) => void;
  /** Where the library is kept: `localStorage` under `PANELS_KEY` by default. */
  readonly store?: PanelStore;
}

export class PanelDeck {
  library: PanelLibrary = $state.raw({ version: 1, panels: [] });
  /** The panel being played or edited, by id. */
  shown: string | null = $state(null);
  /** Bumped when the rack's runtimes change, for what draws one. */
  #racked = $state(0);
  /** The book as the rack last took it up: a panel taken out is released by it. */
  #synced: SetupBook;
  readonly #rack = new PanelRack();
  readonly #store: PanelStore;
  readonly #settings: { book: SetupBook };
  readonly #send: (forwards: readonly Forward[]) => void;
  readonly #plays: PanelDeckOptions['plays'];

  constructor({ settings, send, plays, store = localPanelStore(PANELS_KEY) }: PanelDeckOptions) {
    this.#settings = settings;
    this.#send = send;
    this.#plays = plays;
    this.#store = store;
    this.#synced = settings.book;
    const kept = loadLibrary(store);
    // (a first visit has the two examples to start from; a library emptied by a person stays empty)
    this.library =
      kept.panels.length || store.load() !== null
        ? kept
        : { version: 1, panels: [EXAMPLE_MIXER, EXAMPLE_PLAY] };
    this.adopt();
  }

  /** The setup's active panels that the library has, in the setup's order. */
  get active(): Panel[] {
    return panelsOf(activeSetup(this.#settings.book)).flatMap(
      (id) => panelOf(this.library, id) ?? [],
    );
  }

  /** A panel's runtime, to draw and to play; undefined when it isn't active or the library lacks it. */
  runtimeOf(id: string | null): PanelRuntime | undefined {
    void this.#racked;
    return id === null ? undefined : this.#rack.runtime(id);
  }

  /** The setup in use taken up: its panels playing, those taken out or changed silenced by the book before. */
  adopt(): void {
    const book = this.#settings.book;
    const ids = panelsOf(activeSetup(book));
    for (const released of this.#rack.sync(ids, this.library))
      this.#route(released.panel, released.data, this.#synced);
    this.#synced = book;
    this.#racked++;
    if (this.shown !== null && !ids.includes(this.shown)) this.shown = null;
    this.shown ??= ids.find((id) => panelOf(this.library, id)) ?? null;
  }

  /** A message a panel made, sent where its row is crossed in `book` (to outputs, and to panels) and played where its choice says. */
  #route(panel: string, data: ArrayLike<number>, book: SetupBook = this.#settings.book): void {
    const row = panelKey(panel);
    this.#send(forwardsOf(book, BAND, row, data));
    this.#rack.receive(panelForwardsOf(book, BAND, row, data));
    this.#plays?.(panel, data, book);
  }

  /** A message a panel made, by a touch: sent on its row. */
  played(id: string, data: ArrayLike<number>): void {
    this.#route(id, data);
  }

  /** A raw message from an input, by its port's name: handed to the panels its row crosses. */
  heard(source: string, data: ArrayLike<number>): void {
    this.#rack.receive(panelForwardsOf(this.#settings.book, BAND, { id: '', name: source }, data));
  }

  /** Every panel's held notes released, sent on their rows. */
  silence(): void {
    for (const panel of this.active)
      for (const data of this.#rack.runtime(panel.id)?.silence() ?? []) this.played(panel.id, data);
  }

  #keep(library: PanelLibrary): void {
    this.library = library;
    this.#store.save(library);
    this.adopt();
  }

  /** A panel changed in the editor: kept, and played anew where it is active (its notes released first). */
  edit(panel: Panel): void {
    this.#keep(withPanel(this.library, panel));
  }

  /** A new, empty panel in the library, active in the setup in use and shown: its id. */
  create(): string {
    let n = this.library.panels.length + 1;
    while (panelOf(this.library, `p${n}`)) n++;
    const id = `p${n}`;
    this.#keep(withPanel(this.library, { id, name: `Panel ${n}`, children: [] }));
    this.#settings.book = withPanelActive(this.#settings.book, id, true);
    this.shown = id;
    return id;
  }

  /** A panel taken out of the library, and out of the setup in use with its routes. */
  remove(id: string): void {
    this.#settings.book = withPanelActive(this.#settings.book, id, false);
    this.#keep(removePanel(this.library, id));
  }
}
