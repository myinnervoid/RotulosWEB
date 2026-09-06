/**
 * ============================================================
 * 💾 save-publish.js — Guardar, Publicar GitHub, Screenshot
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

import { showToast } from './toast.js';
import { t } from './i18n.js';
import { getPublishState, setPublishState, updatePublishUI } from './toast.js';
import { showConfirmDialog } from './dialog.js';
import { getErrorMessage } from './error-messages.js';

/**
 * Limpia el HTML del editor de atributos internos de GrapesJS.
 * @param {string} rawHtml
 * @returns {string}
 */
export function getSanitizedHtml(rawHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  if (doc.body) {
    doc.body.classList.remove('editor-show-all');
  }

  const sections = doc.querySelectorAll('.product-section');
  sections.forEach((sec, idx) => {
    sec.style.display = '';
    sec.style.opacity = '';
    if (idx === 0 && !doc.querySelector('.product-section.active')) {
      sec.classList.add('active');
    }
  });

  const allEls = doc.querySelectorAll('*');
  allEls.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-gjs') || attr.name === 'data-highlightable') {
        el.removeAttribute(attr.name);
      }
    });
    el.classList.remove('gjs-selected', 'gjs-hovered');
  });

  const fixStyle = doc.getElementById('gjs-canvas-scroll-fixes');
  if (fixStyle) fixStyle.remove();

  return `<!DOCTYPE html>\n<html lang="es">\n${doc.documentElement.innerHTML}\n</html>`;
}

/**
 * Configura el atajo Ctrl+S para guardar.
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupSaveShortcut(editor) {
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      await triggerSave(editor);
    }
  });
}

/**
 * Configura el botón de guardar en disco.
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupSaveButton(editor) {
  const btnSave = document.getElementById('btn-save-disk');
  if (!btnSave) return;

  btnSave.addEventListener('click', async () => {
    await triggerSave(editor, btnSave);
  });
}

async function triggerSave(editor, btnSave) {
  const btn = btnSave || document.getElementById('btn-save-disk');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${t('btn_saving', 'Guardando...')}</span>`;
  }

  try {
    const cleanHtml = getSanitizedHtml(editor.getHtml());
    const cssContent = editor.getCss();

    if (window.isStaticMode) {
      const fullHtml = `<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Memexicanisimos — Rediseño Popular</title>\n  <style>\n${cssContent}\n  </style>\n</head>\n<body>\n${cleanHtml}\n</body>\n</html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('🎉 ¡Descargaste tu index.html modificado!');
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check"></i> <span>¡Descargado!</span>`;
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-save"></i> <span data-i18n="btn_save">${t('btn_save', 'Guardar en index.html')}</span>`;
          btn.disabled = false;
        }, 2000);
      }
      return;
    }

    const saveRes = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: cleanHtml, css: cssContent })
    });

    const saveResult = await saveRes.json();

    if (saveResult.success) {
      const backupName = saveResult.data ? saveResult.data.backup : 'creado';
      showToast(`¡Guardado exitoso! (Respaldo: ${backupName})`);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check"></i> <span>${t('btn_saved', '¡Guardado!')}</span>`;
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-save"></i> <span data-i18n="btn_save">${t('btn_save', 'Guardar en index.html')}</span>`;
          btn.disabled = false;
        }, 2000);
      }
    } else {
      showToast('Error al guardar: ' + getErrorMessage(saveResult.error_code, saveResult.message || 'Desconocido'), true);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Reintentar</span>`;
        btn.disabled = false;
      }
    }
  } catch (err) {
    showToast('Fallo de conexión al guardar: ' + err.message, true);
    if (btn) {
      btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Error</span>`;
      btn.disabled = false;
    }
  }
}

/**
 * Configura el botón de publicar en GitHub con FSM.
 */
