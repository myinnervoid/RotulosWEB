import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { registerBlocks, getAllBlocksCatalog, MEXICAN_ROTULOS_CATALOG } from '../public/modules/blocks.js';
import { getSanitizedHtml } from '../public/modules/save-publish.js';

const require = createRequire(import.meta.url);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const coreEngine = require('../server/core-engine.js');
const { runCli } = require('../bin/rotulos-cli.js');
const { handleRpcRequest, MCP_TOOLS } = require('../mcp/rotulos-mcp-server.js');

describe('Suite v5.2 — Rótulos Mexicanos, Core Engine, CLI y Servidor MCP (Lotes 1, 2 y 3)', () => {
  const tempRoot = path.join(os.tmpdir(), `rotulos-v52-suite-${Date.now()}`);
  const repoRoot = path.resolve(currentDir, '../..');
  const editorRoot = path.resolve(currentDir, '..');

  beforeAll(() => {
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {}
  });

  describe('Lote 1 (V1-A1 & V4-A1): Purga de Solapamientos y Unificación de Raíz', () => {
    it('confirma que los archivos huérfanos y monolitos obsoletos fueron purgados', () => {
      expect(fs.existsSync(path.join(repoRoot, 'ambient'))).toBe(false);
      expect(fs.existsSync(path.join(repoRoot, 'app.js'))).toBe(false);
      expect(fs.existsSync(path.join(editorRoot, 'public/app.legacy.bak.js'))).toBe(false);
      expect(fs.existsSync(path.join(repoRoot, 'templates/memexicanisimos/app.js'))).toBe(false);
      expect(fs.existsSync(path.join(repoRoot, 'templates/todos-santos/app.js'))).toBe(false);
    });

    it('confirma que el index.html raíz está sincronizado con editor/public/index.html (v5.1 modular)', () => {
      const rootIndex = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
      const publicIndex = fs.readFileSync(path.join(editorRoot, 'public/index.html'), 'utf8');
      expect(rootIndex).toBe(publicIndex);
      expect(rootIndex).toContain('<script type="module" src="./modules/main.js"></script>');
      expect(fs.existsSync(path.join(repoRoot, 'modules/blocks-rotulos-mexicanos.js'))).toBe(true);
    });
  });

  describe('Lote 2 (V1-A2, V2-A1 & V3-A2): Rótulos Mexicanos, Sanitización de Rutas y DOM', () => {
    it('registra los 8 bloques de Rótulos Tradicionales Mexicanos en GrapesJS y en el catálogo headless', () => {
      expect(MEXICAN_ROTULOS_CATALOG.length).toBe(8);
      const catalog = getAllBlocksCatalog();
      const mexicanBlocks = catalog.filter(b => b.category === 'rotulos_mexicanos');
      expect(mexicanBlocks.length).toBe(8);

      const expectedIds = [
        'rotulo-sonidero-baile',
        'rotulo-pizarron-taqueria',
        'rotulo-oferta-ferreteria',
        'rotulo-papel-picado-cintillo',
        'rotulo-sello-hecho-en-mexico',
        'rotulo-barda-publicitaria',
        'rotulo-loteria-carta',
        'rotulo-alerta-noticiero'
      ];

      for (const id of expectedIds) {
        const found = mexicanBlocks.find(b => b.id === id);
        expect(found).toBeDefined();
        expect(found.content.length).toBeGreaterThan(100);
      }

      // Verificar también mediante mock de BlockManager
      const map = new Map();
      registerBlocks({
        BlockManager: {
          get: (id) => map.get(id),
          add: (id, cfg) => map.set(id, cfg)
        }
      });
      expect(map.has('rotulo-sonidero-baile')).toBe(true);
      expect(map.has('rotulo-oferta-ferreteria')).toBe(true);
    });

    it('incluye las nuevas plantillas mexicanas rotulo-ferreteria y cartel-sonidero', () => {
      const tplRes = coreEngine.listTemplates(path.join(editorRoot, 'templates'));
      expect(tplRes.success).toBe(true);
      const ids = tplRes.data.map(t => t.id);
      expect(ids).toContain('rotulo-ferreteria');
      expect(ids).toContain('cartel-sonidero');
      expect(ids).toContain('memexicanisimos');
      expect(ids).toContain('todos-santos');
    });

    it('rechaza intentos de Path Traversal y selectores CSS inválidos con códigos deterministas (V2-A1)', () => {
      const traversal = coreEngine.sanitizeProjectPath('../../etc/passwd', tempRoot);
      expect(traversal.valid).toBe(false);
      expect(traversal.error_code).toBe('PATH_TRAVERSAL_DENIED');

      const badSelector = coreEngine.sanitizeSelector('div[unclosed');
      expect(badSelector.valid).toBe(false);
      expect(badSelector.error_code).toBe('INVALID_SELECTOR');

      const scriptSelector = coreEngine.sanitizeSelector('<script>alert(1)</script>');
      expect(scriptSelector.valid).toBe(false);
      expect(scriptSelector.error_code).toBe('INVALID_SELECTOR');
    });

    it('elimina IDs basura autogenerados por GrapesJS (^i[a-z0-9]{3,6}$) sin referencia en CSS o DOM (V3-A2)', () => {
      const dirtyHtml = `
        <div id="i8x92" data-gjs-type="default" class="gjs-selected">
          <h2 id="i1a2b">Título con estilo en CSS</h2>
          <section id="i3c4d">Sección enlazada</section>
          <a href="#i3c4d" id="i9z0q">Ir a sección</a>
          <p id="hero-main">ID semántico legítimo</p>
        </div>
      `;
      const css = `#i1a2b { color: #D4AF37; }`;

      // Backend (coreEngine)
      const backendClean = coreEngine.sanitizeGrapesHtml(dirtyHtml, css);
      expect(backendClean.html).not.toContain('id="i8x92"');
      expect(backendClean.html).not.toContain('id="i9z0q"');
      expect(backendClean.html).toContain('id="i1a2b"');
      expect(backendClean.html).toContain('id="i3c4d"');
      expect(backendClean.html).toContain('id="hero-main"');
      expect(backendClean.removedIdsCount).toBe(2);

      // Frontend (save-publish.js)
      const frontendClean = getSanitizedHtml(dirtyHtml, css);
      expect(frontendClean).not.toContain('id="i8x92"');
      expect(frontendClean).not.toContain('id="i9z0q"');
      expect(frontendClean).toContain('id="i1a2b"');
      expect(frontendClean).toContain('id="i3c4d"');
      expect(frontendClean).toContain('id="hero-main"');
    });
  });

  describe('Lote 3 (V5-A1 & V5-A2): Ejecución E2E de rotulos-cli y rotulos-mcp sobre stdio', () => {
    const cliProjectDir = path.join(tempRoot, 'proyecto-cli-mex');

    it('rotulos-cli aplica plantilla mexicana, inyecta bloque de rótulo, actualiza sección, audita y exporta ZIP', async () => {
      // 1. Aplicar plantilla rotulo-ferreteria
      const applyRes = await runCli([
        'node', 'rotulos-cli.js', 'apply-template',
        '--project', cliProjectDir,
        '--template', 'rotulo-ferreteria',
        '--json'
      ]);
      expect(applyRes.success).toBe(true);
      expect(fs.existsSync(path.join(cliProjectDir, 'index.html'))).toBe(true);

      // 2. Inyectar bloque rotulo-sonidero-baile con título personalizado
      const injectRes = await runCli([
        'node', 'rotulos-cli.js', 'inject-block',
        '--project', cliProjectDir,
        '--block', 'rotulo-sonidero-baile',
        '--selector', 'main',
        '--position', 'beforeend',
        '--title', '¡GRAN BAILE DE ANIVERSARIO MEMEXICANÍSIMO!'
      ]);
      expect(injectRes.success).toBe(true);
      const htmlAfterInject = fs.readFileSync(path.join(cliProjectDir, 'index.html'), 'utf8');
      expect(htmlAfterInject).toContain('¡GRAN BAILE DE ANIVERSARIO MEMEXICANÍSIMO!');
      expect(htmlAfterInject).toContain('rotulo-mex-sonidero');

      // 3. Actualizar texto de h1 mediante update-section
      const updateRes = await runCli([
        'node', 'rotulos-cli.js', 'update-section',
        '--project', cliProjectDir,
        '--selector', 'h1',
        '--text', 'FERRETERÍA DIGITAL EL MASHUKITA'
      ]);
      expect(updateRes.success).toBe(true);
      const htmlAfterUpdate = fs.readFileSync(path.join(cliProjectDir, 'index.html'), 'utf8');
      expect(htmlAfterUpdate).toContain('FERRETERÍA DIGITAL EL MASHUKITA');

      // 4. Auditar DOM, SEO y Accesibilidad
      const auditRes = await runCli([
        'node', 'rotulos-cli.js', 'audit',
        '--project', cliProjectDir
      ]);
      expect(auditRes.success).toBe(true);
      expect(auditRes.data.score).toBeGreaterThanOrEqual(90);
      expect(auditRes.data.grade).toBe('A');

      // 5. Verificar y restaurar respaldos FIFO
      const backupListRes = await runCli([
        'node', 'rotulos-cli.js', 'backup',
        '--project', cliProjectDir
      ]);
      expect(backupListRes.success).toBe(true);
      expect(backupListRes.data.total).toBeGreaterThanOrEqual(2);

      // 6. Exportar proyecto a ZIP
      const zipOut = path.join(tempRoot, 'ferreteria_bundle.zip');
      const exportRes = await runCli([
        'node', 'rotulos-cli.js', 'export',
        '--project', cliProjectDir,
        '--output', zipOut
      ]);
      expect(exportRes.success).toBe(true);
      expect(fs.existsSync(zipOut)).toBe(true);
      expect(exportRes.data.sizeBytes).toBeGreaterThan(500);
    });

    it('rotulos-mcp-server responde al protocolo JSON-RPC 2.0 y ejecuta las 8 tools MCP', async () => {
      // 1. initialize
      const initResp = await handleRpcRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      });
      expect(initResp.result.serverInfo.name).toBe('rotulos-mcp');
      expect(MCP_TOOLS.length).toBe(8);

      // 2. tools/list
      const listResp = await handleRpcRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      });
      expect(listResp.result.tools.length).toBe(8);

      // 3. tools/call -> rotulos_list_catalog (filtrando rotulos_mexicanos)
      const catResp = await handleRpcRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'rotulos_list_catalog',
          arguments: { type: 'blocks', category: 'rotulos_mexicanos' }
        }
      });
      expect(catResp.result.isError).toBe(false);
      const parsedCatalog = JSON.parse(catResp.result.content[0].text);
      expect(parsedCatalog.success).toBe(true);
      expect(parsedCatalog.data.blocks.length).toBe(8);

      // 4. tools/call -> rotulos_inject_block (inyectando rotulo-pizarron-taqueria)
      const mcpProjDir = path.join(tempRoot, 'proyecto-mcp-sonidero');
      await handleRpcRequest({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'rotulos_apply_template',
          arguments: { project: mcpProjDir, templateId: 'cartel-sonidero' }
        }
      });

      const injectMcpResp = await handleRpcRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'rotulos_inject_block',
          arguments: {
            project: mcpProjDir,
            blockId: 'rotulo-pizarron-taqueria',
            selector: 'main',
            position: 'beforeend'
          }
        }
      });
      expect(injectMcpResp.result.isError).toBe(false);
      const htmlMcp = fs.readFileSync(path.join(mcpProjDir, 'index.html'), 'utf8');
      expect(htmlMcp).toContain('rotulo-mex-taqueria');
    });
  });
});
