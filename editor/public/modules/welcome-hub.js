/**
 * ============================================================
 * 🏠 welcome-hub.js — Pantalla de Bienvenida (Start Screen)
 * Rótulos Web / Memexicanísimos Studio v5.1
 * ============================================================
 * Comportamiento ergonómico estilo Word, Photoshop o VS Code:
 *   - Sesión actual activa con botón destacado "Continuar Editando".
 *   - Lista de otros proyectos en ~/RotulosProjects sin duplicaciones.
 *   - Botón explícito "Abrir Proyecto" y soporte para doble clic.
 *   - Creador de nuevos proyectos con catálogo de plantillas.
 *   - Persistencia de preferencia "Mostrar al iniciar" en localStorage.
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { showToast } from './toast.js';

const LS_KEY_SHOW = 'rotulos_show_welcome';

/** @returns {boolean} true si debe mostrarse el Hub al iniciar */
export function shouldShowWelcomeHub() {
  try {
    return localStorage.getItem(LS_KEY_SHOW) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Muestra el Welcome Hub modal.
 * @param {object} options
 * @param {function} [options.onProjectSelected] callback(projectPath: string)
 * @param {function} [options.onTemplateSelected] callback(templateId: string, projectName: string)
 * @param {boolean}  [options.allowClose=true] permite cerrar sin seleccionar
 */
export async function showWelcomeHub({ onProjectSelected, onTemplateSelected, allowClose = true } = {}) {
  // Eliminar instancia previa si existiera
  document.querySelector('.wh-overlay')?.remove();

  // === Obtener datos en paralelo del backend ===
  let projects = [];
  let templates = [];
  let currentProject = null;

  try {
    const [projRes, tplRes, currRes] = await Promise.all([
      fetch('/api/projects/list').then(r => r.ok ? r.json() : { success: false, data: [] }),
      fetch('/api/templates').then(r => r.ok ? r.json() : { success: false, data: [] }),
      fetch('/api/current-project').then(r => r.ok ? r.json() : { success: false, data: null })
    ]);
    projects = projRes.success && Array.isArray(projRes.data) ? projRes.data : [];
    templates = tplRes.success && Array.isArray(tplRes.data) ? tplRes.data : [];
    currentProject = currRes.success && currRes.data ? currRes.data : null;
  } catch (err) {
    console.warn('[WelcomeHub] Error al obtener datos:', err.message);
  }

  // === Deduplicar: separar sesión activa de otros proyectos ===
  const hasCurrentProject = currentProject && currentProject.hasIndex && currentProject.projectPath;
  const currentProjectPath = hasCurrentProject ? currentProject.projectPath : '';
  const currentProjectName = hasCurrentProject ? currentProjectPath.split('/').filter(Boolean).pop() : '';

  // Filtrar para que el proyecto activo NO aparezca duplicado en la lista inferior
  const otherProjects = projects.filter(p => {
    if (!hasCurrentProject) return true;
    return p.path !== currentProjectPath && p.name !== currentProjectName;
  });

  const modal = document.createElement('div');
  modal.className = 'wh-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Pantalla de Bienvenida — Rótulos Web');

  const templateCards = [
    // "Lienzo en blanco" siempre primero
    { id: '', name: 'Lienzo en Blanco', description: 'Empieza desde cero con un canvas vacío y total libertad creativa.', emoji: '✨', category: 'Básico' },
    ...templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || 'Plantilla prediseñada lista para personalizar.',
      emoji: t.id === 'memexicanisimos' ? '🇲🇽' : t.category === 'Negocios' ? '💼' : t.category === 'Editorial' ? '📰' : t.category === 'Personal' ? '🎨' : '📄',
      category: t.category || 'General'
    }))
  ];

  modal.innerHTML = `
    <div class="wh-container">

      <!-- ENCABEZADO -->
      <div class="wh-header">
        <div class="wh-brand">
          <span class="wh-logo">🎨</span>
          <div>
            <h1 class="wh-title">Rótulos Web <span class="wh-badge">v5.1</span></h1>
            <p class="wh-subtitle">Editor Visual Soberano · Estudio Memexicanísimos</p>
          </div>
        </div>
        ${allowClose ? `<button type="button" class="wh-close" id="wh-close" aria-label="Cerrar y continuar con el proyecto actual">✕</button>` : ''}
      </div>

      <!-- CUERPO DIVIDIDO -->
      <div class="wh-body">

        <!-- COLUMNA IZQUIERDA: PROYECTOS -->
        <div class="wh-left">
          <h2 class="wh-col-title">📁 Mis Proyectos</h2>
          <p class="wh-col-subtitle">Proyectos guardados en <code>~/RotulosProjects</code></p>

          ${hasCurrentProject ? `
          <div class="wh-active-session">
            <div class="wh-session-tag">
              <span class="wh-pulse-dot"></span> SESIÓN EN CURSO
            </div>
            <div class="wh-active-card">
              <div class="wh-active-info">
                <span class="wh-active-icon">🇲🇽</span>
                <div class="wh-active-text">
                  <span class="wh-active-name">${escHtml(currentProjectName)}</span>
                  <span class="wh-active-meta">Proyecto activo en edición</span>
                </div>
              </div>
              <button type="button" class="wh-btn-continue" id="wh-btn-continue">
                ▶ Continuar Editando
              </button>
            </div>
          </div>
          ` : ''}

          <div class="wh-other-section">
            <h3 class="wh-section-label">Otros Proyectos Locales:</h3>
            <div class="wh-project-list" id="wh-project-list">
              ${otherProjects.length > 0 ? otherProjects.slice(0, 8).map((p, idx) => `
                <div class="wh-project-item ${idx === 0 && !hasCurrentProject ? 'selected' : ''}" data-project-path="${escHtml(p.path)}" tabindex="0">
                  <div class="wh-proj-icon">📂</div>
                  <div class="wh-proj-info">
                    <span class="wh-proj-name">${escHtml(p.name)}</span>
                    <span class="wh-proj-meta">${p.modifiedAt ? new Date(p.modifiedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                  </div>
                  <button type="button" class="wh-btn-item-open wh-open-project" data-project-path="${escHtml(p.path)}" title="Abrir ${escHtml(p.name)}">
                    Abrir →
                  </button>
                </div>
              `).join('') : `
                <div class="wh-empty-state">
                  <p>📭 No hay otros proyectos guardados aún.</p>
                  <p>Crea uno nuevo a la derecha.</p>
                </div>
              `}
            </div>

            ${otherProjects.length > 0 ? `
            <button type="button" class="wh-btn-open-selected" id="wh-btn-open-selected" disabled>
              📂 Abrir Proyecto Seleccionado
            </button>
            ` : ''}
          </div>
        </div>

        <!-- COLUMNA DERECHA: CREAR PROYECTO -->
        <div class="wh-right">
          <h2 class="wh-col-title">🚀 Crear Nuevo Proyecto</h2>
          <p class="wh-col-subtitle">Elige una plantilla y dale un nombre</p>

          <input
            type="text"
            id="wh-project-name"
            class="wh-input"
            placeholder="Nombre del proyecto (ej: mi-tienda-online)"
            maxlength="60"
            autocomplete="off"
          />

          <div class="wh-templates-grid" id="wh-templates-grid">
            ${templateCards.map(t => `
              <button type="button" class="wh-tpl-card" data-template-id="${escHtml(t.id)}" title="${escHtml(t.description)}">
                <div class="wh-tpl-emoji">${t.emoji}</div>
                <div class="wh-tpl-name">${escHtml(t.name)}</div>
                <div class="wh-tpl-cat">${escHtml(t.category)}</div>
              </button>
            `).join('')}
          </div>

          <button type="button" class="wh-btn-create" id="wh-btn-create" disabled>
            ✦ Crear y Diseñar
          </button>
          <p class="wh-create-hint" id="wh-create-hint">Selecciona una plantilla y escribe un nombre para activar</p>
        </div>
      </div>

      <!-- PIE -->
      <div class="wh-footer">
        <label class="wh-checkbox-label">
          <input type="checkbox" id="wh-show-on-start" ${shouldShowWelcomeHub() ? 'checked' : ''} />
          Mostrar esta pantalla al iniciar el editor
        </label>
        ${allowClose ? `<button type="button" class="wh-btn-skip" id="wh-btn-skip">Saltar → entrar al editor</button>` : ''}
      </div>
    </div>
  `;

  // === Inyectar estilos dedicados ===
  injectStyles();
  document.body.appendChild(modal);

  // === 1. LÓGICA DE SELECCIÓN Y APERTURA DE PROYECTOS (COLUMNA IZQUIERDA) ===
  let selectedProjectPath = null;
  const btnOpenSelected = modal.querySelector('#wh-btn-open-selected');
  const projectItems = modal.querySelectorAll('.wh-project-item');

  function selectProjectItem(item) {
    projectItems.forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    selectedProjectPath = item.dataset.projectPath;
    if (btnOpenSelected) {
      btnOpenSelected.disabled = false;
      const projName = item.querySelector('.wh-proj-name')?.textContent || 'proyecto';
      btnOpenSelected.textContent = `📂 Abrir "${projName}"`;
    }
  }

  // Click y doble click en items de la lista
  projectItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Si hizo clic en el botón "Abrir →" directo, abrir de inmediato
      if (e.target.closest('.wh-btn-item-open, .wh-open-project')) {
        const p = item.dataset.projectPath;
        if (p) executeOpenProject(p);
        return;
      }
      selectProjectItem(item);
    });

    item.addEventListener('dblclick', () => {
      const p = item.dataset.projectPath;
      if (p) executeOpenProject(p);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const p = item.dataset.projectPath;
        if (p) executeOpenProject(p);
      }
    });
  });

  // Botón principal de abrir proyecto seleccionado
  btnOpenSelected?.addEventListener('click', () => {
    if (selectedProjectPath) {
      executeOpenProject(selectedProjectPath);
    }
  });

  // Botón Continuar Sesión Actual: solo cierra el Hub y enfoca el lienzo
  const btnContinue = modal.querySelector('#wh-btn-continue');
  btnContinue?.addEventListener('click', () => {
    modal.remove();
  });

  function executeOpenProject(p) {
    modal.remove();
    if (onProjectSelected) {
      onProjectSelected(p);
    } else {
      switchAndReload(p);
    }
  }

  // === 2. LÓGICA DE CREACIÓN CON PLANTILLAS (COLUMNA DERECHA) ===
  let selectedTemplateId = null;
  const nameInput = modal.querySelector('#wh-project-name');
  const btnCreate = modal.querySelector('#wh-btn-create');
  const createHint = modal.querySelector('#wh-create-hint');

  // Selección de tarjeta de plantilla
  modal.querySelectorAll('.wh-tpl-card').forEach(card => {
    card.addEventListener('click', () => {
      modal.querySelectorAll('.wh-tpl-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTemplateId = card.dataset.templateId;
      updateCreateButton();
    });
  });

  function updateCreateButton() {
    const name = nameInput.value.trim();
    const ready = name.length >= 2 && selectedTemplateId !== null;
    btnCreate.disabled = !ready;
    if (ready) {
      createHint.textContent = `Crear "${name}" con plantilla "${getTemplateName(selectedTemplateId)}"`;
    } else if (!name) {
      createHint.textContent = 'Escribe un nombre para tu proyecto';
    } else if (selectedTemplateId === null) {
      createHint.textContent = 'Selecciona una plantilla para continuar';
    }
  }

  nameInput.addEventListener('input', updateCreateButton);

  btnCreate.addEventListener('click', async () => {
    const name = sanitizeName(nameInput.value.trim());
    if (!name || selectedTemplateId === null) return;

    btnCreate.disabled = true;
    btnCreate.textContent = '⏳ Creando proyecto...';

    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, templateId: selectedTemplateId || null })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al crear el proyecto');

      modal.remove();
      if (onTemplateSelected) {
        onTemplateSelected(selectedTemplateId, json.data?.path || name);
      } else {
        await switchAndReload(json.data?.path);
      }
    } catch (err) {
      showToast('Error al crear proyecto: ' + err.message, true);
      btnCreate.disabled = false;
      btnCreate.textContent = '✦ Crear y Diseñar';
    }
  });

  // === 3. CONTROLES GENERALES (CHECKBOX, ESCAPE, SALTAR) ===
  const showCheckbox = modal.querySelector('#wh-show-on-start');
  showCheckbox?.addEventListener('change', () => {
    try { localStorage.setItem(LS_KEY_SHOW, showCheckbox.checked ? 'true' : 'false'); } catch {}
  });

  const closeBtn = modal.querySelector('#wh-close');
  closeBtn?.addEventListener('click', () => modal.remove());
  const skipBtn = modal.querySelector('#wh-btn-skip');
  skipBtn?.addEventListener('click', () => modal.remove());

  const onEsc = (e) => {
    if (e.key === 'Escape' && allowClose) {
      modal.remove();
      document.removeEventListener('keydown', onEsc);
    }
  };
  document.addEventListener('keydown', onEsc);

  // Focus inicial en el campo de texto o en el botón continuar
  if (hasCurrentProject) {
    btnContinue?.focus();
  } else {
    nameInput?.focus();
  }
}

