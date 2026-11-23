/**
 * ============================================================
 * 🚀 publish.js — Publicación Simplificada (GitHub Pages / Netlify)
 * Rótulos Web / Memexicanísimos Studio v5.0
 * ============================================================
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { showToast } from './toast.js';
import {
  getGitHubToken, getGitHubUser, isGitHubAuthenticated,
  authenticateGitHub, logoutGitHub
} from './auth.js';

/**
 * Publica un proyecto local en GitHub Pages
 * @param {string} [projectPath] - Ruta local del proyecto
 * @param {string} [repoName] - Nombre del repositorio remoto
 * @returns {Promise<object>}
 */
export async function publishToGitHub(projectPath, repoName) {
  if (!isGitHubAuthenticated()) {
    try {
      showToast('Iniciando sesión con GitHub...');
      await authenticateGitHub();
      showToast('¡Autenticado con éxito!');
    } catch (err) {
      eventBus.publish(EDITOR_EVENTS.PUBLISH_ERROR, { message: 'No se pudo autenticar con GitHub: ' + err.message });
      showToast('Autenticación cancelada o fallida', true);
      throw err;
    }
  }

  const token = getGitHubToken();
  if (!token) {
    const msg = 'Token de GitHub no disponible';
    eventBus.publish(EDITOR_EVENTS.PUBLISH_ERROR, { message: msg });
    showToast(msg, true);
    throw new Error(msg);
  }

  eventBus.publish(EDITOR_EVENTS.PUBLISH_STARTED, { platform: 'GitHub Pages', projectPath });
  eventBus.publish(EDITOR_EVENTS.PUBLISH_PROGRESS, { step: 'Preparando y subiendo archivos a GitHub...', progress: 35 });
  showToast('🚀 Subiendo archivos a GitHub Pages...');

  try {
    const res = await fetch('/api/publish/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath,
        repoName,
        token
      })
    });

    const json = await res.json();

    if (json.success && json.data) {
      eventBus.publish(EDITOR_EVENTS.PUBLISH_PROGRESS, { step: '¡Publicación exitosa!', progress: 100 });
      eventBus.publish(EDITOR_EVENTS.PUBLISH_COMPLETED, json.data);
      showToast(`🎉 ¡Sitio publicado! ${json.data.url}`);
      return json.data;
    } else {
      const errorMsg = json.message || json.error?.message || 'Error al publicar en GitHub Pages';
      eventBus.publish(EDITOR_EVENTS.PUBLISH_ERROR, { message: errorMsg, code: json.error_code });
      showToast('Error de publicación: ' + errorMsg, true);
      throw new Error(errorMsg);
    }
  } catch (error) {
    eventBus.publish(EDITOR_EVENTS.PUBLISH_ERROR, { message: error.message });
    throw error;
  }
}

/**
 * Muestra el modal soberano de selección de plataforma de publicación
 * @param {string} [currentProjectPath]
 * @returns {Promise<{platform: string, repoName?: string}|null>}
 */
