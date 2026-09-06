/**
 * ============================================================
 * 📁 project-manager.js — Gestor de Proyectos y Carpetas
 * Rótulos Web / Memexicanísimos Studio v5.0
 * ============================================================
 */

'use strict';

import { showToast } from './toast.js';
import { showConfirmDialog, showPromptDialog } from './dialog.js';
import { getErrorMessage } from './error-messages.js';
import { rebuildDockSections } from './ui-panels.js';
import { getEditorInstance } from './editor-init.js';
import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { showTemplateSelector } from './template-selector.js';

const FAVORITES_KEY = 'rotulos_favorites';

/**
 * Obtiene la lista de proyectos locales desde el servidor
 * @returns {Promise<Array>}
 */
export async function fetchProjects() {
  const res = await fetch('/api/projects/list');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Error al obtener proyectos');
  }
  return data.data || [];
}

/**
 * Crea un nuevo proyecto con opción de plantilla
 * @param {string} name - Nombre del proyecto
 * @param {string|null} [templateId] - ID de plantilla opcional
 * @returns {Promise<object>}
 */
export async function createProject(name, templateId = null) {
  const res = await fetch('/api/projects/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, templateId })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Error al crear proyecto');
  }
  eventBus.publish(EDITOR_EVENTS.PROJECT_CREATED, data.data);
  return data.data;
}

/**
 * Duplica un proyecto existente
 * @param {string} sourceName - Nombre del proyecto origen
 * @param {string} newName - Nombre para la réplica
 * @returns {Promise<object>}
 */
export async function duplicateProject(sourceName, newName) {
  const res = await fetch('/api/projects/duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceName, newName })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Error al duplicar proyecto');
  }
  eventBus.publish(EDITOR_EVENTS.PROJECT_CREATED, data.data);
  return data.data;
}

/**
 * Renombra un proyecto
 * @param {string} oldName
 * @param {string} newName
 * @returns {Promise<object>}
 */
export async function renameProject(oldName, newName) {
  const res = await fetch('/api/projects/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldName, newName })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Error al renombrar proyecto');
  }
  return data.data;
}

/**
 * Elimina un proyecto de forma permanente
 * @param {string} name
 * @returns {Promise<object>}
 */
export async function deleteProject(name) {
  const res = await fetch('/api/projects/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error?.message || 'Error al eliminar proyecto');
  }
  eventBus.publish(EDITOR_EVENTS.PROJECT_DELETED, { name });
  return data.data;
}

/**
 * Obtiene lista de nombres de proyectos favoritos
 * @returns {string[]}
 */
export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Alterna el estado de favorito de un proyecto
 * @param {string} projectName
 * @returns {string[]}
 */
export function toggleFavorite(projectName) {
  const favorites = getFavorites();
  const index = favorites.indexOf(projectName);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(projectName);
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
  eventBus.publish(EDITOR_EVENTS.FAVORITES_UPDATED, { favorites, projectName });
  return favorites;
}

/**
 * Formatea una fecha ISO a formato local legible
 */
function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString || '';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString || '';
  }
}

/**
 * Formatea bytes a cadena legible
 */
function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Abre el panel modal de administración de proyectos
 * @param {object} editor - Instancia activa de GrapesJS
 * @returns {Promise<object|null>}
 */
