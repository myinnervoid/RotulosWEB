import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bootstrap Integrity (BUG-001, BUG-002, BUG-003, BUG-004)', () => {
  let htmlContent = '';
  const publicDir = path.resolve('./public');

  beforeAll(() => {
    htmlContent = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
  });

  it('debe cargar main.js como ES Module nativo', () => {
    expect(htmlContent).toContain('<script type="module" src="./modules/main.js"></script>');
  });

  it('debe asegurar la ausencia de carga clásica de app.js en index.html', () => {
    expect(htmlContent).not.toMatch(/<script[^>]*src=["'].*app\.js["']/);
  });

  it('debe tener cero dependencias de CDN externo para axe-core', () => {
    expect(htmlContent).not.toContain('cdnjs.cloudflare.com/ajax/libs/axe-core');
    expect(htmlContent).toMatch(/<script src="\.\/vendor\/axe\.min\.js">(<\\\\\/script>|<\/script>)/);

    const fallbackScript = documentWriteAxeCoreMatch(htmlContent);
    if(fallbackScript) {
        expect(fallbackScript).toContain('./vendor/axe.min.js');
        expect(fallbackScript).not.toContain('cdnjs.cloudflare.com/ajax/libs/axe-core');
    }
  });

  function documentWriteAxeCoreMatch(content) {
      const match = content.match(/if\s*\(typeof\s*axe\s*===\s*'undefined'\)\s*\{\s*document\.write\('(.*?)'\);/);
      return match ? match[1] : null;
  }

  it('debe tener link rel="manifest" en el head', () => {
    expect(htmlContent).toMatch(/<link\s+rel=["']manifest["']\s+href=["']\.\/manifest\.json["']\s*\/?>/);
  });

  it('debe existir el archivo manifest.json', () => {
    const manifestExists = fs.existsSync(path.join(publicDir, 'manifest.json'));
    expect(manifestExists).toBe(true);
  });

  it('debe unificar las versiones visibles a v5.1', () => {
    expect(htmlContent).toContain('v5.1');
    expect(htmlContent).not.toContain('v3.1');
    expect(htmlContent).not.toContain('v3.3');
  });
});
