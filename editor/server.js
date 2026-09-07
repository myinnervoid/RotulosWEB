require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const os = require('os');
const simpleGit = require('simple-git');
const { ERROR_CODES } = require('./server/error-codes');
const { GitHubAPI } = require('./server/github-api');
let openPkg;
try {
  openPkg = require('open');
} catch (e) {
  openPkg = null;
}

const app = express();
const PORT = process.env.PORT || 5050;

// ── CONFIGURACIÓN PORTABLE DE PROYECTOS ─────────────────────
// Directorio universal de proyectos (portable, funciona en cualquier máquina)
const PROJECTS_BASE_EARLY = process.env.ROTULOS_PROJECTS_DIR || path.join(os.homedir(), 'RotulosProjects');
if (!fs.existsSync(PROJECTS_BASE_EARLY)) {
  try { fs.mkdirSync(PROJECTS_BASE_EARLY, { recursive: true }); } catch (e) {}
}

// ── BOOTSTRAP: Copiar proyecto Memexicanísimos en primer arranque ──
// Garantiza que todo usuario nuevo (al clonar el repo o descargar el binario)
// tenga un proyecto de referencia completo listo para editar, sin rutas hardcodeadas.
(function ensureMemexProject() {
  const MEMEX_NAME = 'memexicanisimos';
  const memexTarget = path.join(PROJECTS_BASE_EARLY, MEMEX_NAME);
  if (fs.existsSync(memexTarget)) return; // Ya existe, no sobreescribir

  // Candidatos de origen (en orden de prioridad):
  // 1. Plantilla oficial empaquetada con el editor (100% portable)
  // 2. Carpeta externa del desarrollador (fallback)
  const templateSource = path.join(__dirname, 'templates', MEMEX_NAME);
  const devSource = path.resolve(__dirname, '..', 'Pagina web memexicanisimos');
  const source = fs.existsSync(templateSource) ? templateSource :
                 fs.existsSync(devSource) ? devSource : null;

  if (!source) {
    console.warn('⚠️ [BOOTSTRAP] No se encontró fuente para el proyecto Memexicanísimos. Se iniciará con lienzo vacío.');
    return;
  }

  try {
    // Copiar todo el directorio recursivamente (assets, CSS, HTML, etc.)
    const copyDirSync = (src, dest) => {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        // Omitir backups de desarrollo al copiar
        if (entry.name === 'backups' || entry.name === '.git') continue;
        if (entry.isDirectory()) copyDirSync(srcPath, destPath);
        else fs.copyFileSync(srcPath, destPath);
      }
    };
    copyDirSync(source, memexTarget);
    console.log(`✅ [BOOTSTRAP] Proyecto Memexicanísimos creado en: ${memexTarget}`);
  } catch (err) {
    console.warn('⚠️ [BOOTSTRAP] Error al copiar proyecto Memexicanísimos:', err.message);
  }
})();

// ── CONFIGURACIÓN DE RUTA DEL PROYECTO DINÁMICO ─────────────
// Prioridad: 1) ENV/CLI  2) Último proyecto en recent.json  3) memexicanisimos en RotulosProjects  4) RotulosProjects root
const defaultMemexProject = path.join(PROJECTS_BASE_EARLY, 'memexicanisimos');
const defaultCandidate = fs.existsSync(defaultMemexProject)
  ? defaultMemexProject
  : PROJECTS_BASE_EARLY;

let projectPath = process.env.PROJECT_PATH || process.argv[2] || defaultCandidate;
if (!fs.existsSync(projectPath)) {
  console.warn(`⚠️ La ruta "${projectPath}" no existe. Usando default "${defaultCandidate}".`);
  projectPath = defaultCandidate;
}
projectPath = path.resolve(projectPath);

// Configuración de usuario para proyectos recientes (~/.rotulos/recent.json con fallback a ~/.talachas/)
const userConfigDir = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.rotulos'
);
if (!fs.existsSync(userConfigDir)) {
  try { fs.mkdirSync(userConfigDir, { recursive: true }); } catch (e) {}
}
const recentFile = path.join(userConfigDir, 'recent.json');
const legacyRecentFile = path.join(process.env.HOME || '.', '.talachas', 'recent.json');
if (!fs.existsSync(recentFile) && fs.existsSync(legacyRecentFile)) {
  try { fs.copyFileSync(legacyRecentFile, recentFile); } catch (e) {}
}

// Restaurar el último proyecto activo de recent.json si no se especificó por CLI o ENV
if (!process.env.PROJECT_PATH && !process.argv[2] && fs.existsSync(recentFile)) {
  try {
    const list = JSON.parse(fs.readFileSync(recentFile, 'utf8'));
    if (Array.isArray(list) && list.length > 0 && fs.existsSync(list[0])) {
      projectPath = path.resolve(list[0]);
    }
  } catch {}
}

function addRecentProject(p) {
  try {
    const resolved = path.resolve(p);
    let projects = [];
    if (fs.existsSync(recentFile)) {
      projects = JSON.parse(fs.readFileSync(recentFile, 'utf8'));
    }
    projects = projects.filter(item => item !== resolved);
    projects.unshift(resolved);
    if (projects.length > 15) projects.pop();
    fs.writeFileSync(recentFile, JSON.stringify(projects, null, 2), 'utf8');
  } catch (err) {
    console.warn('[RECENT] Error guardando proyecto reciente:', err.message);
  }
}

if (fs.existsSync(projectPath)) {
  addRecentProject(projectPath);
}

function getActiveIndexPath() {
  return path.join(projectPath, 'index.html');
}

function getActiveStylePath() {
  return path.join(projectPath, 'style.css');
}

