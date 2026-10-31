// The app's entry: mounts `App.svelte` on `#app`; its player warms the rhythm repository at idle (#397).
// Once mounted it tells the boot guard (index.html), which otherwise reports a page that stayed blank.
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

mount(App, { target: document.getElementById('app')! });
// The app started: the boot guard in index.html stands down.
window.jambotBooted = true;
document.getElementById('boot-failure')?.remove();
