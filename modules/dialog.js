/**
 * Módulo de Diálogos Modales Soberanos HTML5 (<dialog>).
 * Sustituye window.confirm() y window.prompt() por componentes no bloqueantes,
 * accesibles y con la estética soberana de Rótulos Web.
 */

let _dialogEl = null;

function ensureDialogElement() {
  if (_dialogEl && document.body.contains(_dialogEl)) {
    return _dialogEl;
  }
  _dialogEl = document.createElement('dialog');
  _dialogEl.id = 'sovereign-dialog';
  _dialogEl.className = 'sovereign-dialog';
  document.body.appendChild(_dialogEl);
  return _dialogEl;
}

/**
 * Muestra un cuadro de confirmación soberano.
 * @param {Object} options
 * @param {string} options.title - Título del diálogo
 * @param {string} options.message - Mensaje explicativo
 * @param {string} [options.confirmText='Aceptar'] - Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] - Texto del botón de cancelación
 * @param {boolean} [options.danger=false] - Estilo rojo de advertencia/peligro
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog({
  title = 'Confirmación',
  message = '¿Deseas continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  danger = false
}) {
  return new Promise((resolve) => {
    const dialog = ensureDialogElement();
    const confirmBtnClass = danger ? 'btn-dialog-danger' : 'btn-dialog-confirm';
    const icon = danger ? '⚠️' : '❓';

    dialog.innerHTML = `
      <div class="dialog-card ${danger ? 'dialog-danger-theme' : ''}">
        <div class="dialog-header">
          <span class="dialog-icon">${icon}</span>
          <h3 class="dialog-title">${escapeHtml(title)}</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${escapeHtml(message)}</p>
        </div>
        <div class="dialog-actions">
          <button type="button" class="btn-dialog-cancel" id="btn-dialog-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="${confirmBtnClass}" id="btn-dialog-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const cancelBtn = dialog.querySelector('#btn-dialog-cancel');
    const confirmBtn = dialog.querySelector('#btn-dialog-confirm');

    function cleanup(result) {
      dialog.close();
      dialog.removeEventListener('cancel', onCancel);
      resolve(result);
    }

    function onCancel(e) {
      e.preventDefault();
      cleanup(false);
    }

    cancelBtn.onclick = () => cleanup(false);
    confirmBtn.onclick = () => cleanup(true);
    dialog.addEventListener('cancel', onCancel);

    dialog.showModal();
    confirmBtn.focus();
  });
}

/**
 * Muestra un cuadro para solicitar texto al usuario (reemplazo de prompt()).
 * @param {Object} options
 * @param {string} options.title - Título del diálogo
 * @param {string} options.message - Indicación para el usuario
 * @param {string} [options.defaultValue=''] - Valor inicial en el input
 * @param {string} [options.placeholder=''] - Placeholder del campo de texto
 * @param {string} [options.confirmText='Aceptar'] - Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] - Texto del botón de cancelación
 * @returns {Promise<string|null>}
 */
export function showPromptDialog({
  title = 'Entrada de datos',
  message = '',
  defaultValue = '',
  placeholder = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) {
  return new Promise((resolve) => {
    const dialog = ensureDialogElement();

    dialog.innerHTML = `
      <div class="dialog-card">
        <div class="dialog-header">
          <span class="dialog-icon">⌨️</span>
          <h3 class="dialog-title">${escapeHtml(title)}</h3>
        </div>
        <div class="dialog-body">
          ${message ? `<p class="dialog-message">${escapeHtml(message)}</p>` : ''}
          <input type="text" class="dialog-input" id="dialog-prompt-input"
                 value="${escapeHtml(defaultValue)}"
                 placeholder="${escapeHtml(placeholder)}" spellcheck="false" />
        </div>
        <div class="dialog-actions">
          <button type="button" class="btn-dialog-cancel" id="btn-dialog-cancel">${escapeHtml(cancelText)}</button>
          <button type="button" class="btn-dialog-confirm" id="btn-dialog-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const cancelBtn = dialog.querySelector('#btn-dialog-cancel');
    const confirmBtn = dialog.querySelector('#btn-dialog-confirm');
    const input = dialog.querySelector('#dialog-prompt-input');

    function cleanup(result) {
      dialog.close();
      dialog.removeEventListener('cancel', onCancel);
      resolve(result);
    }

    function onCancel(e) {
      e.preventDefault();
      cleanup(null);
    }

    cancelBtn.onclick = () => cleanup(null);
    confirmBtn.onclick = () => cleanup(input.value.trim());

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        cleanup(input.value.trim());
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(null);
      }
    };

    dialog.addEventListener('cancel', onCancel);

    dialog.showModal();
    input.focus();
    input.select();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
