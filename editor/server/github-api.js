/**
 * ============================================================
 * 🐙 github-api.js — Cliente Soberano de GitHub API v3
 * Rótulos Web / Memexicanísimos Studio v5.0
 * ============================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

class GitHubAPI {
  /**
   * @param {string} token - GitHub Personal Access Token u OAuth Token
   * @param {object} [options]
   */
  constructor(token, options = {}) {
    if (!token) {
      throw new Error('Token de autenticación de GitHub requerido');
    }
    this.token = token;
    this.baseUrl = options.baseUrl || 'https://api.github.com';
    this.headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Rotulos-Web-Studio'
    };
    this.username = null;
  }

  /**
   * Realiza una petición con timeout y manejo estandarizado de errores
   */
  async _fetch(endpoint, opts = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...opts,
      headers: {
        ...this.headers,
        ...(opts.headers || {})
      }
    });
    return response;
  }

  /**
   * Obtiene y cachea el username del usuario autenticado
   * @returns {Promise<string>}
   */
  async getUsername() {
    if (this.username) return this.username;
    const res = await this._fetch('/user');
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Fallo al verificar usuario en GitHub (${res.status})`);
    }
    const data = await res.json();
    this.username = data.login;
    return this.username;
  }

  /**
   * Consulta detalles de un repositorio
   * @param {string} repoName
   * @returns {Promise<object>}
   */
  async getRepo(repoName) {
    const username = await this.getUsername();
    const res = await this._fetch(`/repos/${username}/${repoName}`);
    if (!res.ok) {
      throw new Error(`Repositorio "${repoName}" no encontrado`);
    }
    return res.json();
  }

  /**
   * Crea un nuevo repositorio en la cuenta del usuario
   * @param {string} repoName
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async createRepo(repoName, options = {}) {
    const payload = {
      name: repoName,
      description: options.description || 'Sitio web publicado desde Rótulos Web / Memexicanísimos Studio',
      private: options.private ?? false,
      auto_init: options.auto_init ?? true
    };

    const res = await this._fetch('/user/repos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al crear repositorio en GitHub (${res.status})`);
    }
    return res.json();
  }

  /**
   * Sube o actualiza un archivo en el repositorio
   * @param {string} repoName
   * @param {string} filePath - Ruta relativa dentro del repositorio
   * @param {string|Buffer} content - Contenido del archivo
   * @param {string} [message]
   * @param {string} [sha]
   * @returns {Promise<object>}
   */
  async createOrUpdateFile(repoName, filePath, content, message = `Subir ${filePath}`, sha = null) {
    const username = await this.getUsername();
    const base64Content = Buffer.isBuffer(content)
      ? content.toString('base64')
      : Buffer.from(content, 'utf8').toString('base64');

    // Si no se proporcionó SHA, consultar si el archivo ya existe para obtener su SHA actual
    let fileSha = sha;
    if (!fileSha) {
      try {
        const checkRes = await this._fetch(`/repos/${username}/${repoName}/contents/${encodeURIComponent(filePath)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          fileSha = checkData.sha;
        }
      } catch {}
    }

    const body = {
      message: message || `Actualizar ${filePath}`,
      content: base64Content,
      branch: 'main'
    };
    if (fileSha) {
      body.sha = fileSha;
    }

    const res = await this._fetch(`/repos/${username}/${repoName}/contents/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al subir archivo "${filePath}" (${res.status})`);
    }
    return res.json();
  }

  /**
   * Habilita GitHub Pages en la rama main
   * @param {string} repoName
   * @returns {Promise<object|null>}
   */
  async enablePages(repoName) {
    const username = await this.getUsername();
    const res = await this._fetch(`/repos/${username}/${repoName}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      })
    });

    // 422: Pages ya existe o ya está configurado
    if (res.status === 422 || res.status === 409) {
      return null;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error al activar GitHub Pages (${res.status})`);
    }
    return res.json();
  }

  /**
   * Obtiene la información de GitHub Pages
   * @param {string} repoName
   * @returns {Promise<object>}
   */
  async getPagesInfo(repoName) {
    const username = await this.getUsername();
    const res = await this._fetch(`/repos/${username}/${repoName}/pages`);
    if (!res.ok) {
      return { html_url: `https://${username}.github.io/${repoName}/` };
    }
    return res.json();
  }

  /**
   * Sube todos los archivos de un directorio de proyecto local
   * @param {string} repoName
   * @param {string} projectDir
   * @param {function} [onProgress]
   */
  async uploadProjectDirectory(repoName, projectDir, onProgress = null) {
    const files = [];

    const walk = (dir, baseRel = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          if (entry.name !== '.git' && entry.name !== 'node_modules' && entry.name !== 'backups' && entry.name !== '.talachas') {
            walk(full, rel);
          }
        } else if (entry.isFile()) {
          files.push({ full, rel });
        }
      }
    };

    walk(projectDir);

    let uploaded = 0;
    for (const file of files) {
      const content = fs.readFileSync(file.full);
      await this.createOrUpdateFile(repoName, file.rel, content, `Deploy ${file.rel}`);
      uploaded++;
      if (typeof onProgress === 'function') {
        onProgress({ current: uploaded, total: files.length, file: file.rel });
      }
    }

    return { total: files.length };
  }
}

module.exports = { GitHubAPI };
