/**
 * Tests para el módulo i18n.js
 * Usa Vitest con jsdom para DOM mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Polyfill mínimo de localStorage para jsdom
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock de fetch
global.fetch = vi.fn();

// Importar después de definir mocks
const { loadTranslations, applyTranslations, t, getCurrentLang } = await import('../public/modules/i18n.js');

describe('i18n — t()', () => {
  it('devuelve el fallback cuando no hay traducciones cargadas', () => {
    expect(t('btn_save', 'Guardar')).toBe('Guardar');
  });

  it('devuelve empty string si no hay fallback', () => {
    expect(t('clave_inexistente')).toBe('');
  });
});

describe('i18n — loadTranslations()', () => {
  it('carga traducciones correctamente desde fetch mock', async () => {
    const mockTranslations = { btn_save: 'Save', btn_publish: 'Publish' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTranslations
    });

    await loadTranslations('en');

    expect(t('btn_save', 'fallback')).toBe('Save');
    expect(t('btn_publish', 'fallback')).toBe('Publish');
  });

  it('no lanza error si fetch falla', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(loadTranslations('fr')).resolves.toBeUndefined();
  });
});

describe('i18n — applyTranslations()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span data-i18n="btn_save">Guardar</span>
      <button data-i18n-title="btn_publish" title="">Publicar</button>
    `;
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ btn_save: 'Save', btn_publish: 'Publish' })
    });
  });

  it('aplica traducciones a elementos con data-i18n', async () => {
    await loadTranslations('en');
    applyTranslations();
    const el = document.querySelector('[data-i18n="btn_save"]');
    expect(el.textContent).toBe('Save');
  });

  it('aplica traducciones a atributos title con data-i18n-title', async () => {
    await loadTranslations('en');
    applyTranslations();
    const el = document.querySelector('[data-i18n-title="btn_publish"]');
    expect(el.title).toBe('Publish');
  });
});
