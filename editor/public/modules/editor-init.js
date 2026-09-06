/**
 * ============================================================
 * ⚙️ editor-init.js — Inicialización GrapesJS + Orquestación
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

import { talachaColorPlugin } from './color-plugin.js';
import { registerBlocks } from './blocks.js';
import {
  setupDock, setupDrawer, setupTabs, setupTreeToggle,
  setupSidebarResizer, setupDeviceSelector,
  setupMobileSidebar, setupPreviewButton, setupHistoryButtons,
  setupThemeSelector, setupShutdownButton, setupDiagnosticsModal, switchPagePanel,
  setupDocsModule, rebuildDockSections, setupTemplateButton
} from './ui-panels.js';
import {
  setupSaveButton, setupSaveShortcut, setupPublishButton,
  setupCodeInspector, setupStatsModal, setupScreenshotModal,
  setupZipExport
} from './save-publish.js';
import { loadRecentProjects, setupProjectSelector, setupProjectManagerButton } from './project-manager.js';
import { setupLangSelector } from './i18n.js';
import { showToast } from './toast.js';
import { getErrorMessage } from './error-messages.js';

import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { setupVirtualLayers } from './layers-virtual.js';
import { debounce } from './debounce.js';
import { initHistory } from './history.js';

/** Instancia interna del editor */
let editorInstance = null;

/**
 * Obtiene la instancia activa de GrapesJS sin depender de window.editor global.
 * @returns {any}
 */
export function getEditorInstance() {
  return editorInstance;
}

/**
 * Establece la instancia activa y sincroniza __editor para depuración.
 * @param {any} inst
 */
export function setEditorInstance(inst) {
  editorInstance = inst;
  if (typeof window !== 'undefined') {
    window.__editor = inst;
    window.editor = inst; // Compatibilidad transitoria
  }
}

/**
 * Inicializa el editor visual GrapesJS y todos sus módulos.
 */
