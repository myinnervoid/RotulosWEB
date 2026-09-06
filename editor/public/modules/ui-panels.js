/**
 * ============================================================
 * 🖥️ ui-panels.js — Dock, Drawer, Tabs, Breadcrumbs, Sidebar
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

import { showToast } from './toast.js';
import { t } from './i18n.js';
import { showConfirmDialog } from './dialog.js';
import { workerManager } from './worker-manager.js';
import { eventBus } from './event-bus.js';
import { EDITOR_EVENTS } from './editor-events.js';
import { showTemplateSelector } from './template-selector.js';
import { showWelcomeHub } from './welcome-hub.js';

const panelIds = ['noticias-news', 'perfiles', 'redes-sociales', 'nosotros-apoyo', 'creador-contacto'];

// ── REFERENCIA GLOBAL AL EDITOR (inyectada desde editor-init) ──
let _editor = null;
let _switchTab = null; // referencia lazy a switchTab (necesaria para focusTextTrait)

// ── DOCK IZQUIERDO ──────────────────────────────────────────

/**
 * Reconstruye dinámicamente los botones del dock izquierdo según las secciones
 * reales presentes en el documento activo (GrapesJS).
 * Si la página es externa (sin .product-section), extrae los <header>, <section>,
 * <main>, <article>, <footer> o contenedores con id/heading.
 * @param {object} editor - Instancia de GrapesJS
 */
export function rebuildDockSections(editor) {
  const ed = editor || _editor;
  if (!ed) return;
  const leftDock = document.getElementById('left-dock');
  if (!leftDock) return;
  const itemsWrapper = leftDock.querySelector('.dock-items-wrapper');
  if (!itemsWrapper) return;

  const iframeDoc = ed.Canvas ? ed.Canvas.getDocument() : null;
  const targetDoc = iframeDoc || (new DOMParser()).parseFromString(ed.getHtml ? ed.getHtml() : '', 'text/html');
  if (!targetDoc || !targetDoc.body) return;

  const officialSections = targetDoc.querySelectorAll('.product-section');

  if (officialSections.length > 0) {
    // Plantilla oficial de Memexicanísimos
    itemsWrapper.innerHTML = `
      <button class="dock-btn active" data-section="noticias-news" title="Noticias & Humor (#noticias-news)">
        <span class="dock-btn-icon">📰</span>
        <span class="dock-btn-text" data-i18n="dock_noticias">Noticias & Humor</span>
      </button>
      <button class="dock-btn" data-section="perfiles" title="Suite de Apps .io (#perfiles)">
        <span class="dock-btn-icon">🛠️</span>
        <span class="dock-btn-text" data-i18n="dock_apps">Suite de Apps</span>
      </button>
      <button class="dock-btn" data-section="redes-sociales" title="Redes & Live (#redes-sociales)">
        <span class="dock-btn-icon">📱</span>
        <span class="dock-btn-text" data-i18n="dock_redes">Redes & Live</span>
      </button>
      <button class="dock-btn" data-section="nosotros-apoyo" title="Nosotros & Filosofía (#nosotros-apoyo)">
        <span class="dock-btn-icon">🤝</span>
        <span class="dock-btn-text" data-i18n="dock_nosotros">Nosotros & Filosofía</span>
      </button>
      <button class="dock-btn" data-section="creador-contacto" title="Creador & Contacto (#creador-contacto)">
        <span class="dock-btn-icon">🤠</span>
        <span class="dock-btn-text" data-i18n="dock_creador">Creador & Contacto</span>
      </button>
      <div class="dock-separator"></div>
      <button class="dock-btn dock-btn-all" data-section="all" title="Ver Todo el Sitio (Modo Edición Continua)">
        <span class="dock-btn-icon">👁️</span>
        <span class="dock-btn-text" data-i18n="dock_all">Ver Todo</span>
      </button>
    `;
  } else {
    // Página externa o importada (ej: Memexicanisimos Files)
    const genericElements = Array.from(targetDoc.body.querySelectorAll('header, nav, section, main, article, footer, [id]'))
      .filter(el => {
        const tag = el.tagName.toLowerCase();
        const id = el.id || '';
        // Evitar elementos minúsculos o sin relevancia estructural
        if (['script', 'style', 'noscript', 'link'].includes(tag)) return false;
        if (['header', 'section', 'main', 'article', 'footer'].includes(tag)) return true;
        return id.length > 2 && el.children.length > 0;
      });

    // Deduplicar contenedores padre/hijo muy próximos
    const pickedElements = [];
    genericElements.forEach(el => {
      const isDescendant = pickedElements.some(p => p.contains(el));
      if (!isDescendant && pickedElements.length < 8) {
        pickedElements.push(el);
      }
    });

    const getIconForElement = (el, idx) => {
      const tag = el.tagName.toLowerCase();
      const id = (el.id || '').toLowerCase();
      if (tag === 'header' || /header|hero|banner|encabezado/.test(id)) return '🚀';
      if (tag === 'nav' || /nav|menu/.test(id)) return '🧭';
      if (tag === 'footer' || /footer|pie/.test(id)) return '⚓';
      if (/download|descarga|files|archivos/.test(id)) return '📦';
      if (/features|caracteristicas/.test(id)) return '⚡';
      if (/capturas|screenshots|galeria/.test(id)) return '📷';
      const icons = ['📄', '🧩', '🏷️', '✨', '📑', '📌'];
      return icons[idx % icons.length];
    };

    const getLabelForElement = (el, idx) => {
      const heading = el.querySelector('h1, h2, h3, h4');
      if (heading && heading.textContent.trim()) {
        const clean = heading.textContent.trim().replace(/\s+/g, ' ');
        return clean.length > 22 ? clean.slice(0, 20) + '...' : clean;
      }
      if (el.id) {
        const readable = el.id.replace(/[-_]/g, ' ');
        return readable.charAt(0).toUpperCase() + readable.slice(1);
      }
      const tag = el.tagName.toLowerCase();
      return tag.charAt(0).toUpperCase() + tag.slice(1) + ` ${idx + 1}`;
    };

    if (pickedElements.length > 0) {
      const buttonsHtml = pickedElements.map((el, idx) => {
        const secId = el.id || `generic-sec-${idx}`;
        const icon = getIconForElement(el, idx);
        const label = getLabelForElement(el, idx);
        return `
          <button class="dock-btn ${idx === 0 ? 'active' : ''}" data-section="${secId}" data-target-idx="${idx}" title="${label}">
            <span class="dock-btn-icon">${icon}</span>
            <span class="dock-btn-text">${label}</span>
          </button>
        `;
      }).join('');

      itemsWrapper.innerHTML = `
        ${buttonsHtml}
        <div class="dock-separator"></div>
        <button class="dock-btn dock-btn-all" data-section="all" title="Ver Todo el Sitio (Modo Edición Continua)">
          <span class="dock-btn-icon">👁️</span>
          <span class="dock-btn-text" data-i18n="dock_all">Ver Todo</span>
        </button>
      `;
    } else {
      itemsWrapper.innerHTML = `
        <button class="dock-btn active dock-btn-all" data-section="all" title="Ver Todo el Sitio">
          <span class="dock-btn-icon">👁️</span>
          <span class="dock-btn-text" data-i18n="dock_all">Ver Todo</span>
        </button>
      `;
    }
  }

  // Vincular eventos click a los nuevos botones
  const newDockButtons = itemsWrapper.querySelectorAll('.dock-btn');
  newDockButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchPagePanel(btn.dataset.section, ed, newDockButtons, btn.dataset.targetIdx);
    });
  });
}

