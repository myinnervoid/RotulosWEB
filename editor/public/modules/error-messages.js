/**
 * Mapeo de error_code de backend a mensajes amigables para el usuario.
 * Desacopla los mensajes de UI de los mensajes técnicos del servidor.
 *
 * Uso:
 *   import { getErrorMessage } from './error-messages.js';
 *   showToast(getErrorMessage(json.error_code, json.message), true);
 */

/** @type {Object.<string, string>} */
const ERROR_MESSAGES = {
  // Acceso
  ACCESS_DENIED: 'Acceso denegado. Este editor solo funciona en tu computadora local.',

  // Proyectos
  RECENT_LOAD_FAILED: 'No se pudieron cargar los proyectos recientes.',
  RECENT_SAVE_FAILED: 'No se pudo guardar el proyecto en la lista de recientes.',
  INVALID_PATH: 'La carpeta especificada no existe. Verifica la ruta.',
  PATH_NOT_FOUND: 'No se encontró esa carpeta en tu disco. ¿Fue movida o eliminada?',
  SWITCH_FAILED: 'No se pudo cambiar de proyecto. Intenta de nuevo.',

  // Archivos
  FILE_NOT_FOUND: 'No hay un archivo index.html en esa carpeta. Verifica que sea un proyecto web.',
  PAGE_READ_FAILED: 'Error al leer los archivos del proyecto.',
  ASSETS_READ_FAILED: 'No se pudieron cargar las imágenes del proyecto.',

  // Guardado
  INVALID_PAYLOAD: 'El contenido del editor está vacío. Agrega elementos antes de guardar.',
  MALFORMED_HTML: 'El HTML generado no tiene una estructura válida. Recarga el editor.',
  SAVE_FAILED: 'Error al guardar. Verifica que tengas permisos de escritura en la carpeta.',

  // Estadísticas
  STATS_FAILED: 'No se pudieron obtener las estadísticas del editor.',

  // GitHub
  GIT_PUSH_FAILED: 'Error al publicar en GitHub. Revisa tu conexión a internet y el repositorio.',
  GIT_AUTH_REQUIRED: 'Autenticación de GitHub requerida. Configura tu clave SSH o token de acceso personal.',

  // Captura de pantalla
  CHROME_NOT_FOUND: 'No se encontró Chrome o Chromium en tu sistema. Instala Google Chrome para usar esta función.',
  SCREENSHOT_FAILED: 'Error al generar la captura de pantalla. Intenta de nuevo.'
};

/**
 * Obtiene un mensaje amigable para el usuario basado en el error_code del backend.
 * Si el código no tiene mapeo, usa el mensaje técnico del backend como fallback.
 *
 * @param {string|null} errorCode  - El error_code recibido en la ApiResponse
 * @param {string} [fallbackMsg]   - Mensaje de fallback si no hay mapeo (generalmente json.message)
 * @returns {string}
 */
export function getErrorMessage(errorCode, fallbackMsg = 'Error inesperado. Intenta de nuevo.') {
  if (!errorCode) return fallbackMsg;
  return ERROR_MESSAGES[errorCode] || fallbackMsg;
}

export { ERROR_MESSAGES };