// ── Helpers ─────────────────────────────────────────────────

function escHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-_.\s]/g, '').replace(/\s+/g, '-').slice(0, 60).toLowerCase();
}

function getTemplateName(id) {
  if (!id) return 'Lienzo en Blanco';
  const names = { memexicanisimos: 'Memexicanísimos', landing: 'Landing Page', blog: 'Blog Editorial', portfolio: 'Portafolio' };
  return names[id] || id;
}

async function switchAndReload(projectPath) {
  try {
    const res = await fetch('/api/switch-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newProjectPath: projectPath })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'No se pudo cambiar de proyecto');
    
    // Limpiar estado de sesión previa
    try {
      localStorage.removeItem('rotulos_active_imported_html');
      localStorage.removeItem('rotulos_active_imported_css');
      localStorage.removeItem('rotulos_active_imported_name');
    } catch {}

    eventBus.publish(EDITOR_EVENTS.PROJECT_LOADED, { projectPath });
    showToast(`📂 Abriendo proyecto: ${projectPath.split('/').filter(Boolean).pop()}`);
    setTimeout(() => window.location.reload(), 600);
  } catch (err) {
    showToast('Error al cambiar de proyecto: ' + err.message, true);
  }
}

// ── Inyección de estilos del Welcome Hub ────────────────────

function injectStyles() {
  const styleId = 'wh-styles';
  const existing = document.getElementById(styleId);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* ── Welcome Hub Overlay ── */
    .wh-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 7, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      padding: 16px;
      animation: whFadeIn 0.22s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes whFadeIn {
      from { opacity: 0; transform: scale(0.97) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Container ── */
    .wh-container {
      background: linear-gradient(160deg, #141b17 0%, #0d1410 100%);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 20px;
      width: 100%;
      max-width: 1020px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset;
      overflow: hidden;
    }

    /* ── Header ── */
    .wh-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      background: rgba(212,175,55,0.05);
      flex-shrink: 0;
    }
    .wh-brand { display: flex; align-items: center; gap: 14px; }
    .wh-logo { font-size: 2.2rem; line-height: 1; }
    .wh-title {
      margin: 0; font-size: 1.4rem; font-weight: 700;
      color: #fff; font-family: 'Space Grotesk', sans-serif;
      display: flex; align-items: center; gap: 8px;
    }
    .wh-badge {
      background: rgba(212,175,55,0.15);
      color: #d4af37;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      border: 1px solid rgba(212,175,55,0.3);
    }
    .wh-subtitle { margin: 2px 0 0; font-size: 0.78rem; color: #7a8d83; }
    .wh-close {
      background: none; border: 1px solid rgba(255,255,255,0.12);
      color: #7a8d83; cursor: pointer; border-radius: 50%;
      width: 32px; height: 32px; font-size: 1rem; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .wh-close:hover { background: rgba(255,80,80,0.15); color: #ff7070; border-color: rgba(255,80,80,0.3); }

    /* ── Body ── */
    .wh-body {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 0;
      overflow: hidden;
      flex: 1;
    }

    /* ── Columna Izquierda (Proyectos) ── */
    .wh-left {
      padding: 24px 22px;
      border-right: 1px solid rgba(255,255,255,0.06);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(212,175,55,0.2) transparent;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .wh-col-title {
      margin: 0; font-size: 1.05rem; font-weight: 700;
      color: #e8ede9; font-family: 'Space Grotesk', sans-serif;
    }
    .wh-col-subtitle { margin: 0; font-size: 0.75rem; color: #5e7367; }
    .wh-col-subtitle code { background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 4px; font-size: 0.7rem; }

    /* Sesión Actual Destacada */
    .wh-active-session {
      background: rgba(212,175,55,0.08);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .wh-session-tag {
      font-size: 0.65rem; font-weight: 700; color: #d4af37;
      letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;
    }
    .wh-pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981; box-shadow: 0 0 8px #10b981;
      animation: whPulse 1.8s infinite;
    }
    @keyframes whPulse {
      0%, 100% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    .wh-active-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .wh-active-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .wh-active-icon { font-size: 1.5rem; line-height: 1; flex-shrink: 0; }
    .wh-active-text { min-width: 0; }
    .wh-active-name { display: block; font-size: 0.95rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wh-active-meta { display: block; font-size: 0.7rem; color: #8aa192; }

    .wh-btn-continue {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none; color: #fff; padding: 8px 14px;
      border-radius: 8px; font-size: 0.8rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    }
    .wh-btn-continue:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.45); }

    /* Otros Proyectos */
    .wh-other-section { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .wh-section-label { margin: 0; font-size: 0.78rem; font-weight: 600; color: #8aa192; }
    .wh-project-list { display: flex; flex-direction: column; gap: 6px; flex: 1; }

    .wh-project-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px; cursor: pointer;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      transition: all 0.18s; outline: none;
    }
    .wh-project-item:hover { background: rgba(212,175,55,0.08); border-color: rgba(212,175,55,0.25); }
    .wh-project-item.selected {
      background: rgba(212,175,55,0.12);
      border-color: #d4af37;
      box-shadow: 0 0 0 2px rgba(212,175,55,0.2);
    }
    .wh-proj-icon { font-size: 1.1rem; flex-shrink: 0; }
    .wh-proj-info { flex: 1; min-width: 0; }
    .wh-proj-name { display: block; font-size: 0.85rem; font-weight: 600; color: #ccdbd2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wh-proj-meta { display: block; font-size: 0.68rem; color: #5e7367; }

    .wh-btn-item-open {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: #ccdbd2; border-radius: 6px; padding: 4px 9px;
      font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
      flex-shrink: 0;
    }
    .wh-btn-item-open:hover {
      background: #d4af37; border-color: #d4af37; color: #0d1410;
    }

    .wh-btn-open-selected {
      width: 100%; padding: 10px; border-radius: 10px; cursor: pointer;
      background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.35);
      color: #d4af37; font-size: 0.85rem; font-weight: 700;
      transition: all 0.2s; font-family: 'Space Grotesk', sans-serif;
    }
    .wh-btn-open-selected:not(:disabled):hover {
      background: #d4af37; color: #0d1410;
    }
    .wh-btn-open-selected:disabled { opacity: 0.35; cursor: not-allowed; border-color: rgba(255,255,255,0.08); color: #5e7367; }

    .wh-empty-state {
      text-align: center; padding: 24px 12px;
      color: #5e7367; font-size: 0.8rem; line-height: 1.5;
    }

    /* ── Columna Derecha (Crear Proyecto) ── */
    .wh-right {
      padding: 24px 24px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(212,175,55,0.2) transparent;
      display: flex;
      flex-direction: column;
    }
    .wh-input {
      width: 100%; padding: 10px 14px; border-radius: 10px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      color: #d6e0d8; font-size: 0.9rem; font-family: inherit;
      outline: none; transition: border-color 0.2s; margin-top: 14px; margin-bottom: 14px; box-sizing: border-box;
    }
    .wh-input:focus { border-color: rgba(212,175,55,0.45); background: rgba(212,175,55,0.04); }
    .wh-input::placeholder { color: #4a5e52; }

    .wh-templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    .wh-tpl-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 8px; border-radius: 12px; cursor: pointer;
      background: rgba(255,255,255,0.03); border: 2px solid transparent;
      transition: all 0.18s; text-align: center; color: inherit;
    }
    .wh-tpl-card:hover { background: rgba(212,175,55,0.06); border-color: rgba(212,175,55,0.2); transform: translateY(-2px); }
    .wh-tpl-card.selected { background: rgba(212,175,55,0.12); border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
    .wh-tpl-emoji { font-size: 1.8rem; line-height: 1; }
    .wh-tpl-name { font-size: 0.78rem; font-weight: 700; color: #ccdbd2; }
    .wh-tpl-cat { font-size: 0.65rem; color: #5e7367; }

    .wh-btn-create {
      width: 100%; padding: 12px 20px; border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #d4af37, #c49b27);
      border: none; color: #0d1410; font-size: 0.9rem; font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      transition: all 0.2s; margin-bottom: 8px;
    }
    .wh-btn-create:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,175,55,0.3); }
    .wh-btn-create:disabled { opacity: 0.35; cursor: not-allowed; }
    .wh-create-hint { font-size: 0.72rem; color: #5e7367; text-align: center; margin: 0; }

    /* ── Footer ── */
    .wh-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(0,0,0,0.18);
      flex-shrink: 0; gap: 12px;
    }
    .wh-checkbox-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.75rem; color: #5e7367; cursor: pointer; user-select: none;
    }
    .wh-checkbox-label input[type="checkbox"] { accent-color: #d4af37; cursor: pointer; }
    .wh-btn-skip {
      background: none; border: 1px solid rgba(255,255,255,0.1);
      color: #7a8d83; cursor: pointer; border-radius: 8px;
      padding: 6px 14px; font-size: 0.75rem; transition: all 0.2s;
      white-space: nowrap;
    }
    .wh-btn-skip:hover { color: #ccdbd2; border-color: rgba(255,255,255,0.25); }

    /* ── Responsive ── */
    @media (max-width: 680px) {
      .wh-body { grid-template-columns: 1fr; }
      .wh-left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); max-height: 260px; }
      .wh-templates-grid { grid-template-columns: repeat(3, 1fr); }
      .wh-footer { flex-direction: column; align-items: flex-start; }
    }
  `;
  document.head.appendChild(style);
}