function getActiveBackupsDir() {
  const custom = path.join(projectPath, 'backups');
  if (!fs.existsSync(custom)) {
    try { fs.mkdirSync(custom, { recursive: true }); } catch (e) {}
  }
  return custom;
}

const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '15', 10);

function getGitInstance() {
  return simpleGit(projectPath);
}

// ── CONTRATO CANÓNICO ApiResponse<T> (Ley Global 5) ─────────

/**
 * Estructura del contrato canónico de respuesta de la API (Ley Global 5).
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Indica si la operación concluyó exitosamente.
 * @property {T|null} data - Carga útil con la información solicitada o null en caso de error.
 * @property {string|null} error_code - Código estandarizado de error (catálogo ERROR_CODES) o null si success es true.
 * @property {string} message - Mensaje descriptivo legible en español para registro o fallback de interfaz.
 */

/**
 * Fábrica para construir respuestas canónicas ApiResponse<T>.
 * @template T
 * @param {boolean} success
 * @param {T|null} [data=null]
 * @param {string|null} [errorCode=null]
 * @param {string} [message='']
 * @returns {ApiResponse<T>}
 */
function createApiResponse(success, data = null, errorCode = null, message = '') {
  return {
    success: Boolean(success),
    data: data,
    error_code: errorCode,
    message: message || (success ? 'Operación completada con éxito' : 'Error en la operación')
  };
}

// ── ROTACIÓN FIFO DE RESPALDOS ──────────────────────────────
function rotateBackups(dir = getActiveBackupsDir()) {
  try {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('index_backup_') && f.endsWith('.html'))
      .map(f => {
        const fullPath = path.join(dir, f);
        return { name: f, path: fullPath, time: fs.statSync(fullPath).mtime.getTime() };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`[ROTACIÓN FIFO] Respaldo antiguo purgado: ${file.name}`);
      }
    }
  } catch (err) {
    console.warn('[ROTACIÓN FIFO] Error al purgar respaldos antiguos:', err.message);
  }
}

// ── MIDDLEWARES DE SEGURIDAD Y RENDIMIENTO ─────────────────
app.use((req, res, next) => {
  const ip = req.socket.remoteAddress;
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    console.warn(`[SEGURIDAD] Intento de conexión no local bloqueado desde: ${ip}`);
    return res.status(403).json(createApiResponse(false, null, ERROR_CODES.ACCESS_DENIED.code, 'Acceso denegado: este editor es estrictamente local.'));
  }
  next();
});

const MAX_JSON_SIZE = process.env.MAX_JSON_SIZE || '20mb';
app.use(cors({ origin: ['http://localhost:5050', 'https://localhost:5050', 'http://127.0.0.1:5050', 'https://127.0.0.1:5050'] }));
app.use(express.json({ limit: MAX_JSON_SIZE }));

// Middleware para capturar errores de express.json (e.g. 413 Payload Too Large o JSON malformado)
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json(createApiResponse(false, null, ERROR_CODES.PAYLOAD_TOO_LARGE.code, `El payload excede el límite permitido de ${MAX_JSON_SIZE}`));
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PAYLOAD.code, 'JSON inválido en el cuerpo de la petición'));
  }
  next(err);
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/locales', express.static(path.join(__dirname, 'locales')));
app.use('/vendor/grapesjs', express.static(path.join(__dirname, 'node_modules/grapesjs/dist')));
app.use('/vendor/grapesjs-blocks-basic', express.static(path.join(__dirname, 'node_modules/grapesjs-blocks-basic/dist')));
app.use('/vendor/fflate', express.static(path.join(__dirname, 'node_modules/fflate/umd')));

// Servir archivos estáticos relativos del proyecto actual (ilustraciones, imagenes, fuentes, estilos, etc.)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/vendor') ||
    req.path.startsWith('/locales') ||
    req.path.startsWith('/screenshots')
  ) {
    return next();
  }

  try {
    const decodedPath = decodeURIComponent(req.path);
    const resolvedTarget = path.resolve(projectPath, '.' + decodedPath);
    const resolvedProject = path.resolve(projectPath);

    // Protección estricta contra Path Traversal: debe residir dentro de projectPath
    if (resolvedTarget.startsWith(resolvedProject) && fs.existsSync(resolvedTarget)) {
      const stat = fs.statSync(resolvedTarget);
      if (stat.isFile()) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(resolvedTarget);
      }
    }
  } catch {}
  next();
});

// Servir la página del proyecto activo tal cual, como un sitio web publicado real
app.get('/live', (req, res) => {
  const indexPath = getActiveIndexPath();
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(indexPath);
  }
  res.status(404).json(createApiResponse(false, null, ERROR_CODES.FILE_NOT_FOUND.code, 'No se encontró index.html en el proyecto activo'));
});

// Servir assets dinámicos del proyecto actual con fallback al workspace
app.use('/assets', (req, res, next) => {
  const projectAsset = path.join(projectPath, 'assets', req.path);
  if (fs.existsSync(projectAsset)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(projectAsset);
  }
  const defaultAsset = path.join(path.resolve(__dirname, '../../assets'), req.path);
  if (fs.existsSync(defaultAsset)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(defaultAsset);
  }
  next();
});

// ── SSE Y MONITOREO DE CAMBIOS EN DISCO (Sincronización Bidireccional) ──
let sseClients = [];
let activeWatcher = null;
let watcherDebounceTimer = null;

function notifySSEClients(targetProject, file, content) {
  const payload = JSON.stringify({
    event: 'file-change',
    data: { file, content }
  });
  sseClients.forEach(client => {
    if (client.projectPath === targetProject) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.warn('[SSE] Error enviando a cliente:', err.message);
      }
    }
  });
}

