/**
 * ============================================================
 * 🚀 main.js — Punto de Entrada de Rótulos Web
 * Rótulos Web / Memexicanísimos Studio v5.1
 * ============================================================
 * Importa e inicializa todos los módulos del editor.
 * Integra el Welcome Hub (pantalla de bienvenida) al arranque.
 */

import { initEditor } from './editor-init.js';
import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { startFileWatcher } from './file-watcher.js';
import { showWelcomeHub, shouldShowWelcomeHub } from './welcome-hub.js';

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
 * Decide si mostrar el Welcome Hub antes de iniciar el editor.
 * Lógica:
 *   - Si el proyecto activo no tiene index.html → Hub obligatorio (allowClose=false)
 *   - Si el usuario desactivó el Hub → solo inicializar el editor
 *   - Si no → mostrar Hub con opción de saltar
 */
async function maybeShowWelcomeHub() {
  try {
    const res = await fetch('/api/current-project');
    const json = res.ok ? await res.json() : null;
    const hasIndex = json?.success && json?.data?.hasIndex === true;

    if (!hasIndex) {
      // Sin proyecto activo: Hub obligatorio, el usuario DEBE elegir
      await showWelcomeHub({ allowClose: false });
    } else if (shouldShowWelcomeHub()) {
      // Proyecto activo pero el Hub está habilitado: mostrar con botón de saltar
      showWelcomeHub({ allowClose: true });
    }
  } catch (_) {
    // Error de red: mostrar editor directamente (graceful degradation)
  }
}

/**
 * Arranca el editor cuando GrapesJS esté disponible en window.
 * GrapesJS se carga con <script> clásico antes de este módulo.
 */
function startEditorApp() {
  if (typeof grapesjs !== 'undefined') {
    initEditor();
    // Mostrar Welcome Hub de forma no bloqueante (el editor ya se inicializa)
    // El Hub se renderiza sobre el canvas hasta que el usuario elige
    maybeShowWelcomeHub();
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
