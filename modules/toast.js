/**
 * ============================================================
 * 🔔 toast.js — Notificaciones Toast + FSM de Publicación
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

import { t } from './i18n.js';

/** Estado de la máquina de estados de publicación */
let publishState = 'IDLE';

/**
 * Muestra un mensaje toast en la esquina de la pantalla.
 * @param {string} message - Texto a mostrar
 * @param {boolean} [isError=false] - Si true, muestra en color de error
 */
export function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.style.borderColor = isError ? '#CE1126' : '#006847';
  toast.style.color = isError ? '#FFA4AD' : '#55EBB2';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/**
 * Actualiza la UI del botón de publicar según el estado FSM.
 * @param {'IDLE'|'PENDING'|'SUCCESS'|'FAULT'} state
 * @param {string} [msg='']
 */
export function updatePublishUI(state, msg = '') {
  const btn = document.getElementById('btn-publish');
  if (!btn) return;
  publishState = state;

  switch (state) {
    case 'IDLE':
      btn.innerHTML = `<i class="fas fa-rocket"></i> <span data-i18n="btn_publish">${t('btn_publish', 'Publicar')}</span>`;
      btn.disabled = false;
      btn.className = 'btn-action btn-publish';
      break;
    case 'PENDING':
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${t('btn_publishing', 'Publicando...')}</span>`;
      btn.disabled = true;
      break;
    case 'SUCCESS':
      btn.innerHTML = `<i class="fas fa-check"></i> <span>${t('btn_published', '¡Publicado!')}</span>`;
      btn.className = 'btn-action btn-publish btn-success';
      showToast(msg || t('publish_success', '¡Publicado exitosamente en GitHub!'));
      setTimeout(() => {
        publishState = 'IDLE';
        updatePublishUI('IDLE');
      }, 3000);
      break;
    case 'EMPTY':
      btn.innerHTML = `<i class="fas fa-box-open"></i> <span>Sin cambios</span>`;
      btn.disabled = true;
      btn.className = 'btn-action btn-publish';
      break;
    case 'FAULT':
      btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Reintentar</span>`;
      btn.disabled = false;
      btn.className = 'btn-action btn-publish btn-fault';
      showToast(msg || t('publish_error', 'Error al publicar'), true);
      break;
  }
}

/** Devuelve el estado actual del FSM de publicación */
export function getPublishState() {
  return publishState;
}

/** Establece el estado del FSM sin actualizar la UI */
export function setPublishState(state) {
  publishState = state;
}
