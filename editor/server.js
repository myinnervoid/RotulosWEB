require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const simpleGit = require('simple-git');
const { ERROR_CODES } = require('./server/error-codes');
let openPkg;
try {
  openPkg = require('open');
} catch (e) {
  openPkg = null;
}

const app = express();
const PORT = process.env.PORT || 5050;

// ── CONFIGURACIÓN DE RUTA DEL PROYECTO DINÁMICO ─────────────
let defaultCandidate = path.resolve(__dirname, '../../Pagina web memexicanisimos');
if (!fs.existsSync(defaultCandidate)) {
  defaultCandidate = path.resolve(__dirname, '../../');
}
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
  res.status(404).send('No se encontró index.html en el proyecto activo');
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

    res.json(createApiResponse(true, { assets: images }, null, 'Galería de imágenes obtenida con éxito'));
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

    // Si se pasa ?project= válido y difiere de projectPath actual, conmutar projectPath
    if (req.query.project && fs.existsSync(req.query.project) && activePath !== projectPath) {
      projectPath = activePath;
      addRecentProject(activePath);
      console.log(`[PROYECTO] Conmutado mediante query param a: ${projectPath}`);
    }

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
