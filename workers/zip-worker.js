/**
 * ============================================================
 * 📦 zip-worker.js — Web Worker para Compresión Asíncrona ZIP
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Comprime archivos en un hilo secundario sin congelar la UI de GrapesJS.
 */

'use strict';

try {
  // Intentar cargar fflate localmente desde /vendor/fflate/index.js
  importScripts('/vendor/fflate/index.js');
} catch (e) {
  try {
    // Fallback a CDN si no está montado en /vendor
    importScripts('https://cdn.jsdelivr.net/npm/fflate@0.8.1/umd/index.js');
  } catch (cdnErr) {
    console.error('[ZipWorker] No se pudo cargar la librería fflate:', cdnErr);
  }
}

self.onmessage = (event) => {
  const { id, type, payload } = event.data || {};

  if (type === 'compress-zip') {
    if (typeof fflate === 'undefined') {
      self.postMessage({
        id,
        type: 'error',
        error: { message: 'Librería fflate no disponible en el Worker.' }
      });
      return;
    }

    try {
      const filesInput = payload && payload.files ? payload.files : [];
      const zipData = {};

      // Normalizar archivos de entrada
      if (Array.isArray(filesInput)) {
        filesInput.forEach(({ path: filePath, content }) => {
          if (!filePath) return;
          if (typeof content === 'string') {
            zipData[filePath] = fflate.strToU8(content);
          } else if (content instanceof Uint8Array) {
            zipData[filePath] = content;
          } else if (content instanceof ArrayBuffer) {
            zipData[filePath] = new Uint8Array(content);
          }
        });
      } else if (typeof filesInput === 'object') {
        Object.entries(filesInput).forEach(([filePath, content]) => {
          if (typeof content === 'string') {
            zipData[filePath] = fflate.strToU8(content);
          } else if (content instanceof Uint8Array) {
            zipData[filePath] = content;
          }
        });
      }

      self.postMessage({ id, type: 'progress', result: { percent: 30, message: 'Comprimiendo buffers...' } });

      fflate.zip(zipData, { level: 6 }, (err, out) => {
        if (err) {
          self.postMessage({
            id,
            type: 'error',
            error: { message: err.message }
          });
          return;
        }

        self.postMessage({ id, type: 'progress', result: { percent: 100, message: 'Compresión finalizada.' } });

        // Transferir el buffer sin copia de memoria
        self.postMessage(
          { id, type: 'success', result: out.buffer },
          [out.buffer]
        );
      });
    } catch (err) {
      self.postMessage({
        id,
        type: 'error',
        error: { message: err.message }
      });
    }
  }
};
