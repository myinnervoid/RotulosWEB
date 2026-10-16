/**
 * ============================================================
 * ⚙️ core-engine.js — Motor de Dominio Puro (Headless / UI / CLI / MCP)
 * Rótulos Web / Memexicanísimos Studio v5.2
 * ============================================================
 * Desacopla la lógica de negocio de Express (server.js) para ser
 * consumida de forma idéntica por HTTP REST, rotulos-cli y rotulos-mcp.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { ERROR_CODES } = require('./error-codes');

/**
 * Fábrica para construir respuestas canónicas ApiResponse<T> (Ley Global 5).
 * @template T
 * @param {boolean} success
 * @param {T|null} [data=null]
 * @param {string|null} [errorCode=null]
 * @param {string} [message='']
 * @returns {{success: boolean, data: T|null, error_code: string|null, message: string}}
 */
function createApiResponse(success, data = null, errorCode = null, message = '') {
  return {
    success: Boolean(success),
    data: data,
    error_code: errorCode,
    message: message || (success ? 'Operación completada con éxito' : 'Error en la operación')
  };
}

/**
 * Carga perezosa de JSDOM para operaciones de manipulación y auditoría DOM.
 */
function getJSDOM() {
  const { JSDOM } = require('jsdom');
  return JSDOM;
}

/**
 * Valida y sanitiza rutas de proyectos/archivos previniendo null-bytes y Path Traversal (V2-A1).
 * @param {string} inputPath
 * @param {string|null} [baseDir=null]
 * @returns {{valid: boolean, resolvedPath: string|null, error_code: string|null, message: string}}
 */
function sanitizeProjectPath(inputPath, baseDir = null) {
  if (!inputPath || typeof inputPath !== 'string' || !inputPath.trim()) {
    return {
      valid: false,
      resolvedPath: null,
      error_code: ERROR_CODES.INVALID_PATH.code,
      message: 'Ruta no especificada'
    };
  }

  if (inputPath.indexOf('\0') !== -1) {
    return {
      valid: false,
      resolvedPath: null,
      error_code: ERROR_CODES.INVALID_PATH.code,
      message: 'Ruta contiene caracteres inválidos'
    };
  }

  if (baseDir) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(resolvedBase, inputPath);
    const rel = path.relative(resolvedBase, resolvedTarget);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return {
        valid: false,
        resolvedPath: null,
        error_code: ERROR_CODES.PATH_TRAVERSAL_DENIED.code,
        message: 'Acceso denegado: intento de Path Traversal fuera del directorio permitido'
      };
    }
    return {
      valid: true,
      resolvedPath: resolvedTarget,
      error_code: null,
      message: 'Ruta válida'
    };
  }

  return {
    valid: true,
    resolvedPath: path.resolve(inputPath),
    error_code: null,
    message: 'Ruta válida'
  };
}

/**
 * Valida un selector CSS antes de ejecutar querySelector en el motor DOM (V2-A1).
 * @param {string} selector
 * @returns {{valid: boolean, error_code: string|null, message: string}}
 */