/**
 * Inicializa el dock lateral izquierdo con persistencia.
 * @param {object} editor - Instancia de GrapesJS
 */
export function setupDock(editor) {
  _editor = editor;
  const leftDock = document.getElementById('left-dock');
  const btnDockToggle = document.getElementById('btn-dock-toggle');
  const dockToggleIcon = document.getElementById('dock-toggle-icon');

  if (leftDock && btnDockToggle) {
    const isExpanded = localStorage.getItem('editor_dock_expanded') === 'true';
    if (isExpanded) {
      leftDock.classList.add('expanded');
      if (dockToggleIcon) dockToggleIcon.className = 'fas fa-chevron-left';
    } else {
      leftDock.classList.remove('expanded');
      if (dockToggleIcon) dockToggleIcon.className = 'fas fa-chevron-right';
    }

    btnDockToggle.addEventListener('click', () => {
      const nowExpanded = leftDock.classList.toggle('expanded');
      if (dockToggleIcon) {
        dockToggleIcon.className = nowExpanded ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
      }
      localStorage.setItem('editor_dock_expanded', nowExpanded);
    });
  }

  rebuildDockSections(editor);
}

/**
 * Cambia la sección visible en el lienzo del editor.
 * @param {string} panelId
 * @param {object} editor
 * @param {NodeList} dockButtons
 */
export function switchPagePanel(panelId, editor, dockButtons, targetIdx = null) {
  const ed = editor || _editor;
  if (!ed) return;
  const iframeDoc = ed.Canvas ? ed.Canvas.getDocument() : null;
  if (!iframeDoc) return;
  const iframeBody = iframeDoc.body;
  const sections = iframeDoc.querySelectorAll('.product-section');
  const tabButtons = iframeDoc.querySelectorAll('.tab-button');
  const btns = dockButtons || document.querySelectorAll('.dock-btn');

  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === panelId);
  });

  // Si la página cargada no usa la estructura de plantilla de Memexicanísimos
  if (sections.length === 0) {
    iframeBody.classList.add('editor-show-all');
    if (panelId === 'all') {
      localStorage.setItem('editor_active_section', 'all');
      showToast('Modo edición: Página completa visible.');
      return;
    }

    // Buscar por ID específico primero
    let targetEl = panelId ? iframeDoc.getElementById(panelId) : null;

    // Si no se halló por ID, usar índice de lista genérica
    if (!targetEl && targetIdx !== null && targetIdx !== undefined) {
      const genericSections = Array.from(iframeDoc.querySelectorAll('header, nav, section, main, article, footer, [id]'));
      targetEl = genericSections[parseInt(targetIdx, 10)];
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const secName = targetEl.id || targetEl.tagName.toLowerCase();
      showToast(`Navegando a sección: ${secName}`);
    } else {
      showToast('Modo edición: Página completa visible.');
    }
    localStorage.setItem('editor_active_section', panelId);
    return;
  }

  if (panelId === 'all') {
    iframeBody.classList.add('editor-show-all');
    sections.forEach(sec => {
      sec.style.display = 'block';
      sec.style.opacity = '1';
    });
    localStorage.setItem('editor_active_section', 'all');
    showToast('Modo edición continua: Todos los paneles visibles.');
  } else {
    iframeBody.classList.remove('editor-show-all');
    sections.forEach(sec => {
      if (sec.id === panelId) {
        sec.classList.add('active');
        sec.style.display = 'block';
        sec.style.opacity = '1';
        setTimeout(() => { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
      } else {
        sec.classList.remove('active');
        sec.style.display = 'none';
        sec.style.opacity = '0';
      }
    });

    tabButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', panelIds[idx] === panelId);
    });

    const wrapper = ed.getWrapper();
    if (wrapper) {
      sections.forEach(sec => {
        const comp = wrapper.find(`#${sec.id}`)[0];
        if (comp) {
          if (sec.id === panelId) comp.addClass('active');
          else comp.removeClass('active');
        }
      });
    }

    localStorage.setItem('editor_active_section', panelId);

    const panelNames = {
      'noticias-news': 'Noticias & Humor',
      'perfiles': 'Suite de Apps (.io)',
      'redes-sociales': 'Redes & Live',
      'nosotros-apoyo': 'Nosotros & Apoyo',
      'creador-contacto': 'Creador & Contacto'
    };
    showToast(`Mostrando: ${panelNames[panelId] || panelId}`);
  }
}

