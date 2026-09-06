/**
 * ============================================================
 * 🔐 auth.js — Gestor Soberano de Autenticación GitHub OAuth2
 * Rótulos Web / Memexicanísimos Studio v5.0
 * ============================================================
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';

let githubToken = (typeof localStorage !== 'undefined' && localStorage.getItem('github_token')) || null;
let githubUser = (typeof localStorage !== 'undefined' && localStorage.getItem('github_user')) || null;

/**
 * Obtiene el token de acceso de GitHub actual
 * @returns {string|null}
 */
export function getGitHubToken() {
  if (typeof localStorage !== 'undefined') {
    githubToken = localStorage.getItem('github_token') || githubToken;
  }
  return githubToken;
}

/**
 * Obtiene el nombre de usuario de GitHub actual
 * @returns {string|null}
 */
export function getGitHubUser() {
  if (typeof localStorage !== 'undefined') {
    githubUser = localStorage.getItem('github_user') || githubUser;
  }
  return githubUser;
}

/**
 * Determina si hay una sesión activa de GitHub
 * @returns {boolean}
 */
export function isGitHubAuthenticated() {
  return Boolean(getGitHubToken());
}

/**
 * Abre la ventana modal/popup para iniciar el flujo de autenticación OAuth2 con GitHub
 * @returns {Promise<{user: string, token: string}>}
 */
export function authenticateGitHub() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Entorno no compatible con autenticación en navegador'));
  }

  const width = 600;
  const height = 720;
  const left = Math.max(0, (window.innerWidth - width) / 2 + window.screenX);
  const top = Math.max(0, (window.innerHeight - height) / 2 + window.screenY);

  const popup = window.open(
    '/api/auth/github/login',
    'github-oauth-window',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
  );

  return new Promise((resolve, reject) => {
    let checkInterval = null;

    const cleanup = () => {
      if (checkInterval) clearInterval(checkInterval);
      window.removeEventListener('message', onMessage);
    };

    const onMessage = (event) => {
      if (event.data && event.data.type === 'github-auth-success') {
        cleanup();
        githubToken = localStorage.getItem('github_token');
        githubUser = localStorage.getItem('github_user') || event.data.user;
        eventBus.publish(EDITOR_EVENTS.GITHUB_AUTH_CHANGED, {
          authenticated: true,
          user: githubUser,
          token: githubToken
        });
        resolve({ user: githubUser, token: githubToken });
      }
    };

    window.addEventListener('message', onMessage);

    // Detección de cierre manual de ventana por parte del usuario
    checkInterval = setInterval(() => {
      if (!popup || popup.closed) {
        cleanup();
        // Verificar si el token se guardó antes del cierre
        const savedToken = localStorage.getItem('github_token');
        if (savedToken) {
          githubToken = savedToken;
          githubUser = localStorage.getItem('github_user');
          eventBus.publish(EDITOR_EVENTS.GITHUB_AUTH_CHANGED, {
            authenticated: true,
            user: githubUser,
            token: githubToken
          });
          resolve({ user: githubUser, token: githubToken });
        } else {
          reject(new Error('Ventana de autenticación de GitHub cerrada'));
        }
      }
    }, 600);
  });
}

/**
 * Cierra la sesión de GitHub eliminando tokens almacenados
 */
export async function logoutGitHub() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
  }
  githubToken = null;
  githubUser = null;

  try {
    await fetch('/api/auth/github/logout', { method: 'POST' });
  } catch {}

  eventBus.publish(EDITOR_EVENTS.GITHUB_AUTH_CHANGED, {
    authenticated: false,
    user: null,
    token: null
  });
}

// Escuchar cambios de token entre pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'github_token') {
      githubToken = event.newValue;
      githubUser = localStorage.getItem('github_user');
      eventBus.publish(EDITOR_EVENTS.GITHUB_AUTH_CHANGED, {
        authenticated: Boolean(githubToken),
        user: githubUser,
        token: githubToken
      });
    }
  });

  // Notificar estado inicial al arrancar
  if (githubToken) {
    setTimeout(() => {
      eventBus.publish(EDITOR_EVENTS.GITHUB_AUTH_CHANGED, {
        authenticated: true,
        user: githubUser,
        token: githubToken
      });
    }, 100);
  }
}
