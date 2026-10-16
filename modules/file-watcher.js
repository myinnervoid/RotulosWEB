/**
 * ============================================================
 * 👁️ file-watcher.js — Sincronización SSE en Tiempo Real
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Escucha cambios en archivos CSS y JS del proyecto vía Server-Sent
 * Events (SSE) y actualiza el canvas de GrapesJS sin recarga completa.
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { getEditorInstance } from './editor-init.js';
import { showToast } from './toast.js';

/** @type {EventSource|null} */
let activeSource = null;
let currentWatchedPath = null;
let reconnectTimer = null;

/**
 * Inicia la conexión SSE con el servidor para monitorear el proyecto activo.
 * @param {string} projectPath - Ruta absoluta del proyecto a observar
 */
export function startFileWatcher(projectPath) {
  stopFileWatcher();

  if (!projectPath || typeof EventSource === 'undefined') {
    return;
  }

  currentWatchedPath = projectPath;
  const url = `/api/watch?project=${encodeURIComponent(projectPath)}`;

  try {
    activeSource = new EventSource(url);

    activeSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const payload = JSON.parse(event.data);

        if (payload.event === 'file-change' && payload.data) {
          const { file, content } = payload.data;
          const editor = getEditorInstance();
          if (!editor) return;

          if (file.endsWith('.css')) {
            // Actualizar reglas CSS en el canvas
            editor.setStyle(content);
            eventBus.publish(EDITOR_EVENTS.EXTERNAL_CSS_CHANGED, { file, content });
            showToast(`🎨 CSS sincronizado desde disco: ${file}`);
          } else if (file.endsWith('.js')) {
            // Notificar cambio en JS y opcionalmente inyectar en canvas
            const canvasWindow = editor.Canvas && editor.Canvas.getWindow ? editor.Canvas.getWindow() : null;
            if (canvasWindow && canvasWindow.document) {
              const oldScript = canvasWindow.document.getElementById('live-injected-script');
              if (oldScript) oldScript.remove();

              const script = canvasWindow.document.createElement('script');
              script.id = 'live-injected-script';
              script.textContent = content;
              canvasWindow.document.body.appendChild(script);
            }
            eventBus.publish(EDITOR_EVENTS.EXTERNAL_JS_CHANGED, { file, content });
            showToast(`⚡ JavaScript sincronizado desde disco: ${file}`);
          }
        }
      } catch (err) {
        console.warn('[FileWatcher] Error procesando mensaje SSE:', err);
      }
    };

    activeSource.onerror = (err) => {
      console.warn('[FileWatcher] Desconexión de SSE, reintentando en 5s...', err);
      if (activeSource) {
        activeSource.close();
        activeSource = null;
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        if (currentWatchedPath) {
          startFileWatcher(currentWatchedPath);
        }
      }, 5000);
    };
  } catch (err) {
    console.warn('[FileWatcher] No se pudo inicializar EventSource:', err.message);
  }
}

/**
 * Detiene la conexión SSE y cancela reintentos pendientes.
 */
export function stopFileWatcher() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (activeSource) {
    activeSource.close();
    activeSource = null;
  }
}
