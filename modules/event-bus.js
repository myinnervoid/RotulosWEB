/**
 * ============================================================
 * 📡 event-bus.js — Sistema Pub/Sub Centralizado y Tipado
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Maneja la comunicación desacoplada entre módulos del editor visual.
 * 
 * Uso:
 *   import { eventBus } from './event-bus.js';
 *   import { EDITOR_EVENTS } from './editor-events.js';
 *   const unsubscribe = eventBus.subscribe(EDITOR_EVENTS.CONTENT_CHANGED, (data) => { ... });
 *   eventBus.publish(EDITOR_EVENTS.CONTENT_CHANGED, { html, css });
 */

'use strict';

/**
 * @callback EventCallback
 * @param {any} payload - Datos transferidos con el evento
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Array<EventCallback>>} */
    this.listeners = new Map();
  }

  /**
   * Se suscribe a un evento específico.
   * @param {string} event - Nombre del evento (usar catálogo EDITOR_EVENTS)
   * @param {EventCallback} callback - Función que procesará el payload
   * @returns {Function} Función para cancelar la suscripción (unsubscribe)
   */
  subscribe(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError(`[EventBus] El listener para "${event}" debe ser una función.`);
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Publica un evento con un payload opcional hacia todos sus suscriptores.
   * @param {string} event - Nombre del evento
   * @param {any} [payload=null] - Datos asociados al evento
   */
  publish(event, payload = null) {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.length === 0) return;

    // Clonar lista de callbacks para evitar mutaciones durante ejecución
    const snapshot = [...callbacks];
    for (const cb of snapshot) {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error en suscriptor de "${event}":`, err);
      }
    }
  }

  /**
   * Obtiene la cantidad de suscriptores activos para un evento.
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
  }

  /**
   * Elimina todos los suscriptores registrados (útil para pruebas o reinicialización).
   */
  clear() {
    this.listeners.clear();
  }
}

// Instancia singleton compartida por todos los módulos del editor
export const eventBus = new EventBus();