export function showPublishDialog(currentProjectPath = '') {
  if (typeof document === 'undefined') return Promise.resolve(null);

  const existing = document.querySelector('.publish-modal-overlay');
  if (existing) existing.remove();

  const projectName = currentProjectPath
    ? currentProjectPath.split('/').filter(Boolean).pop() || 'mi-sitio-web'
    : 'mi-sitio-web';

  const isAuth = isGitHubAuthenticated();
  const currentUser = getGitHubUser() || 'Usuario';

  const modal = document.createElement('div');
  modal.className = 'publish-modal-overlay';
  modal.innerHTML = `
    <div class="publish-modal-card">
      <div class="publish-modal-header">
        <div>
          <h2><i class="fas fa-rocket" style="color:var(--oro-charro, #D4AF37);"></i> Publicar Sitio Web</h2>
          <p class="publish-subtitle">Pon tu sitio en línea de forma pública y soberana</p>
        </div>
        <button class="publish-close-btn" aria-label="Cerrar">&times;</button>
      </div>

      <div class="publish-modal-body">
        <div class="publish-auth-banner" id="publish-auth-banner">
          ${isAuth
            ? `
              <div class="publish-user-badge">
                <i class="fab fa-github"></i> Conectado como <strong>${currentUser}</strong>
                <button class="publish-btn-logout" id="btn-pub-logout" title="Cerrar sesión de GitHub">Desconectar</button>
              </div>
            `
            : `
              <div class="publish-login-callout">
                <span><i class="fab fa-github"></i> Sin cuenta vinculada</span>
                <button class="publish-btn-login" id="btn-pub-login">Vincular GitHub</button>
              </div>
            `
          }
        </div>

        <div class="publish-field-group">
          <label for="pub-repo-input">Nombre del Repositorio / Sitio:</label>
          <div class="pub-input-wrap">
            <span class="pub-prefix">github.com/usuario/</span>
            <input type="text" id="pub-repo-input" class="pub-input" value="${projectName}" placeholder="mi-sitio-web" spellcheck="false" />
          </div>
          <small class="pub-hint">Se creará o actualizará este repositorio con GitHub Pages activo.</small>
        </div>

        <div class="publish-platforms-grid">
          <button class="pub-platform-card active" id="btn-choice-github">
            <div class="pub-card-icon github-icon"><i class="fab fa-github"></i></div>
            <div class="pub-card-info">
              <h3>GitHub Pages</h3>
              <p>Hospedaje estático gratuito, HTTPS automático y dominio .github.io</p>
            </div>
            <span class="pub-badge-recommended">Recomendado</span>
          </button>

          <button class="pub-platform-card" id="btn-choice-netlify">
            <div class="pub-card-icon netlify-icon"><i class="fas fa-bolt"></i></div>
            <div class="pub-card-info">
              <h3>Netlify (Drop ZIP)</h3>
              <p>Descarga ZIP optimizado y arrástralo a netlify.com/drop</p>
            </div>
            <span class="pub-badge-alt">Alternativa</span>
          </button>
        </div>
      </div>

      <div class="publish-modal-footer">
        <button class="pub-btn-cancel" id="btn-pub-cancel">Cancelar</button>
        <button class="pub-btn-confirm" id="btn-pub-confirm">
          <i class="fas fa-paper-plane"></i> Iniciar Publicación
        </button>
      </div>
    </div>
  `;

  // Estilos del modal
  const styleId = 'publish-dialog-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .publish-modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(8, 12, 10, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        animation: pubFadeIn 0.2s ease-out;
      }
      @keyframes pubFadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      .publish-modal-card {
        background: var(--bg-surface, #14221f);
        border: 1px solid var(--border-highlight, rgba(226, 181, 64, 0.35));
        border-radius: 16px;
        width: 100%;
        max-width: 580px;
        box-shadow: 0 24px 50px rgba(17, 19, 20, 0.85);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .publish-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color, rgba(226, 181, 64, 0.2));
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .publish-modal-header h2 {
        color: var(--blanco-hueso, #f5ecc2);
        font-size: 1.3rem;
        margin: 0 0 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .publish-subtitle {
        color: var(--texto-sec, #c2ae93);
        font-size: 0.85rem;
        margin: 0;
      }
      .publish-close-btn {
        background: none;
        border: none;
        color: var(--texto-sec, #c2ae93);
        font-size: 1.8rem;
        cursor: pointer;
        line-height: 1;
      }
      .publish-close-btn:hover { color: var(--blanco-hueso, #f5ecc2); }
      .publish-modal-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .publish-auth-banner {
        background: var(--bg-elevated, #1b2e2a);
        border: 1px solid var(--border-color, rgba(226, 181, 64, 0.2));
        border-radius: 8px;
        padding: 10px 14px;
      }
      .publish-user-badge, .publish-login-callout {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.88rem;
        color: var(--blanco-hueso, #f5ecc2);
      }
      .publish-btn-login {
        background: var(--verde-patrio, #1a7444);
        color: #f5ecc2;
        border: 1px solid var(--verde-neon, #00b49b);
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.82rem;
      }
      .publish-btn-login:hover { background: var(--verde-neon, #00b49b); color: #111314; }
      .publish-btn-logout {
        background: none;
        border: 1px solid var(--border-color, rgba(226, 181, 64, 0.25));
        color: var(--texto-sec, #c2ae93);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .publish-btn-logout:hover { color: var(--danger, #cc1236); border-color: var(--danger, #cc1236); }
      .publish-field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .publish-field-group label {
        color: var(--blanco-hueso, #f5ecc2);
        font-size: 0.85rem;
        font-weight: 600;
      }
      .pub-input-wrap {
        display: flex;
        align-items: center;
        background: var(--bg-dark, #111314);
        border: 1px solid var(--border-color, rgba(226, 181, 64, 0.25));
        border-radius: 8px;
        overflow: hidden;
      }
      .pub-input-wrap:focus-within {
        border-color: var(--oro-charro, #e2b540);
      }
      .pub-prefix {
        padding: 8px 10px 8px 12px;
        color: var(--texto-sec, #c2ae93);
        font-size: 0.82rem;
        background: var(--bg-elevated, #1b2e2a);
        border-right: 1px solid var(--border-color, rgba(226, 181, 64, 0.2));
        user-select: none;
      }
      .pub-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--blanco-hueso, #f5ecc2);
        padding: 8px 12px;
        font-size: 0.9rem;
      }
      .pub-input:focus { outline: none; }
      .pub-hint {
        color: var(--texto-sec, #c2ae93);
        font-size: 0.75rem;
      }
      .publish-platforms-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pub-platform-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        background: var(--bg-elevated, #1b2e2a);
        border: 1px solid var(--border-color, rgba(226, 181, 64, 0.2));
        border-radius: 10px;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
        position: relative;
      }
      .pub-platform-card:hover {
        background: var(--bg-hover, #243d37);
      }
      .pub-platform-card.active {
        border-color: var(--oro-charro, #e2b540);
        background: var(--bg-hover, #243d37);
      }
      .pub-card-icon {
        font-size: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
      }
      .pub-card-icon.github-icon { color: var(--blanco-hueso, #f5ecc2); }
      .pub-card-icon.netlify-icon { color: var(--verde-neon, #00b49b); }
      .pub-card-info { flex: 1; }
      .pub-card-info h3 {
        color: var(--blanco-hueso, #f5ecc2);
        font-size: 0.95rem;
        margin: 0 0 2px;
      }
      .pub-card-info p {
        color: var(--texto-sec, #c2ae93);
        font-size: 0.78rem;
        margin: 0;
      }
      .pub-badge-recommended {
        background: rgba(226, 181, 64, 0.2);
        color: var(--oro-charro, #e2b540);
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
      }
      .pub-badge-alt {
        background: rgba(0, 180, 155, 0.15);
        color: var(--verde-neon, #00b49b);
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 4px;
      }
      .publish-modal-footer {
        padding: 16px 24px;
        background: var(--bg-dark, #111314);
        border-top: 1px solid var(--border-color, rgba(226, 181, 64, 0.2));
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .pub-btn-cancel {
        background: transparent;
        border: 1px solid var(--border-color, rgba(226, 181, 64, 0.25));
        color: var(--texto-sec, #c2ae93);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
      }
      .pub-btn-cancel:hover { color: var(--blanco-hueso, #f5ecc2); }
      .pub-btn-confirm {
        background: var(--oro-charro, #e2b540);
        color: #111314;
        border: none;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .pub-btn-confirm:hover { background: var(--oro-brillante, #f99d1b); }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  return new Promise((resolve) => {
    let selectedPlatform = 'github';

    const closeModal = (res = null) => {
      modal.remove();
      resolve(res);
    };

    modal.querySelector('.publish-close-btn').addEventListener('click', () => closeModal(null));
    modal.querySelector('#btn-pub-cancel').addEventListener('click', () => closeModal(null));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(null);
    });

    const btnChoiceGithub = modal.querySelector('#btn-choice-github');
    const btnChoiceNetlify = modal.querySelector('#btn-choice-netlify');

    btnChoiceGithub.addEventListener('click', () => {
      selectedPlatform = 'github';
      btnChoiceGithub.classList.add('active');
      btnChoiceNetlify.classList.remove('active');
    });

    btnChoiceNetlify.addEventListener('click', () => {
      selectedPlatform = 'netlify';
      btnChoiceNetlify.classList.add('active');
      btnChoiceGithub.classList.remove('active');
    });

    // Login rápido desde el modal
    const btnLogin = modal.querySelector('#btn-pub-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', async () => {
        try {
          await authenticateGitHub();
          closeModal({ platform: 'reopen' });
          showPublishDialog(currentProjectPath);
        } catch {}
      });
    }

    const btnLogout = modal.querySelector('#btn-pub-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await logoutGitHub();
        closeModal({ platform: 'reopen' });
        showPublishDialog(currentProjectPath);
      });
    }

    modal.querySelector('#btn-pub-confirm').addEventListener('click', () => {
      const repoInput = modal.querySelector('#pub-repo-input');
      const repoName = repoInput ? repoInput.value.trim() : projectName;
      closeModal({
        platform: selectedPlatform,
        repoName: repoName || projectName
      });
    });
  });
}
