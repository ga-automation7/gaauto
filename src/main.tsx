import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/global.css';
import { App } from './App';
import { prefersReducedMotion } from './lib/device';

// Motion mode is decided once, before first paint, and exposed to CSS.
document.documentElement.dataset.motion = prefersReducedMotion() ? 'reduced' : 'full';

// Always start the film from the beginning; restoring a mid-film scroll
// position would drop the visitor into an arbitrary frame.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!window.location.hash) window.scrollTo(0, 0);

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