function startProjectWatcher(targetPath) {
  if (activeWatcher) {
    try { activeWatcher.close(); } catch (_) {}
    activeWatcher = null;
  }
  if (!targetPath || !fs.existsSync(targetPath)) return;

  try {
    activeWatcher = fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const normalized = filename.replace(/\\/g, '/');
      if (normalized.includes('node_modules') || normalized.includes('.git') || normalized.includes('backups')) return;
      const ext = path.extname(filename).toLowerCase();
      if (!['.css', '.js'].includes(ext)) return;

      const fullPath = path.join(targetPath, filename);
      if (!fs.existsSync(fullPath)) return;

      if (watcherDebounceTimer) clearTimeout(watcherDebounceTimer);
      watcherDebounceTimer = setTimeout(() => {
        try {
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            notifySSEClients(targetPath, normalized, content);
          }
        } catch (err) {
          console.warn('[WATCHER] Error leyendo archivo modificado:', err.message);
        }
      }, 150);
    });
  } catch (err) {
    console.warn('[WATCHER] No se pudo iniciar fs.watch en:', targetPath, err.message);
  }
}

// Iniciar watcher en el proyecto activo al arrancar
startProjectWatcher(projectPath);

// ── ENDPOINTS DE LA API (ApiResponse<T>) ────────────────────

