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

  it('GET /api/assets con query params de paginación debe responder con estructura paginada', async () => {
    const res = await request(app).get('/api/assets?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('assets');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('limit');
    expect(res.body.data).toHaveProperty('hasMore');
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(5);
  });
});
