import { describe, it, expect, beforeAll, afterAll, } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { app } from '../server.js';
import { ERROR_CODES } from '../server/error-codes.js';

describe('Server Hardening Tests', () => {
  const TEST_DIR = path.join(os.tmpdir(), `rotulos_test_${Date.now()}`);
  const BACKUPS_DIR = path.join(TEST_DIR, 'backups');
  let originalProjectPath;
  let originalHome;

  beforeAll(() => {
    // Save original env
    originalProjectPath = process.env.PROJECT_PATH;
    originalHome = process.env.HOME;

    // Set up test environment
    process.env.PROJECT_PATH = TEST_DIR;
    process.env.HOME = TEST_DIR;

    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // Mock initial files
    fs.writeFileSync(path.join(TEST_DIR, 'index.html'), '<html><body>Original</body></html>');
    fs.writeFileSync(path.join(TEST_DIR, 'style.css'), 'body { background: white; }');
  });

  afterAll(() => {
    // Restore environment
    process.env.PROJECT_PATH = originalProjectPath;
    process.env.HOME = originalHome;

    // Clean up
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('/api/save - Atomic Save and Payload Validation', () => {
    it('should successfully save valid HTML and CSS and verify payload', async () => {
      // First, switch project to TEST_DIR to ensure it saves there
      await request(app)
        .post('/api/switch-project')
        .send({ newProjectPath: TEST_DIR })
        .set('Accept', 'application/json');

      const validHtml = '<!DOCTYPE html><html><body>Valid HTML</body></html>';
      const validCss = 'body { background: blue; }';

      const res = await request(app)
        .post('/api/save')
        .send({ html: validHtml, css: validCss })
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('¡Cambios guardados con éxito');

      // Verify files were actually written correctly
      const savedHtml = fs.readFileSync(path.join(TEST_DIR, 'index.html'), 'utf8');
      const savedCss = fs.readFileSync(path.join(TEST_DIR, 'style.css'), 'utf8');

      expect(savedHtml).toBe(validHtml);
      expect(savedCss).toBe(validCss);

      // Verify backup was created
      const backups = fs.readdirSync(BACKUPS_DIR);
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should fail when HTML lacks basic structure', async () => {
      const invalidHtml = 'just some text, not html';

      const res = await request(app)
        .post('/api/save')
        .send({ html: invalidHtml })
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe(ERROR_CODES.MALFORMED_HTML.code);
    });
  });

  describe('/api/switch-project - Path Sanitization', () => {
    it('should switch project gracefully to a valid path', async () => {
      const newProjectPath = path.join(TEST_DIR, 'new-project-space');
      fs.mkdirSync(newProjectPath, { recursive: true });

      const res = await request(app)
        .post('/api/switch-project')
        .send({ newProjectPath })
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectPath).toBe(path.resolve(newProjectPath));
    });

    it('should gracefully handle and return 400 when path contains null bytes', async () => {
      const maliciousPath = '/tmp/project\0name';

      const res = await request(app)
        .post('/api/switch-project')
        .send({ newProjectPath: maliciousPath })
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe(ERROR_CODES.INVALID_PATH.code);
      expect(res.body.message).toBe('Ruta contiene caracteres inválidos');
    });

    it('should return 400 when switching to a non-existent directory', async () => {
      const nonExistentPath = path.join(TEST_DIR, 'does-not-exist');

      const res = await request(app)
        .post('/api/switch-project')
        .send({ newProjectPath: nonExistentPath })
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error_code).toBe(ERROR_CODES.PATH_NOT_FOUND.code);
    });
  });
});
