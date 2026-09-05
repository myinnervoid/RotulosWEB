require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const simpleGit = require('simple-git');
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
    return res.status(403).json(createApiResponse(false, null, 'ACCESS_DENIED', 'Acceso denegado: este editor es estrictamente local.'));
  }
  next();
});

app.use(cors({ origin: ['http://localhost:5050', 'https://localhost:5050', 'http://127.0.0.1:5050', 'https://127.0.0.1:5050'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/locales', express.static(path.join(__dirname, 'locales')));
app.use('/vendor/grapesjs', express.static(path.join(__dirname, 'node_modules/grapesjs/dist')));
app.use('/vendor/grapesjs-blocks-basic', express.static(path.join(__dirname, 'node_modules/grapesjs-blocks-basic/dist')));

// Servir assets dinámicos del proyecto actual con fallback al workspace
app.use('/assets', (req, res, next) => {
  const projectAsset = path.join(projectPath, 'assets', req.path);
  if (fs.existsSync(projectAsset)) {
    return res.sendFile(projectAsset);
  }
  const defaultAsset = path.join(path.resolve(__dirname, '../../assets'), req.path);
  if (fs.existsSync(defaultAsset)) {
    return res.sendFile(defaultAsset);
  }
  next();
});

// ── ENDPOINTS DE LA API (ApiResponse<T>) ────────────────────

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
      const projects = JSON.parse(data);
      res.json(createApiResponse(true, projects, null, 'Proyectos recientes'));
    } else {
      res.json(createApiResponse(true, [projectPath], null, 'Sin proyectos recientes'));
    }
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'RECENT_LOAD_FAILED', err.message));
  }
});

app.post('/api/recent-projects', (req, res) => {
  try {
    const { projectPath: newPath } = req.body;
    if (!newPath || !fs.existsSync(newPath)) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PATH', 'La ruta no existe'));
    }
    addRecentProject(newPath);
    let projects = [];
    if (fs.existsSync(recentFile)) {
      projects = JSON.parse(fs.readFileSync(recentFile, 'utf8'));
    }
    res.json(createApiResponse(true, projects, null, 'Proyecto guardado en recientes'));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'RECENT_SAVE_FAILED', err.message));
  }
});

app.post('/api/switch-project', (req, res) => {
  try {
    const { newProjectPath } = req.body;
    if (!newProjectPath) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PATH', 'Ruta no especificada'));
    }
    const resolved = path.resolve(newProjectPath);
    if (!fs.existsSync(resolved)) {
      return res.status(400).json(createApiResponse(false, null, 'PATH_NOT_FOUND', `La ruta "${resolved}" no existe`));
    }
    projectPath = resolved;
    addRecentProject(resolved);
    console.log(`[PROYECTO] Conmutado a: ${projectPath}`);
    res.json(createApiResponse(true, { projectPath }, null, `Proyecto cambiado a ${path.basename(projectPath)}`));
  } catch (err) {
    res.status(500).json(createApiResponse(false, null, 'SWITCH_FAILED', err.message));
  }
});

// 1. Endpoint para listar imágenes disponibles en assets del proyecto
app.get('/api/assets', (req, res) => {
  try {
    const projectAssetsDir = path.join(projectPath, 'assets');
    const images = [];

    function scanDir(currentDir, relativePrefix = '') {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.join(relativePrefix, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(entry.name)) {
          images.push({
            src: `/assets/${relPath.replace(/\\/g, '/')}`,
            name: entry.name,
            type: 'image'
          });
        }
      }
    }

    scanDir(projectAssetsDir);
    // Si no hay assets en projectPath/assets, buscar en el fallback
    if (images.length === 0) {
      scanDir(path.resolve(__dirname, '../../assets'));
    }
    res.json(createApiResponse(true, { assets: images }, null, 'Galería de imágenes obtenida con éxito'));
  } catch (error) {
    res.status(500).json(createApiResponse(false, null, 'ASSETS_READ_FAILED', error.message));
  }
});

// 2. Endpoint para cargar el contenido actual de index.html y style.css
app.get('/api/page', (req, res) => {
  try {
    if (req.query.project && fs.existsSync(req.query.project)) {
      projectPath = path.resolve(req.query.project);
      addRecentProject(projectPath);
    }

    const indexPath = getActiveIndexPath();
    const stylePath = getActiveStylePath();

    if (!fs.existsSync(indexPath)) {
      return res.status(404).json(createApiResponse(false, null, 'FILE_NOT_FOUND', `No se encontró index.html en ${projectPath}`));
    }
    const html = fs.readFileSync(indexPath, 'utf-8');
    const css = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf-8') : '';
    res.json(createApiResponse(true, { html, css, projectPath }, null, 'Página cargada exitosamente'));
  } catch (error) {
    res.status(500).json(createApiResponse(false, null, 'PAGE_READ_FAILED', error.message));
  }
});

// 3. Endpoint para guardar los cambios en index.html con respaldo dinámico
app.post('/api/save', (req, res) => {
  try {
    const { html, css } = req.body;
    if (!html || typeof html !== 'string' || html.trim().length < 10) {
      return res.status(400).json(createApiResponse(false, null, 'INVALID_PAYLOAD', 'El contenido HTML es inválido o está vacío'));
    }

    if (!html.includes('<body') && !html.includes('<div') && !html.includes('<html') && !html.includes('<!DOCTYPE')) {
      return res.status(400).json(createApiResponse(false, null, 'MALFORMED_HTML', 'El contenido HTML carece de estructura válida'));
    }

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

    // B. Guardar en index.html
    fs.writeFileSync(indexPath, html, 'utf-8');

    // C. Si se envían estilos actualizados, guardar en style.css
    if (css && typeof css === 'string') {
      fs.writeFileSync(stylePath, css, 'utf-8');
    }

    console.log(`[OK] Cambios guardados en ${indexPath}. Respaldo: ${path.basename(backupFile)}`);
    res.json(createApiResponse(true, { backup: path.basename(backupFile), projectPath }, null, '¡Cambios guardados con éxito en index.html!'));
  } catch (error) {
    console.error('[ERROR] Al guardar:', error);
    res.status(500).json(createApiResponse(false, null, 'SAVE_FAILED', error.message));
  }
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
    res.status(500).json(createApiResponse(false, null, 'STATS_FAILED', 'Error al obtener estadísticas: ' + err.message));
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
    let errorCode = 'GIT_PUSH_FAILED';
    let message = 'Error al publicar en GitHub: ' + err.message;

    if (err.message.includes('authentication') || err.message.includes('Permission denied') || err.message.includes('fatal: could not read Username')) {
      errorCode = 'GIT_AUTH_REQUIRED';
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
    return res.status(503).json(createApiResponse(false, null, 'CHROME_NOT_FOUND', 'No se encontró un navegador Chrome/Chromium en el sistema (/usr/bin/google-chrome).'));
  }

  const { device = 'desktop', customWidth, customHeight, fullPage = false, theme = 'patria' } = req.body || {};
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

    // Cargar directamente el index.html principal del proyecto
    const targetUrl = `file://${INDEX_HTML_PATH}`;
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });

    // Aplicar tema solicitado si corresponde
    if (theme && theme !== 'patria') {
      await page.evaluate((t) => {
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
    res.status(500).json(createApiResponse(false, null, 'SCREENSHOT_FAILED', 'Error al capturar pantalla: ' + err.message));
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
