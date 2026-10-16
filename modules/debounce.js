/**
 * ============================================================
 * ⏱️ debounce.js — Utilidad de Limitación Temporal
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 */

'use strict';

/**
 * Crea una función debounced que pospone la invocación de `fn` hasta
 * que transcurran `wait` milisegundos desde la última llamada.
 * @template {Function} T
 * @param {T} fn
 * @param {number} [wait=300]
 * @returns {T & { cancel: () => void }}
 */
export function debounce(fn, wait = 300) {
  let timeoutId = null;

  function debounced(...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