// ── DRAWER / MENÚ HAMBURGUESA ─────────────────────────────

/**
 * Inicializa el drawer hamburguesa con apertura/cierre por Escape.
 */
export function setupDrawer() {
  const btnHamburger = document.getElementById('btn-hamburger');
  const drawerMenu = document.getElementById('drawer-menu');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');

  const openDrawer = () => {
    if (drawerMenu) drawerMenu.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('open');
  };

  const closeDrawer = () => {
    if (drawerMenu) drawerMenu.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('open');
  };

  if (btnHamburger) btnHamburger.addEventListener('click', openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerMenu && drawerMenu.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Permite que save-publish.js cierre el drawer sin importar ui-panels.js
  document.addEventListener('drawer:close', closeDrawer);
}

/**
 * Configura el botón de selección de plantillas en el drawer
 * @param {object} [editor]
 */
export function setupTemplateButton(editor) {
  const btnNewTemplate = document.getElementById('btn-new-template');
  if (!btnNewTemplate) return;

  btnNewTemplate.addEventListener('click', async () => {
    document.dispatchEvent(new Event('drawer:close'));
    const ed = editor || _editor;
    if (ed) {
      await showTemplateSelector(ed);
    }
  });
}

/**
 * Configura el botón de la Pantalla de Inicio (Welcome Hub) en el drawer y cabecera
 */
export function setupWelcomeHubButton() {
  const btnWelcomeHub = document.getElementById('btn-welcome-hub');
  if (btnWelcomeHub) {
    btnWelcomeHub.addEventListener('click', () => {
      document.dispatchEvent(new Event('drawer:close'));
      showWelcomeHub({ allowClose: true });
    });
  }

  // Permitir también abrir el Welcome Hub haciendo click en el branding de la cabecera
  const brandTitle = document.querySelector('.brand-title');
  if (brandTitle) {
    brandTitle.style.cursor = 'pointer';
    brandTitle.setAttribute('title', 'Abrir Pantalla de Inicio (Welcome Hub)');
    brandTitle.addEventListener('click', (e) => {
      // Si el click no fue en el botón hamburguesa
      if (!e.target.closest('#btn-hamburger')) {
        showWelcomeHub({ allowClose: true });
      }
    });
  }
}

// ── PESTAÑAS DE BARRA LATERAL ─────────────────────────────

/**
 * Configura las pestañas (Bloques / Estilos / Capas / Propiedades).
 * @param {object} editor - Instancia de GrapesJS
 * @returns {Function} switchTab - función para cambiar pestaña programáticamente
 */
export function setupTabs(editor) {
  const tabBtns = document.querySelectorAll('.sidebar-tab-btn');
  const panes = {
    blocks: document.getElementById('pane-blocks'),
    styles: document.getElementById('pane-styles'),
    layers: document.getElementById('pane-layers'),
    traits: document.getElementById('pane-traits')
  };

  function switchTab(targetTab) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetTab);
    });
    Object.keys(panes).forEach(tabKey => {
      if (panes[tabKey]) panes[tabKey].classList.toggle('active', tabKey === targetTab);
    });
  }

  _switchTab = switchTab;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab === 'layers') {
        setTimeout(updateLayerAttributes, 80);
      }
    });
  });

  editor.on('component:selected', (model) => {
    const activeBtn = document.querySelector('.sidebar-tab-btn.active');
    if (activeBtn && activeBtn.dataset.tab === 'blocks') {
      switchTab('styles');
    }
    setTimeout(updateLayerAttributes, 50);
    updateBreadcrumbs(model, editor);
    updateContextPanel(model, editor);
  });

  editor.on('component:deselected', () => {
    updateBreadcrumbs(null, editor);
    updateContextPanel(null, editor);
  });

  editor.on('component:update', () => {
    setTimeout(updateLayerAttributes, 100);
    const selected = editor.getSelected();
    if (selected) {
      updateBreadcrumbs(selected, editor);
      updateContextPanel(selected, editor);
    }
  });

  return switchTab;
}

// ── BREADCRUMBS ───────────────────────────────────────────

function getTypeIcon(tag) {
  const map = {
    'a': '🔗', 'button': '🔘', 'div': '📦', 'section': '📰', 'header': '📰',
    'footer': '📰', 'main': '📰', 'nav': '🧭', 'article': '📄', 'aside': '📑',
    'p': '✏️', 'span': '✏️', 'h1': '📝', 'h2': '📝', 'h3': '📝',
    'h4': '📝', 'h5': '📝', 'h6': '📝', 'img': '🖼️', 'video': '🎬',
    'svg': '🎨', 'ul': '📋', 'ol': '📋', 'li': '▪️', 'form': '📝',
    'input': '⌨️', 'label': '🏷️', 'textarea': '⌨️'
  };
  return map[(tag || '').toLowerCase()] || '📄';
}

function getComponentName(comp) {
  if (!comp) return 'Elemento';
  const tag = comp.get('tagName') || 'div';
  const id = comp.getId ? comp.getId() : '';
  const customName = comp.getName ? comp.getName() : '';
  if (customName && customName !== tag) return customName;
  if (id) return `${tag}#${id}`;
  return tag;
}

