import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app } = require('../server.js');

describe('Backend Integration Suite — Contratos canónicos ApiResponse<T>', () => {
  it('GET /api/current-project responde con estructura canónica ApiResponse', async () => {
    const res = await request(app)
      .get('/api/current-project')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('projectPath');
    expect(res.body.data).toHaveProperty('hasIndex');
    expect(res.body).toHaveProperty('error_code', null);
    expect(typeof res.body.message).toBe('string');
  });

  it('GET /api/recent-projects responde con array de proyectos', async () => {
    const res = await request(app)
      .get('/api/recent-projects')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('error_code', null);
  });

  it('GET /api/stats devuelve métricas del servidor', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalBackups');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('memory');
    expect(res.body.error_code).toBe(null);
  });

  it('POST /api/save con payload vacío responde 400 y código INVALID_PAYLOAD', async () => {
    const res = await request(app)
      .post('/api/save')
      .set('Host', '127.0.0.1:5050')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PAYLOAD');
    expect(res.body.data).toBe(null);
  });

  it('POST /api/save con contenido no HTML responde 400 y código MALFORMED_HTML', async () => {
    const res = await request(app)
      .post('/api/save')
      .set('Host', '127.0.0.1:5050')
      .send({ html: 'texto plano sin etiquetas' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('MALFORMED_HTML');
  });

  it('POST /api/switch-project con ruta inexistente responde 400 y código PATH_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/switch-project')
      .set('Host', '127.0.0.1:5050')
      .send({ newProjectPath: '/ruta/que/no/existe/en/este/sistema_12345' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('PATH_NOT_FOUND');
  });

  it('POST /api/switch-project sin ruta responde 400 y código INVALID_PATH', async () => {
    const res = await request(app)
      .post('/api/switch-project')
      .set('Host', '127.0.0.1:5050')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PATH');
  });

  it('POST /api/screenshot responde con ApiResponse canónica ante html personalizado o ausencia de navegador', async () => {
    const res = await request(app)
      .post('/api/screenshot')
      .set('Host', '127.0.0.1:5050')
      .send({
        device: 'mobile',
        html: '<div><h1>Captura de Prueba</h1></div>',
        css: 'h1 { color: red; }'
      });

    // En entornos CI o sin Chrome devolverá 503 (CHROME_NOT_FOUND) o si Chrome está instalado devolverá 200 con ApiResponse
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('url');
    } else {
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error_code', 'CHROME_NOT_FOUND');
    }
  }, 15000);

  it('GET /api/assets escanea imágenes y responde con lista de assets', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('assets');
    expect(Array.isArray(res.body.data.assets)).toBe(true);
  });

  it('GET en ruta relativa de archivo existente en el proyecto lo sirve estáticamente con seguridad', async () => {
    // Probar con un archivo que siempre existe en el proyecto activo (ej. index.html o assets)
    const res = await request(app)
      .get('/index.html')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
  });

  it('Protección contra Directory Traversal bloquea acceso fuera de projectPath', async () => {
    const res = await request(app)
      .get('/../../../../etc/shadow')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).not.toBe(200);
  });

  it('POST /api/save serializa peticiones concurrentes mediante mutex sin race conditions', async () => {
    // 1. Obtener y respaldar la ruta del proyecto activo
    const currentRes = await request(app).get('/api/current-project').set('Host', '127.0.0.1:5050');
    const originalProjectPath = currentRes.body?.data?.projectPath;

    // 2. Crear un directorio temporal aislado para la prueba
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const testDir = path.join(os.tmpdir(), `rotulos-save-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'index.html'), '<!DOCTYPE html><html><body><h1>Test Inicial</h1></body></html>', 'utf8');
    fs.writeFileSync(path.join(testDir, 'style.css'), 'body { margin: 0; }', 'utf8');

    // Conmutar temporalmente el proyecto activo
    await request(app)
      .post('/api/switch-project')
      .set('Host', '127.0.0.1:5050')
      .send({ newProjectPath: testDir });

    try {
      const validHtml = '<div><h2>Prueba de Concurrencia</h2><p>Contenido concurrente</p></div>';

      // Disparar 3 peticiones de guardado paralelas simultáneas
      const promises = [1, 2, 3].map(i =>
        request(app)
          .post('/api/save')
          .set('Host', '127.0.0.1:5050')
          .send({
            html: `${validHtml} <!-- Paso ${i} -->`,
            css: `p { color: ${i === 1 ? 'blue' : i === 2 ? 'green' : 'red'}; }`
          })
      );

      const results = await Promise.all(promises);
      for (const res of results) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('backup');
      }
    } finally {
      // 3. Restaurar invariablemente el proyecto activo original
      if (originalProjectPath && fs.existsSync(originalProjectPath)) {
        await request(app)
          .post('/api/switch-project')
          .set('Host', '127.0.0.1:5050')
          .send({ newProjectPath: originalProjectPath });
      }
      // Limpiar directorio temporal de pruebas
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });
});



