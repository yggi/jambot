import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeterPlayer } from '../meter/meter-player.svelte.ts';
import { setup, surroundings } from '../timing-test/fixtures.ts';
import { correctionWorld, tone, world } from '../tune/fixtures.ts';
import { LiveCorrection } from '../tune/live-correction.svelte.ts';
import { ToneSender } from '../tune/sender.svelte.ts';
import { TICK_MS, Tuner } from '../tune/tuner.svelte.ts';
import Door from './Door.svelte';

const sound = createRawSnippet(() => ({ render: () => '<p>the sound card</p>' }));
const counters = createRawSnippet(() => ({ render: () => '<p>the counters</p>' }));

/** The door over an extra of each kind driven by hand, and the lobby's callbacks. */
function shown(more: { counters?: typeof counters; restoring?: boolean } = {}) {
  const heard = world();
  heard.heard.signal = tone(440, 12);
  const tuner = new Tuner({ mic: heard.source, analyse: heard.analyseHere });
  const sender = new ToneSender({
    ports: () => [],
    port: () => null,
    synth: () => ({ currentTime: 0, play: () => {}, silence: () => {} }),
  });
  const correction = new LiveCorrection({
    mic: correctionWorld().micSource,
    moduleUrl: '/correct.js',
  });
  const room = surroundings();
  const metronome = new MeterPlayer({ audio: () => ({ base: room.base, offset: room.offset }) });
  const { test } = setup();
  const lobby = {
    suggest: () => 'Bright Attic',
    found: { sessions: [{ name: 'Garage', players: 3, where: 'local' as const }], problem: null },
    joining: false,
    notice: null,
    onsolo: vi.fn(),
    onhost: vi.fn(() => Promise.resolve()),
    onjoin: vi.fn(),
  };
  const ondrop = vi.fn();
  render(Door, {
    lobby,
    you: { name: 'Curious Otter', onname: vi.fn(), onsettle: vi.fn(), onregenerate: vi.fn() },
    settings: { theme: 'system', ontheme: vi.fn(), address: '', onaddress: vi.fn() },
    restoring: more.restoring ?? false,
    ondrop,
    tuner,
    sender,
    correction,
    metronome,
    test,
    onexport: vi.fn(),
    sound,
    counters: more.counters,
  });
  return { tuner, metronome, test, lobby, ondrop };
}

const tab = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
const riders = () =>
  within(screen.getByRole('navigation', { name: 'Drawer' }))
    .getAllByRole('button')
    .map((b) => b.textContent?.trim());

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
afterEach(() => vi.useRealTimers());

describe('the door', () => {
  it('opens on the lobby, under the page’s name, the person’s, and how many sessions are open', () => {
    shown();
    expect(screen.getAllByRole('tab').map((t) => t.textContent?.trim())).toEqual([
      'Play',
      'Tune',
      'Meter',
      'Timing',
    ]);
    expect(screen.getByRole('tab', { name: 'Play' })).toHaveAttribute('aria-selected', 'true');
    const banner = screen.getByRole('region', { name: 'Lobby' });
    expect(banner).toHaveTextContent('Jambot');
    expect(banner).toHaveTextContent('Curious Otter · in the lobby');
    expect(banner).toHaveTextContent('1 open');
    expect(screen.getByRole('button', { name: 'Solo' })).toBeVisible();
  });

  it('keeps what belongs to the person and the device in the drawer', async () => {
    shown();
    expect(riders()).toEqual(['Sound', 'You', 'Settings', 'About']);
    await fireEvent.click(screen.getByRole('button', { name: 'You' }));
    expect(screen.getByLabelText('Your name')).toBeVisible();
    expect(screen.getByLabelText('Your name')).toHaveValue('Curious Otter');
  });

  it('keeps the timing counters in the drawer where the address asks for them', () => {
    shown({ counters });
    expect(riders()).toEqual(['Sound', 'You', 'Settings', 'About', 'Counters']);
  });

  it('starts and stops the tuner from its header, which reads the note heard', async () => {
    const { tuner } = shown();
    await tab('Tune');
    const transport = within(screen.getByRole('region', { name: 'Transport' }));
    expect(transport.getByText('Tuner')).toBeInTheDocument();
    expect(transport.getByText('Not listening')).toBeInTheDocument();
    await fireEvent.click(transport.getByRole('button', { name: 'Start' }));
    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect(tuner.status).toBe('listening');
    expect(transport.getByText(/^A4 · \+1[12] ¢$/)).toBeInTheDocument();
    await fireEvent.click(transport.getByRole('button', { name: 'Stop' }));
    expect(tuner.status).toBe('idle');
  });

  it('plays and stops the metronome from its header, under the bar’s meter', async () => {
    const { metronome } = shown();
    await tab('Meter');
    const transport = within(screen.getByRole('region', { name: 'Transport' }));
    expect(transport.getByText('4/4')).toBeInTheDocument();
    expect(transport.getByText('100 BPM · swing 50 %')).toBeInTheDocument();
    await fireEvent.click(transport.getByRole('button', { name: 'Play' }));
    expect(metronome.playing).toBe(true);
    await fireEvent.click(transport.getByRole('button', { name: 'Stop' }));
    expect(metronome.playing).toBe(false);
  });

  it('starts and stops the timing test from its header', async () => {
    const { test } = shown();
    await tab('Timing');
    const transport = within(screen.getByRole('region', { name: 'Transport' }));
    expect(transport.getByText('Quarters · 100 BPM')).toBeInTheDocument();
    await fireEvent.click(transport.getByRole('button', { name: 'Start the test' }));
    await vi.waitFor(() => expect(test.phase).toBe('playing'));
    expect(transport.getByText('Follow every hit')).toBeInTheDocument();
    await fireEvent.click(transport.getByRole('button', { name: 'Stop' }));
    expect(test.phase).toBe('idle');
  });

  it('has no loop in an extra’s header, since an extra has no song to hold', async () => {
    shown();
    for (const view of ['Tune', 'Meter', 'Timing']) {
      await tab(view);
      expect(screen.queryByRole('button', { name: /loop/i })).toBeNull();
    }
  });

  it('says a session is being taken up again, and lets it go', async () => {
    const { ondrop } = shown({ restoring: true });
    expect(screen.getByRole('status')).toHaveTextContent('Taking up your session again…');
    await fireEvent.click(screen.getByRole('button', { name: 'Drop session' }));
    expect(ondrop).toHaveBeenCalledOnce();
  });
});
