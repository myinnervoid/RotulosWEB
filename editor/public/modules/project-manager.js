/**
 * ============================================================
 * 📁 project-manager.js — Gestor de Proyectos y Carpetas
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

import { showToast } from './toast.js';
import { showConfirmDialog, showPromptDialog } from './dialog.js';
import { getErrorMessage } from './error-messages.js';
import { rebuildDockSections } from './ui-panels.js';

/**
 * Carga y muestra los proyectos recientes en el drawer.
 */
export async function loadRecentProjects() {
  if (window.isStaticMode) {
    const activeNameEl = document.getElementById('active-project-name');
    if (activeNameEl) activeNameEl.textContent = 'Memexicanísimos (GitHub Pages)';
    const container = document.getElementById('recent-projects');
    if (container) {
      container.innerHTML = '<div style="color:var(--oro-charro); font-size:0.75rem; padding:6px 0;"><i class="fas fa-globe"></i> Plantilla Oficial Memexicanísimos</div>';
    }
    return;
  }

  try {
    const curRes = await fetch('/api/current-project');
    const curJson = await curRes.json();
    if (curJson.success && curJson.data) {
      const activeNameEl = document.getElementById('active-project-name');
      const activeCardEl = document.getElementById('active-project-card');
      if (activeNameEl) {
        const fullPath = curJson.data.projectPath;
        const baseName = fullPath.split('/').filter(Boolean).pop() || fullPath;
        activeNameEl.textContent = baseName;
        if (activeCardEl) activeCardEl.title = `Ruta: ${fullPath}`;
      }
    }

    const res = await fetch('/api/recent-projects');
    const json = await res.json();
    const container = document.getElementById('recent-projects');
    if (!container) return;

    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      container.innerHTML = json.data.map(p => {
        const name = p.split('/').filter(Boolean).pop() || p;
        return `
          <button class="recent-project-btn" data-path="${p}" title="${p}">
            <i class="fas fa-folder" style="color:var(--oro-charro);"></i>
            <span>${name}</span>
          </button>
        `;
      }).join('');

      container.querySelectorAll('.recent-project-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await switchProject(btn.dataset.path);
        });
      });
    } else {
      container.innerHTML = '<div style="color:var(--texto-sec); font-size:0.75rem; padding:6px 0;">No hay proyectos recientes</div>';
    }
  } catch (err) {
    console.warn('Error cargando proyectos recientes:', err);
  }
}

/**
 * Cambia el proyecto activo y recarga el editor.
 * @param {string} targetPath - Ruta absoluta del proyecto
 */
export async function switchProject(targetPath) {
  if (!targetPath) return;
  try {
    localStorage.removeItem('rotulos_active_imported_html');
    localStorage.removeItem('rotulos_active_imported_css');
    localStorage.removeItem('rotulos_active_imported_name');
  } catch {}

  showToast(`Cambiando a: ${targetPath}...`);
  try {
    const res = await fetch('/api/switch-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newProjectPath: targetPath })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Proyecto cambiado. Recargando editor...');
      setTimeout(() => {
        window.location.search = `?project=${encodeURIComponent(targetPath)}`;
      }, 300);
    } else {
      showToast(getErrorMessage(json.error_code, json.message || 'Error al cambiar de proyecto'), true);
    }
  } catch (err) {
    showToast('Fallo al conmutar proyecto: ' + err.message, true);
  }
}