function updateBreadcrumbs(component, editor) {
  const container = document.getElementById('breadcrumb-items');
  if (!container) return;

  if (!component) {
    container.innerHTML = '<span class="breadcrumb-empty">Haz clic en cualquier elemento para inspeccionar su ruta</span>';
    return;
  }

  const path = [];
  let current = component;
  while (current) {
    path.unshift(current);
    current = current.parent ? current.parent() : null;
  }

  let html = '';
  path.forEach((comp, index) => {
    const name = getComponentName(comp);
    const icon = getTypeIcon(comp.get('tagName'));
    const isActive = index === path.length - 1;
    const cid = comp.cid;
    html += `
      <span class="breadcrumb-item ${isActive ? 'active' : ''}" data-cid="${cid}" title="Seleccionar ${name}">
        <span>${icon}</span> <span>${name}</span>
      </span>
    `;
    if (index < path.length - 1) {
      html += `<span class="breadcrumb-separator">›</span>`;
    }
  });

  container.innerHTML = html;

  container.querySelectorAll('.breadcrumb-item').forEach(el => {
    el.addEventListener('click', () => {
      const cid = el.dataset.cid;
      const found = path.find(c => c.cid === cid);
      if (found && editor) editor.select(found);
    });
  });
}

function updateContextPanel(component, editor) {
  const content = document.getElementById('talachas-context-content');
  if (!content) return;

  if (!component) {
    content.innerHTML = `<p style="color:var(--texto-sec); font-size:0.85rem; padding:10px 0;">Selecciona un elemento en el lienzo para ver su contexto y hermanos.</p>`;
    return;
  }

  const parent = component.parent ? component.parent() : null;
  const siblings = parent ? parent.components().models : [component];
  const children = component.components ? component.components().models : [];

  const path = [];
  let cur = component;
  while (cur) {
    path.unshift(cur);
    cur = cur.parent ? cur.parent() : null;
  }
  const pathText = path.map(c => getComponentName(c)).join(' › ');

  let html = `
    <div class="context-location" title="${pathText}">
      <span style="opacity:0.7; font-size:0.72rem; display:block; margin-bottom:3px; letter-spacing:0.05em;">📍 UBICACIÓN EN EL DOM:</span>
      <strong>${pathText}</strong>
    </div>
  `;

  html += `<div class="context-nav-buttons">`;
  if (parent) {
    const pName = getComponentName(parent);
    html += `<button class="context-nav-btn" id="btn-context-parent" title="Subir a ${pName}"><i class="fas fa-arrow-up"></i> Subir a ${pName}</button>`;
  }
  if (children.length > 0) {
    const cName = getComponentName(children[0]);
    html += `<button class="context-nav-btn" id="btn-context-child" title="Bajar a ${cName}"><i class="fas fa-arrow-down"></i> Bajar a ${cName}</button>`;
  }
  html += `</div>`;

  if (siblings && siblings.length > 0) {
    html += `
      <div class="context-section-heading">
        <span>Hermanos en este contenedor (${siblings.length})</span>
      </div>
      <div class="context-siblings">
    `;
    siblings.forEach(sib => {
      const isActive = sib.cid === component.cid;
      const icon = getTypeIcon(sib.get('tagName'));
      const name = getComponentName(sib);
      const type = sib.get('tagName') || 'div';
      html += `
        <div class="context-sibling ${isActive ? 'active' : ''}" data-cid="${sib.cid}" title="${isActive ? 'Elemento actualmente seleccionado' : 'Hacer clic para seleccionar ' + name}">
          <span class="context-sibling-icon">${icon}</span>
          <span class="context-sibling-name">${name}</span>
          <span class="context-sibling-type">${type}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  content.innerHTML = html;

  const btnParent = content.querySelector('#btn-context-parent');
  if (btnParent && parent && editor) btnParent.addEventListener('click', () => editor.select(parent));

  const btnChild = content.querySelector('#btn-context-child');
  if (btnChild && children.length > 0 && editor) btnChild.addEventListener('click', () => editor.select(children[0]));

  content.querySelectorAll('.context-sibling').forEach(item => {
    item.addEventListener('click', () => {
      const cid = item.dataset.cid;
      const targetComp = siblings.find(s => s.cid === cid);
      if (targetComp && editor) editor.select(targetComp);
    });
  });
}

// ── TOGGLE ÁRBOL vs CONTEXTO ──────────────────────────────

export function setupTreeToggle() {
  const btnToggleTree = document.getElementById('btn-toggle-tree-view');
  const toggleTreeLabel = document.getElementById('toggle-tree-label');
  const contextContainer = document.getElementById('talachas-context-container');
  const nativeLayersContainer = document.getElementById('layers-container');
  const layersDescText = document.getElementById('layers-desc-text');

  let isTreeView = false;
  if (btnToggleTree) {
    btnToggleTree.addEventListener('click', () => {
      isTreeView = !isTreeView;
      if (contextContainer) contextContainer.style.display = isTreeView ? 'none' : 'block';
      if (nativeLayersContainer) nativeLayersContainer.style.display = isTreeView ? 'block' : 'none';
      if (toggleTreeLabel) toggleTreeLabel.textContent = isTreeView ? 'Ver Contexto' : 'Ver Árbol';
      if (layersDescText) {
        layersDescText.textContent = isTreeView
          ? 'Vista de árbol completo de la página.'
          : 'Navegación contextual plana: elemento actual, contenedor padre y hermanos inmediatos.';
      }
    });
  }
}

// ── REDIMENSIONADOR DE SIDEBAR ────────────────────────────

export function setupSidebarResizer() {
  const resizer = document.getElementById('sidebar-resizer');
  const sidebar = document.getElementById('editor-sidebar');
  const btnToggleW = document.getElementById('btn-toggle-sidebar-w');
  const breadcrumbsBar = document.getElementById('breadcrumbs-bar');
  if (!sidebar) return;

  const savedWidth = localStorage.getItem('talachas-sidebar-w');
  if (savedWidth) {
    const wNum = parseInt(savedWidth, 10);
    if (wNum >= 280 && wNum <= 800) {
      sidebar.style.width = `${wNum}px`;
      if (breadcrumbsBar) breadcrumbsBar.style.right = `${wNum}px`;
    }
  }

  if (btnToggleW) {
    btnToggleW.addEventListener('click', () => {
      const currentW = sidebar.offsetWidth;
      const targetW = currentW > 420 ? 360 : 540;
      sidebar.style.width = `${targetW}px`;
      if (breadcrumbsBar) breadcrumbsBar.style.right = `${targetW}px`;
      localStorage.setItem('talachas-sidebar-w', targetW);
      showToast(targetW > 420 ? 'Panel expandido a modo amplio' : 'Panel en modo compacto');
    });
  }

  if (!resizer) return;

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    resizer.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const diff = startX - e.clientX;
    const newWidth = Math.max(280, Math.min(800, startWidth + diff));
    sidebar.style.width = `${newWidth}px`;
    if (breadcrumbsBar) breadcrumbsBar.style.right = `${newWidth}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      resizer.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('talachas-sidebar-w', sidebar.offsetWidth);
    }
  });
}

