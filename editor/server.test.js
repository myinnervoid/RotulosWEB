const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./server'); // Importar para testing sin levantar el servidor por defecto

describe('API Tests', () => {
  it('Debe rechazar conexiones de IP no locales', async () => {
    const res = await request(app).get('/api/current-project');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/page debe retornar HTML', async () => {
    const testProject = path.resolve(__dirname, '..');
    const res = await request(app).get(`/api/page?project=${encodeURIComponent(testProject)}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('html');
  });

  it('POST /api/save debe requerir contenido HTML válido', async () => {
    const res = await request(app)
      .post('/api/save')
      .send({ html: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PAYLOAD');
  });

  it('POST /api/save con HTML malformado debe fallar', async () => {
    const res = await request(app)
      .post('/api/save')
      .send({ html: 'esto es un texto sin estructura html' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('MALFORMED_HTML');
  });
});