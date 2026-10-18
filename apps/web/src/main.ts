// The app's entry: mounts `App.svelte` on `#app`, and warms the rhythm repository at idle (#397).
import { RHYTHM_BENCHES, RHYTHM_REPOSITORY } from '@jambot/engine';
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { warmAtIdle } from './warm.ts';

mount(App, { target: document.getElementById('app')! });
warmAtIdle(RHYTHM_REPOSITORY.warm?.(RHYTHM_BENCHES) ?? []);