// ── ÁRBOL DE CAPAS ─────────────────────────────────────────

export function updateLayerAttributes() {
  const layersBox = document.getElementById('layers-container') || document.querySelector('.gjs-layers');
  if (!layersBox) return;

  const items = layersBox.querySelectorAll('.gjs-layer');
  items.forEach(item => {
    let depth = 0;
    let p = item.parentElement;
    while (p && p !== layersBox) {
      if (p.classList && p.classList.contains('gjs-layer')) depth++;
      p = p.parentElement;
    }
    item.setAttribute('data-level', Math.min(depth, 5));

    const text = (item.textContent || '').trim().toLowerCase();
    let type = 'div';
    if (/section|header|footer|main|nav|aside/i.test(text)) type = 'section';
    else if (/link|enlace|botón|button|\ba\b/i.test(text)) type = 'link';
    else if (/text|texto|heading|título|\bp\b|\bh\d\b|span/i.test(text)) type = 'text';
    else if (/image|imagen|video|img|svg/i.test(text)) type = 'image';
    item.setAttribute('data-type', type);

    const caret = item.querySelector('.gjs-layer-caret');
    if (caret && !caret.dataset.bound) {
      caret.dataset.bound = 'true';
      caret.setAttribute('title', 'Expandir / Colapsar capa');
    }
  });
}

// ── SELECTOR DE DISPOSITIVOS ──────────────────────────────

export function setupDeviceSelector(editor) {
  const btnDesktop = document.getElementById('btn-dev-desktop');
  const btnTablet = document.getElementById('btn-dev-tablet');
  const btnMobile = document.getElementById('btn-dev-mobile');
  if (!btnDesktop || !btnTablet || !btnMobile) return;

  function setActiveDevice(btn, deviceId) {
    [btnDesktop, btnTablet, btnMobile].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    editor.setDevice(deviceId);
  }

  btnDesktop.addEventListener('click', () => setActiveDevice(btnDesktop, 'desktop'));
  btnTablet.addEventListener('click', () => setActiveDevice(btnTablet, 'tablet'));
  btnMobile.addEventListener('click', () => setActiveDevice(btnMobile, 'mobile'));
}

// ── SIDEBAR RESPONSIVE ────────────────────────────────────

export function setupMobileSidebar(editor) {
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const sidebar = document.getElementById('editor-sidebar');
  const fabMobile = document.getElementById('btn-fab-mobile');
  const btnCloseSidebarMobile = document.getElementById('btn-close-sidebar-mobile');
  if (!btnToggleSidebar || !sidebar) return;

  if (window.innerWidth <= 768) {
    sidebar.classList.add('collapsed');
    if (fabMobile) fabMobile.style.display = 'flex';
  }

  const toggleSidebarState = () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    btnToggleSidebar.classList.toggle('active', !isCollapsed);
    if (fabMobile && window.innerWidth <= 768) {
      fabMobile.style.display = isCollapsed ? 'flex' : 'none';
    }
    setTimeout(() => editor.refresh(), 100);
  };

  btnToggleSidebar.addEventListener('click', toggleSidebarState);

  if (fabMobile) {
    fabMobile.addEventListener('click', () => {
      sidebar.classList.remove('collapsed');
      btnToggleSidebar.classList.add('active');
      fabMobile.style.display = 'none';
      setTimeout(() => editor.refresh(), 100);
    });
  }

  if (btnCloseSidebarMobile) {
    btnCloseSidebarMobile.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
      btnToggleSidebar.classList.remove('active');
      if (fabMobile && window.innerWidth <= 768) fabMobile.style.display = 'flex';
      setTimeout(() => editor.refresh(), 100);
    });
  }
}

// ── MODO VISTA PREVIA ─────────────────────────────────────

export function setupPreviewButton(editor) {
  const btnPreview = document.getElementById('btn-preview');
  if (!btnPreview) return;
  let isPreview = false;

  btnPreview.addEventListener('click', () => {
    isPreview = !isPreview;
    editor.runCommand('preview');
    btnPreview.innerHTML = isPreview
      ? `<i class="fas fa-edit"></i> <span data-i18n="btn_edit_mode">${t('btn_edit_mode', 'Modo Edición')}</span>`
      : `<i class="fas fa-eye"></i> <span data-i18n="btn_preview">${t('btn_preview', 'Vista Previa')}</span>`;
    btnPreview.style.borderColor = isPreview ? 'var(--oro-charro)' : '';
    btnPreview.classList.toggle('active', isPreview);
  });
}

// ── BOTONES HISTORIAL Y HERRAMIENTAS ──────────────────────