function sanitizeSelector(selector) {
  if (!selector || typeof selector !== 'string' || !selector.trim()) {
    return {
      valid: false,
      error_code: ERROR_CODES.INVALID_SELECTOR.code,
      message: 'El selector CSS no puede estar vacío'
    };
  }
  if (selector.indexOf('\0') !== -1 || /<script|[<>]/i.test(selector)) {
    return {
      valid: false,
      error_code: ERROR_CODES.INVALID_SELECTOR.code,
      message: 'El selector contiene caracteres no permitidos'
    };
  }
  const openBrackets = (selector.match(/\[/g) || []).length;
  const closeBrackets = (selector.match(/\]/g) || []).length;
  const openParens = (selector.match(/\(/g) || []).length;
  const closeParens = (selector.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets || openParens !== closeParens) {
    return {
      valid: false,
      error_code: ERROR_CODES.INVALID_SELECTOR.code,
      message: `Selector CSS con corchetes o paréntesis sin cerrar: "${selector}"`
    };
  }
  try {
    const JSDOM = getJSDOM();
    const dom = new JSDOM('<!DOCTYPE html><html><body><div></div></body></html>');
    dom.window.document.querySelector(selector);
    return { valid: true, error_code: null, message: 'Selector válido' };
  } catch (_err) {
    return {
      valid: false,
      error_code: ERROR_CODES.INVALID_SELECTOR.code,
      message: `Selector CSS sintácticamente inválido: "${selector}"`
    };
  }
}

/**
 * Sanitiza HTML serializado por GrapesJS eliminando atributos data-gjs-*, clases efímeras
 * e IDs basura autogenerados (^i[a-z0-9]{3,6}$) sin referencia en CSS ni DOM (V3-A2).
 * Si el HTML no contiene artefactos de GrapesJS, devuelve el string intacto.
 * @param {string} rawHtml
 * @param {string} [rawCss='']
 * @returns {{html: string, removedIdsCount: number}}
 */
function sanitizeGrapesHtml(rawHtml, rawCss = '') {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return { html: '', removedIdsCount: 0 };
  }

  const hasGjsArtifacts =
    /data-gjs-|data-highlightable|gjs-selected|gjs-hovered|gjs-canvas-scroll-fixes|editor-show-all|\bid=["']i[a-z0-9]{3,6}["']/.test(rawHtml);

  if (!hasGjsArtifacts) {
    return { html: rawHtml, removedIdsCount: 0 };
  }

  const JSDOM = getJSDOM();
  const isFullDoc = /<!DOCTYPE|<html/i.test(rawHtml);
  const dom = new JSDOM(rawHtml);
  const doc = dom.window.document;

  if (doc.body) {
    doc.body.classList.remove('editor-show-all');
    if (doc.body.className === '') doc.body.removeAttribute('class');
  }

  const inlineStyles = Array.from(doc.querySelectorAll('style'))
    .map(s => s.textContent || '')
    .join('\n');
  const combinedCss = `${rawCss || ''}\n${inlineStyles}`;
  const gjsAutoIdRegex = /^i[a-z0-9]{3,6}$/;
  let removedIdsCount = 0;

  const allEls = doc.querySelectorAll('*');
  allEls.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-gjs') || attr.name === 'data-highlightable') {
        el.removeAttribute(attr.name);
      }
    });
    el.classList.remove('gjs-selected', 'gjs-hovered');
    if (el.getAttribute('class') === '') {
      el.removeAttribute('class');
    }

    const currentId = el.getAttribute('id');
    if (currentId && gjsAutoIdRegex.test(currentId)) {
      const referencedInCss = combinedCss.includes(`#${currentId}`);
      const referencedInDom = Boolean(
        doc.querySelector(`[href="#${currentId}"], [for="${currentId}"], [aria-labelledby~="${currentId}"], [aria-describedby~="${currentId}"], [aria-controls~="${currentId}"]`)
      );
      if (!referencedInCss && !referencedInDom) {
        el.removeAttribute('id');
        removedIdsCount++;
      }
    }
  });

  const fixStyle = doc.getElementById('gjs-canvas-scroll-fixes');
  if (fixStyle) fixStyle.remove();

  if (isFullDoc) {
    return {
      html: dom.serialize(),
      removedIdsCount
    };
  }

  return {
    html: doc.body ? doc.body.innerHTML : rawHtml,
    removedIdsCount
  };
}

/**
 * Rota respaldos manteniendo un máximo FIFO de `maxBackups` archivos.
 * @param {string} backupsDir
 * @param {number} [maxBackups=15]
 */
function rotateBackups(backupsDir, maxBackups = 15) {
  try {
    if (!fs.existsSync(backupsDir)) return;
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('index_backup_') && f.endsWith('.html'))
      .map(f => {
        const fullPath = path.join(backupsDir, f);
        return { name: f, path: fullPath, time: fs.statSync(fullPath).mtime.getTime() };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
    }
  } catch (err) {
    console.warn('[ROTACIÓN FIFO] Error al purgar respaldos antiguos:', err.message);
  }
}

/**
 * Guarda index.html y style.css de forma atómica (.tmp -> rename) con respaldo FIFO (V3-A1 + V3-A2).
 * @param {object} params
 * @param {string} params.projectDir
 * @param {string} params.html
 * @param {string} [params.css]
 * @param {number} [params.maxBackups=15]
 * @param {boolean} [params.sanitizeGjs=true]
 */
