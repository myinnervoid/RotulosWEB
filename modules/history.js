/**
 * ============================================================
 * ⏳ history.js — Historial de Versiones y Undo/Redo Persistente
 * Rótulos Web / Memexicanísimos Studio v4.0
 * ============================================================
 * Gestiona snapshots de cambios (HTML y CSS) con persistencia
 * en localStorage por proyecto, soporte para deshacer/rehacer y
 * sincronización reactiva con EventBus y la UI.
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';

export const MAX_SNAPSHOTS = 50;
export const STORAGE_KEY_PREFIX = 'rotulos_history_';

let history = [];
let currentIndex = -1;
let isRestoring = false;
let lastRestoreTime = 0;
let editorInstance = null;
let projectPath = '';
let captureTimeout = null;

function getStorageKey() {
  const safeProject = (projectPath || 'default').replace(/[^a-zA-Z0-9]/g, '_');
  return `${STORAGE_KEY_PREFIX}${safeProject}`;
}

function saveHistory() {
  if (typeof localStorage === 'undefined') return;
  const key = getStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch (err) {
    // Si se excede la cuota de 5MB de localStorage en proyectos grandes, guardar solo los 10 más recientes en disco
    try {
      const compact = history.slice(-10);
      localStorage.setItem(key, JSON.stringify(compact));
    } catch {
      console.warn('[History] Error guardando historial en localStorage:', err);
    }
  }
}

export function updateUI() {
  if (typeof document === 'undefined') return;
  const canUndo = currentIndex > 0 || Boolean(captureTimeout);
  const canRedo = currentIndex >= 0 && currentIndex < history.length - 1;

  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');

  if (undoBtn) {
    undoBtn.disabled = !canUndo;
    undoBtn.classList.toggle('active', canUndo);
  }
  if (redoBtn) {
    redoBtn.disabled = !canRedo;
    redoBtn.classList.toggle('active', canRedo);
  }
}

export function restoreSnapshot(snapshot) {
  if (!editorInstance || !snapshot) return;
  if (captureTimeout) {
    clearTimeout(captureTimeout);
    captureTimeout = null;
  }
  isRestoring = true;
  try {
    if (typeof editorInstance.setHtml === 'function') {
      editorInstance.setHtml(snapshot.html || '');
    } else if (typeof editorInstance.setComponents === 'function') {
      editorInstance.setComponents(snapshot.html || '');
    }
    if (typeof editorInstance.setCss === 'function') {
      editorInstance.setCss(snapshot.css || '');
    } else if (typeof editorInstance.setStyle === 'function') {
      editorInstance.setStyle(snapshot.css || '');
    }
    if (typeof editorInstance.getHtml === 'function') {
      snapshot.html = editorInstance.getHtml();
    }
    if (typeof editorInstance.getCss === 'function') {
      snapshot.css = editorInstance.getCss();
    }
    eventBus.publish(EDITOR_EVENTS.HISTORY_RESTORED, { snapshot });
  } catch (e) {
    console.warn('[History] Error restaurando snapshot:', e);
  } finally {
    isRestoring = false;
    lastRestoreTime = Date.now();
  }
}

export function undo() {
  if (captureTimeout) {
    clearTimeout(captureTimeout);
    captureTimeout = null;
    captureSnapshot('Cambio en curso');
  }
  if (currentIndex > 0) {
    currentIndex--;
    restoreSnapshot(history[currentIndex]);
    updateUI();
    eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      currentIndex,
      total: history.length
    });
  }
}

export function redo() {
  if (currentIndex < history.length - 1) {
    currentIndex++;
    restoreSnapshot(history[currentIndex]);
    updateUI();
    eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      currentIndex,
      total: history.length
    });
  }
}

export function captureSnapshot(label = '') {
  if (isRestoring || !editorInstance) return;
  const html = typeof editorInstance.getHtml === 'function' ? editorInstance.getHtml() : '';
  const css = typeof editorInstance.getCss === 'function' ? editorInstance.getCss() : '';

  // Evitar capturar duplicado si no hubo cambios
  if (history.length > 0 && currentIndex >= 0 && currentIndex < history.length) {
    const current = history[currentIndex];
    if (current.html === html && current.css === css) {
      return;
    }
  }

  const snapshot = {
    html,
    css,
    timestamp: Date.now(),
    label: label || `Snapshot ${new Date().toLocaleTimeString()}`
  };

  // Truncar futuro si estamos en medio de la pila
  if (currentIndex < history.length - 1) {
    history = history.slice(0, currentIndex + 1);
  }

  history.push(snapshot);
  if (history.length > MAX_SNAPSHOTS) {
    history.shift();
  }

  currentIndex = history.length - 1;
  saveHistory();
  updateUI();

  eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    currentIndex,
    total: history.length
  });
}

export function getHistory() {
  return [...history];
}

export function getCurrentIndex() {
  return currentIndex;
}

export function clearHistory() {
  history = [];
  currentIndex = -1;
  saveHistory();
  updateUI();
  eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
    canUndo: false,
    canRedo: false,
    currentIndex: -1,
    total: 0
  });
}

/**
 * Inicializa el gestor de historial persistente
 * @param {object} editor - Instancia de GrapesJS
 * @param {string} [project] - Ruta del proyecto activo
 */
export function initHistory(editor, project = '') {
  editorInstance = editor;
  projectPath = project || 'default';
  const storageKey = getStorageKey();

  history = [];
  currentIndex = -1;

  // Cargar historial guardado si existe
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          history = parsed;
          currentIndex = history.length - 1;
        }
      } catch (e) {
        console.warn('[History] Error al leer historial previo:', e);
      }
    }
  }

  // Captura inicial si estaba vacío o si el estado actual del proyecto difiere del último snapshot guardado
  if (editor) {
    const curHtml = typeof editor.getHtml === 'function' ? editor.getHtml() : '';
    const curCss = typeof editor.getCss === 'function' ? editor.getCss() : '';
    const lastSnap = history.length > 0 ? history[history.length - 1] : null;
    if (history.length === 0 || (curHtml && lastSnap && (lastSnap.html !== curHtml || lastSnap.css !== curCss))) {
      captureSnapshot('Estado Inicial');
    } else {
      updateUI();
      eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        currentIndex,
        total: history.length
      });
    }
  } else {
    updateUI();
    eventBus.publish(EDITOR_EVENTS.HISTORY_CHANGED, {
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      currentIndex,
      total: history.length
    });
  }

  // Debounced auto-capture (700ms para respuesta ágil al editar sin perder Ctrl+Z ni truncar Redo tras restore)
  const debouncedCapture = () => {
    if (isRestoring || (Date.now() - lastRestoreTime < 500)) return;
    if (captureTimeout) clearTimeout(captureTimeout);
    captureTimeout = setTimeout(() => {
      captureTimeout = null;
      if (isRestoring || (Date.now() - lastRestoreTime < 500)) return;
      requestAnimationFrame(() => captureSnapshot());
    }, 700);
    updateUI();
  };

  if (editor && typeof editor.on === 'function') {
    editor.on('change:changesCount', debouncedCapture);
    editor.on('style:update', debouncedCapture);
    editor.on('component:update', debouncedCapture);
  }

  // Exponer a window para interoperabilidad si se requiere
  if (typeof window !== 'undefined') {
    window.undo = undo;
    window.redo = redo;
    window.captureSnapshot = captureSnapshot;
    window.getHistory = getHistory;
    window.clearHistory = clearHistory;
  }

  return {
    undo,
    redo,
    captureSnapshot,
    getHistory,
    clearHistory
  };
}
