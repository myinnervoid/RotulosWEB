import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyTheme, initTheme, getCurrentTheme, updateThemeIcon, THEME_STORAGE_KEY } from '../public/modules/theme.js';
import { eventBus } from '../public/modules/event-bus.js';
import { EDITOR_EVENTS } from '../public/modules/editor-events.js';

describe('Theme & Accessibility Suite — Modo Oscuro y Accesibilidad (Fase 3)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = `
      <header>
        <button id="btn-theme-toggle" aria-label="Cambiar tema">
          <span class="theme-icon">🌙</span>
        </button>
        <select id="theme-selector">
          <option value="patria">Patria</option>
          <option value="oscuro">Oscuro</option>
          <option value="claro">Claro</option>
        </select>
      </header>
    `;
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('applyTheme("dark") aplica el atributo data-theme y persiste en localStorage', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(getCurrentTheme()).toBe('dark');
  });

  it('applyTheme("light") actualiza data-theme e icono a luna', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    const icon = document.querySelector('#btn-theme-toggle .theme-icon');
    expect(icon.textContent).toBe('🌙');
  });

  it('applyTheme("dark") actualiza el icono a sol para indicar cambio a claro', () => {
    applyTheme('dark');
    const icon = document.querySelector('#btn-theme-toggle .theme-icon');
    expect(icon.textContent).toBe('☀️');
  });

  it('applyTheme sincroniza con el select del drawer', () => {
    applyTheme('oscuro');
    const select = document.getElementById('theme-selector');
    expect(select.value).toBe('oscuro');

    applyTheme('claro');
    expect(select.value).toBe('claro');
  });

  it('applyTheme emite el evento THEME_CHANGED en eventBus', () => {
    const listener = vi.fn();
    const unsub = eventBus.subscribe(EDITOR_EVENTS.THEME_CHANGED, listener);

    applyTheme('dark');
    expect(listener).toHaveBeenCalledWith({ theme: 'dark' });

    unsub();
  });

  it('initTheme() recupera y aplica tema guardado en localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('clic en #btn-theme-toggle alterna entre modo oscuro y claro', () => {
    initTheme();
    applyTheme('dark');

    const btn = document.getElementById('btn-theme-toggle');
    btn.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    btn.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('updateThemeIcon actualiza correctamente aria-label y title', () => {
    updateThemeIcon('light');
    const btn = document.getElementById('btn-theme-toggle');
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
    expect(btn.title).toBe('Cambiar a modo oscuro');

    updateThemeIcon('dark');
    expect(btn.getAttribute('aria-label')).toBe('Cambiar a modo claro');
    expect(btn.title).toBe('Cambiar a modo claro');
  });
});