function saveAtomicWithFIFO({ projectDir, html, css, maxBackups = 15, sanitizeGjs = true }) {
  if (!html || typeof html !== 'string' || html.trim().length < 10) {
    return createApiResponse(false, null, ERROR_CODES.INVALID_PAYLOAD.code, 'El contenido HTML es inválido o está vacío');
  }

  if (!html.includes('<body') && !html.includes('<div') && !html.includes('<html') && !html.includes('<!DOCTYPE') && !html.includes('<section') && !html.includes('<article')) {
    return createApiResponse(false, null, ERROR_CODES.MALFORMED_HTML.code, 'El contenido HTML carece de estructura válida');
  }

  const pathCheck = sanitizeProjectPath(projectDir);
  if (!pathCheck.valid) {
    return createApiResponse(false, null, pathCheck.error_code, pathCheck.message);
  }

  const resolvedProject = pathCheck.resolvedPath;
  const indexPath = path.join(resolvedProject, 'index.html');
  const stylePath = path.join(resolvedProject, 'style.css');
  const backupsDir = path.join(resolvedProject, 'backups');

  if (!fs.existsSync(backupsDir)) {
    try { fs.mkdirSync(backupsDir, { recursive: true }); } catch (_e) {}
  }

  try {
    // 1. Sanitizar artefactos de GrapesJS si aplica (V3-A2)
    const { html: finalHtml, removedIdsCount } = sanitizeGjs
      ? sanitizeGrapesHtml(html, css || '')
      : { html, removedIdsCount: 0 };

    // 2. Crear respaldo previo con timestamp y rotación FIFO
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupsDir, `index_backup_${timestamp}.html`);
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, backupFile);
      rotateBackups(backupsDir, maxBackups);
    }

    // 3. Escritura atómica de index.html
    const tmpPath = indexPath + '.tmp';
    fs.writeFileSync(tmpPath, finalHtml, 'utf-8');
    const expectedHtmlSize = Buffer.byteLength(finalHtml, 'utf8');
    const actualHtmlSize = fs.statSync(tmpPath).size;
    if (actualHtmlSize !== expectedHtmlSize) {
      throw new Error('Falló la comprobación de integridad al guardar index.html');
    }
    fs.renameSync(tmpPath, indexPath);

    // 4. Escritura atómica de style.css si se proporciona
    if (css && typeof css === 'string') {
      const tmpCss = stylePath + '.tmp';
      fs.writeFileSync(tmpCss, css, 'utf-8');
      const expectedCssSize = Buffer.byteLength(css, 'utf8');
      const actualCssSize = fs.statSync(tmpCss).size;
      if (actualCssSize !== expectedCssSize) {
        throw new Error('Falló la comprobación de integridad al guardar style.css');
      }
      fs.renameSync(tmpCss, stylePath);
    }

    return createApiResponse(
      true,
      {
        backup: path.basename(backupFile),
        projectPath: resolvedProject,
        sanitizedIdsRemoved: removedIdsCount
      },
      null,
      '¡Cambios guardados con éxito en index.html!'
    );
  } catch (error) {
    const tmpPath = indexPath + '.tmp';
    const tmpCss = stylePath + '.tmp';
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
    try { if (fs.existsSync(tmpCss)) fs.unlinkSync(tmpCss); } catch (_) {}
    return createApiResponse(false, null, ERROR_CODES.SAVE_FAILED.code, error.message);
  }
}

/**
 * Lista los respaldos disponibles de un proyecto o restaura uno específico.
 * @param {object} params
 * @param {string} params.projectDir
 * @param {'list'|'restore'} [params.action='list']
 * @param {string} [params.backupName]
 * @param {number} [params.maxBackups=15]
 */
