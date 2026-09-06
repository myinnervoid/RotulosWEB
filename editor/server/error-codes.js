/**
 * Catálogo centralizado de Error Codes — Rótulos Web
 * @module error-codes
 *
 * Cada entrada define:
 *   - code:        Identificador normalizado del error (usado en ApiResponse.error_code)
 *   - http:        HTTP status code sugerido
 *   - description: Descripción técnica del error
 */

'use strict';

/**
 * @typedef {Object} ErrorCodeEntry
 * @property {string} code        - Código de error normalizado
 * @property {number} http        - HTTP status code sugerido
 * @property {string} description - Descripción técnica del error
 */

/** @type {Object.<string, ErrorCodeEntry>} */
const ERROR_CODES = {
  // ── Acceso y seguridad ────────────────────────────────────
  ACCESS_DENIED: {
    code: 'ACCESS_DENIED',
    http: 403,
    description: 'Intento de conexión desde una IP no local bloqueada.'
  },

  // ── Proyectos recientes ───────────────────────────────────
  RECENT_LOAD_FAILED: {
    code: 'RECENT_LOAD_FAILED',
    http: 500,
    description: 'Error al leer el archivo de proyectos recientes (~/.rotulos/recent.json).'
  },
  RECENT_SAVE_FAILED: {
    code: 'RECENT_SAVE_FAILED',
    http: 500,
    description: 'Error al escribir el archivo de proyectos recientes.'
  },

  // ── Rutas y sistema de archivos ───────────────────────────
  INVALID_PATH: {
    code: 'INVALID_PATH',
    http: 400,
    description: 'La ruta proporcionada es inválida, vacía o no existe en el sistema de archivos.'
  },
  PATH_NOT_FOUND: {
    code: 'PATH_NOT_FOUND',
    http: 400,
    description: 'La ruta absoluta especificada no existe en el sistema de archivos.'
  },
  FILE_NOT_FOUND: {
    code: 'FILE_NOT_FOUND',
    http: 404,
    description: 'No se encontró el archivo index.html en el directorio del proyecto activo.'
  },

  // ── Lectura y escritura de página ─────────────────────────
  ASSETS_READ_FAILED: {
    code: 'ASSETS_READ_FAILED',
    http: 500,
    description: 'Error al escanear la carpeta de assets del proyecto.'
  },
  PAGE_READ_FAILED: {
    code: 'PAGE_READ_FAILED',
    http: 500,
    description: 'Error al leer index.html o style.css del proyecto activo.'
  },
  INVALID_PAYLOAD: {
    code: 'INVALID_PAYLOAD',
    http: 400,
    description: 'El contenido HTML enviado al endpoint /api/save es inválido o está vacío (< 10 caracteres).'
  },
  MALFORMED_HTML: {
    code: 'MALFORMED_HTML',
    http: 400,
    description: 'El HTML enviado carece de estructura válida (sin <body>, <div>, <html> ni <!DOCTYPE>).'
  },
  SAVE_FAILED: {
    code: 'SAVE_FAILED',
    http: 500,
    description: 'Error de sistema de archivos al guardar index.html o style.css.'
  },

  // ── Estadísticas ──────────────────────────────────────────
  STATS_FAILED: {
    code: 'STATS_FAILED',
    http: 500,
    description: 'Error al recopilar estadísticas del servidor o del directorio de backups.'
  },

  // ── Git / Publicación ─────────────────────────────────────
  GIT_PUSH_FAILED: {
    code: 'GIT_PUSH_FAILED',
    http: 500,
    description: 'Error genérico al ejecutar git add/commit/push. Ver detalle en el campo message.'
  },
  GIT_AUTH_REQUIRED: {
    code: 'GIT_AUTH_REQUIRED',
    http: 401,
    description: 'Autenticación de Git fallida. El usuario debe configurar credenciales SSH o token PAT.'
  },

  // ── Captura de pantalla ───────────────────────────────────
  CHROME_NOT_FOUND: {
    code: 'CHROME_NOT_FOUND',
    http: 503,
    description: 'No se encontró un ejecutable de Chrome/Chromium en las rutas conocidas del sistema.'
  },
  SCREENSHOT_FAILED: {
    code: 'SCREENSHOT_FAILED',
    http: 500,
    description: 'Error de Puppeteer al navegar a la página o al capturar la pantalla.'
  },

  // ── Conmutación de proyecto ───────────────────────────────
  SWITCH_FAILED: {
    code: 'SWITCH_FAILED',
    http: 500,
    description: 'Error inesperado al intentar conmutar el proyecto activo.'
  }
};

module.exports = { ERROR_CODES };
