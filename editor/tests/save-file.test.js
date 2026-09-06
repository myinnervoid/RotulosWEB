import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { app } = require('../server.js');

describe('POST /api/save-file — Sincronización Bidireccional de Archivos', () => {
  const testFileName = 'test-dynamic-sync.css';
  let createdFilePath = null;

  afterAll(() => {
    if (createdFilePath && fs.existsSync(createdFilePath)) {
      try { fs.unlinkSync(createdFilePath); } catch (_) {}
    }
  });

  it('debe guardar un archivo CSS correctamente dentro del proyecto activo', async () => {
    const cssContent = '/* Test dinámico */\n.mex-banner { background: #006847; }';

    const res = await request(app)
      .post('/api/save-file')
      .set('Host', '127.0.0.1:5050')
      .send({
        file: testFileName,
        content: cssContent
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('file', testFileName);

    // Obtener ruta del proyecto para verificar existencia en disco
    const projectRes = await request(app)
      .get('/api/current-project')
      .set('Host', '127.0.0.1:5050');

    const projectPath = projectRes.body.data.projectPath;
    createdFilePath = path.join(projectPath, testFileName);

    expect(fs.existsSync(createdFilePath)).toBe(true);
    expect(fs.readFileSync(createdFilePath, 'utf8')).toBe(cssContent);
  });

  it('debe rechazar con 403 intentos de Directory Traversal fuera del proyecto', async () => {
    const res = await request(app)
      .post('/api/save-file')
      .set('Host', '127.0.0.1:5050')
      .send({
        file: '../../../../etc/malicious.txt',
        content: 'malicious payload'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('FORBIDDEN_PATH');
  });

  it('debe responder 400 si falta el parámetro "file"', async () => {
    const res = await request(app)
      .post('/api/save-file')
      .set('Host', '127.0.0.1:5050')
      .send({
        content: 'cuerpo sin archivo'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PATH');
  });

  it('debe responder 400 si "content" no es una cadena de texto', async () => {
    const res = await request(app)
      .post('/api/save-file')
      .set('Host', '127.0.0.1:5050')
      .send({
        file: 'style.css',
        content: 12345
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PAYLOAD');
  });

  it('GET /api/watch con ruta inválida responde 400 y código INVALID_PATH', async () => {
    const res = await request(app)
      .get('/api/watch?project=/ruta/inexistente_12345')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PATH');
  });

  it('GET /api/watch abre conexión SSE con encabezados text/event-stream', async () => {
    const req = request(app)
      .get('/api/watch')
      .set('Host', '127.0.0.1:5050')
      .parse((res, fn) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
        res.destroy();
        fn(null, {});
      });

    await req;
  });
});
