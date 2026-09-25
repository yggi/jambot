import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import App from './App.svelte';

it('links to the playable prototype', () => {
  render(App);
  expect(screen.getByRole('heading', { name: 'Jambot' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'prototype' })).toHaveAttribute(
    'href',
    '/prototype.html',
  );
});
