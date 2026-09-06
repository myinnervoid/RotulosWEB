/**
 * ============================================================
 * 🧪 templates.test.js — Suite de Pruebas de API de Plantillas
 * Rótulos Web / Memexicanísimos Studio v4.0
 * ============================================================
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Templates & Assets API Suite', () => {
  it('GET /api/templates debe responder con lista de plantillas disponibles en formato ApiResponse', async () => {
    const res = await request(app).get('/api/templates');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const ids = res.body.data.map(t => t.id);
    expect(ids).toContain('landing');
    expect(ids).toContain('blog');
    expect(ids).toContain('portfolio');
  });

  it('GET /api/templates/:id debe responder con el HTML y CSS de una plantilla existente', async () => {
    const res = await request(app).get('/api/templates/landing');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('html');
    expect(res.body.data).toHaveProperty('css');
    expect(res.body.data.html).toContain('Landing Moderna');
  });

  it('GET /api/templates/:id debe responder 404 para plantilla inexistente', async () => {
    const res = await request(app).get('/api/templates/plantilla-fantasma-404');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/templates/:id debe incluir la lista de assets y reescribir rutas relativas', async () => {
    const res = await request(app).get('/api/templates/landing');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('assets');
    expect(Array.isArray(res.body.data.assets)).toBe(true);
    expect(res.body.data.assets).toContain('hero-mockup.svg');
    expect(res.body.data.html).toContain('/api/templates/landing/assets/');
  });

  it('GET /api/templates/:id/assets/* debe servir un archivo de asset existente con status 200', async () => {
    const res = await request(app).get('/api/templates/landing/assets/hero-mockup.svg');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/svg|xml|image/);
  });

  it('GET /api/templates/:id/assets/* debe rechazar intentos de path traversal con código 403', async () => {
    const res = await request(app).get('/api/templates/landing/assets/%2e%2e%2f%2e%2e%2fpackage.json');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('ACCESS_DENIED');
  });

  it('GET /api/templates/:id/assets/* debe devolver 404 para asset inexistente', async () => {
    const res = await request(app).get('/api/templates/landing/assets/asset-que-no-existe-xyz.png');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
