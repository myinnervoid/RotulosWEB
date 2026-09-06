/**
 * ============================================================
 * 📋 editor-events.js — Catálogo y Contratos de Eventos
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Define constantes y tipado JSDoc para evitar errores tipográficos
 * y formalizar las firmas de eventos entre módulos.
 */

'use strict';

/**
 * Constantes canónicas para los eventos del sistema.
 */
export const EDITOR_EVENTS = Object.freeze({
  /** Editor visual GrapesJS inicializado y disponible en DOM */
  EDITOR_READY: 'editor:ready',

  /** Cambio en el contenido HTML o estilos CSS del canvas */
  CONTENT_CHANGED: 'editor:content:changed',

  /** Selección activa de un componente en el lienzo */
  COMPONENT_SELECTED: 'editor:component:selected',

  /** Deselección de componente (clic en vacío) */
  COMPONENT_DESELECTED: 'editor:component:deselected',

  /** Nuevo componente insertado en el canvas */
  COMPONENT_ADDED: 'editor:component:added',

  /** Componente eliminado del canvas */
  COMPONENT_REMOVED: 'editor:component:removed',

  /** Proyecto nuevo cargado o conmutado */
  PROJECT_LOADED: 'editor:project:loaded',

  /** Intención de guardar disparada por UI o atajo de teclado */
  BEFORE_SAVE: 'editor:before:save',

  /** Guardado exitoso completado en el servidor */
  AFTER_SAVE: 'editor:after:save',

  /** Error durante cualquier operación del editor */
  ERROR_OCCURRED: 'editor:error'
});

/**
 * @typedef {Object} ContentChangedPayload
 * @property {string} html - Código HTML serializado del canvas
 * @property {string} css - Reglas de estilo CSS del canvas
 */

/**
 * @typedef {Object} ComponentSelectedPayload
 * @property {string} [componentId] - Identificador único del componente
 * @property {string} [tagName] - Tag HTML del elemento seleccionado
 * @property {any} [component] - Modelo de componente GrapesJS
 */

/**
 * @typedef {Object} ProjectLoadedPayload
 * @property {string} projectPath - Ruta en el sistema de archivos del proyecto
 * @property {string} [name] - Nombre legible del proyecto
 * @property {string} [html] - HTML inicial cargado
 * @property {string} [css] - CSS inicial cargado
 */

/**
 * @typedef {Object} SavePayload
 * @property {string} [html] - HTML específico a guardar
 * @property {string} [css] - CSS específico a guardar
 * @property {string} [projectPath] - Destino del proyecto
 * @property {any} [result] - Respuesta del servidor tras guardar
 */

/**
 * @typedef {Object} ErrorPayload
 * @property {string} code - Código canónico de error
 * @property {string} message - Mensaje legible para el usuario
 * @property {any} [details] - Metadatos adicionales de depuración
 */
