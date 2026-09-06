/**
 * ============================================================
 * ⚙️ worker-manager.js — Gestor y Protocolo de Web Workers
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Centraliza la instanciación, pooling y ciclo de vida de Web Workers.
 * Provee mensajería tipada asíncrona basada en Promesas y reporte de progreso.
 */

'use strict';

/**
 * Genera un UUID estándar o fallback compatible
 * @returns {string}
 */
function generateTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Gestor central de Web Workers
 */
export class WorkerManager {
  constructor() {
    /** @type {Record<string, Worker>} */
    this.workers = {};
    /** @type {Map<string, { resolve: Function, reject: Function, progress: Function|null }>} */
    this.pending = new Map();
  }

  /**
   * Crea o reutiliza un Web Worker identificado por un nombre clave.
   * @param {string} name - Nombre identificador (ej: 'zip', 'dom')
   * @param {string} scriptPath - Ruta al archivo del Worker
   * @returns {Worker}
   */
  createWorker(name, scriptPath) {
    if (this.workers[name]) {
      return this.workers[name];
    }

    if (typeof Worker === 'undefined') {
      throw new Error(`Web Workers no están soportados en este entorno para el worker "${name}"`);
    }

    const worker = new Worker(scriptPath);
    worker.onmessage = (event) => this.handleMessage(name, event);
    worker.onerror = (error) => this.handleError(name, error);

    this.workers[name] = worker;
    return worker;
  }

  /**
   * Procesa las respuestas provenientes de los workers
   * @param {string} workerName
   * @param {MessageEvent} event
   */
  handleMessage(workerName, event) {
    const data = event && event.data ? event.data : {};
    const { id, type, result, error } = data;

    const pending = this.pending.get(id);
    if (!pending) return;

    if (type === 'progress') {
      if (typeof pending.progress === 'function') {
        pending.progress(result);
      }
      return; // No eliminar la promesa en progreso intermedio
    }

    if (type === 'success') {
      pending.resolve(result);
      this.pending.delete(id);
    } else if (type === 'error') {
      const err = (error instanceof Error) ? error : new Error((error && error.message) || 'Error desconocido en Worker');
      if (error && typeof error === 'object') {
        Object.assign(err, error);
      }
      pending.reject(err);
      this.pending.delete(id);
    }
  }

  /**
   * Maneja errores no capturados del hilo secundario
   * @param {string} workerName
   * @param {ErrorEvent} error
   */
  handleError(workerName, error) {
    console.error(`[WorkerManager: ${workerName}] Error no capturado:`, error);
  }

  /**
   * Envía una tarea con payload a un worker registrado y retorna una Promesa.
   * @param {string} workerName - Nombre del worker
   * @param {string} task - Tipo de tarea (ej: 'compress-zip', 'analyze-dom')
   * @param {any} [payload] - Datos de entrada
   * @param {Function|null} [progressCallback] - Callback opcional para reportes intermedios
   * @returns {Promise<any>}
   */
  sendTask(workerName, task, payload = {}, progressCallback = null) {
    const worker = this.workers[workerName];
    if (!worker) {
      return Promise.reject(new Error(`Worker "${workerName}" no registrado`));
    }

    const id = generateTaskId();

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, progress: progressCallback });
      worker.postMessage({ id, type: task, payload });
    });
  }

  /**
   * Termina un worker específico y cancela sus tareas pendientes
   * @param {string} name
   */
  terminate(name) {
    const worker = this.workers[name];
    if (worker) {
      if (typeof worker.terminate === 'function') {
        worker.terminate();
      }
      delete this.workers[name];
    }
  }

  /**
   * Termina todos los workers y limpia las tareas pendientes
   */
  terminateAll() {
    Object.keys(this.workers).forEach((name) => {
      this.terminate(name);
    });
    this.workers = {};
    for (const [id, pending] of this.pending.entries()) {
      pending.reject(new Error('WorkerManager: Operación cancelada por terminación'));
    }
    this.pending.clear();
  }
}

export const workerManager = new WorkerManager();
export default workerManager;