function manageBackups({ projectDir, action = 'list', backupName = null, maxBackups = 15 }) {
  const pathCheck = sanitizeProjectPath(projectDir);
  if (!pathCheck.valid || !fs.existsSync(pathCheck.resolvedPath)) {
    return createApiResponse(false, null, ERROR_CODES.PATH_NOT_FOUND.code, 'El directorio del proyecto no existe');
  }

  const backupsDir = path.join(pathCheck.resolvedPath, 'backups');
  if (!fs.existsSync(backupsDir)) {
    return action === 'list'
      ? createApiResponse(true, { backups: [], total: 0 }, null, 'Sin respaldos registrados')
      : createApiResponse(false, null, ERROR_CODES.BACKUP_NOT_FOUND.code, 'No existe directorio de respaldos');
  }

  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('index_backup_') && f.endsWith('.html'))
    .map(f => {
      const fullPath = path.join(backupsDir, f);
      const stat = fs.statSync(fullPath);
      return {
        name: f,
        sizeBytes: stat.size,
        modified: stat.mtime.toISOString(),
        timestampMs: stat.mtime.getTime()
      };
    })
    .sort((a, b) => b.timestampMs - a.timestampMs);

  if (action === 'list') {
    return createApiResponse(true, { backups: files, total: files.length }, null, 'Respaldos listados correctamente');
  }

  if (action === 'restore') {
    const targetBackup = backupName
      ? files.find(f => f.name === path.basename(backupName))
      : files[0];

    if (!targetBackup) {
      return createApiResponse(false, null, ERROR_CODES.BACKUP_NOT_FOUND.code, 'Respaldo solicitado no encontrado');
    }

    const backupFullPath = path.join(backupsDir, targetBackup.name);
    const restoredHtml = fs.readFileSync(backupFullPath, 'utf8');
    const saveRes = saveAtomicWithFIFO({
      projectDir: pathCheck.resolvedPath,
      html: restoredHtml,
      maxBackups,
      sanitizeGjs: false
    });

    if (!saveRes.success) return saveRes;
    return createApiResponse(
      true,
      { restoredFrom: targetBackup.name, newBackup: saveRes.data.backup, projectPath: pathCheck.resolvedPath },
      null,
      `Proyecto restaurado exitosamente desde ${targetBackup.name}`
    );
  }

  return createApiResponse(false, null, ERROR_CODES.INVALID_PARAMS.code, `Acción de respaldo inválida: ${action}`);
}

/**
 * Calcula el tamaño recursivo de un directorio en bytes.
 * @param {string} dirPath
 * @returns {number}
 */
function getDirectorySize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          size += getDirectorySize(fullPath);
        } else {
          size += stats.size;
        }
      } catch {}
    }
  } catch {}
  return size;
}

/**
 * Copia recursivamente un directorio a otro destino.
 * @param {string} src
 * @param {string} dest
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Lista todos los proyectos válidos dentro de projectsBaseDir.
 * @param {string} projectsBaseDir
 */
function listProjects(projectsBaseDir) {
  try {
    if (!fs.existsSync(projectsBaseDir)) {
      return createApiResponse(true, [], null, 'No hay directorio de proyectos');
    }
    const dirs = fs.readdirSync(projectsBaseDir).filter(item => {
      const fullPath = path.join(projectsBaseDir, item);
      try {
        return fs.statSync(fullPath).isDirectory() &&
               fs.existsSync(path.join(fullPath, 'index.html'));
      } catch {
        return false;
      }
    });

    const projects = dirs.map(name => {
      const fullPath = path.join(projectsBaseDir, name);
      const stats = fs.statSync(fullPath);
      const size = getDirectorySize(fullPath);
      return {
        name,
        path: fullPath,
        modified: stats.mtime.toISOString(),
        size,
        hasAssets: fs.existsSync(path.join(fullPath, 'assets'))
      };
    });

    return createApiResponse(true, projects, null, 'Listado de proyectos obtenido con éxito');
  } catch (err) {
    return createApiResponse(false, null, ERROR_CODES.SERVER_ERROR.code, err.message);
  }
}

/**
 * Carga el contenido de index.html y style.css de un proyecto.
 * @param {string} projectDir
 */
function loadProject(projectDir) {
  const pathCheck = sanitizeProjectPath(projectDir);
  if (!pathCheck.valid) {
    return createApiResponse(false, null, pathCheck.error_code, pathCheck.message);
  }
  const resolved = pathCheck.resolvedPath;
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return createApiResponse(false, null, ERROR_CODES.PATH_NOT_FOUND.code, 'El directorio del proyecto no existe');
  }
  const indexPath = path.join(resolved, 'index.html');
  const stylePath = path.join(resolved, 'style.css');
  if (!fs.existsSync(indexPath)) {
    return createApiResponse(false, null, ERROR_CODES.FILE_NOT_FOUND.code, `No se encontró index.html en ${resolved}`);
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : '';
  return createApiResponse(true, {
    html,
    css,
    projectPath: resolved,
    hasIndex: true,
    hasStyle: fs.existsSync(stylePath)
  }, null, 'Página cargada exitosamente');
}

