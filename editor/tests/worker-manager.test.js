/**
 * ============================================================
 * 🧪 worker-manager.test.js — Suite de Pruebas Unitarias
 * WorkerManager / Web Workers en Rótulos Web v3.4
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerManager, workerManager } from '../public/modules/worker-manager.js';

describe('WorkerManager — Suite de Pruebas Unitarias', () => {
  let mockWorkerInstance;

  beforeEach(() => {
    mockWorkerInstance = {
      postMessage: vi.fn(),
      onmessage: null,
      onerror: null,
      terminate: vi.fn()
    };

    // Mock global de Worker
    globalThis.Worker = vi.fn(function () {
      return mockWorkerInstance;
    });

    workerManager.terminateAll();
  });

  afterEach(() => {
    workerManager.terminateAll();
    vi.restoreAllMocks();
  });

  it('debería exportar un singleton y permitir instanciar nuevas clases WorkerManager', () => {
    expect(workerManager).toBeInstanceOf(WorkerManager);
    const customMgr = new WorkerManager();
    expect(customMgr).toBeInstanceOf(WorkerManager);
  });

  it('debería crear un Worker y reutilizarlo en invocaciones subsiguientes', () => {
    const worker1 = workerManager.createWorker('zip', '/workers/zip-worker.js');
    expect(globalThis.Worker).toHaveBeenCalledWith('/workers/zip-worker.js');
    expect(worker1).toBe(mockWorkerInstance);

    const worker2 = workerManager.createWorker('zip', '/workers/zip-worker.js');
    expect(globalThis.Worker).toHaveBeenCalledTimes(1); // Reutilizado
    expect(worker2).toBe(worker1);
  });

  it('debería rechazar sendTask si el worker solicitado no está registrado', async () => {
    await expect(workerManager.sendTask('desconocido', 'test', {}))
      .rejects.toThrow('Worker "desconocido" no registrado');
  });

  it('debería despachar tareas al worker y resolver con "success"', async () => {
    const worker = workerManager.createWorker('zip', '/workers/zip-worker.js');

    const taskPromise = workerManager.sendTask('zip', 'compress-zip', {
      files: [{ path: 'index.html', content: '<h1>Hola</h1>' }]
    });

    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    const sentMsg = worker.postMessage.mock.calls[0][0];
    expect(sentMsg.type).toBe('compress-zip');
    expect(sentMsg.id).toBeDefined();

    // Simular respuesta del worker
    worker.onmessage({
      data: {
        id: sentMsg.id,
        type: 'success',
        result: new ArrayBuffer(16)
      }
    });

    const result = await taskPromise;
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it('debería rechazar la promesa si el worker responde con "error"', async () => {
    const worker = workerManager.createWorker('dom', '/workers/dom-worker.js');

    const taskPromise = workerManager.sendTask('dom', 'analyze-dom', { html: '<div>' });
    const sentMsg = worker.postMessage.mock.calls[0][0];

    worker.onmessage({
      data: {
        id: sentMsg.id,
        type: 'error',
        error: { message: 'Fallo al parsear árbol' }
      }
    });

    await expect(taskPromise).rejects.toThrow('Fallo al parsear árbol');
  });

  it('debería soportar actualizaciones de "progress" sin perder la resolución final "success"', async () => {
    const worker = workerManager.createWorker('zip', '/workers/zip-worker.js');
    const progressSpy = vi.fn();

    const taskPromise = workerManager.sendTask(
      'zip',
      'compress-zip',
      { files: [] },
      progressSpy
    );

    const sentMsg = worker.postMessage.mock.calls[0][0];

    // Emitir eventos intermedios de progreso
    worker.onmessage({
      data: {
        id: sentMsg.id,
        type: 'progress',
        result: { percent: 30, message: 'Comprimiendo...' }
      }
    });

    worker.onmessage({
      data: {
        id: sentMsg.id,
        type: 'progress',
        result: { percent: 70, message: 'Finalizando...' }
      }
    });

    expect(progressSpy).toHaveBeenCalledTimes(2);
    expect(progressSpy).toHaveBeenNthCalledWith(1, { percent: 30, message: 'Comprimiendo...' });
    expect(progressSpy).toHaveBeenNthCalledWith(2, { percent: 70, message: 'Finalizando...' });

    // Emitir respuesta de éxito final
    worker.onmessage({
      data: {
        id: sentMsg.id,
        type: 'success',
        result: 'OK'
      }
    });

    const result = await taskPromise;
    expect(result).toBe('OK');
  });

  it('terminate() y terminateAll() deben invocar terminate en los Workers y cancelar pendientes', async () => {
    const worker = workerManager.createWorker('dom', '/workers/dom-worker.js');

    const pendingPromise = workerManager.sendTask('dom', 'analyze-dom', { html: '' });

    workerManager.terminateAll();

    expect(worker.terminate).toHaveBeenCalled();
    await expect(pendingPromise).rejects.toThrow('Operación cancelada por terminación');
  });
});
