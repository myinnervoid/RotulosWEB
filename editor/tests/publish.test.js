import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app } = require('../server.js');
const { GitHubAPI } = require('../server/github-api.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Publish & OAuth Suite — Publicación Simplificada (Fase 2)', () => {
  it('GET /api/auth/github/login redirige a la URL de autorización de GitHub', async () => {
    const res = await request(app)
      .get('/api/auth/github/login')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('github.com/login/oauth/authorize');
    expect(res.headers.location).toContain('scope=repo,user');
  });

  it('GET /api/auth/github/callback falla con 400 si no se recibe parámetro code', async () => {
    const res = await request(app)
      .get('/api/auth/github/callback')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(400);
    expect(res.text).toContain('No se recibió código de autorización');
  });

  it('GET /api/auth/github/status devuelve estado inicial no autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/github/status')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.authenticated).toBe(false);
  });

  it('POST /api/auth/github/logout restablece el estado de autenticación', async () => {
    const res = await request(app)
      .post('/api/auth/github/logout')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.authenticated).toBe(false);
  });

  it('POST /api/publish/github rechaza con 401 si no hay token ni sesión activa', async () => {
    const res = await request(app)
      .post('/api/publish/github')
      .set('Host', '127.0.0.1:5050')
      .send({ projectPath: '/tmp', repoName: 'test-repo' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('AUTH_REQUIRED');
  });

  it('POST /api/publish/github rechaza con 404 si el projectPath no existe', async () => {
    const res = await request(app)
      .post('/api/publish/github')
      .set('Host', '127.0.0.1:5050')
      .send({
        projectPath: '/ruta/inexistente/de/prueba-' + Date.now(),
        repoName: 'test-repo',
        token: 'ghp_dummytoken123456789'
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('PROJECT_NOT_FOUND');
  });

  it('GitHubAPI lanza error si se inicializa sin token', () => {
    expect(() => new GitHubAPI('')).toThrow('Token de autenticación de GitHub requerido');
    expect(() => new GitHubAPI(null)).toThrow('Token de autenticación de GitHub requerido');
  });

  it('GitHubAPI instancia correctamente con headers requeridos', () => {
    const client = new GitHubAPI('ghp_test123');
    expect(client.token).toBe('ghp_test123');
    expect(client.headers.Authorization).toBe('token ghp_test123');
    expect(client.headers['User-Agent']).toBe('Rotulos-Web-Studio');
  });

  it('POST /api/publish/github realiza despliegue exitoso cuando GitHub API responde OK', async () => {
    // Directorio temporal con index.html
    const tempDir = path.join(os.tmpdir(), 'rotulos-publish-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<html><body>Publicado</body></html>', 'utf8');

    // Mockeamos los métodos de GitHubAPI
    const originalGetUsername = GitHubAPI.prototype.getUsername;
    const originalGetRepo = GitHubAPI.prototype.getRepo;
    const originalCreateRepo = GitHubAPI.prototype.createRepo;
    const originalUploadProjectDirectory = GitHubAPI.prototype.uploadProjectDirectory;
    const originalEnablePages = GitHubAPI.prototype.enablePages;
    const originalGetPagesInfo = GitHubAPI.prototype.getPagesInfo;

    GitHubAPI.prototype.getUsername = vi.fn().mockResolvedValue('testuser');
    GitHubAPI.prototype.getRepo = vi.fn().mockResolvedValue({ name: 'mi-sitio' });
    GitHubAPI.prototype.createRepo = vi.fn().mockResolvedValue({ name: 'mi-sitio' });
    GitHubAPI.prototype.uploadProjectDirectory = vi.fn().mockResolvedValue({ total: 1 });
    GitHubAPI.prototype.enablePages = vi.fn().mockResolvedValue({ status: 'built' });
    GitHubAPI.prototype.getPagesInfo = vi.fn().mockResolvedValue({ html_url: 'https://testuser.github.io/mi-sitio/' });

    try {
      const res = await request(app)
        .post('/api/publish/github')
        .set('Host', '127.0.0.1:5050')
        .send({
          projectPath: tempDir,
          repoName: 'mi-sitio',
          token: 'ghp_validmocktoken'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBe('https://testuser.github.io/mi-sitio/');
      expect(res.body.data.repo).toBe('mi-sitio');
      expect(res.body.data.user).toBe('testuser');
    } finally {
      // Restaurar métodos originales
      GitHubAPI.prototype.getUsername = originalGetUsername;
      GitHubAPI.prototype.getRepo = originalGetRepo;
      GitHubAPI.prototype.createRepo = originalCreateRepo;
      GitHubAPI.prototype.uploadProjectDirectory = originalUploadProjectDirectory;
      GitHubAPI.prototype.enablePages = originalEnablePages;
      GitHubAPI.prototype.getPagesInfo = originalGetPagesInfo;

      // Limpiar temporal
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});