export function setupPublishButton() {
  const btnPublish = document.getElementById('btn-publish');
  if (!btnPublish) return;

  btnPublish.addEventListener('click', async () => {
    if (getPublishState() === 'PENDING') return;

    if (window.isStaticMode) {
      alert('🎉 ¡Reto Memexicanísimo!\n\nEn esta versión Web de GitHub Pages puedes presionar "Guardar en index.html" para descargar tu código completo con todas tus modificaciones, o tomar una captura de pantalla y compartirla en redes sociales etiquetando a @memexicanisimos (#RetoMemexicanisimo).');
      setPublishState('SUCCESS');
      updatePublishUI('SUCCESS', '¡Diseño listo! Descarga tu archivo.');
      return;
    }

    const confirmed = await showConfirmDialog({
      title: 'Publicar en GitHub',
      message: t('publish_confirm', '¿Deseas compilar y publicar los cambios en GitHub?'),
      confirmText: 'Publicar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    setPublishState('PENDING');
    updatePublishUI('PENDING');

    try {
      const pubRes = await fetch('/api/publish', { method: 'POST' });
      const pubJson = await pubRes.json();
      if (pubJson.success) {
        setPublishState('SUCCESS');
        updatePublishUI('SUCCESS', pubJson.message);
      } else {
        setPublishState('FAULT');
        updatePublishUI('FAULT', getErrorMessage(pubJson.error_code, pubJson.message));
      }
    } catch (err) {
      setPublishState('FAULT');
      updatePublishUI('FAULT', err.message);
    }
  });

  // Actualizar UI al cambiar idioma
  document.addEventListener('lang:changed', () => {
    updatePublishUI(getPublishState());
  });
}

/**
 * Configura el inspector de código fuente limpio.
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupCodeInspector(editor) {
  const codeModal = document.getElementById('code-modal');
  const codeContent = document.getElementById('code-content');
  const btnCloseCode = document.getElementById('btn-close-code');
  const btnCloseCodeFooter = document.getElementById('btn-close-code-footer');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const btnViewCode = document.getElementById('btn-view-code');
  if (!codeModal || !codeContent) return;

  const openCodeInspector = () => {
    codeContent.value = getSanitizedHtml(editor.getHtml());
    codeModal.classList.add('open');
  };

  const closeCodeInspector = () => codeModal.classList.remove('open');

  if (btnViewCode) btnViewCode.addEventListener('click', () => { document.dispatchEvent(new Event('drawer:close')); openCodeInspector(); });
  if (btnCloseCode) btnCloseCode.addEventListener('click', closeCodeInspector);
  if (btnCloseCodeFooter) btnCloseCodeFooter.addEventListener('click', closeCodeInspector);

  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeContent.value);
        showToast('¡Código copiado al portapapeles!');
      } catch (e) {
        codeContent.select();
        document.execCommand('copy');
        showToast('¡Código copiado!');
      }
    });
  }
}

/**
 * Configura el modal de estadísticas del servidor.
 */
export function setupStatsModal(editorInstance) {
  const btnStats = document.getElementById('btn-stats');
  const statsModal = document.getElementById('stats-modal');
  const statsContent = document.getElementById('stats-content');
  const btnCloseStats = document.getElementById('btn-close-stats');
  const btnCloseStatsFooter = document.getElementById('btn-close-stats-footer');
  if (!btnStats || !statsModal) return;

  const closeStatsModal = () => statsModal.classList.remove('open');

  btnStats.addEventListener('click', async () => {
    document.dispatchEvent(new Event('drawer:close'));
    statsModal.classList.add('open');

    const ed = editorInstance || window.editor;
    const pageMetrics = { elements: 0, headings: 0, links: 0, images: 0, words: 0 };
    try {
      const canvasDoc = ed && ed.Canvas ? ed.Canvas.getDocument() : null;
      const targetDoc = canvasDoc || (new DOMParser()).parseFromString(ed ? ed.getHtml() : '', 'text/html');
      if (targetDoc && targetDoc.body) {
        pageMetrics.elements = targetDoc.body.querySelectorAll('*').length;
        pageMetrics.headings = targetDoc.body.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        pageMetrics.links = targetDoc.body.querySelectorAll('a, button').length;
        pageMetrics.images = targetDoc.body.querySelectorAll('img, svg').length;
        const text = targetDoc.body.textContent || '';
        pageMetrics.words = text.split(/\s+/).filter(Boolean).length;
      }
    } catch {
      // Ignorar fallo de parseo
    }

    const pageStatsHtml = `
      <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
        <div style="font-size:0.75rem; color:var(--oro-charro); font-weight:700; text-transform:uppercase; margin-bottom:8px; font-family:'Space Mono',monospace;">
          📄 Métricas de la Página en Edición
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Elementos DOM</div>
            <div class="stat-value">${pageMetrics.elements}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Palabras Aprox.</div>
            <div class="stat-value">${pageMetrics.words}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Encabezados (H1-H6)</div>
            <div class="stat-value">${pageMetrics.headings}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Enlaces y Botones</div>
            <div class="stat-value">${pageMetrics.links}</div>
          </div>
        </div>
      </div>
    `;

    if (window.isStaticMode) {
      statsContent.innerHTML = `
        ${pageStatsHtml}
        <div class="stat-row"><strong>Entorno:</strong> <span>Navegador Web Soberano</span></div>
        <div class="stat-row"><strong>Imágenes detectadas:</strong> <span>${pageMetrics.images}</span></div>
        <div class="stat-row"><strong>Persistencia:</strong> <span>Descarga directa &amp; LocalStorage</span></div>
      `;
      return;
    }

    statsContent.innerHTML = pageStatsHtml + '<div style="text-align:center; padding:12px;"><i class="fas fa-spinner fa-spin"></i> Consultando servidor local...</div>';
    try {
      const statsRes = await fetch('/api/stats');
      const json = await statsRes.json();
      if (json.success && json.data) {
        const d = json.data;
        statsContent.innerHTML = `
          ${pageStatsHtml}
          <div style="font-size:0.75rem; color:var(--verde-neon); font-weight:700; text-transform:uppercase; margin-bottom:8px; font-family:'Space Mono',monospace;">
            🛠️ Estado del Servidor Local
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">${t('stats_backups', 'Respaldos almacenados')}</div>
              <div class="stat-value">${d.totalBackups} / ${d.maxBackups || 15}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('stats_size', 'Tamaño de respaldos')}</div>
              <div class="stat-value">${d.totalSizeKB} KB</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('stats_uptime', 'Tiempo activo')}</div>
              <div class="stat-value">${d.uptimeHuman}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('stats_memory_rss', 'Memoria RSS')}</div>
              <div class="stat-value">${d.memory.rss}</div>
            </div>
          </div>
          <div style="font-size:0.75rem; color:var(--texto-sec); text-align:right; margin-top:8px;">
            Carpeta activa: <strong>${d.projectPath}</strong>
          </div>
        `;
      } else {
        statsContent.innerHTML = pageStatsHtml + `<div style="color:#CE1126;">${getErrorMessage(json.error_code, 'Error al obtener estadísticas del servidor.')}</div>`;
      }
    } catch (err) {
      statsContent.innerHTML = pageStatsHtml + `<div style="color:#CE1126;">Error de red al consultar estadísticas: ${err.message}</div>`;
    }
  });

  if (btnCloseStats) btnCloseStats.addEventListener('click', closeStatsModal);
  if (btnCloseStatsFooter) btnCloseStatsFooter.addEventListener('click', closeStatsModal);
  statsModal.addEventListener('click', (e) => { if (e.target === statsModal) closeStatsModal(); });
}

/**
 * Configura el generador de capturas HD con Puppeteer.
 */
export function setupScreenshotModal(editorInstance) {
  const btnScreenshot = document.getElementById('btn-screenshot');
  const screenshotModal = document.getElementById('screenshot-modal');
  const btnCloseScreenshot = document.getElementById('btn-close-screenshot');
  const btnCloseScreenshotFooter = document.getElementById('btn-close-screenshot-footer');
  const resOptions = document.querySelectorAll('.btn-res-option');
  const btnExecuteScreenshot = document.getElementById('btn-execute-screenshot');
  const chkFullPage = document.getElementById('chk-fullpage');
  const screenshotResultArea = document.getElementById('screenshot-result-area');
  if (!btnScreenshot || !screenshotModal) return;

  let selectedScreenshotDevice = 'desktop';

  btnScreenshot.addEventListener('click', () => {
    document.dispatchEvent(new Event('drawer:close'));
    screenshotModal.classList.add('open');
    if (screenshotResultArea) screenshotResultArea.style.display = 'none';
  });

  const closeScreenshot = () => screenshotModal.classList.remove('open');
  if (btnCloseScreenshot) btnCloseScreenshot.addEventListener('click', closeScreenshot);
  if (btnCloseScreenshotFooter) btnCloseScreenshotFooter.addEventListener('click', closeScreenshot);

  resOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      resOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedScreenshotDevice = opt.dataset.device;
    });
  });

  if (btnExecuteScreenshot) {
    btnExecuteScreenshot.addEventListener('click', async () => {
      btnExecuteScreenshot.disabled = true;
      btnExecuteScreenshot.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Tomando captura en Chrome...</span>';
      if (screenshotResultArea) {
        screenshotResultArea.style.display = 'block';
        screenshotResultArea.innerHTML = '<div style="text-align:center; padding:15px;"><i class="fas fa-camera fa-2x fa-bounce"></i><p style="margin-top:8px;">Renderizando en Chrome local...</p></div>';
      }

      try {
        const currentTheme = localStorage.getItem('memex-theme') || 'patria';
        const isFullPage = chkFullPage ? chkFullPage.checked : false;

        const ed = editorInstance || window.editor;
        let activeHtml = '';
        let activeCss = '';
        if (ed) {
          activeHtml = getSanitizedHtml(ed.getHtml());
          activeCss = ed.getCss();
        }

        const res = await fetch('/api/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device: selectedScreenshotDevice,
            fullPage: isFullPage,
            theme: currentTheme,
            html: activeHtml,
            css: activeCss
          })
        });

        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          if (screenshotResultArea) {
            screenshotResultArea.innerHTML = `
              <div class="screenshot-preview-box">
                <div style="font-size:0.75rem; color:var(--oro-charro); margin-bottom:8px; font-weight:700;">
                  ✔ Captura generada: ${d.dimensions.width}×${d.dimensions.height} px (${d.sizeKB} KB)
                </div>
                <img src="${d.url}" alt="Screenshot" />
                <div style="margin-top:10px; display:flex; justify-content:center; gap:10px;">
                  <a href="${d.url}" download="${d.filename}" class="btn-action" style="background:var(--verde-patrio); color:#FFF;">
                    <i class="fas fa-download"></i> Descargar Imagen PNG
                  </a>
                  <a href="${d.url}" target="_blank" class="btn-action">
                    <i class="fas fa-external-link-alt"></i> Ver en Tamaño Real
                  </a>
                </div>
              </div>
            `;
          }
          showToast('¡Captura generada exitosamente!');
        } else {
          const errorMsg = getErrorMessage(json.error_code, json.message || 'Error al generar captura');
          if (screenshotResultArea) screenshotResultArea.innerHTML = `<div style="color:#CE1126; padding:10px;">${errorMsg}</div>`;
          showToast(errorMsg, true);
        }
      } catch (err) {
        if (screenshotResultArea) screenshotResultArea.innerHTML = `<div style="color:#CE1126; padding:10px;">Fallo de conexión: ${err.message}</div>`;
        showToast('Fallo al conectar con el motor de capturas: ' + err.message, true);
      } finally {
        btnExecuteScreenshot.disabled = false;
        btnExecuteScreenshot.innerHTML = '<i class="fas fa-camera"></i> <span>Generar Captura Ahora</span>';
      }
    });
  }
}