/**
 * Catálogo de metadatos de plantillas oficiales y mexicanas.
 */
const TEMPLATE_METADATA = {
  landing: {
    category: 'Negocios',
    description: 'Página de aterrizaje comercial de alta conversión con hero, grid y llamadas a la acción.'
  },
  blog: {
    category: 'Editorial',
    description: 'Revista editorial moderna para publicación de artículos, crónicas y contenidos.'
  },
  portfolio: {
    category: 'Personal',
    description: 'Vitrina personal y portafolio interactivo para creativos y desarrolladores.'
  },
  memexicanisimos: {
    category: 'Oficial',
    description: 'Plantilla oficial de Memexicanísimos con dock, paleta Día de Muertos y secciones interactivas.'
  },
  'todos-santos': {
    category: 'Temporada',
    description: 'Edición especial Día de Muertos y Todos Santos con paleta cempasúchil, papel picado y altar tradicional.'
  },
  'rotulo-ferreteria': {
    category: 'Rótulos Mexicanos',
    description: 'Rótulo comercial "El Segundo Piso de la Ferretería" en amarillo tráfico, rojo carmesí y barda pintada.'
  },
  'cartel-sonidero': {
    category: 'Rótulos Mexicanos',
    description: 'Cartelera de baile sonidero y feria popular con tipografía flúor, mano a mano y cartas de Lotería.'
  }
};

/**
 * Lista todas las plantillas disponibles en templatesDir.
 * @param {string} templatesDir
 */
function listTemplates(templatesDir) {
  try {
    if (!fs.existsSync(templatesDir)) {
      return createApiResponse(true, [], null, 'No hay directorio de plantillas');
    }
    const dirs = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(item => item.isDirectory())
      .map(item => item.name);

    const templates = dirs.map(id => {
      const hasPreview = fs.existsSync(path.join(templatesDir, id, 'preview.png'));
      const name = id.charAt(0).toUpperCase() + id.slice(1);
      const meta = TEMPLATE_METADATA[id] || {};
      return {
        id,
        name,
        description: meta.description || `Plantilla predefinida ${name}`,
        category: meta.category || 'General',
        hasPreview
      };
    });

    return createApiResponse(true, templates, null, 'Catálogo de plantillas obtenido con éxito');
  } catch (err) {
    return createApiResponse(false, null, ERROR_CODES.SERVER_ERROR.code, err.message);
  }
}

/**
 * Aplica una plantilla del catálogo a un directorio de proyecto (con respaldo previo si ya tenía index.html).
 * @param {object} params
 * @param {string} params.projectDir
 * @param {string} params.templateId
 * @param {string} params.templatesDir
 * @param {number} [params.maxBackups=15]
 */