export async function initEditor() {
  try {
    // ── 1. Cargar HTML/CSS del proyecto ──────────────────
    let html = '';
    let css = '';
    window.isStaticMode = false;

    // Verificar si hay parámetro ?project= en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryProjectPath = urlParams.get('project');

    // Si viene ?project= explícito en la URL, limpiar localStorage previo para priorizar el proyecto
    if (queryProjectPath) {
      try {
        localStorage.removeItem('rotulos_active_imported_html');
        localStorage.removeItem('rotulos_active_imported_css');
        localStorage.removeItem('rotulos_active_imported_name');
      } catch {}
    }

    // Verificar si hay un archivo importado previamente persistido en localStorage
    const savedImportedHtml = localStorage.getItem('rotulos_active_imported_html');
    const savedImportedCss = localStorage.getItem('rotulos_active_imported_css');
    const savedImportedName = localStorage.getItem('rotulos_active_imported_name');

    if (savedImportedHtml) {
      html = savedImportedHtml;
      css = savedImportedCss || '';
    } else {
      try {
        const pageEndpoint = queryProjectPath
          ? `/api/page?project=${encodeURIComponent(queryProjectPath)}`
          : '/api/page';
        const res = await fetch(pageEndpoint);
        if (res.ok) {
          const pageResponse = await res.json();
          if (pageResponse.success && pageResponse.data) {
            html = pageResponse.data.html;
            css = pageResponse.data.css;
          } else {
            throw new Error(getErrorMessage(pageResponse.error_code, pageResponse.message || 'Error en respuesta /api/page'));
          }
        } else {
          throw new Error('Servidor sin endpoint /api/page');
        }
      } catch (errPage) {
        console.log('ℹ️ Modo Web Estático / GitHub Pages detectado:', errPage.message);
        window.isStaticMode = true;
        try {
          const [tHtmlRes, tCssRes] = await Promise.all([
            fetch('./templates/memexicanisimos/index.html'),
            fetch('./templates/memexicanisimos/style.css')
          ]);
          if (tHtmlRes.ok && tCssRes.ok) {
            html = await tHtmlRes.text();
            css = await tCssRes.text();
          } else {
            throw new Error('No se pudo obtener plantilla');
          }
        } catch (eTemplate) {
          console.warn('Fallback a plantilla mínima:', eTemplate);
          html = '<div style="padding:40px; text-align:center; color:#fff; font-family:sans-serif;"><h1>🇲🇽 ¡Bienvenido a Rótulos Web!</h1><p>Arrastra bloques desde el panel derecho para maquetar.</p></div>';
          css = 'body { background: #0A0F0D; color: #F8F9FA; }';
        }
      }
    }

    // ── 2. Cargar galería de imágenes ────────────────────
    let localAssets = [];
    try {
      const assetsRes = await fetch('/api/assets');
      if (assetsRes.ok) {
        const assetsResponse = await assetsRes.json();
        if (assetsResponse.success && assetsResponse.data && assetsResponse.data.assets) {
          localAssets = assetsResponse.data.assets;
        }
      }
    } catch {
      localAssets = [
        { src: 'assets/Logo.png', name: 'Logo Memexicanisimos' },
        { src: 'assets/Avatar.jpg', name: 'Avatar Creador' },
        { src: 'assets/news/reportero_zocalo.jpg', name: 'Reportero Zócalo' },
        { src: 'assets/news/reportero_taqueria.jpg', name: 'Reportero Taquería' },
        { src: 'assets/news/reportero_mercado.jpg', name: 'Reportero Mercado 23' },
        { src: 'assets/news/reportero_plaza.jpg', name: 'Reportero Plaza' }
      ];
    }

    // ── 3. Inicializar GrapesJS ──────────────────────────
    editor = grapesjs.init({
      container: '#gjs-container',
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      panels: { defaults: [] },
      undoManager: { trackSelection: false, maxSteps: 15 },
      plugins: ['gjs-blocks-basic', talachaColorPlugin],
      pluginsOpts: {
        'gjs-blocks-basic': {
          category: { id: 'basicos', label: 'Estructura & Básicos', open: true },
          flexGrid: true,
          labelColumn1: '1 Columna', labelColumn2: '2 Columnas', labelColumn3: '3 Columnas',
          labelColumn37: '2 Cols (30/70)', labelText: 'Texto', labelLink: 'Enlace',
          labelImage: 'Imagen', labelVideo: 'Video', labelMap: 'Mapa'
        }
      },
      blockManager: { appendTo: '#blocks-container' },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: '📐 Dimensiones & Espaciado', open: true,
            buildProps: ['width', 'min-width', 'max-width', 'height', 'margin', 'padding'],
            properties: [
              { name: 'Ancho', property: 'width' }, { name: 'Alto', property: 'height' },
              { name: 'Margen', property: 'margin' }, { name: 'Relleno', property: 'padding' }
            ]
          },
          {
            name: '✍️ Tipografía', open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align'],
            properties: [
              { name: 'Fuente', property: 'font-family' }, { name: 'Tamaño', property: 'font-size' },
              { name: 'Grosor', property: 'font-weight' },
              { name: 'Color Texto', property: 'color', type: 'color', defaults: '' },
              { name: 'Alineación', property: 'text-align' }, { name: 'Interlineado', property: 'line-height' }
            ]
          },
          {
            name: '🎨 Fondo & Decoración', open: false,
            buildProps: ['background-color', 'background-image', 'border-radius', 'border', 'box-shadow', 'opacity'],
            properties: [
              { name: 'Color Fondo', property: 'background-color', type: 'color', defaults: '' },
              { name: 'Imagen Fondo', property: 'background-image' },
              { name: 'Borde Redondo', property: 'border-radius' },
              { name: 'Borde', property: 'border' }, { name: 'Sombra', property: 'box-shadow' },
              { name: 'Opacidad', property: 'opacity' }
            ]
          },
          {
            name: '🔲 Disposición & Flexbox', open: false,
            buildProps: ['display', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'gap'],
            properties: [
              { name: 'Tipo Display', property: 'display' },
              { name: 'Dirección Flex', property: 'flex-direction' },
              { name: 'Alinear Horizontal', property: 'justify-content' },
              { name: 'Alinear Vertical', property: 'align-items' },
              { name: 'Separación (Gap)', property: 'gap' }
            ]
          }
        ]
      },
      layerManager: { appendTo: '#layers-container' },
      traitManager: { appendTo: '#traits-container' },
      assetManager: { assets: localAssets, upload: false, openAssetsOnDrop: true },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
          { id: 'mobile', name: 'Mobile', width: '390px', widthMedia: '480px' }
        ]
      },
      canvas: {
        styles: [
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
          '/fonts/fonts.css',
          'data:text/css;charset=utf-8,' + encodeURIComponent('html, body { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }')
        ]
      }
    });
    setEditorInstance(editor);

    // ── Publicar eventos de GrapesJS en EventBus (Arquitectura Desacoplada) ──
    editor.on('load', () => {
      eventBus.publish(EDITOR_EVENTS.EDITOR_READY, { editor });
    });
    // Debounce a eventos de alta frecuencia para no saturar el EventBus ni la serialización DOM
    const debouncedPublishContent = debounce(() => {
      try {
        eventBus.publish(EDITOR_EVENTS.CONTENT_CHANGED, {
          html: editor.getHtml(),
          css: editor.getCss()
        });
      } catch (err) {
        console.warn('[EventBus] Error al serializar contenido:', err);
      }
    }, 300);

    editor.on('change:changesCount', debouncedPublishContent);
    editor.on('style:update', debouncedPublishContent);
    editor.on('component:update', debouncedPublishContent);
    editor.on('component:selected', (component) => {
      eventBus.publish(EDITOR_EVENTS.COMPONENT_SELECTED, {
        componentId: component && component.getId ? component.getId() : '',
        tagName: component && component.get ? component.get('tagName') : '',
        component
      });
    });
    editor.on('component:deselected', () => {
      eventBus.publish(EDITOR_EVENTS.COMPONENT_DESELECTED);
    });
    editor.on('component:add', (component) => {
      eventBus.publish(EDITOR_EVENTS.COMPONENT_ADDED, { component });
    });
    editor.on('component:remove', (component) => {
      eventBus.publish(EDITOR_EVENTS.COMPONENT_REMOVED, { component });
    });

    // ── 4. Registrar bloques ──────────────────────────────
    registerBlocks(editor);

    // ── 5. Cargar contenido en el lienzo ─────────────────
    editor.setComponents(html);
    if (css) editor.setStyle(css);

    // ── 6. Configurar módulos de UI ───────────────────────
    setupDock(editor);
    setupDrawer();
    setupTemplateButton(editor);
    setupTabs(editor);
    setupTreeToggle();
    setupVirtualLayers(editor);
    setupSidebarResizer();
    setupDeviceSelector(editor);
    setupMobileSidebar(editor);
    setupPreviewButton(editor);
    setupHistoryButtons(editor);
    setupThemeSelector();
    setupShutdownButton();
    setupDiagnosticsModal(editor);
    setupDocsModule();

    // ── 7. Configurar guardar / publicar ──────────────────
    setupSaveButton(editor);
    setupSaveShortcut(editor);
    setupPublishButton();
    setupCodeInspector(editor);
    setupStatsModal(editor);
    setupScreenshotModal(editor);
    setupZipExport(editor);

    // ── 8. Idioma ─────────────────────────────────────────
    setupLangSelector();

    // ── 9. Proyectos ──────────────────────────────────────
    setupProjectSelector(editor);
    setupProjectManagerButton(editor);
    await loadRecentProjects();
    if (savedImportedName) {
      const activeNameEl = document.getElementById('active-project-name');
      if (activeNameEl) activeNameEl.textContent = savedImportedName;
    }

    // Inicializar historial de versiones persistente
    initHistory(editor, savedImportedName || queryProjectPath || 'default');

    // ── 10. Canvas load: fixes de scroll y sección activa ─
    editor.on('load', () => {
      // Reconstruir dock izquierdo para coincidir con la página cargada
      rebuildDockSections(editor);

      const iframeDoc = editor.Canvas.getDocument();
      if (!iframeDoc) return;

      // Inyectar fuentes externas y estilos del <head> original en el iframe del canvas
      try {
        const rawDoc = (new DOMParser()).parseFromString(html, 'text/html');
        if (rawDoc && rawDoc.head) {
          rawDoc.head.querySelectorAll('link[rel*="stylesheet"], link[href*="fonts"], style').forEach(el => {
            if (el.tagName.toLowerCase() === 'link') {
              const linkClone = iframeDoc.createElement('link');
              Array.from(el.attributes).forEach(attr => linkClone.setAttribute(attr.name, attr.value));
              iframeDoc.head.appendChild(linkClone);
            } else if (el.tagName.toLowerCase() === 'style') {
              const styleClone = iframeDoc.createElement('style');
              styleClone.innerHTML = el.innerHTML;
              iframeDoc.head.appendChild(styleClone);
            }
          });
        }
      } catch (headErr) {
        console.warn('No se pudieron inyectar etiquetas del head:', headErr);
      }

      const fixStyle = iframeDoc.createElement('style');
      fixStyle.id = 'gjs-canvas-scroll-fixes';
      fixStyle.innerHTML = `
        html { overflow-y: auto !important; height: auto !important; }
        body { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
        body.editor-show-all .product-section {
          display: block !important; opacity: 1 !important;
          margin-bottom: 50px !important;
          border: 1px dashed rgba(212, 175, 55, 0.4) !important;
          border-radius: 16px; padding: 16px;
        }
      `;
      iframeDoc.head.appendChild(fixStyle);

      // En modo edición, los enlaces no deben navegar
      iframeDoc.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) e.preventDefault();
      }, true);

      // Restaurar última sección activa si es plantilla oficial
      const savedSection = localStorage.getItem('editor_active_section');
      const validPanels = ['noticias-news', 'perfiles', 'redes-sociales', 'nosotros-apoyo', 'creador-contacto'];
      if (savedSection && (validPanels.includes(savedSection) || savedSection === 'all')) {
        switchPagePanel(savedSection, editor);
      }
    });

  } catch (err) {
    console.error('Error al inicializar editor:', err);
    showToast('Error cargando la web: ' + err.message, true);
  }
}
