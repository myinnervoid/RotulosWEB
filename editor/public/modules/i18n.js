/**
 * ============================================================
 * 🌐 i18n.js — Motor de Internacionalización
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

let currentLang = localStorage.getItem('memex-lang') || 'es';
let translations = {};

/**
 * Carga el archivo de traducciones para el idioma dado.
 * @param {string} lang - Código de idioma, p.ej. 'es', 'en'
 */
export async function loadTranslations(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    translations = await res.json();
    currentLang = lang;
    applyTranslations();
  } catch (err) {
    console.warn('[i18n] Error cargando traducciones:', err);
  }
}

/**
 * Aplica las traducciones cargadas al DOM vía atributos data-i18n y data-i18n-title.
 */
export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (translations[key]) {
      el.title = translations[key];
    }
  });
}

/**
 * Obtiene una cadena traducida por clave, con fallback.
 * @param {string} key
 * @param {string} [fallback='']
 * @returns {string}
 */
export function t(key, fallback = '') {
  return translations[key] || fallback;
}

/** Devuelve el idioma actualmente activo */
export function getCurrentLang() {
  return currentLang;
}

/** Configura el selector de idioma en el DOM */
export function setupLangSelector() {
  const langSelector = document.getElementById('lang-selector');
  if (!langSelector) return;

  langSelector.value = currentLang;
  loadTranslations(currentLang);

  langSelector.addEventListener('change', async (e) => {
    const selectedLang = e.target.value;
    localStorage.setItem('memex-lang', selectedLang);
    await loadTranslations(selectedLang);
    // Notificamos al módulo de publicación para que actualice su UI
    document.dispatchEvent(new CustomEvent('lang:changed', { detail: { lang: selectedLang } }));
  });
}
