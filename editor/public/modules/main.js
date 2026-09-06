/**
 * ============================================================
 * 🚀 main.js — Punto de Entrada de Rótulos Web
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 * Importa e inicializa todos los módulos del editor.
 * Reemplaza el bloque startEditorApp() de app.js.
 */

import { initEditor } from './editor-init.js';

/**
 * Arranca el editor cuando GrapesJS esté disponible en window.
 * GrapesJS se carga con <script> clásico antes de este módulo.
 */
function startEditorApp() {
  if (typeof grapesjs !== 'undefined') {
    initEditor();
  } else {
    console.warn('GrapesJS aún no está listo... esperando carga');
    setTimeout(startEditorApp, 60);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startEditorApp);
} else {
  startEditorApp();
}