export function setupHistoryButtons(editor) {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnOpenAssets = document.getElementById('btn-open-assets');
  const btnDeleteItem = document.getElementById('btn-delete-item');

  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (typeof window !== 'undefined' && typeof window.undo === 'function') {
        window.undo();
      } else if (editor && typeof editor.runCommand === 'function') {
        editor.runCommand('core:undo');
      }
    });
  }
  if (btnRedo) {
    btnRedo.addEventListener('click', () => {
      if (typeof window !== 'undefined' && typeof window.redo === 'function') {
        window.redo();
      } else if (editor && typeof editor.runCommand === 'function') {
        editor.runCommand('core:redo');
      }
    });
  }

  // Atajos de teclado globales Ctrl+Z y Ctrl+Y
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (typeof window !== 'undefined' && typeof window.undo === 'function') window.undo();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (typeof window !== 'undefined' && typeof window.redo === 'function') window.redo();
      }
    }
  });
  if (btnOpenAssets) btnOpenAssets.addEventListener('click', () => {
    document.dispatchEvent(new Event('drawer:close'));
    editor.runCommand('open-assets');
  });
  if (btnDeleteItem) btnDeleteItem.addEventListener('click', () => {
    const selected = editor.getSelected();
    if (selected) {
      selected.remove();
      showToast('Elemento eliminado');
    } else {
      showToast('Selecciona un elemento primero', true);
    }
  });
}

// ── SELECTOR DE TEMAS ─────────────────────────────────────

export function setupThemeSelector() {
  const themeSelector = document.getElementById('theme-selector');
  if (!themeSelector) return;

  const savedTheme = localStorage.getItem('memex-theme') || 'patria';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeSelector.value = savedTheme;

  themeSelector.addEventListener('change', (e) => {
    const themeVal = e.target.value;
    document.documentElement.setAttribute('data-theme', themeVal);
    localStorage.setItem('memex-theme', themeVal);
  });
}

// ── BOTÓN APAGADO ─────────────────────────────────────────

export function setupShutdownButton() {
  const btnShutdown = document.getElementById('btn-shutdown');
  if (!btnShutdown) return;

  btnShutdown.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Detener Servidor Local',
      message: '🛑 ¿Deseas detener el servidor de Rótulos Web y liberar el puerto 5050?',
      confirmText: 'Detener Servidor',
      cancelText: 'Cancelar',
      danger: true
    });
    if (!confirmed) return;

    showToast('Apagando servidor...');
    try {
      await fetch('/api/shutdown', { method: 'POST' });
    } catch {
      // Servidor se apaga inmediatamente
    }

    document.body.innerHTML = `
      <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#090D0B; color:#F8F9FA; font-family:'Space Grotesk',sans-serif; text-align:center; padding:20px;">
        <div style="font-size:3.5rem; margin-bottom:14px;">🛑</div>
        <h2 style="color:#D4AF37; margin-bottom:8px; font-size:1.8rem;">Servidor Detenido Correctamente</h2>
        <p style="color:#9CA3AF; max-width:480px; margin-bottom:24px; line-height:1.5;">El proceso local en el puerto 5050 se ha liberado. Puedes cerrar esta pestaña del navegador.</p>
        <div style="font-family:'Space Mono',monospace; font-size:0.85rem; background:#141B17; border:1px solid rgba(212,175,55,0.3); padding:12px 24px; border-radius:8px; color:#55EBB2;">
          Para reiniciar: ./"Talachas y Modulos Web/editor.sh" start
        </div>
      </div>
    `;
  });
}

// ── GUÍA DE USO & DOCUMENTACIÓN TÉCNICA ───────────────────

/**
 * Configura el botón y modal interactivo de la Guía de Uso & DOCS.
 */
