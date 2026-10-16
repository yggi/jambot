import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Shell, { type Place } from './Shell.svelte';

const DRAWER: Place[] = [
  { id: 'sound', title: 'Sound', icon: 'sound' },
  { id: 'style', title: 'Style', icon: 'style' },
];
const VIEWS: Place[] = [
  { id: 'song', title: 'Song', icon: 'song' },
  { id: 'mix', title: 'Mix', icon: 'mix' },
];

const header = createRawSnippet(() => ({ render: () => '<p>the transport</p>' }));
const sheet = createRawSnippet((id: () => string) => ({
  render: () => `<p>the ${id()} sheet</p>`,
}));
const stage = createRawSnippet((id: () => string) => ({
  render: () => `<p>the ${id()} view</p>`,
}));

const draw = () => render(Shell, { header, drawer: DRAWER, sheet, views: VIEWS, stage });
const rider = (name: string) =>
  within(screen.getByRole('navigation', { name: 'Drawer' })).getByRole('button', { name });

describe('the shell', () => {
  it('has the header on top, a rider for each section, and a tab for each view, the first shown', () => {
    draw();
    expect(screen.getByText('the transport')).toBeVisible();
    expect(rider('Sound')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('tab').map((t) => t.textContent?.trim())).toEqual(['Song', 'Mix']);
    expect(screen.getByRole('tab', { name: 'Song' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('the song view')).toBeVisible();
    expect(screen.getByText('the mix view')).not.toBeVisible();
  });

  it('keeps every sheet and view mounted, and hides those not shown', () => {
    draw();
    for (const text of ['the sound sheet', 'the style sheet', 'the mix view'])
      expect(screen.getByText(text)).not.toBeVisible();
  });

  it('drops a section’s sheet when its rider is tapped, one at a time, and takes it up on a second tap', async () => {
    draw();
    await fireEvent.click(rider('Sound'));
    expect(rider('Sound')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('the sound sheet')).toBeVisible();
    await fireEvent.click(rider('Style'));
    expect(screen.getByText('the sound sheet')).not.toBeVisible();
    expect(screen.getByText('the style sheet')).toBeVisible();
    await fireEvent.click(rider('Style'));
    expect(screen.getByText('the style sheet')).not.toBeVisible();
  });

  it('lays a sheet over the view, which stays as it is underneath', async () => {
    draw();
    await fireEvent.click(rider('Sound'));
    expect(screen.getByText('the song view')).toBeVisible();
  });

  it('takes the sheet up from its grab, from the scrim, or when a view is chosen', async () => {
    draw();
    await fireEvent.click(rider('Sound'));
    await fireEvent.click(screen.getByRole('button', { name: 'Hide Sound' }));
    expect(screen.getByText('the sound sheet')).not.toBeVisible();
    await fireEvent.click(rider('Sound'));
    await fireEvent.click(screen.getByRole('button', { name: 'Close the drawer' }));
    expect(screen.getByText('the sound sheet')).not.toBeVisible();
    await fireEvent.click(rider('Sound'));
    await fireEvent.click(screen.getByRole('tab', { name: 'Mix' }));
    expect(screen.getByText('the sound sheet')).not.toBeVisible();
    expect(screen.getByText('the mix view')).toBeVisible();
    expect(screen.getByText('the song view')).not.toBeVisible();
  });

  it('names each view by its tab', () => {
    draw();
    expect(screen.getByRole('tabpanel', { name: 'Song' })).toHaveTextContent('the song view');
  });
});