function applyTemplate({ projectDir, templateId, templatesDir, maxBackups = 15 }) {
  if (!templateId || typeof templateId !== 'string') {
    return createApiResponse(false, null, ERROR_CODES.INVALID_PARAMS.code, 'El parámetro templateId es obligatorio');
  }
  const tplCheck = sanitizeProjectPath(templateId, templatesDir);
  if (!tplCheck.valid) {
    return createApiResponse(false, null, tplCheck.error_code, tplCheck.message);
  }

  const templateDir = tplCheck.resolvedPath;
  if (!fs.existsSync(templateDir) || !fs.statSync(templateDir).isDirectory()) {
    return createApiResponse(false, null, ERROR_CODES.TEMPLATE_NOT_FOUND.code, `La plantilla "${templateId}" no existe`);
  }

  const projCheck = sanitizeProjectPath(projectDir);
  if (!projCheck.valid) {
    return createApiResponse(false, null, projCheck.error_code, projCheck.message);
  }
  const resolvedProject = projCheck.resolvedPath;
  if (!fs.existsSync(resolvedProject)) {
    fs.mkdirSync(resolvedProject, { recursive: true });
  }

  // Si ya existe index.html, respaldarlo antes de aplicar la plantilla
  const existingIndex = path.join(resolvedProject, 'index.html');
  if (fs.existsSync(existingIndex)) {
    const backupsDir = path.join(resolvedProject, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(existingIndex, path.join(backupsDir, `index_backup_${timestamp}.html`));
    rotateBackups(backupsDir, maxBackups);
  }

  copyDirectory(templateDir, resolvedProject);
  return createApiResponse(
    true,
    { projectPath: resolvedProject, templateId: path.basename(templateId) },
    null,
    `Plantilla "${templateId}" aplicada correctamente en ${resolvedProject}`
  );
}

/**
 * Obtiene el catálogo completo de bloques (incluyendo Rótulos Tradicionales Mexicanos)
 * importando dinámicamente los módulos ES6 de public/modules/.
 * @returns {Promise<{success: boolean, data: Array<object>|null, error_code: string|null, message: string}>}
 */
async function listBlocksCatalog() {
  try {
    const blocksModulePath = path.resolve(__dirname, '../public/modules/blocks.js');
    const { getAllBlocksCatalog } = await import(`file://${blocksModulePath}`);
    const blocks = getAllBlocksCatalog();
    return createApiResponse(true, blocks, null, `Catálogo de ${blocks.length} bloques cargado con éxito`);
  } catch (err) {
    return createApiResponse(false, null, ERROR_CODES.SERVER_ERROR.code, `Error cargando catálogo de bloques: ${err.message}`);
  }
}

/**
 * Inyecta un bloque del catálogo en un selector CSS de index.html del proyecto (V3-A1 + V1-A2).
 * @param {object} params
 * @param {string} params.projectDir
 * @param {string} params.blockId
 * @param {string} [params.selector='body']
 * @param {'beforeend'|'afterbegin'|'beforebegin'|'afterend'|'replace'} [params.position='beforeend']
 * @param {object} [params.props={}] - Personalización opcional (title, subtitle, text, ctaText, ctaHref)
 * @param {number} [params.maxBackups=15]
 */
async function injectBlock({ projectDir, blockId, selector = 'body', position = 'beforeend', props = {}, maxBackups = 15 }) {
  const loadRes = loadProject(projectDir);
  if (!loadRes.success) return loadRes;

  const selCheck = sanitizeSelector(selector);
  if (!selCheck.valid) {
    return createApiResponse(false, null, selCheck.error_code, selCheck.message);
  }

  const catalogRes = await listBlocksCatalog();
  if (!catalogRes.success) return catalogRes;

  const block = catalogRes.data.find(b => b.id === blockId);
  if (!block || !block.content) {
    return createApiResponse(false, null, ERROR_CODES.BLOCK_NOT_FOUND.code, `El bloque "${blockId}" no existe en el catálogo`);
  }

  const JSDOM = getJSDOM();
  const dom = new JSDOM(loadRes.data.html);
  const doc = dom.window.document;
  const targetEl = doc.querySelector(selector);

  if (!targetEl) {
    return createApiResponse(false, null, ERROR_CODES.INVALID_SELECTOR.code, `No se encontró ningún elemento para el selector "${selector}"`);
  }

  // Personalizar el fragmento del bloque si se enviaron props
  const fragmentDom = new JSDOM(`<body>${block.content}</body>`);
  const fragDoc = fragmentDom.window.document;

  if (props && typeof props === 'object') {
    if (props.title) {
      const h = fragDoc.querySelector('h1, h2, h3');
      if (h) h.textContent = String(props.title);
    }
    if (props.subtitle) {
      const sub = fragDoc.querySelector('p');
      if (sub) sub.textContent = String(props.subtitle);
    }
    if (props.ctaText) {
      const a = fragDoc.querySelector('a');
      if (a) a.textContent = String(props.ctaText);
    }
    if (props.ctaHref) {
      const a = fragDoc.querySelector('a');
      if (a) a.setAttribute('href', String(props.ctaHref));
    }
  }

  const blockHtml = fragDoc.body.innerHTML.trim();

  if (position === 'replace') {
    targetEl.innerHTML = blockHtml;
  } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(position)) {
    targetEl.insertAdjacentHTML(position, `\n${blockHtml}\n`);
  } else {
    return createApiResponse(false, null, ERROR_CODES.INVALID_PARAMS.code, `Posición de inserción inválida: "${position}"`);
  }

  const updatedHtml = dom.serialize();
  const saveRes = saveAtomicWithFIFO({
    projectDir: loadRes.data.projectPath,
    html: updatedHtml,
    maxBackups,
    sanitizeGjs: true
  });

  if (!saveRes.success) return saveRes;

  return createApiResponse(
    true,
    {
      blockId,
      selector,
      position,
      backup: saveRes.data.backup,
      projectPath: loadRes.data.projectPath
    },
    null,
    `Bloque "${blockId}" inyectado en "${selector}" (${position})`
  );
}

