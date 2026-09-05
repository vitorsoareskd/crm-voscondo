import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Desativa globalmente a alteração de valores em campos numéricos (input type="number") ao rolar o scroll do mouse
if (typeof window !== 'undefined') {
  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'number') {
        active.blur();
      }
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur();
      }
    },
    { capture: true, passive: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

