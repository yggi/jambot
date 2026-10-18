// The app's entry: mounts `App.svelte` on `#app`; its player warms the rhythm repository at idle (#397).
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

mount(App, { target: document.getElementById('app')! });
