import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import UpdateToast from './UpdateToast.svelte';
import Version from './Version.svelte';
import { update } from '../update.svelte.ts';

describe('the version', () => {
  it('shows the first 7 characters of the commit, small', () => {
    render(Version);
    expect(screen.getByRole('button', { name: /Version 0123456/ })).toHaveTextContent('0123456');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a sheet with the commit in full, the branch, the date and the dependencies, and closes it again', async () => {
    render(Version);
    await fireEvent.click(screen.getByRole('button', { name: /Version 0123456/ }));
    const sheet = screen.getByRole('dialog', { name: 'Version' });
    expect(sheet).toHaveTextContent('0123456789abcdef0123456789abcdef01234567');
    expect(sheet).toHaveTextContent('main');
    expect(sheet).toHaveTextContent('2026-10-17 14:03 UTC');
    expect(sheet).toHaveTextContent('@yggi/cells');
    expect(sheet).toHaveTextContent('v0.2.0');
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('a waiting update', () => {
  it('is offered by the toast until Later, and by the sheet after it', async () => {
    update.ready = true;
    update.hushed = false;
    render(UpdateToast);
    render(Version);
    expect(screen.getByRole('status')).toHaveTextContent('New version ready');
    await fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('status')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: /Version 0123456/ }));
    expect(screen.getByRole('status')).toHaveTextContent('A new version is ready');
    update.ready = false;
    update.hushed = false;
  });
});
