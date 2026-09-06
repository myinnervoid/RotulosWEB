/**
 * ============================================================
 * 🧪 history.test.js — Suite de Pruebas Unitarias del Historial
 * Rótulos Web / Memexicanísimos Studio v4.0
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initHistory,
  undo,
  redo,
  captureSnapshot,
  getHistory,
  getCurrentIndex,
  clearHistory,
  MAX_SNAPSHOTS
} from '../public/modules/history.js';
import { eventBus } from '../public/modules/event-bus.js';
import { EDITOR_EVENTS } from '../public/modules/editor-events.js';

describe('History Module — Snapshots Persistentes y Undo/Redo', () => {
  let mockEditor;
  let htmlState = '<h1>Versión Inicial</h1>';
  let cssState = 'h1 { color: gold; }';

  beforeEach(() => {
    htmlState = '<h1>Versión Inicial</h1>';
    cssState = 'h1 { color: gold; }';

    mockEditor = {
      getHtml: vi.fn(() => htmlState),
      getCss: vi.fn(() => cssState),
      setHtml: vi.fn((val) => { htmlState = val; }),
      setCss: vi.fn((val) => { cssState = val; }),
      setComponents: vi.fn((val) => { htmlState = val; }),
      setStyle: vi.fn((val) => { cssState = val; }),
      on: vi.fn()
    };

    localStorage.clear();
    clearHistory();
  });

  afterEach(() => {
    localStorage.clear();
    clearHistory();
    vi.restoreAllMocks();
  });

  it('debería inicializar el historial con un snapshot inicial si la pila está vacía', () => {
    initHistory(mockEditor, 'proyecto-test');

    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].html).toBe('<h1>Versión Inicial</h1>');
    expect(history[0].css).toBe('h1 { color: gold; }');
    expect(getCurrentIndex()).toBe(0);
  });

  it('debería capturar nuevos snapshots y persistirlos en localStorage', () => {
    initHistory(mockEditor, 'proyecto-test');

    htmlState = '<h1>Segunda Versión</h1>';
    captureSnapshot('Edición 2');

    const history = getHistory();
    expect(history.length).toBe(2);
    expect(getCurrentIndex()).toBe(1);
    expect(history[1].html).toBe('<h1>Segunda Versión</h1>');

    const stored = JSON.parse(localStorage.getItem('rotulos_history_proyecto_test'));
    expect(stored.length).toBe(2);
  });

  it('debería ejecutar undo() y restaurar el estado anterior', () => {
    initHistory(mockEditor, 'proyecto-test');

    htmlState = '<h1>Modificado</h1>';
    captureSnapshot('Edición');

    expect(getCurrentIndex()).toBe(1);

    undo();

    expect(getCurrentIndex()).toBe(0);
    expect(mockEditor.setHtml).toHaveBeenCalledWith('<h1>Versión Inicial</h1>');
  });

  it('debería ejecutar redo() tras un undo()', () => {
    initHistory(mockEditor, 'proyecto-test');

    htmlState = '<h1>Modificado</h1>';
    captureSnapshot('Edición');

    undo();
    expect(getCurrentIndex()).toBe(0);

    redo();
    expect(getCurrentIndex()).toBe(1);
    expect(mockEditor.setHtml).toHaveBeenCalledWith('<h1>Modificado</h1>');
  });

  it('no debería exceder el límite MAX_SNAPSHOTS (50)', () => {
    initHistory(mockEditor, 'proyecto-test');

    for (let i = 1; i <= 60; i++) {
      htmlState = `<h1>Versión ${i}</h1>`;
      captureSnapshot(`Paso ${i}`);
    }

    const history = getHistory();
    expect(history.length).toBeLessThanOrEqual(MAX_SNAPSHOTS);
    expect(history.length).toBe(50);
  });

  it('debería emitir eventos HISTORY_CHANGED en el EventBus al capturar o navegar', () => {
    const historyChangedSpy = vi.fn();
    eventBus.subscribe(EDITOR_EVENTS.HISTORY_CHANGED, historyChangedSpy);

    initHistory(mockEditor, 'proyecto-test');
    htmlState = '<h1>Cambio</h1>';
    captureSnapshot('Cambio');

    expect(historyChangedSpy).toHaveBeenCalled();
    const lastPayload = historyChangedSpy.mock.calls[historyChangedSpy.mock.calls.length - 1][0];
    expect(lastPayload.canUndo).toBe(true);
    expect(lastPayload.canRedo).toBe(false);
  });

  it('clearHistory() debe vaciar la memoria y el almacenamiento local', () => {
    initHistory(mockEditor, 'proyecto-test');
    htmlState = '<h1>Cambio para probar clear</h1>';
    captureSnapshot('Paso 1');
    expect(getHistory().length).toBe(2);

    clearHistory();
    expect(getHistory().length).toBe(0);
    expect(getCurrentIndex()).toBe(-1);
  });
});