export function setupDocsModule() {
  const btnOpenDocs = document.getElementById('btn-open-docs');
  if (!btnOpenDocs) return;

  btnOpenDocs.addEventListener('click', () => {
    document.dispatchEvent(new Event('drawer:close'));

    const existing = document.querySelector('.docs-modal');
    if (existing) existing.remove();

    const tabs = [
      {
        id: 'editar',
        label: '✏️ Editar Textos',
        content: `
          <h3>¿Cómo editar textos en tu página?</h3>
          <p><strong>1. Método Directo (Doble Clic):</strong> Haz doble clic sobre cualquier palabra o título en el lienzo. Aparecerá el cursor de texto parpadeando y podrás escribir lo que desees.</p>
          <p><strong>2. En Enlaces y Botones:</strong> Selecciona el botón. En la barra lateral derecha (pestaña <strong>Propiedades</strong>), usa el campo <strong>"📝 Texto Visible"</strong> para cambiar el nombre al instante.</p>
          <p><strong>3. Con el Árbol de Capas:</strong> Abre la pestaña <strong>Capas</strong> a la derecha para ver y seleccionar elementos anidados o difíciles de alcanzar con el ratón.</p>
        `
      },
      {
        id: 'enlaces',
        label: '🔗 Enlaces & Botones',
        content: `
          <h3>Configurar Enlaces y Destinos</h3>
          <p>Selecciona un botón o enlace en la página y ve a la pestaña <strong>Propiedades</strong>:</p>
          <ul>
            <li><strong>📝 Texto Visible:</strong> El nombre que ven tus usuarios en el botón.</li>
            <li><strong>🌐 Enlace (Href):</strong> La dirección web de destino.
              <ul>
                <li>Usa <code>#noticias-news</code>, <code>#perfiles</code>, etc., para saltar entre paneles internos.</li>
                <li>Usa una URL completa (ej: <code>https://youtube.com</code>) para sitios externos.</li>
              </ul>
            </li>
            <li><strong>↗️ Comportamiento:</strong> Elige si se abre en la <em>Misma ventana</em> o en una <em>Pestaña nueva (_blank)</em>.</li>
            <li><strong>💬 Texto flotante:</strong> Tooltip descriptivo al pasar el cursor encima.</li>
          </ul>
        `
      },
      {
        id: 'capas',
        label: '🌲 Árbol de Capas',
        content: `
          <h3>Dominar el Árbol de Capas</h3>
          <p>El panel de <strong>Capas</strong> te muestra la jerarquía exacta de la página en forma de árbol:</p>
          <ul>
            <li><strong>Flechas doradas (▾ / ▸):</strong> Despliegan o pliegan grupos de elementos con animación.</li>
            <li><strong>👁️ Ojo:</strong> Oculta o muestra temporalmente cualquier bloque en el lienzo.</li>
            <li><strong>Arrastrar:</strong> Reordena bloques subiéndolos o bajándolos dentro de su contenedor.</li>
          </ul>
          <p><strong>Código de Colores de Capas:</strong></p>
          <ul>
            <li style="color:#7AA2E7;">📦 <strong>Azul Claro:</strong> Contenedores estructurales (Section, Div, Header, Main).</li>
            <li style="color:#55EBB2;">🔗 <strong>Verde Neón:</strong> Enlaces y Botones interactivos.</li>
            <li style="color:#F5C542;">📝 <strong>Oro Charro:</strong> Textos, párrafos y títulos editables.</li>
            <li style="color:#C792EA;">🖼️ <strong>Púrpura:</strong> Imágenes, iconos y videos.</li>
          </ul>
        `
      },
      {
        id: 'estilos',
        label: '🎨 Estilos & Diseño',
        content: `
          <h3>Personalizar Estilos Visuales</h3>
          <p>Haz clic en cualquier elemento y abre la pestaña <strong>Estilos</strong> (🎨) a la derecha:</p>
          <ul>
            <li><strong>Tipografía:</strong> Familia de fuentes (Space Grotesk, Space Mono), tamaño, peso y alineación.</li>
            <li><strong>Colores:</strong> Fondos, colores de texto y acentos dorados o patrios.</li>
            <li><strong>Dimensiones y Espaciado:</strong> Márgenes externos (Margin) y espaciado interno (Padding).</li>
            <li><strong>Bordes:</strong> Radio de esquinas (Border Radius) y sombras elegantes.</li>
          </ul>
        `
      },
      {
        id: 'publicar',
        label: '🚀 Guardar & Publicar',
        content: `
          <h3>Flujo de Guardado y Publicación Soberana</h3>
          <p><strong>💾 Guardar en index.html:</strong> Guarda tus cambios directamente en el archivo <code>index.html</code> del proyecto activo y crea un respaldo automático con rotación FIFO en la carpeta <code>backups/</code>.</p>
          <p><strong>🚀 Publicar:</strong> Ejecuta un commit automático y sincroniza los cambios con el repositorio Git remoto.</p>
          <p><strong>📁 Proyectos & Espacios:</strong> En el menú ☰ puedes saltar a cualquier otro sitio web en tu computadora con el botón <em>Abrir Carpeta...</em>.</p>
        `
      },
      {
        id: 'atajos',
        label: '⌨️ Atajos de Teclado',
        content: `
          <h3>Atajos de Productividad</h3>
          <ul>
            <li><kbd>Ctrl + S</kbd> — Guardar cambios en <code>index.html</code></li>
            <li><kbd>Ctrl + Z</kbd> — Deshacer última acción</li>
            <li><kbd>Ctrl + Y</kbd> — Rehacer acción deshecha</li>
            <li><kbd>Supr / Backspace</kbd> — Eliminar elemento seleccionado</li>
            <li><kbd>Escape</kbd> — Cerrar menús y modales abiertos</li>
          </ul>
        `
      }
    ];

    const modal = document.createElement('div');
    modal.id = 'docs-modal';
    modal.className = 'docs-modal';
    modal.innerHTML = `
      <div class="docs-modal-content">
        <div class="docs-modal-header">
          <h2>📖 Guía de Uso & DOCS (Rótulos Web)</h2>
          <button class="docs-modal-close" id="docs-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="docs-tabs" id="docs-tabs">
          ${tabs.map((tab, i) => `
            <button class="docs-tab ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>
          `).join('')}
        </div>
        <div class="docs-content" id="docs-content">
          ${tabs.map((tab, i) => `
            <div class="tab-panel ${i === 0 ? 'active' : ''}" id="panel-${tab.id}">
              ${tab.content}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#docs-close');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.docs-tab').forEach(tBtn => {
      tBtn.addEventListener('click', () => {
        modal.querySelectorAll('.docs-tab').forEach(b => b.classList.remove('active'));
        tBtn.classList.add('active');
        const targetId = tBtn.dataset.tab;
        modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = modal.querySelector('#panel-' + targetId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    const handleEsc = (e) => {
      if (e.key === 'Escape' && document.querySelector('.docs-modal')) {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

// ── CENTRO DE DIAGNÓSTICO Y SALUD ──────────────────────────

export function setupDiagnosticsModal(editor) {
  const btnDiagnostics = document.getElementById('btn-diagnostics');
  const diagModal = document.getElementById('diag-modal');
  const btnCloseDiag = document.getElementById('btn-close-diag');
  const btnCloseDiagFooter = document.getElementById('btn-close-diag-footer');
  const btnRerunDiag = document.getElementById('btn-rerun-diag');
  const btnExportDiag = document.getElementById('btn-export-diag');
  const diagTabBtns = document.querySelectorAll('.diag-tab-btn');

  if (!btnDiagnostics || !diagModal) return;

  let currentDiagReport = null;
  let currentDiagTab = 'integrity';

  function renderDiagTable() {
    const contentBox = document.getElementById('diag-content-box');
    if (!currentDiagReport || !contentBox) return;

    let items = [];
    if (currentDiagTab === 'integrity') {
      items = currentDiagReport.integrity.results;
    } else if (currentDiagTab === 'a11y') {
      items = currentDiagReport.a11ySeo.results.filter(r => r.category === 'a11y');
    } else if (currentDiagTab === 'seo') {
      items = currentDiagReport.a11ySeo.results.filter(r => r.category === 'seo');
    }

    if (items.length === 0) {
      contentBox.innerHTML = '<div style="padding:20px; text-align:center; color:var(--texto-sec);">No hay elementos reportados en esta categoría.</div>';
      return;
    }

    let html = '<table class="diag-table"><thead><tr><th>Estado</th><th>Prueba / Métrica</th><th>Detalles</th></tr></thead><tbody>';
    items.forEach(item => {
      const badgeClass = item.status === 'PASS' ? 'badge-pass' : (item.status === 'WARN' ? 'badge-warn' : 'badge-fail');
      const icon = item.status === 'PASS' ? '✔' : (item.status === 'WARN' ? '⚠' : '✖');
      html += `
        <tr>
          <td style="width: 90px;"><span class="badge-status ${badgeClass}">${icon} ${item.status}</span></td>
          <td style="width: 220px; font-weight:700; color:var(--blanco-hueso);">${item.name}</td>
          <td style="color:var(--texto-sec);">${item.message}</td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    contentBox.innerHTML = html;
  }

  async function executeDiagnostics() {
    const contentBox = document.getElementById('diag-content-box');
    const scoreNum = document.getElementById('diag-score-num');
    const summaryText = document.getElementById('diag-summary-text');
    if (!contentBox || !scoreNum || !summaryText) return;

    contentBox.innerHTML = '<div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Analizando contratos, enlaces y accesibilidad...</p></div>';
    scoreNum.textContent = '--';
    scoreNum.className = 'score-circle';

    try {
      if (!window.MemexDiagnostics) {
        throw new Error('El motor de diagnóstico no está cargado');
      }
      const integrity = await window.MemexDiagnostics.runIntegritySuite(editor);
      const a11ySeo = await window.MemexDiagnostics.runA11yAndSeoSuite(editor);

      try {
        const rawHtml = editor && typeof editor.getHtml === 'function' ? editor.getHtml() : '';
        if (rawHtml && typeof Worker !== 'undefined') {
          const workerResult = await runAccessibilityAudit(rawHtml, 'accessibility-audit');
          if (workerResult && Array.isArray(workerResult.violations)) {
            workerResult.violations.forEach(v => {
              a11ySeo.results.push({
                category: 'a11y',
                name: `[axe-core] ${v.id}`,
                status: v.impact === 'critical' || v.impact === 'serious' ? 'FAIL' : 'WARN',
                message: `${v.description} — ${v.help}`
              });
            });
          } else if (workerResult && Array.isArray(workerResult.issues)) {
            workerResult.issues.forEach(iss => {
              a11ySeo.results.push({
                category: iss.category || 'a11y',
                name: `[Web Worker] ${iss.target || 'DOM'}`,
                status: iss.severity === 'FAIL' ? 'FAIL' : (iss.severity === 'WARN' ? 'WARN' : 'PASS'),
                message: iss.message
              });
            });
          }
        }
      } catch (wErr) {
        console.warn('[Diagnostics] DOM Worker opcional no disponible:', wErr.message);
      }

      const combinedScore = Math.round((integrity.score * 0.4) + (a11ySeo.a11yScore * 0.3) + (a11ySeo.seoScore * 0.3));
      scoreNum.textContent = combinedScore;

      if (combinedScore >= 90) {
        scoreNum.className = 'score-circle';
        summaryText.textContent = '¡Excelente salud! El sitio cumple con los estándares óptimos.';
      } else if (combinedScore >= 70) {
        scoreNum.className = 'score-circle warn';
        summaryText.textContent = 'Salud aceptable con advertencias menores para mejorar.';
      } else {
        scoreNum.className = 'score-circle fail';
        summaryText.textContent = 'Se detectaron fallos críticos de integridad o SEO.';
      }

      currentDiagReport = {
        timestamp: new Date().toISOString(),
        combinedScore,
        integrity,
        a11ySeo
      };

      renderDiagTable();
    } catch (err) {
      contentBox.innerHTML = `<div style="color:#CE1126; padding:20px;">Error al ejecutar suite: ${err.message}</div>`;
    }
  }

  btnDiagnostics.addEventListener('click', () => {
    document.dispatchEvent(new Event('drawer:close'));
    diagModal.classList.add('open');
    executeDiagnostics();
  });

  const closeDiag = () => diagModal.classList.remove('open');
  if (btnCloseDiag) btnCloseDiag.addEventListener('click', closeDiag);
  if (btnCloseDiagFooter) btnCloseDiagFooter.addEventListener('click', closeDiag);
  if (btnRerunDiag) btnRerunDiag.addEventListener('click', executeDiagnostics);
  if (btnExportDiag) {
    btnExportDiag.addEventListener('click', () => {
      if (currentDiagReport && window.MemexDiagnostics) {
        window.MemexDiagnostics.downloadReport(currentDiagReport);
        showToast('Informe descargado con éxito');
      }
    });
  }

  diagTabBtns.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      diagTabBtns.forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      currentDiagTab = tabBtn.dataset.tab;
      renderDiagTable();
    });
  });
}

/**
 * Ejecuta una auditoría sintáctica y de accesibilidad en segundo plano mediante dom-worker.js
 * @param {string} html
 * @returns {Promise<{ stats: object, issues: Array<object> }>}
 */
export async function runAccessibilityAudit(html, mode = 'accessibility-audit') {
  try {
    eventBus.publish(EDITOR_EVENTS.AUDIT_PROGRESS, { percent: 10, message: 'Iniciando Worker de diagnóstico de accesibilidad...' });
    workerManager.createWorker('dom', '/workers/dom-worker.js');

    const result = await workerManager.sendTask('dom', mode, { html }, (progress) => {
      eventBus.publish(EDITOR_EVENTS.AUDIT_PROGRESS, progress);
    });

    eventBus.publish(EDITOR_EVENTS.AUDIT_COMPLETED, result);
    return result;
  } catch (error) {
    eventBus.publish(EDITOR_EVENTS.AUDIT_ERROR, { message: error.message });
    throw error;
  }
}