/**
 * Actualiza el texto, HTML interno o atributos de un elemento por selector CSS.
 * @param {object} params
 * @param {string} params.projectDir
 * @param {string} params.selector
 * @param {string} [params.text]
 * @param {string} [params.html]
 * @param {Object.<string, string>} [params.attributes]
 * @param {number} [params.maxBackups=15]
 */
function updateSection({ projectDir, selector, text, html, attributes = {}, maxBackups = 15 }) {
  const loadRes = loadProject(projectDir);
  if (!loadRes.success) return loadRes;

  const selCheck = sanitizeSelector(selector);
  if (!selCheck.valid) {
    return createApiResponse(false, null, selCheck.error_code, selCheck.message);
  }

  const JSDOM = getJSDOM();
  const dom = new JSDOM(loadRes.data.html);
  const doc = dom.window.document;
  const targetEl = doc.querySelector(selector);

  if (!targetEl) {
    return createApiResponse(false, null, ERROR_CODES.INVALID_SELECTOR.code, `No se encontró ningún elemento para el selector "${selector}"`);
  }

  if (typeof text === 'string') {
    targetEl.textContent = text;
  } else if (typeof html === 'string') {
    targetEl.innerHTML = html;
  }

  if (attributes && typeof attributes === 'object') {
    for (const [k, v] of Object.entries(attributes)) {
      if (v === null || v === undefined) {
        targetEl.removeAttribute(k);
      } else {
        targetEl.setAttribute(k, String(v));
      }
    }
  }

  const updatedHtml = dom.serialize();
  const saveRes = saveAtomicWithFIFO({
    projectDir: loadRes.data.projectPath,
    html: updatedHtml,
    maxBackups,
    sanitizeGjs: true
  });

  if (!saveRes.success) return saveRes;

  return createApiResponse(
    true,
    {
      selector,
      tagName: targetEl.tagName.toLowerCase(),
      backup: saveRes.data.backup,
      projectPath: loadRes.data.projectPath
    },
    null,
    `Elemento "${selector}" actualizado correctamente`
  );
}

/**
 * Ejecuta una auditoría determinista de DOM, SEO y Accesibilidad WCAG sobre un proyecto o HTML (V3-A1).
 * @param {object} params
 * @param {string} [params.projectDir]
 * @param {string} [params.html]
 */
