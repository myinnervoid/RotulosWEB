/**
 * ============================================================
 * 🚀 main.js — Punto de Entrada de Rótulos Web
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 * Importa e inicializa todos los módulos del editor.
 * Reemplaza el bloque startEditorApp() de app.js.
 */

import { initEditor } from './editor-init.js';
import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { startFileWatcher } from './file-watcher.js';

// Conectar el watcher de sincronización continua cuando el editor esté listo
eventBus.subscribe(EDITOR_EVENTS.EDITOR_READY, async () => {
  try {
    const res = await fetch('/api/current-project');
    const json = await res.json();
    if (json.success && json.data && json.data.projectPath) {
      startFileWatcher(json.data.projectPath);
    }
  } catch (_) {}
});

// Reconectar watcher si se conmuta o carga un nuevo proyecto
eventBus.subscribe(EDITOR_EVENTS.PROJECT_LOADED, (payload) => {
  if (payload && payload.projectPath) {
    startFileWatcher(payload.projectPath);
  }
});

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