// SSE: Conexión continua para recibir notificaciones de archivos modificados
app.get('/api/watch', (req, res) => {
  let targetPath = projectPath;
  if (req.query.project) {
    targetPath = path.resolve(req.query.project);
    if (!fs.existsSync(targetPath)) {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PATH.code, 'Ruta de proyecto inválida o inexistente'));
    }
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PATH.code, 'Ruta de proyecto inválida'));
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ event: 'connected', project: targetPath })}\n\n`);

  const clientId = Date.now() + Math.random();
  sseClients.push({ id: clientId, res, projectPath: targetPath });

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Guardado directo de archivos CSS/JS individuales con protección Path Traversal
app.post('/api/save-file', (req, res) => {
  try {
    const { file, content, project } = req.body || {};
    if (!file || typeof file !== 'string') {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PATH.code, 'El parámetro "file" es obligatorio.'));
    }
    if (typeof content !== 'string') {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PAYLOAD.code, 'El parámetro "content" debe ser texto.'));
    }

    const baseProject = (project && fs.existsSync(project)) ? path.resolve(project) : projectPath;
    const cleanRel = file.replace(/^[/\\]+/, '').replace(/\.\./g, '');
    const targetFile = path.resolve(baseProject, cleanRel);

    const rel = path.relative(baseProject, targetFile);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return res.status(403).json(createApiResponse(false, null, ERROR_CODES.FORBIDDEN_PATH.code, 'Acceso denegado: Directory Traversal detectado.'));
    }

    const parentDir = path.dirname(targetFile);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    return res.json(createApiResponse(true, { file: cleanRel, bytesWritten: Buffer.byteLength(content, 'utf8') }, null, 'Archivo guardado correctamente'));
  } catch (err) {
    return res.status(500).json(createApiResponse(false, null, ERROR_CODES.SAVE_FAILED.code, err.message));
  }
});

// 0. Endpoints de Proyectos Dinámicos (Universal Editor)
app.get('/api/current-project', (req, res) => {
  res.json(createApiResponse(true, {
    projectPath,
    hasIndex: fs.existsSync(getActiveIndexPath()),
    hasStyle: fs.existsSync(getActiveStylePath())
  }, null, 'Proyecto actual'));
});

app.get('/api/recent-projects', (req, res) => {
  try {
    if (fs.existsSync(recentFile)) {
      const data = fs.readFileSync(recentFile, 'utf8');
      let projects = JSON.parse(data);
      // Guardia de esquema: debe ser Array<string>
      if (!Array.isArray(projects)) projects = [projectPath];
      res.json(createApiResponse(true, projects, null, 'Proyectos recientes'));
    } else {
      res.json(createApiResponse(true, [projectPath], null, 'Sin proyectos recientes'));
    }
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.RECENT_LOAD_FAILED.code, err.message));
  }
});

app.post('/api/recent-projects', (req, res) => {
  try {
    const { projectPath: newPath } = req.body;
    if (!newPath || !fs.existsSync(newPath)) {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PATH.code, 'La ruta no existe'));
    }
    addRecentProject(newPath);
    let projects = [];
    if (fs.existsSync(recentFile)) {
      projects = JSON.parse(fs.readFileSync(recentFile, 'utf8'));
      if (!Array.isArray(projects)) projects = [];
    }
    res.json(createApiResponse(true, projects, null, 'Proyecto guardado en recientes'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.RECENT_SAVE_FAILED.code, err.message));
  }
});

app.post('/api/switch-project', (req, res) => {
  try {
    const { newProjectPath } = req.body;
    if (!newProjectPath) {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PATH.code, 'Ruta no especificada'));
    }
    const resolved = path.resolve(newProjectPath);
    if (!fs.existsSync(resolved)) {
      return res.status(400).json(createApiResponse(false, null, ERROR_CODES.PATH_NOT_FOUND.code, `La ruta "${resolved}" no existe`));
    }
    projectPath = resolved;
    addRecentProject(resolved);
    startProjectWatcher(resolved);
    console.log(`[PROYECTO] Conmutado a: ${projectPath}`);
    res.json(createApiResponse(true, { projectPath }, null, `Proyecto cambiado a ${path.basename(projectPath)}`));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.SWITCH_FAILED.code, err.message));
  }
});

// 1. Endpoint para listar imágenes disponibles en assets del proyecto
app.get('/api/assets', (req, res) => {
  try {
    const images = [];
    const imageExtensions = /\.(png|jpe?g|gif|svg|webp|ico|avif)$/i;
    const ignoreDirs = new Set(['.git', 'node_modules', 'backups', 'temp', 'tmp', 'dist', 'build', '.vscode', '.idea']);

    function scanDirectory(dir, relPrefix = '', maxDepth = 4, currentDepth = 0) {
      if (!fs.existsSync(dir) || currentDepth > maxDepth) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!ignoreDirs.has(entry.name) && !entry.name.startsWith('.')) {
              scanDirectory(path.join(dir, entry.name), path.join(relPrefix, entry.name), maxDepth, currentDepth + 1);
            }
          } else if (imageExtensions.test(entry.name)) {
            const relPath = path.join(relPrefix, entry.name).replace(/\\/g, '/');
            images.push({
              src: `/${relPath}`,
              name: entry.name,
              type: 'image'
            });
          }
        }
      } catch {}
    }

    // Escanear carpetas de medios prioritarias del proyecto si existen
    const mediaCandidates = ['assets', 'ilustraciones', 'images', 'img', 'media', 'photos', 'public'];
    for (const sub of mediaCandidates) {
      const subDir = path.join(projectPath, sub);
      if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
        scanDirectory(subDir, sub, 3, 0);
      }
    }

    // Escanear también imágenes sueltas en la raíz del proyecto
    try {
      const rootEntries = fs.readdirSync(projectPath, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (!entry.isDirectory() && imageExtensions.test(entry.name)) {
          images.push({
            src: `/${entry.name}`,
            name: entry.name,
            type: 'image'
          });
        }
      }
    } catch {}

    // Si aún no se encontró ninguna imagen, intentar fallback a la carpeta general de assets del workspace
    if (images.length === 0) {
      const fallbackDir = path.resolve(__dirname, '../../assets');
      if (fs.existsSync(fallbackDir)) {
        scanDirectory(fallbackDir, 'assets', 2, 0);
      }
    }

    const total = images.length;
    let paginated = images;
    let page = 1;
    let limit = total;
    let hasMore = false;

    if (req.query.page || req.query.limit) {
      page = Math.max(1, parseInt(req.query.page, 10) || 1);
      limit = Math.max(1, parseInt(req.query.limit, 10) || 24);
      const start = (page - 1) * limit;
      const end = start + limit;
      paginated = images.slice(start, end);
      hasMore = end < total;
    }

    res.json(createApiResponse(true, {
      assets: paginated,
      total,
      page,
      limit,
      hasMore
    }, null, 'Galería de imágenes obtenida con éxito'));
  } catch (error) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.ASSETS_READ_FAILED.code, error.message));
  }
});

// 2. Endpoint para cargar el contenido actual de index.html y style.css
app.get('/api/page', (req, res) => {
  try {
    const activePath = (req.query.project && fs.existsSync(req.query.project))
      ? path.resolve(req.query.project)
      : projectPath;

    const indexPath = path.join(activePath, 'index.html');
    const stylePath = path.join(activePath, 'style.css');

    if (!fs.existsSync(indexPath)) {
      return res.status(404).json(createApiResponse(false, null, ERROR_CODES.FILE_NOT_FOUND.code, `No se encontró index.html en ${activePath}`));
    }
    const html = fs.readFileSync(indexPath, 'utf-8');
    const css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf-8') : '';
    res.json(createApiResponse(true, { html, css, projectPath: activePath }, null, 'Página cargada exitosamente'));
  } catch (error) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.PAGE_READ_FAILED.code, error.message));
  }
});

// ── MUTEX / COLA DE GUARDADO (Prevención de Race Conditions en /api/save) ──
let saveQueuePromise = Promise.resolve();

// 3. Endpoint para guardar los cambios en index.html con respaldo dinámico
app.post('/api/save', (req, res) => {
  const { html, css } = req.body || {};
  if (!html || typeof html !== 'string' || html.trim().length < 10) {
    return res.status(400).json(createApiResponse(false, null, ERROR_CODES.INVALID_PAYLOAD.code, 'El contenido HTML es inválido o está vacío'));
  }

  if (!html.includes('<body') && !html.includes('<div') && !html.includes('<html') && !html.includes('<!DOCTYPE')) {
    return res.status(400).json(createApiResponse(false, null, ERROR_CODES.MALFORMED_HTML.code, 'El contenido HTML carece de estructura válida'));
  }

  // Serialización estricta para evitar colisiones en rotación FIFO y escritura atómica
  const saveOperation = async () => {
    try {
      const indexPath = getActiveIndexPath();
      const stylePath = getActiveStylePath();
      const backupsDir = getActiveBackupsDir();

      // A. Crear respaldo previo con timestamp y rotación FIFO
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupsDir, `index_backup_${timestamp}.html`);
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, backupFile);
        rotateBackups(backupsDir);
      }

      // B. Escritura atómica: escribir a .tmp y luego renombrar (evita corrupción)
      const tmpPath = indexPath + '.tmp';
      fs.writeFileSync(tmpPath, html, 'utf-8');
      fs.renameSync(tmpPath, indexPath);

      // C. Si se envían estilos actualizados, guardar en style.css (también atómico)
      if (css && typeof css === 'string') {
        const tmpCss = stylePath + '.tmp';
        fs.writeFileSync(tmpCss, css, 'utf-8');
        fs.renameSync(tmpCss, stylePath);
      }

      console.log(`[OK] Cambios guardados en ${indexPath}. Respaldo: ${path.basename(backupFile)}`);
      return res.json(createApiResponse(true, { backup: path.basename(backupFile), projectPath }, null, '¡Cambios guardados con éxito en index.html!'));
    } catch (error) {
      console.error('[ERROR] Al guardar:', error);
      // Limpiar archivos .tmp residuales si el guardado falló
      const tmpPath = getActiveIndexPath() + '.tmp';
      const tmpCss = getActiveStylePath() + '.tmp';
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) {}
      try { if (fs.existsSync(tmpCss)) fs.unlinkSync(tmpCss); } catch (_) {}
      return res.status(500).json(createApiResponse(false, null, ERROR_CODES.SAVE_FAILED.code, error.message));
    }
  };

  const nextTask = saveQueuePromise.then(() => saveOperation());
  saveQueuePromise = nextTask.catch(() => {});
});

// 4. Endpoint de Estadísticas (Dashboard Ligero - Fase 3)
app.get('/api/stats', (req, res) => {
  try {
    const backupsDir = getActiveBackupsDir();
    let files = [];
    let totalSize = 0;
    if (fs.existsSync(backupsDir)) {
      files = fs.readdirSync(backupsDir).filter(f => f.startsWith('index_backup_') && f.endsWith('.html'));
      totalSize = files.reduce((acc, f) => {
        try {
          return acc + fs.statSync(path.join(backupsDir, f)).size;
        } catch {
          return acc;
        }
      }, 0);
    }

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const stats = {
      projectPath,
      totalBackups: files.length,
      maxBackups: MAX_BACKUPS,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      uptimeSeconds: Math.floor(uptime),
      uptimeHuman: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
      },
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    res.json(createApiResponse(true, stats, null, 'Estadísticas obtenidas con éxito'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.STATS_FAILED.code, 'Error al obtener estadísticas: ' + err.message));
  }
});

// 5. Endpoint para Publicación Automática a GitHub (Fase 4)
app.post('/api/publish', async (req, res) => {
  try {
    const git = getGitInstance();
    const status = await git.status();

    if (status.files.length === 0) {
      return res.json(createApiResponse(true, { modified: 0 }, null, 'El repositorio ya está limpio. No hay cambios pendientes por publicar.'));
    }

    const remote = process.env.GIT_REMOTE || 'origin';
    const branch = process.env.GIT_BRANCH || 'main';

    // Agregar cambios, crear commit y empujar a origin
    await git.add('.');
    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Cancun' });
    const commitMsg = `Publicación automática desde Talachas y Rótulos Web (${timestamp})`;
    const commitResult = await git.commit(commitMsg);

    console.log(`[GIT] Commit realizado: ${commitResult.commit}. Empujando a ${remote}/${branch}...`);
    await git.push(remote, branch);

    res.json(createApiResponse(true, { commit: commitResult.commit, files: status.files.length }, null, '¡Publicado exitosamente en GitHub!'));
  } catch (err) {
    console.error('[GIT ERROR] Al publicar:', err.message);
    let errorCode = ERROR_CODES.GIT_PUSH_FAILED.code;
    let message = 'Error al publicar en GitHub: ' + err.message;

    if (err.message.includes('authentication') || err.message.includes('Permission denied') || err.message.includes('fatal: could not read Username')) {
      errorCode = ERROR_CODES.GIT_AUTH_REQUIRED.code;
      message = 'Autenticación requerida. Configura tus credenciales SSH o token en tu máquina.';
    }

    res.status(500).json(createApiResponse(false, null, errorCode, message));
  }
});

// ── DETECCIÓN AUTOMÁTICA DE NAVEGADOR CHROME LOCAL ──────────
const puppeteer = require('puppeteer-core');
const SCREENSHOTS_DIR = path.join(__dirname, 'public/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findSystemChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/brave-browser',
    '/snap/bin/chromium'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// 6. Endpoint para Render y Captura de Pantalla HD (Fase C)
app.post('/api/screenshot', async (req, res) => {
  const chromePath = findSystemChrome();
  if (!chromePath) {
    return res.status(503).json(createApiResponse(false, null, ERROR_CODES.CHROME_NOT_FOUND.code, 'No se encontró un navegador Chrome/Chromium en el sistema (/usr/bin/google-chrome).'));
  }

  const { device = 'desktop', customWidth, customHeight, fullPage = false, theme = 'patria', html, css } = req.body || {};
  const resolutions = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 }
  };

  let width = 1920;
  let height = 1080;

  if (device === 'custom' && customWidth && customHeight) {
    width = Math.min(Math.max(parseInt(customWidth, 10) || 1280, 320), 3840);
    height = Math.min(Math.max(parseInt(customHeight, 10) || 800, 320), 2400);
  } else if (resolutions[device]) {
    width = resolutions[device].width;
    height = resolutions[device].height;
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--hide-scrollbars'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    if (html && typeof html === 'string') {
      // Si se envía el HTML activo desde el cliente/lienzo
      let pageHtml = html;
      if (css && typeof css === 'string') {
        pageHtml = `<style>${css}</style>\n${pageHtml}`;
      }
      await page.setContent(pageHtml, { waitUntil: 'load', timeout: 15000 });
    } else {
      // Fallback a cargar directamente el index.html principal del proyecto activo
      const targetUrl = `file://${getActiveIndexPath()}`;
      await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
    }

    // Aplicar tema solicitado si corresponde
    if (theme && theme !== 'patria') {
      await page.evaluate((t) => {
        // eslint-disable-next-line no-undef
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
    }

    // Pequeño delay de asentamiento visual para fuentes
    await new Promise(resolve => setTimeout(resolve, 300));

    const timestamp = Date.now();
    const filename = `screenshot_${device}_${width}x${height}_${timestamp}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, filename);

    await page.screenshot({
      path: filePath,
      fullPage: Boolean(fullPage)
    });

    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log(`[SCREENSHOT] Captura generada: ${filename} (${sizeKB} KB)`);
    res.json(createApiResponse(true, {
      filename,
      url: `/screenshots/${filename}`,
      sizeKB,
      dimensions: { width, height },
      fullPage: Boolean(fullPage),
      theme
    }, null, '¡Captura HD generada con éxito!'));

  } catch (err) {
    console.error('[SCREENSHOT ERROR]:', err.message);
    res.status(500).json(createApiResponse(false, null, ERROR_CODES.SCREENSHOT_FAILED.code, 'Error al capturar pantalla: ' + err.message));
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('[SCREENSHOT WARN] Error cerrando browser:', closeErr.message);
      }
    }
  }
});

// ── 8. Catálogo de Plantillas Predefinidas (Fase 3) ────────────
const TEMPLATES_DIR = path.join(__dirname, 'templates');

app.get('/api/templates', (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      return res.json(createApiResponse(true, [], null, 'No hay directorio de plantillas'));
    }
    const dirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
      .filter(item => item.isDirectory())
      .map(item => item.name);

    const descriptions = {
      landing: 'Página de aterrizaje comercial de alta conversión con hero, grid y llamadas a la acción.',
      blog: 'Revista editorial moderna para publicación de artículos, crónicas y contenidos.',
      portfolio: 'Vitrina personal y portafolio interactivo para creativos y desarrolladores.',
      memexicanisimos: 'Plantilla patria icónica oficial de Memexicanísimos con dock y secciones.'
    };

    const categories = {
      landing: 'Negocios',
      blog: 'Editorial',
      portfolio: 'Personal',
      memexicanisimos: 'Oficial'
    };

    const templates = dirs.map(id => {
      const hasPreview = fs.existsSync(path.join(TEMPLATES_DIR, id, 'preview.png'));
      const name = id.charAt(0).toUpperCase() + id.slice(1);
      return {
        id,
        name,
        description: descriptions[id] || `Plantilla predefinida ${name}`,
        category: categories[id] || 'General',
        hasPreview
      };
    });

    res.json(createApiResponse(true, templates, null, 'Catálogo de plantillas obtenido con éxito'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const safeId = path.basename(id);
    const templateDir = path.join(TEMPLATES_DIR, safeId);

    if (!fs.existsSync(templateDir) || !fs.statSync(templateDir).isDirectory()) {
      return res.status(404).json(createApiResponse(false, null, 'NOT_FOUND', 'Plantilla no encontrada'));
    }

    const indexPath = path.join(templateDir, 'index.html');
    const stylePath = path.join(templateDir, 'style.css');
    const assetsPath = path.join(templateDir, 'assets');

    let html = '';
    let css = '';

    if (fs.existsSync(indexPath)) {
      html = fs.readFileSync(indexPath, 'utf8');
    }
    if (fs.existsSync(stylePath)) {
      css = fs.readFileSync(stylePath, 'utf8');
    }

    // Reemplazar rutas relativas de assets para que apunten al endpoint de assets de la plantilla
    html = html.replace(
      /(src|href)=["'](?:\.\/)?assets\/([^"']+)["']/g,
      (match, attr, file) => `${attr}="/api/templates/${safeId}/assets/${file}"`
    );

    // Listar assets disponibles en la carpeta de la plantilla
    let assets = [];
    if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory()) {
      const scanAssets = (dir, relDir = '') => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const subRel = relDir ? `${relDir}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            scanAssets(path.join(dir, entry.name), subRel);
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
              assets.push(subRel);
            }
          }
        }
      };
      try {
        scanAssets(assetsPath);
      } catch {}
    }

    res.json(createApiResponse(true, {
      id: safeId,
      html,
      css,
      assets,
      meta: {
        id: safeId,
        name: safeId.charAt(0).toUpperCase() + safeId.slice(1),
        version: '1.0'
      }
    }, null, `Plantilla "${safeId}" cargada con éxito`));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'TEMPLATE_READ_ERROR', err.message));
  }
});