/**
 * Configura los controles del selector de proyectos:
 * - Importar HTML desde archivo
 * - Restaurar plantilla oficial
 * - Drag & Drop
 * - Abrir carpeta del sistema
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupProjectSelector(editor) {
  const btnOpenProject = document.getElementById('btn-open-project');
  const btnImportHtml = document.getElementById('btn-import-html');
  const btnResetTemplate = document.getElementById('btn-reset-template');

  // 1. Importar HTML directo
  if (btnImportHtml) {
    btnImportHtml.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.html,.htm';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const rawContent = ev.target.result;
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawContent, 'text/html');

            let extractedCss = '';
            doc.querySelectorAll('style').forEach(s => {
              extractedCss += s.textContent + '\n';
            });

            const bodyContent = doc.body ? doc.body.innerHTML : rawContent;
            const ed = editor || window.editor;

            if (ed) {
              ed.setComponents(bodyContent);
              if (extractedCss.trim()) {
                ed.setStyle(extractedCss);
              }
              ed.refresh();
              rebuildDockSections(ed);
            }

            // Persistir archivo importado para evitar reseteo con F5
            try {
              localStorage.setItem('rotulos_active_imported_html', bodyContent);
              localStorage.setItem('rotulos_active_imported_css', extractedCss);
              localStorage.setItem('rotulos_active_imported_name', `${file.name} (Importado)`);
            } catch {}

            const activeNameEl = document.getElementById('active-project-name');
            if (activeNameEl) activeNameEl.textContent = `${file.name} (Importado)`;

            document.dispatchEvent(new Event('drawer:close'));
            showToast(`🎉 ¡${file.name} cargado en el editor! Ya puedes modificarlo y guardarlo.`);
          } catch (err) {
            showToast('Error al leer el archivo HTML: ' + err.message, true);
          } finally {
            if (input.parentNode) input.parentNode.removeChild(input);
          }
        };

        reader.readAsText(file);
      });

      input.click();
    });
  }

  // 2. Restaurar plantilla oficial
  if (btnResetTemplate) {
    btnResetTemplate.addEventListener('click', async () => {
      const ok = await showConfirmDialog({
        title: 'Restaurar Plantilla Oficial',
        message: '¿Deseas recargar la plantilla oficial de Memexicanísimos en el editor? Se perderán los cambios no guardados.',
        confirmText: 'Restaurar',
        cancelText: 'Cancelar'
      });
      if (!ok) return;
      try {
        const [tHtmlRes, tCssRes] = await Promise.all([
          fetch('./templates/memexicanisimos/index.html'),
          fetch('./templates/memexicanisimos/style.css')
        ]);
        if (tHtmlRes.ok && tCssRes.ok) {
          const h = await tHtmlRes.text();
          const c = await tCssRes.text();
          const ed = editor || window.editor;
          if (ed) {
            ed.setComponents(h);
            ed.setStyle(c);
            ed.refresh();
            rebuildDockSections(ed);
          }

          try {
            localStorage.removeItem('rotulos_active_imported_html');
            localStorage.removeItem('rotulos_active_imported_css');
            localStorage.removeItem('rotulos_active_imported_name');
          } catch {}

          const activeNameEl = document.getElementById('active-project-name');
          if (activeNameEl) activeNameEl.textContent = 'Memexicanísimos (Plantilla Oficial)';
          document.dispatchEvent(new Event('drawer:close'));
          showToast('🇲🇽 ¡Plantilla oficial de Memexicanísimos restaurada!');
        }
      } catch (err) {
        showToast('Error al restaurar plantilla: ' + err.message, true);
      }
    });
  }

  // 3. Drag & Drop de archivo HTML
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const rawContent = ev.target.result;
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawContent, 'text/html');

            let extractedCss = '';
            doc.querySelectorAll('style').forEach(s => {
              extractedCss += s.textContent + '\n';
            });

            const bodyContent = doc.body ? doc.body.innerHTML : rawContent;
            const ed = editor || window.editor;

            if (ed) {
              ed.setComponents(bodyContent);
              if (extractedCss.trim()) {
                ed.setStyle(extractedCss);
              }
              ed.refresh();
              rebuildDockSections(ed);
            }

            try {
              localStorage.setItem('rotulos_active_imported_html', bodyContent);
              localStorage.setItem('rotulos_active_imported_css', extractedCss);
              localStorage.setItem('rotulos_active_imported_name', `${file.name} (Importado)`);
            } catch (storageErr) {
              console.warn('No se pudo persistir en localStorage:', storageErr);
            }

            const activeNameEl = document.getElementById('active-project-name');
            if (activeNameEl) activeNameEl.textContent = `${file.name} (Importado)`;

            showToast(`🎉 ¡${file.name} cargado mediante arrastre!`);
          } catch (dropErr) {
            showToast('Error al procesar archivo soltado: ' + dropErr.message, true);
          }
        };
        reader.readAsText(file);
      }
    }
  });

  // 4. Abrir carpeta completa (modo local con Node)
  if (btnOpenProject) {
    btnOpenProject.addEventListener('click', async () => {
      let currentPathHint = '/home/myinnervoid/Estudio Memexicanisimos/';
      const activeCardEl = document.getElementById('active-project-card');
      if (activeCardEl && activeCardEl.title) {
        currentPathHint = activeCardEl.title.replace(/^Ruta:\s*/, '');
      }

      const userPath = await showPromptDialog({
        title: '📂 Abrir Carpeta de Proyecto',
        message: 'Ingresa o confirma la ruta absoluta de la carpeta en tu disco:',
        defaultValue: currentPathHint,
        placeholder: '/home/myinnervoid/Estudio Memexicanisimos/Psiconauta/',
        confirmText: 'Abrir Proyecto'
      });

      if (userPath && userPath.trim()) {
        await switchProject(userPath.trim());
      }
    });
  }
}
