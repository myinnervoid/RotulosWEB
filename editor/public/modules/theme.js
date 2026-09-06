/**
 * ============================================================
 * 🎨 theme.js — Gestor de Modo Oscuro, Claro y Sistema
 * Rótulos Web / Memexicanísimos Studio v5.0
 * ============================================================
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';

export const THEME_STORAGE_KEY = 'rotulos_theme';
export const LEGACY_THEME_KEY = 'memex-theme';

/**
 * Obtiene el tema actual configurado en el documento o almacenamiento
 * @returns {string} 'dark' | 'light' | 'patria' | 'oscuro' | 'claro'
 */
export function getCurrentTheme() {
  if (typeof document !== 'undefined' && document.documentElement) {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'dark';
  }
  return 'dark';
}

/**
 * Aplica un tema visual al documento y actualiza la UI
 * @param {string} theme - 'dark' | 'light' | 'patria' | 'oscuro' | 'claro'
 */
export function applyTheme(theme) {
  if (!theme) return;
  const normalized = theme.toLowerCase().trim();

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', normalized);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
      localStorage.setItem(LEGACY_THEME_KEY, normalized);
    } catch {}
  }

  updateThemeIcon(normalized);

  // Sincronizar con select de temas en el drawer si existe
  if (typeof document !== 'undefined') {
    const select = document.getElementById('theme-selector');
    if (select) {
      if (['patria', 'oscuro', 'claro'].includes(normalized)) {
        select.value = normalized;
      } else if (normalized === 'dark') {
        select.value = 'oscuro';
      } else if (normalized === 'light') {
        select.value = 'claro';
      }
    }
  }

  eventBus.publish(EDITOR_EVENTS.THEME_CHANGED, { theme: normalized });
}

/**
 * Actualiza el ícono y tooltip del botón de alternancia de tema
 * @param {string} theme
 */
export function updateThemeIcon(theme) {
  if (typeof document === 'undefined') return;
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;

  const isLight = theme === 'light' || theme === 'claro';
  const icon = isLight ? '🌙' : '☀️';
  const title = isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

  const iconEl = btn.querySelector('.theme-icon');
  if (iconEl) {
    iconEl.textContent = icon;
  } else {
    btn.innerHTML = `<span class="theme-icon">${icon}</span>`;
  }
  btn.title = title;
  btn.setAttribute('aria-label', title);
}

/**
 * Inicializa el sistema de temas detectando preferencias del usuario o del sistema
 */
export function initTheme() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let theme = null;
  try {
    theme = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
  } catch {}

  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'patria';
  }

  applyTheme(theme);

  // 1. Conectar botón de alternancia en la barra de herramientas
  const themeToggle = document.getElementById('btn-theme-toggle');
  if (themeToggle && !themeToggle.dataset.themeBound) {
    themeToggle.dataset.themeBound = 'true';
    themeToggle.addEventListener('click', () => {
      const current = getCurrentTheme();
      const next = (current === 'dark' || current === 'oscuro' || current === 'patria')
        ? 'light'
        : 'dark';
      applyTheme(next);
    });
  }

  // 2. Conectar selector del drawer si existe
  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect && !themeSelect.dataset.themeBound) {
    themeSelect.dataset.themeBound = 'true';
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  // 3. Escuchar cambios de preferencia del sistema si el usuario no tiene preferencia forzada
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      let saved = null;
      try {
        saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY);
      } catch {}
      if (!saved) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onChange);
    }
  }
}
