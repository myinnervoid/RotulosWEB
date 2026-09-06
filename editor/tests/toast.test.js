/**
 * Tests para el módulo toast.js
 */

import { describe, it, expect, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('toast — showToast()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast">
        <span id="toast-msg"></span>
      </div>
    `;
  });

  it('muestra el mensaje en el toast', async () => {
    const { showToast } = await import('../public/modules/toast.js');
    showToast('¡Guardado exitoso!');
    const msg = document.getElementById('toast-msg');
    expect(msg.textContent).toBe('¡Guardado exitoso!');
  });

  it('añade clase show al toast', async () => {
    const { showToast } = await import('../public/modules/toast.js');
    showToast('Hola');
    const toast = document.getElementById('toast');
    expect(toast.classList.contains('show')).toBe(true);
  });

  it('aplica color de error cuando isError es true', async () => {
    const { showToast } = await import('../public/modules/toast.js');
    showToast('Error crítico', true);
    const toast = document.getElementById('toast');
    // jsdom normaliza hex → rgb(); verificamos que el color sea el rojo de la bandera
    expect(toast.style.borderColor).toMatch(/rgb\(206,\s*17,\s*38\)|#CE1126/i);
  });

  it('aplica color de éxito cuando isError es false', async () => {
    const { showToast } = await import('../public/modules/toast.js');
    showToast('OK');
    const toast = document.getElementById('toast');
    // jsdom normaliza hex → rgb(); verificamos el verde patrio
    expect(toast.style.borderColor).toMatch(/rgb\(0,\s*104,\s*71\)|#006847/i);
  });
});

describe('toast — getPublishState() / setPublishState()', () => {
  it('estado inicial es IDLE', async () => {
    const { getPublishState } = await import('../public/modules/toast.js');
    expect(getPublishState()).toBe('IDLE');
  });

  it('setPublishState cambia el estado', async () => {
    const { setPublishState, getPublishState } = await import('../public/modules/toast.js');
    setPublishState('PENDING');
    expect(getPublishState()).toBe('PENDING');
    setPublishState('IDLE');
  });
});

describe('toast — updatePublishUI()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast"><span id="toast-msg"></span></div>
      <button id="btn-publish"></button>
    `;
  });

  it('en estado IDLE el botón está habilitado', async () => {
    const { updatePublishUI } = await import('../public/modules/toast.js');
    updatePublishUI('IDLE');
    const btn = document.getElementById('btn-publish');
    expect(btn.disabled).toBe(false);
  });

  it('en estado PENDING el botón está deshabilitado', async () => {
    const { updatePublishUI } = await import('../public/modules/toast.js');
    updatePublishUI('PENDING');
    const btn = document.getElementById('btn-publish');
    expect(btn.disabled).toBe(true);
  });

  it('en estado FAULT el botón vuelve a estar habilitado', async () => {
    const { updatePublishUI } = await import('../public/modules/toast.js');
    updatePublishUI('FAULT', 'Error de red');
    const btn = document.getElementById('btn-publish');
    expect(btn.disabled).toBe(false);
  });
});
