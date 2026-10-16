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
        background: #141B17;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 16px;
        width: 100%;
        max-width: 580px;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.8);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .publish-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .publish-modal-header h2 {
        color: #F8F9FA;
        font-size: 1.3rem;
        margin: 0 0 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .publish-subtitle {
        color: #9CA3AF;
        font-size: 0.85rem;
        margin: 0;
      }
      .publish-close-btn {
        background: none;
        border: none;
        color: #9CA3AF;
        font-size: 1.8rem;
        cursor: pointer;
        line-height: 1;
      }
      .publish-close-btn:hover { color: #fff; }
      .publish-modal-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .publish-auth-banner {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px 14px;
      }
      .publish-user-badge, .publish-login-callout {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.88rem;
        color: #E5E7EB;
      }
      .publish-btn-login {
        background: #238636;
        color: #fff;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.82rem;
      }
      .publish-btn-login:hover { background: #2ea043; }
      .publish-btn-logout {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #9CA3AF;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .publish-btn-logout:hover { color: #EF4444; border-color: #EF4444; }
      .publish-field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .publish-field-group label {
        color: #E5E7EB;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .pub-input-wrap {
        display: flex;
        align-items: center;
        background: #0A0F0D;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        overflow: hidden;
      }
      .pub-input-wrap:focus-within {
        border-color: var(--oro-charro, #D4AF37);
      }
      .pub-prefix {
        padding: 8px 10px 8px 12px;
        color: #6B7280;
        font-size: 0.82rem;
        background: rgba(255, 255, 255, 0.03);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        user-select: none;
      }
      .pub-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #F8F9FA;
        padding: 8px 12px;
        font-size: 0.9rem;
      }
      .pub-input:focus { outline: none; }
      .pub-hint {
        color: #6B7280;
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
        background: #1A231F;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
        position: relative;
      }
      .pub-platform-card:hover {
        background: #212E29;
      }
      .pub-platform-card.active {
        border-color: var(--oro-charro, #D4AF37);
        background: #212E29;
      }
      .pub-card-icon {
        font-size: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
      }
      .pub-card-icon.github-icon { color: #F8F9FA; }
      .pub-card-icon.netlify-icon { color: #00C7B7; }
      .pub-card-info { flex: 1; }
      .pub-card-info h3 {
        color: #F8F9FA;
        font-size: 0.95rem;
        margin: 0 0 2px;
      }
      .pub-card-info p {
        color: #9CA3AF;
        font-size: 0.78rem;
        margin: 0;
      }
      .pub-badge-recommended {
        background: rgba(212, 175, 55, 0.2);
        color: var(--oro-charro, #D4AF37);
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
      }
      .pub-badge-alt {
        background: rgba(0, 199, 183, 0.15);
        color: #00C7B7;
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 4px;
      }
      .publish-modal-footer {
        padding: 16px 24px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .pub-btn-cancel {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #9CA3AF;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
      }
      .pub-btn-cancel:hover { color: #fff; }
      .pub-btn-confirm {
        background: var(--oro-charro, #D4AF37);
        color: #0A0F0D;
        border: none;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .pub-btn-confirm:hover { background: #E5C158; }
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