// ── Servir assets desde plantillas con protección anti-traversal ────────
app.get(/^\/api\/templates\/([^/]+)\/assets\/(.+)$/, (req, res) => {
  try {
    const id = req.params[0];
    const rawSubPath = req.params[1] || '';
    const assetSubPath = decodeURIComponent(rawSubPath);
    const safeId = path.basename(id);
    const templateDir = path.resolve(TEMPLATES_DIR, safeId);
    const assetsDir = path.resolve(templateDir, 'assets');
    const resolvedPath = path.resolve(assetsDir, assetSubPath);

    // Validación anti-path-traversal estricta
    if (rawSubPath.includes('..') || assetSubPath.includes('..') || (!resolvedPath.startsWith(assetsDir + path.sep) && resolvedPath !== assetsDir)) {
      return res.status(403).json(createApiResponse(false, null, 'ACCESS_DENIED', 'Acceso denegado: ruta fuera de assets'));
    }

    if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
      return res.status(404).json(createApiResponse(false, null, 'NOT_FOUND', 'Asset de plantilla no encontrado'));
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.get('/api/templates/:id/preview', (req, res) => {
  const { id } = req.params;
  const safeId = path.basename(id);
  const previewPath = path.join(TEMPLATES_DIR, safeId, 'preview.png');
  if (fs.existsSync(previewPath)) {
    res.sendFile(previewPath);
  } else {
    res.status(404).send('No preview available');
  }
});

// ── 9. Gestión de Proyectos en Disco (v5.0 Fase 1) ────────────
const PROJECTS_BASE = process.env.ROTULOS_PROJECTS_DIR || path.join(os.homedir(), 'RotulosProjects');

if (!fs.existsSync(PROJECTS_BASE)) {
  try {
    fs.mkdirSync(PROJECTS_BASE, { recursive: true });
  } catch (err) {
    console.warn('[PROJECTS] Error creando PROJECTS_BASE:', err.message);
  }
}

function getSafeProjectPath(projectName) {
  const safeName = path.basename(projectName || '');
  return path.join(PROJECTS_BASE, safeName);
}

function validateProject(projectName) {
  const pPath = getSafeProjectPath(projectName);
  if (!fs.existsSync(pPath) || !fs.statSync(pPath).isDirectory()) {
    return null;
  }
  return pPath;
}

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

function copyTemplate(templateDir, targetProjectPath) {
  copyDirectory(templateDir, targetProjectPath);
}

app.get('/api/projects/list', (req, res) => {
  try {
    if (!fs.existsSync(PROJECTS_BASE)) {
      return res.json(createApiResponse(true, [], null, 'No hay directorio de proyectos'));
    }
    const dirs = fs.readdirSync(PROJECTS_BASE).filter(item => {
      const fullPath = path.join(PROJECTS_BASE, item);
      try {
        return fs.statSync(fullPath).isDirectory() &&
               fs.existsSync(path.join(fullPath, 'index.html'));
      } catch {
        return false;
      }
    });

    const projects = dirs.map(name => {
      const fullPath = path.join(PROJECTS_BASE, name);
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

    res.json(createApiResponse(true, projects, null, 'Listado de proyectos obtenido con éxito'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.post('/api/projects/create', (req, res) => {
  try {
    const { name, templateId } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PARAMS', 'Nombre de proyecto requerido'));
    }

    const safeName = path.basename(name.trim());
    const projectPath = path.join(PROJECTS_BASE, safeName);
    if (fs.existsSync(projectPath)) {
      return res.status(409).json(createApiResponse(false, null, 'PROJECT_EXISTS', 'El proyecto ya existe'));
    }

    fs.mkdirSync(projectPath, { recursive: true });

    if (templateId) {
      const templateDir = path.join(__dirname, 'templates', path.basename(templateId));
      if (fs.existsSync(templateDir) && fs.statSync(templateDir).isDirectory()) {
        copyTemplate(templateDir, projectPath);
      } else {
        fs.writeFileSync(path.join(projectPath, 'index.html'), '<!DOCTYPE html>\n<html lang="es">\n<head><meta charset="UTF-8"><title>' + safeName + '</title></head>\n<body><h1>' + safeName + '</h1></body></html>', 'utf8');
      }
    } else {
      fs.writeFileSync(path.join(projectPath, 'index.html'), '<!DOCTYPE html>\n<html lang="es">\n<head><meta charset="UTF-8"><title>' + safeName + '</title></head>\n<body><h1>' + safeName + '</h1></body></html>', 'utf8');
    }

    addRecentProject(projectPath);

    res.json(createApiResponse(true, { name: safeName, path: projectPath }, null, 'Proyecto creado exitosamente'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.post('/api/projects/duplicate', (req, res) => {
  try {
    const { sourceName, newName } = req.body || {};
    if (!sourceName || !newName) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PARAMS', 'Faltan parámetros'));
    }

    const sourcePath = validateProject(sourceName);
    if (!sourcePath) {
      return res.status(404).json(createApiResponse(false, null, 'PROJECT_NOT_FOUND', 'Proyecto origen no encontrado'));
    }

    const safeNewName = path.basename(newName.trim());
    const destPath = path.join(PROJECTS_BASE, safeNewName);
    if (fs.existsSync(destPath)) {
      return res.status(409).json(createApiResponse(false, null, 'PROJECT_EXISTS', 'El proyecto destino ya existe'));
    }

    copyDirectory(sourcePath, destPath);
    addRecentProject(destPath);

    res.json(createApiResponse(true, { name: safeNewName, path: destPath }, null, 'Proyecto duplicado con éxito'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.post('/api/projects/rename', (req, res) => {
  try {
    const { oldName, newName } = req.body || {};
    if (!oldName || !newName) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PARAMS', 'Faltan parámetros'));
    }

    const oldPath = validateProject(oldName);
    if (!oldPath) {
      return res.status(404).json(createApiResponse(false, null, 'PROJECT_NOT_FOUND', 'Proyecto no encontrado'));
    }

    const safeNewName = path.basename(newName.trim());
    const newPath = path.join(PROJECTS_BASE, safeNewName);
    if (fs.existsSync(newPath)) {
      return res.status(409).json(createApiResponse(false, null, 'PROJECT_EXISTS', 'Ya existe un proyecto con ese nombre'));
    }

    fs.renameSync(oldPath, newPath);
    addRecentProject(newPath);

    res.json(createApiResponse(true, { name: safeNewName, path: newPath }, null, 'Proyecto renombrado con éxito'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

app.post('/api/projects/delete', (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PARAMS', 'Nombre de proyecto requerido'));
    }

    const projectPath = validateProject(name);
    if (!projectPath) {
      return res.status(404).json(createApiResponse(false, null, 'PROJECT_NOT_FOUND', 'Proyecto no encontrado'));
    }

    fs.rmSync(projectPath, { recursive: true, force: true });
    res.json(createApiResponse(true, { name: path.basename(name) }, null, 'Proyecto eliminado correctamente'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SERVER_ERROR', err.message));
  }
});

// ── OAuth GitHub & Publicación a GitHub Pages (Fase 2) ──────
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'dummy_client_id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'dummy_client_secret';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5050/api/auth/github/callback';

let githubSession = {
  accessToken: null,
  user: null
};

app.get('/api/auth/github/login', (req, res) => {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo,user`;
  res.redirect(authUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('No se recibió código de autorización');
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
      })
    });
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Error al obtener token');
    }

    const accessToken = tokenData.access_token;
    githubSession.accessToken = accessToken;

    let login = 'GitHub User';
    try {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Rotulos-Web-Studio'
        }
      });
      const userData = await userResponse.json();
      login = userData.login || 'GitHub User';
    } catch {}

    githubSession.user = login;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Autenticación Exitosa</title></head>
      <body style="font-family:sans-serif; text-align:center; padding:40px; background:#141B17; color:#fff;">
        <script>
          localStorage.setItem('github_token', '${accessToken}');
          localStorage.setItem('github_user', '${login}');
          if (window.opener) {
            window.opener.postMessage({ type: 'github-auth-success', user: '${login}' }, '*');
          }
          setTimeout(() => window.close(), 600);
        </script>
        <h2>🎉 ¡Autenticación con GitHub exitosa!</h2>
        <p>Usuario: <strong>${login}</strong></p>
        <p>Puedes cerrar esta ventana.</p>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error de autenticación: ${error.message}`);
  }
});

app.get('/api/auth/github/status', (req, res) => {
  const token = githubSession.accessToken;
  if (token) {
    res.json(createApiResponse(true, { authenticated: true, user: githubSession.user || 'GitHub User' }, null, 'Usuario autenticado'));
  } else {
    res.json(createApiResponse(true, { authenticated: false, user: null }, null, 'No autenticado'));
  }
});

app.post('/api/auth/github/logout', (req, res) => {
  githubSession = { accessToken: null, user: null };
  res.json(createApiResponse(true, { authenticated: false }, null, 'Sesión cerrada correctamente'));
});

// POST /api/publish/github
app.post('/api/publish/github', async (req, res) => {
  try {
    const { projectPath: reqProjectPath, repoName, token: reqToken } = req.body || {};
    const token = reqToken || githubSession.accessToken;

    if (!token) {
      return res.status(401).json(createApiResponse(false, null, 'AUTH_REQUIRED', 'Token de autenticación de GitHub requerido'));
    }

    const targetPath = reqProjectPath ? path.resolve(reqProjectPath) : projectPath;
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
      return res.status(404).json(createApiResponse(false, null, 'PROJECT_NOT_FOUND', 'Ruta del proyecto no encontrada o inválida'));
    }

    const safeRepoName = (repoName || path.basename(targetPath) || 'mi-sitio-rotulos')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');

    const github = new GitHubAPI(token);

    // 1. Verificar si el repositorio ya existe
    let repoExists = false;
    try {
      await github.getRepo(safeRepoName);
      repoExists = true;
    } catch {
      repoExists = false;
    }

    // Si no existe, crearlo
    if (!repoExists) {
      await github.createRepo(safeRepoName, { description: 'Sitio web publicado desde Rótulos Web', private: false });
    }

    // 2. Subir archivos recursivamente
    await github.uploadProjectDirectory(safeRepoName, targetPath);

    // 3. Activar GitHub Pages
    try {
      await github.enablePages(safeRepoName);
    } catch (pagesErr) {
      console.warn('[Pages Warning]', pagesErr.message);
    }

    // 4. Obtener URL de GitHub Pages
    const pagesInfo = await github.getPagesInfo(safeRepoName);
    const username = await github.getUsername();
    const pagesUrl = pagesInfo.html_url || `https://${username}.github.io/${safeRepoName}/`;

    res.json(createApiResponse(true, {
      url: pagesUrl,
      repo: safeRepoName,
      user: username,
      message: '¡Publicado exitosamente en GitHub Pages!'
    }, null, 'Publicación exitosa'));
  } catch (err) {
    console.error('[PUBLISH ERROR]', err);
    res.status(500).json(createApiResponse(false, null, 'PUBLISH_FAILED', err.message));
  }
});

// 7. Endpoint seguro para apagar el servidor directamente
app.post('/api/shutdown', (req, res) => {
  res.json(createApiResponse(true, null, null, 'Servidor apagándose...'));
  console.log('🛑 Solicitud de apagado recibida. Cerrando servidor en 1 segundo...');
  setTimeout(() => process.exit(0), 1000);
});

// ── CREACIÓN DE SERVIDOR (HTTPS DUAL / HÍBRIDO - FASE 1.2) ──
const sslKeyPath = path.resolve(__dirname, process.env.SSL_KEY || 'localhost-key.pem');
const sslCertPath = path.resolve(__dirname, process.env.SSL_CERT || 'localhost.pem');

let server;
let isHttps = false;

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  try {
    const sslOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    server = https.createServer(sslOptions, app);
    isHttps = true;
  } catch (e) {
    console.warn('⚠️ Error al leer certificados SSL, alternando a HTTP:', e.message);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    const protocol = isHttps ? 'https' : 'http';
    const url = `${protocol}://localhost:${PORT}`;
    console.log(`
==========================================================
 🛠️ TALACHAS Y RÓTULOS WEB – EDITOR UNIVERSAL
==========================================================
 Servidor activo en: ${url}
 Modo Seguro: ${isHttps ? '🔒 HTTPS Activo' : '🌐 HTTP Activo'}
 Proyecto activo: ${projectPath}
 Archivo en edición: ${getActiveIndexPath()}
 Respaldos automáticos en: ${getActiveBackupsDir()} (Retención FIFO: ${MAX_BACKUPS})
 API Canónica: ApiResponse<T> activa
==========================================================
${!isHttps ? '💡 TIP: Para activar HTTPS local con candado verde:\n   mkcert -install && mkcert localhost 127.0.0.1 ::1\n' : ''}`);

    if (openPkg && process.env.NODE_ENV !== 'test' && !process.env.NO_OPEN) {
      try {
        openPkg(url).catch(() => {});
      } catch (e) {}
    }
  });
}

module.exports = { app, server, createApiResponse };