export async function showProjectSelector(editor) {
  if (typeof document === 'undefined') return null;

  // Remover modal previo si estuviera abierto
  const existing = document.querySelector('.project-selector-overlay');
  if (existing) existing.remove();

  let projects = [];
  try {
    projects = await fetchProjects();
  } catch (err) {
    showToast('Error cargando proyectos: ' + err.message, true);
  }

  const modal = document.createElement('div');
  modal.className = 'project-selector-overlay';
  modal.innerHTML = `
    <div class="project-selector-modal" role="dialog" aria-labelledby="pm-modal-title">
      <div class="project-selector-header">
        <div>
          <h2 id="pm-modal-title"><i class="fas fa-boxes-stacked" style="color:var(--oro-charro);"></i> Mis Proyectos Locales</h2>
          <p class="pm-subtitle">Entornos de trabajo en <code>~/RotulosProjects</code></p>
        </div>
        <button class="project-selector-close" aria-label="Cerrar modal">&times;</button>
      </div>

      <div class="project-selector-toolbar">
        <div class="pm-search-wrap">
          <i class="fas fa-search pm-search-icon"></i>
          <input type="text" id="pm-search-input" class="pm-search-input" placeholder="Buscar proyecto..." spellcheck="false" />
        </div>
        <button id="btn-pm-new" class="btn-pm-primary">
          <i class="fas fa-plus"></i> Nuevo Proyecto
        </button>
      </div>

      <div class="project-list" id="pm-project-list">
        <!-- Renderizado dinámico -->
      </div>
    </div>
  `;

  // Inyectar estilos dedicados si no existen
  const styleId = 'project-manager-modal-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .project-selector-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(8, 12, 10, 0.88);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        padding: 20px;
        animation: pmFadeIn 0.2s ease-out;
      }
      @keyframes pmFadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
      .project-selector-modal {
        background: #141B17;
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 16px;
        width: 100%;
        max-width: 820px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.75);
        overflow: hidden;
      }
      .project-selector-header {
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .project-selector-header h2 {
        color: #F8F9FA;
        font-size: 1.35rem;
        margin: 0 0 4px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .pm-subtitle {
        color: #9CA3AF;
        font-size: 0.85rem;
        margin: 0;
      }
      .pm-subtitle code {
        color: var(--oro-charro, #D4AF37);
        background: rgba(212, 175, 55, 0.12);
        padding: 2px 6px;
        border-radius: 4px;
      }
      .project-selector-close {
        background: none;
        border: none;
        color: #9CA3AF;
        font-size: 1.8rem;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s;
      }
      .project-selector-close:hover { color: #fff; }
      .project-selector-toolbar {
        padding: 14px 24px;
        display: flex;
        gap: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        align-items: center;
      }
      .pm-search-wrap {
        position: relative;
        flex: 1;
      }
      .pm-search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #6B7280;
        font-size: 0.85rem;
      }
      .pm-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px 8px 34px;
        background: #0D1210;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #F8F9FA;
        font-size: 0.9rem;
      }
      .pm-search-input:focus {
        outline: none;
        border-color: var(--oro-charro, #D4AF37);
      }
      .btn-pm-primary {
        background: var(--oro-charro, #D4AF37);
        color: #0A0F0D;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s, transform 0.1s;
      }
      .btn-pm-primary:hover {
        background: #E5C158;
        transform: translateY(-1px);
      }
      .project-list {
        overflow-y: auto;
        flex: 1;
        padding: 12px 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .pm-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #9CA3AF;
      }
      .pm-empty-state i {
        font-size: 2.5rem;
        color: var(--oro-charro, #D4AF37);
        margin-bottom: 12px;
        opacity: 0.8;
      }
      .project-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: #1A231F;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        transition: border-color 0.15s, background 0.15s;
      }
      .project-item:hover {
        background: #202C27;
        border-color: rgba(212, 175, 55, 0.35);
      }
      .project-item.is-favorite {
        border-left: 3px solid var(--oro-charro, #D4AF37);
      }
      .pm-fav-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.15rem;
        color: #6B7280;
        padding: 4px;
        transition: transform 0.1s, color 0.15s;
      }
      .pm-fav-btn.active {
        color: var(--oro-charro, #D4AF37);
      }
      .pm-fav-btn:hover {
        transform: scale(1.15);
      }
      .pm-project-info {
        flex: 1;
        min-width: 0;
        cursor: pointer;
      }
      .pm-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .project-name {
        font-weight: 600;
        color: #F8F9FA;
        font-size: 0.95rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pm-tag-assets {
        font-size: 0.7rem;
        background: rgba(56, 189, 248, 0.15);
        color: #38BDF8;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .project-meta {
        color: #9CA3AF;
        font-size: 0.78rem;
        display: flex;
        gap: 10px;
      }
      .pm-actions-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pm-btn-action {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #D1D5DB;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 0.8rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: background 0.15s, color 0.15s;
      }
      .pm-btn-action:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
      .pm-btn-open {
        background: rgba(212, 175, 55, 0.15);
        border-color: rgba(212, 175, 55, 0.4);
        color: var(--oro-charro, #D4AF37);
        font-weight: 600;
      }
      .pm-btn-open:hover {
        background: var(--oro-charro, #D4AF37);
        color: #0A0F0D;
      }
      .pm-btn-delete {
        color: #EF4444;
      }
      .pm-btn-delete:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #F87171;
        border-color: rgba(239, 68, 68, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  return new Promise((resolve) => {
    const listEl = modal.querySelector('#pm-project-list');
    const searchInput = modal.querySelector('#pm-search-input');

    const closeModal = (res = null) => {
      modal.remove();
      resolve(res);
    };

    modal.querySelector('.project-selector-close').addEventListener('click', () => closeModal(null));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(null);
    });

    const renderList = () => {
      const query = (searchInput.value || '').trim().toLowerCase();
      const favorites = getFavorites();

      let filtered = projects.filter(p => p.name.toLowerCase().includes(query));

      // Ordenar: favoritos primero, luego fecha modificación descendente
      filtered.sort((a, b) => {
        const aFav = favorites.includes(a.name);
        const bFav = favorites.includes(b.name);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return new Date(b.modified) - new Date(a.modified);
      });

      if (filtered.length === 0) {
        listEl.innerHTML = `
          <div class="pm-empty-state">
            <i class="fas fa-folder-open"></i>
            <p>No se encontraron proyectos${query ? ' para "' + query + '"' : ''}.</p>
            <p style="font-size:0.8rem; color:#6B7280;">Haz clic en <strong>+ Nuevo Proyecto</strong> para crear el primero.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = filtered.map(p => {
        const isFav = favorites.includes(p.name);
        return `
          <div class="project-item ${isFav ? 'is-favorite' : ''}" data-name="${p.name}" data-path="${p.path}">
            <button class="pm-fav-btn ${isFav ? 'active' : ''}" data-action="favorite" data-name="${p.name}" title="${isFav ? 'Quitar de favoritos' : 'Marcar favorito'}">
              <i class="${isFav ? 'fas fa-star' : 'far fa-star'}"></i>
            </button>
            <div class="pm-project-info" data-action="open" data-path="${p.path}">
              <div class="pm-name-row">
                <span class="project-name">${p.name}</span>
                ${p.hasAssets ? '<span class="pm-tag-assets"><i class="fas fa-images"></i> assets</span>' : ''}
              </div>
              <div class="project-meta">
                <span><i class="far fa-clock"></i> ${formatDate(p.modified)}</span>
                <span><i class="fas fa-hard-drive"></i> ${formatSize(p.size)}</span>
              </div>
            </div>
            <div class="pm-actions-group">
              <button class="pm-btn-action pm-btn-open" data-action="open" data-path="${p.path}" title="Cargar proyecto en el editor">
                <i class="fas fa-arrow-right-to-bracket"></i> Abrir
              </button>
              <button class="pm-btn-action" data-action="duplicate" data-name="${p.name}" title="Duplicar proyecto">
                <i class="fas fa-clone"></i>
              </button>
              <button class="pm-btn-action" data-action="rename" data-name="${p.name}" title="Renombrar proyecto">
                <i class="fas fa-pencil"></i>
              </button>
              <button class="pm-btn-action pm-btn-delete" data-action="delete" data-name="${p.name}" title="Eliminar proyecto">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Delegación de eventos en la lista
      listEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const name = btn.dataset.name;
          const path = btn.dataset.path;

          if (action === 'open') {
            closeModal({ action: 'switch', path, name });
            await switchProject(path);
          } else if (action === 'favorite') {
            toggleFavorite(name);
            renderList();
          } else if (action === 'duplicate') {
            const newName = await showPromptDialog({
              title: '📋 Duplicar Proyecto',
              message: `Ingresa el nuevo nombre para la copia de "${name}":`,
              defaultValue: `${name}-copia`,
              placeholder: 'nombre-del-proyecto',
              confirmText: 'Duplicar'
            });
            if (newName && newName.trim()) {
              try {
                showToast(`Duplicando "${name}"...`);
                await duplicateProject(name, newName.trim());
                projects = await fetchProjects();
                renderList();
                showToast(`Proyecto "${newName.trim()}" duplicado con éxito.`);
              } catch (err) {
                showToast('Error al duplicar: ' + err.message, true);
              }
            }
          } else if (action === 'rename') {
            const newName = await showPromptDialog({
              title: '✏️ Renombrar Proyecto',
              message: `Nuevo nombre para "${name}":`,
              defaultValue: name,
              placeholder: 'nuevo-nombre',
              confirmText: 'Renombrar'
            });
            if (newName && newName.trim() && newName.trim() !== name) {
              try {
                showToast(`Renombrando "${name}"...`);
                await renameProject(name, newName.trim());
                projects = await fetchProjects();
                renderList();
                showToast(`Proyecto renombrado a "${newName.trim()}".`);
              } catch (err) {
                showToast('Error al renombrar: ' + err.message, true);
              }
            }
          } else if (action === 'delete') {
            const ok = await showConfirmDialog({
              title: '🗑️ Eliminar Proyecto',
              message: `¿Estás seguro de que deseas eliminar permanentemente el proyecto "${name}"? Esta acción no se puede deshacer.`,
              confirmText: 'Eliminar Proyecto',
              cancelText: 'Cancelar',
              danger: true
            });
            if (ok) {
              try {
                showToast(`Eliminando "${name}"...`);
                await deleteProject(name);
                projects = await fetchProjects();
                renderList();
                showToast(`Proyecto "${name}" eliminado.`);
              } catch (err) {
                showToast('Error al eliminar: ' + err.message, true);
              }
            }
          }
        });
      });
    };

    searchInput.addEventListener('input', renderList);

    // Botón Nuevo Proyecto
    modal.querySelector('#btn-pm-new').addEventListener('click', async () => {
      const useTemplate = await showConfirmDialog({
        title: '✨ Nuevo Proyecto',
        message: '¿Deseas seleccionar una plantilla prediseñada (Landing, Blog, Portafolio) o comenzar con un proyecto en blanco?',
        confirmText: 'Elegir Plantilla',
        cancelText: 'En Blanco'
      });

      let chosenTemplateId = null;
      if (useTemplate) {
        // Abre el selector de plantillas sin aplicarlo directamente al editor actual
        chosenTemplateId = await showTemplateSelector(editor, { applyToEditor: false });
        // Si el usuario canceló el selector de plantillas, abortar creación
        if (!chosenTemplateId) return;
      }

      const defaultName = chosenTemplateId ? `sitio-${chosenTemplateId}` : 'nuevo-proyecto';
      const projectName = await showPromptDialog({
        title: '📁 Nombrar Proyecto',
        message: `Ingresa el nombre del nuevo proyecto ${chosenTemplateId ? `(basado en ${chosenTemplateId})` : '(en blanco)'}:`,
        defaultValue: defaultName,
        placeholder: 'mi-proyecto',
        confirmText: 'Crear Proyecto'
      });

      if (projectName && projectName.trim()) {
        try {
          showToast(`Creando proyecto "${projectName.trim()}"...`);
          const created = await createProject(projectName.trim(), chosenTemplateId);
          showToast(`¡Proyecto "${created.name}" creado!`);
          closeModal({ action: 'created', ...created });
          // Conmutar automáticamente al nuevo proyecto
          await switchProject(created.path);
        } catch (err) {
          showToast('Error al crear proyecto: ' + err.message, true);
        }
      }
    });

    renderList();
  });
}

/**
 * Conecta los botones de interfaz de usuario con el gestor de proyectos
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupProjectManagerButton(editor) {
  const btnProjects = document.getElementById('btn-projects');
  const btnQuickProjects = document.getElementById('btn-quick-projects');

  const handler = async () => {
    document.dispatchEvent(new Event('drawer:close'));
    const ed = editor || getEditorInstance();
    await showProjectSelector(ed);
  };

  if (btnProjects) btnProjects.addEventListener('click', handler);
  if (btnQuickProjects) btnQuickProjects.addEventListener('click', handler);
}

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
            const ed = editor || getEditorInstance();

            if (ed) {
              ed.setComponents(bodyContent);
              if (extractedCss.trim()) {
                ed.setStyle(extractedCss);
              }
              ed.refresh();
              rebuildDockSections(ed);
              eventBus.publish(EDITOR_EVENTS.PROJECT_LOADED, {
                name: file.name,
                html: bodyContent,
                css: extractedCss
              });
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
          const ed = editor || getEditorInstance();
          if (ed) {
            ed.setComponents(h);
            ed.setStyle(c);
            ed.refresh();
            rebuildDockSections(ed);
            eventBus.publish(EDITOR_EVENTS.PROJECT_LOADED, {
              name: 'Memexicanísimos (Plantilla Oficial)',
              html: h,
              css: c
            });
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
            const ed = editor || getEditorInstance();

            if (ed) {
              ed.setComponents(bodyContent);
              if (extractedCss.trim()) {
                ed.setStyle(extractedCss);
              }
              ed.refresh();
              rebuildDockSections(ed);
              eventBus.publish(EDITOR_EVENTS.PROJECT_LOADED, {
                name: file.name,
                html: bodyContent,
                css: extractedCss
              });
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
