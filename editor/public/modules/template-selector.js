/**
 * ============================================================
 * 🎨 template-selector.js — Selector Visual de Plantillas
 * Rótulos Web / Memexicanísimos Studio v4.0
 * ============================================================
 * Presenta un catálogo modal interactivo de plantillas prediseñadas
 * y las inyecta en el canvas de GrapesJS con actualización del Dock.
 */

'use strict';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { showToast } from './toast.js';
import { rebuildDockSections } from './ui-panels.js';

const categoryIcons = {
  Negocios: '💼',
  Editorial: '📰',
  Personal: '🎨',
  Oficial: '🇲🇽',
  General: '📄'
};

/**
 * Muestra el modal del catálogo de plantillas
 * @param {object} editor - Instancia de GrapesJS
 * @returns {Promise<string|null>} ID de la plantilla cargada o null si se cancela
 */
export async function showTemplateSelector(editor, { applyToEditor = true } = {}) {
  if (typeof document === 'undefined') return null;

  try {
    const res = await fetch('/api/templates');
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error(json.message || 'Error al obtener plantillas');
    }
    const templates = json.data;

    // Remover modal previo si existiera
    const existing = document.querySelector('.template-modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'template-modal-overlay';
    modal.innerHTML = `
      <div class="template-modal-container">
        <div class="template-modal-header">
          <div>
            <h2>🎨 Galería de Plantillas</h2>
            <p>Selecciona una plantilla lista para comenzar tu diseño</p>
          </div>
          <button class="template-modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="template-cards-grid">
          ${templates.map(t => {
            const icon = categoryIcons[t.category] || '📄';
            return `
              <div class="template-card" data-template-id="${t.id}">
                <div class="template-card-preview">
                  ${t.hasPreview
                    ? `<img src="/api/templates/${t.id}/preview" alt="${t.name}" />`
                    : `<div class="template-card-icon">${icon}</div>`
                  }
                  <span class="template-category-badge">${t.category}</span>
                </div>
                <div class="template-card-body">
                  <h3>${t.name}</h3>
                  <p>${t.description || 'Diseño web responsivo optimizado.'}</p>
                  <button class="btn-select-template">Usar Plantilla</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="template-modal-footer">
          <button class="template-btn-cancel">Cancelar</button>
        </div>
      </div>
    `;

    // Inyectar estilos dedicados si no existen
    const styleId = 'template-selector-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .template-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(9, 13, 11, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
          animation: tmFadeIn 0.2s ease-out;
        }
        @keyframes tmFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .template-modal-container {
          background: #141B17;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          width: 100%;
          max-width: 960px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }
        .template-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .template-modal-header h2 {
          color: #F8F9FA;
          font-size: 1.4rem;
          margin: 0 0 4px;
        }
        .template-modal-header p {
          color: #9CA3AF;
          font-size: 0.9rem;
          margin: 0;
        }
        .template-modal-close {
          background: none;
          border: none;
          color: #9CA3AF;
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
        }
        .template-modal-close:hover {
          color: #F8F9FA;
        }
        .template-cards-grid {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          overflow-y: auto;
        }
        .template-card {
          background: #1A231F;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, border-color 0.2s;
        }
        .template-card:hover {
          transform: translateY(-4px);
          border-color: #D4AF37;
        }
        .template-card-preview {
          height: 130px;
          background: linear-gradient(135deg, #1E2923, #111714);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .template-card-icon {
          font-size: 3.5rem;
        }
        .template-category-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 104, 71, 0.7);
          border: 1px solid #006847;
          color: #55EBB2;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .template-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .template-card-body h3 {
          color: #F8F9FA;
          font-size: 1.15rem;
          margin-bottom: 6px;
        }
        .template-card-body p {
          color: #9CA3AF;
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 16px;
          flex: 1;
        }
        .btn-select-template {
          background: #006847;
          border: 1px solid #55EBB2;
          color: #F8F9FA;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-select-template:hover {
          background: #00875A;
        }
        .template-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: right;
        }
        .template-btn-cancel {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #F8F9FA;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const closeModal = (result = null) => {
        modal.remove();
        resolve(result);
      };

      modal.querySelector('.template-modal-close').addEventListener('click', () => closeModal(null));
      modal.querySelector('.template-btn-cancel').addEventListener('click', () => closeModal(null));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(null);
      });

      modal.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', async () => {
          const id = card.dataset.templateId;
          try {
            showToast(`Cargando plantilla "${id}"...`);
            const templateRes = await fetch(`/api/templates/${id}`);
            const templateJson = await templateRes.json();

            if (templateJson.success && templateJson.data) {
              const { html, css } = templateJson.data;

              if (applyToEditor && editor) {
                if (typeof editor.setComponents === 'function') {
                  editor.setComponents(html);
                } else if (typeof editor.setHtml === 'function') {
                  editor.setHtml(html);
                }
                if (css) {
                  if (typeof editor.setStyle === 'function') {
                    editor.setStyle(css);
                  } else if (typeof editor.setCss === 'function') {
                    editor.setCss(css);
                  }
                }
                rebuildDockSections(editor);
                eventBus.publish(EDITOR_EVENTS.TEMPLATE_LOADED, { templateId: id, data: templateJson.data });
                showToast(`🎉 ¡Plantilla "${id}" cargada exitosamente!`);
              }
              closeModal(id);
            } else {
              showToast('Error al cargar plantilla: ' + (templateJson.message || 'Desconocido'), true);
              closeModal(null);
            }
          } catch (err) {
            showToast('Fallo al obtener plantilla: ' + err.message, true);
            closeModal(null);
          }
        });
      });
    });
  } catch (err) {
    console.error('[TemplateSelector] Error:', err);
    showToast('Error al consultar plantillas: ' + err.message, true);
    return null;
  }
}