function auditDomAndA11y({ projectDir, html: rawHtmlInput }) {
  let html = rawHtmlInput;
  let resolvedPath = null;

  if (!html) {
    const loadRes = loadProject(projectDir);
    if (!loadRes.success) return loadRes;
    html = loadRes.data.html;
    resolvedPath = loadRes.data.projectPath;
  }

  const JSDOM = getJSDOM();
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const issues = [];

  // 1. Verificaciones SEO y Metadatos
  const titleEl = doc.querySelector('title');
  const hasTitle = Boolean(titleEl && titleEl.textContent.trim().length > 0);
  if (!hasTitle) {
    issues.push({ category: 'seo', severity: 'major', code: 'MISSING_TITLE', message: 'La página carece de etiqueta <title> con contenido.' });
  }

  const viewportEl = doc.querySelector('meta[name="viewport"]');
  const hasViewport = Boolean(viewportEl);
  if (!hasViewport) {
    issues.push({ category: 'seo', severity: 'major', code: 'MISSING_VIEWPORT', message: 'Falta <meta name="viewport"> para diseño responsivo.' });
  }

  const langAttr = doc.documentElement ? doc.documentElement.getAttribute('lang') : null;
  if (!langAttr) {
    issues.push({ category: 'a11y', severity: 'major', code: 'MISSING_HTML_LANG', message: 'La etiqueta <html> no define el atributo lang="es".' });
  }

  const h1Count = doc.querySelectorAll('h1').length;
  if (h1Count === 0) {
    issues.push({ category: 'seo', severity: 'minor', code: 'MISSING_H1', message: 'No se encontró ningún encabezado principal <h1>.' });
  } else if (h1Count > 1) {
    issues.push({ category: 'seo', severity: 'minor', code: 'MULTIPLE_H1', message: `Se encontraron ${h1Count} etiquetas <h1> (se recomienda 1 por documento).` });
  }

  // 2. Verificaciones de Accesibilidad WCAG
  const images = Array.from(doc.querySelectorAll('img'));
  const imagesWithoutAlt = images.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt') === null);
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      category: 'a11y',
      severity: 'critical',
      code: 'IMG_MISSING_ALT',
      message: `${imagesWithoutAlt.length} imagen(es) carecen del atributo alt.`
    });
  }

  const buttons = Array.from(doc.querySelectorAll('button'));
  const unlabeledButtons = buttons.filter(btn => {
    const text = (btn.textContent || '').trim();
    const ariaLabel = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
    return text.length === 0 && ariaLabel.trim().length === 0;
  });
  if (unlabeledButtons.length > 0) {
    issues.push({
      category: 'a11y',
      severity: 'major',
      code: 'BUTTON_MISSING_LABEL',
      message: `${unlabeledButtons.length} botón(es) carecen de texto accesible o aria-label.`
    });
  }

  // 3. Salud del DOM (IDs basura de GrapesJS y duplicados)
  const gjsAutoIdRegex = /^i[a-z0-9]{3,6}$/;
  const allWithId = Array.from(doc.querySelectorAll('[id]'));
  const gjsGarbageIds = allWithId.filter(el => gjsAutoIdRegex.test(el.getAttribute('id') || ''));
  if (gjsGarbageIds.length > 0) {
    issues.push({
      category: 'dom',
      severity: 'minor',
      code: 'GRAPESJS_AUTO_IDS',
      message: `Se detectaron ${gjsGarbageIds.length} IDs autogenerados por GrapesJS (ej. #${gjsGarbageIds[0].id}).`
    });
  }

  const penalty = issues.reduce((acc, item) => {
    if (item.severity === 'critical') return acc + 18;
    if (item.severity === 'major') return acc + 10;
    return acc + 4;
  }, 0);

  const score = Math.max(0, 100 - penalty);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';

  return createApiResponse(
    true,
    {
      projectPath: resolvedPath,
      score,
      grade,
      summary: {
        totalElements: doc.querySelectorAll('*').length,
        totalImages: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        h1Count,
        gjsGarbageIdsCount: gjsGarbageIds.length,
        issuesCount: issues.length
      },
      issues
    },
    null,
    `Auditoría completada: ${score}/100 (Grado ${grade})`
  );
}

/**
 * Exporta un proyecto a un archivo .zip en disco usando fflate.
 * @param {object} params
 * @param {string} params.projectDir
 * @param {string} [params.outputPath]
 */
function exportProjectZip({ projectDir, outputPath }) {
  const loadRes = loadProject(projectDir);
  if (!loadRes.success) return loadRes;

  try {
    const fflate = require('fflate');
    const resolvedProject = loadRes.data.projectPath;
    const filesMap = {};

    const collectFiles = (dir, relPrefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (['backups', 'node_modules', '.git', 'dist'].includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          collectFiles(fullPath, relPath);
        } else {
          filesMap[relPath] = new Uint8Array(fs.readFileSync(fullPath));
        }
      }
    };

    collectFiles(resolvedProject);
    const zipped = fflate.zipSync(filesMap, { level: 6 });
    const targetZip = outputPath
      ? path.resolve(outputPath)
      : path.join(resolvedProject, `${path.basename(resolvedProject)}_export.zip`);

    fs.writeFileSync(targetZip, Buffer.from(zipped));
    return createApiResponse(
      true,
      {
        zipPath: targetZip,
        sizeBytes: zipped.byteLength,
        filesCount: Object.keys(filesMap).length
      },
      null,
      `Proyecto exportado exitosamente en ${targetZip}`
    );
  } catch (err) {
    return createApiResponse(false, null, ERROR_CODES.SERVER_ERROR.code, `Error exportando ZIP: ${err.message}`);
  }
}

module.exports = {
  createApiResponse,
  sanitizeProjectPath,
  sanitizeSelector,
  sanitizeGrapesHtml,
  rotateBackups,
  saveAtomicWithFIFO,
  manageBackups,
  getDirectorySize,
  copyDirectory,
  listProjects,
  loadProject,
  listTemplates,
  applyTemplate,
  listBlocksCatalog,
  injectBlock,
  updateSection,
  auditDomAndA11y,
  exportProjectZip,
  TEMPLATE_METADATA
};
