import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { app } = require('../server.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECTS_BASE = path.join(os.homedir(), 'RotulosProjects');
const TEST_PROJECT = 'test-project-' + Date.now();
const TEST_PROJECT_TPL = 'test-project-tpl-' + Date.now();

describe('Projects API Suite — CRUD de Proyectos Locales', () => {
  beforeAll(() => {
    // Asegurar directorio base de proyectos
    if (!fs.existsSync(PROJECTS_BASE)) {
      fs.mkdirSync(PROJECTS_BASE, { recursive: true });
    }

    // Crear un proyecto de prueba con index.html
    const testPath = path.join(PROJECTS_BASE, TEST_PROJECT);
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(testPath, { recursive: true });
      fs.writeFileSync(path.join(testPath, 'index.html'), '<!DOCTYPE html><html><body><h1>Test</h1></body></html>', 'utf8');
    }
  });

  afterAll(() => {
    // Limpieza de proyectos creados durante la suite
    const pathsToClean = [
      path.join(PROJECTS_BASE, TEST_PROJECT),
      path.join(PROJECTS_BASE, TEST_PROJECT_TPL),
      path.join(PROJECTS_BASE, `${TEST_PROJECT}-copia`),
      path.join(PROJECTS_BASE, `${TEST_PROJECT}-renombrado`)
    ];

    for (const p of pathsToClean) {
      if (fs.existsSync(p)) {
        try {
          fs.rmSync(p, { recursive: true, force: true });
        } catch {}
      }
    }
  });

  it('GET /api/projects/list devuelve array canónico con proyectos válidos', async () => {
    const res = await request(app)
      .get('/api/projects/list')
      .set('Host', '127.0.0.1:5050');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const found = res.body.data.find(p => p.name === TEST_PROJECT);
    expect(found).toBeDefined();
    expect(found).toHaveProperty('path');
    expect(found).toHaveProperty('modified');
    expect(found).toHaveProperty('size');
  });

  it('POST /api/projects/create crea un proyecto en blanco correctamente', async () => {
    const name = 'nuevo-blanco-' + Date.now();
    const res = await request(app)
      .post('/api/projects/create')
      .set('Host', '127.0.0.1:5050')
      .send({ name });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(name);

    const createdPath = path.join(PROJECTS_BASE, name);
    expect(fs.existsSync(createdPath)).toBe(true);
    expect(fs.existsSync(path.join(createdPath, 'index.html'))).toBe(true);

    // Limpiar
    fs.rmSync(createdPath, { recursive: true, force: true });
  });

  it('POST /api/projects/create clona una plantilla existente cuando se especifica templateId', async () => {
    const res = await request(app)
      .post('/api/projects/create')
      .set('Host', '127.0.0.1:5050')
      .send({ name: TEST_PROJECT_TPL, templateId: 'landing' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(TEST_PROJECT_TPL);

    const createdPath = path.join(PROJECTS_BASE, TEST_PROJECT_TPL);
    expect(fs.existsSync(createdPath)).toBe(true);
    expect(fs.existsSync(path.join(createdPath, 'index.html'))).toBe(true);

    const content = fs.readFileSync(path.join(createdPath, 'index.html'), 'utf8');
    expect(content.length).toBeGreaterThan(50);
  });

  it('POST /api/projects/create falla con 400 si falta el nombre', async () => {
    const res = await request(app)
      .post('/api/projects/create')
      .set('Host', '127.0.0.1:5050')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('INVALID_PARAMS');
  });

  it('POST /api/projects/create falla con 409 si el proyecto ya existe', async () => {
    const res = await request(app)
      .post('/api/projects/create')
      .set('Host', '127.0.0.1:5050')
      .send({ name: TEST_PROJECT });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('PROJECT_EXISTS');
  });

  it('POST /api/projects/duplicate clona un proyecto existente', async () => {
    const newName = `${TEST_PROJECT}-copia`;
    const res = await request(app)
      .post('/api/projects/duplicate')
      .set('Host', '127.0.0.1:5050')
      .send({ sourceName: TEST_PROJECT, newName });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newName);

    const destPath = path.join(PROJECTS_BASE, newName);
    expect(fs.existsSync(destPath)).toBe(true);
    expect(fs.existsSync(path.join(destPath, 'index.html'))).toBe(true);
  });

  it('POST /api/projects/duplicate falla con 404 si el proyecto origen no existe', async () => {
    const res = await request(app)
      .post('/api/projects/duplicate')
      .set('Host', '127.0.0.1:5050')
      .send({ sourceName: 'inexistente-12345', newName: 'algo-nuevo' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('PROJECT_NOT_FOUND');
  });

  it('POST /api/projects/rename renombra la carpeta del proyecto en disco', async () => {
    const newName = `${TEST_PROJECT}-renombrado`;
    const res = await request(app)
      .post('/api/projects/rename')
      .set('Host', '127.0.0.1:5050')
      .send({ oldName: TEST_PROJECT, newName });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newName);

    const newPath = path.join(PROJECTS_BASE, newName);
    expect(fs.existsSync(newPath)).toBe(true);

    // Restaurar nombre original para que los afterAll y tests siguientes sean consistentes
    fs.renameSync(newPath, path.join(PROJECTS_BASE, TEST_PROJECT));
  });

  it('POST /api/projects/delete elimina el proyecto en disco', async () => {
    const tempName = 'temp-delete-' + Date.now();
    const tempPath = path.join(PROJECTS_BASE, tempName);
    fs.mkdirSync(tempPath, { recursive: true });
    fs.writeFileSync(path.join(tempPath, 'index.html'), '<html><body>Eliminar</body></html>', 'utf8');

    const res = await request(app)
      .post('/api/projects/delete')
      .set('Host', '127.0.0.1:5050')
      .send({ name: tempName });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fs.existsSync(tempPath)).toBe(false);
  });

  it('POST /api/projects/delete falla con 404 si el proyecto no existe', async () => {
    const res = await request(app)
      .post('/api/projects/delete')
      .set('Host', '127.0.0.1:5050')
      .send({ name: 'proyecto-fantasma-' + Date.now() });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe('PROJECT_NOT_FOUND');
  });
});
