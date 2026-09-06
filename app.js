/**
 * ==========================================================
 * 🇲🇽 Memexicanísimos Studio — Motor Frontend v3.1
 * GrapesJS, Stats Dashboard, GitHub Publisher, Multi-Theme, i18n
 * ==========================================================
 */

let editor;
let currentLang = localStorage.getItem('memex-lang') || 'es';
let translations = {};
let publishState = 'IDLE';

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.style.borderColor = isError ? '#CE1126' : '#006847';
  toast.style.color = isError ? '#FFA4AD' : '#55EBB2';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── MOTOR DE INTERNACIONALIZACIÓN (i18n) ───────────────────
async function loadTranslations(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    translations = await res.json();
    applyTranslations();
  } catch (err) {
    console.warn('[i18n] Error cargando traducciones:', err);
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) {
      el.textContent = translations[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (translations[key]) {
      el.title = translations[key];
    }
  });
}

function t(key, fallback = '') {
  return translations[key] || fallback;
}

// ── SANITIZACIÓN DE ATRIBUTOS data-gjs-* ANTES DE GUARDAR ──
function getSanitizedHtml(rawHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  if (doc.body) {
    doc.body.classList.remove('editor-show-all');
  }

  // Limpiar estilos inline temporales en secciones del editor
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

// ── FSM DE PUBLICACIÓN A GITHUB ────────────────────────────
function updatePublishUI(state, msg = '') {
  const btn = document.getElementById('btn-publish');
  if (!btn) return;

  switch (state) {
    case 'IDLE':
      btn.innerHTML = '<i class="fas fa-rocket"></i> <span data-i18n="btn_publish">' + t('btn_publish', 'Publicar') + '</span>';
      btn.disabled = false;
      btn.className = 'btn-action btn-publish';
      break;
    case 'PENDING':
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>' + t('btn_publishing', 'Publicando...') + '</span>';
      btn.disabled = true;
      break;
    case 'SUCCESS':
      btn.innerHTML = '<i class="fas fa-check"></i> <span>' + t('btn_published', '¡Publicado!') + '</span>';
      btn.className = 'btn-action btn-publish btn-success';
      showToast(msg || t('publish_success', '¡Publicado exitosamente en GitHub!'));
      setTimeout(() => {
        publishState = 'IDLE';
        updatePublishUI('IDLE');
      }, 3000);
      break;
    case 'FAULT':
      btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Reintentar</span>';
      btn.disabled = false;
      btn.className = 'btn-action btn-publish btn-fault';
      showToast(msg || t('publish_error', 'Error al publicar'), true);
      break;
  }
}

// ── INICIALIZACIÓN DEL EDITOR Y COMPONENTES ────────────────
async function initEditor() {
  try {
    // 1. Cargar el HTML y CSS actual (con soporte dual: Backend Local / GitHub Pages Estático)
    let html = '';
    let css = '';
    window.isStaticMode = false;

    try {
      const res = await fetch('/api/page');
      if (res.ok) {
        const pageResponse = await res.json();
        if (pageResponse.success && pageResponse.data) {
          html = pageResponse.data.html;
          css = pageResponse.data.css;
        } else {
          throw new Error(pageResponse.message || 'Error en respuesta /api/page');
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

    // 2. Cargar galería de imágenes
    let localAssets = [];
    try {
      const assetsRes = await fetch('/api/assets');
      if (assetsRes.ok) {
        const assetsResponse = await assetsRes.json();
        if (assetsResponse.success && assetsResponse.data && assetsResponse.data.assets) {
          localAssets = assetsResponse.data.assets;
        }
      }
    } catch (e) {
      localAssets = [
        { src: 'assets/Logo.png', name: 'Logo Memexicanisimos' },
        { src: 'assets/Avatar.jpg', name: 'Avatar Creador' },
        { src: 'assets/news/reportero_zocalo.jpg', name: 'Reportero Zócalo' },
        { src: 'assets/news/reportero_taqueria.jpg', name: 'Reportero Taquería' },
        { src: 'assets/news/reportero_mercado.jpg', name: 'Reportero Mercado 23' },
        { src: 'assets/news/reportero_plaza.jpg', name: 'Reportero Plaza' }
      ];
    }

    // ============================================================
    // PLUGIN DE COLOR AVANZADO CON PALETA Y ESPAÑOL (v3.8)
    // ============================================================
    const SPANISH_COLOR_MAP = {
      'azul': '#2563EB',
      'azul cielo': '#38BDF8',
      'celeste': '#7DD3FC',
      'azul marino': '#1E3A8A',
      'azul rey': '#1D4ED8',
      'verde': '#16A34A',
      'verde bandera': '#006847',
      'verde neon': '#55EBB2',
      'verde menta': '#55EBB2',
      'verde oscuro': '#064E3B',
      'rojo': '#DC2626',
      'rojo bandera': '#CE1126',
      'rojo vivo': '#FF4D4D',
      'rojo coral': '#FF4D4D',
      'dorado': '#D4AF37',
      'oro': '#D4AF37',
      'oro charro': '#D4AF37',
      'oro brillante': '#F5C542',
      'amarillo': '#FACC15',
      'amarillo mostaza': '#F5C542',
      'blanco': '#FFFFFF',
      'blanco hueso': '#F8F9FA',
      'negro': '#111111',
      'negro carbon': '#111111',
      'naranja': '#F97316',
      'naranja pastor': '#F97316',
      'morado': '#A855F7',
      'purpura': '#9333EA',
      'bugambilia': '#D946EF',
      'rosa': '#EC4899',
      'rosado': '#F472B6',
      'gris': '#9CA3AF',
      'gris claro': '#E5E7EB',
      'gris oscuro': '#374151',
      'cafe': '#78350F',
      'marron': '#78350F',
      'transparente': 'transparent',
      'ninguno': 'transparent'
    };

    const QUICK_PALETTE = [
      // 🇲🇽 Identidad Patria
      { color: '#006847', label: 'Verde Bandera' },
      { color: '#55EBB2', label: 'Verde Neón' },
      { color: '#D4AF37', label: 'Oro Charro' },
      { color: '#F5C542', label: 'Oro Brillante' },
      { color: '#CE1126', label: 'Rojo Bandera' },
      { color: '#FF4D4D', label: 'Rojo Coral' },
      { color: '#F8F9FA', label: 'Blanco Hueso' },
      { color: '#111111', label: 'Negro Carbón' },
      // 🎨 Web Esenciales
      { color: '#38BDF8', label: 'Azul Cielo' },
      { color: '#2563EB', label: 'Azul Rey' },
      { color: '#A855F7', label: 'Morado' },
      { color: '#F97316', label: 'Naranja Pastor' },
      { color: 'transparent', label: 'Transparente' }
    ];

    let sessionRecentColors = ['#D4AF37', '#006847', '#CE1126', '#55EBB2', '#F8F9FA'];

    function normalizeColorName(str) {
      if (!str || typeof str !== 'string') return '';
      return str.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function resolveColorInput(raw) {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      const normalized = normalizeColorName(trimmed);
      if (SPANISH_COLOR_MAP[normalized]) {
        return SPANISH_COLOR_MAP[normalized];
      }
      return trimmed;
    }

    function colorToHex(color) {
      if (!color || color === 'transparent' || color === 'inherit' || color === 'initial' || color === 'none') return '#000000';
      if (color.startsWith('#')) {
        if (color.length === 4) {
          return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        return color.slice(0, 7);
      }
      const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
      return '#000000';
    }

    function addRecentColor(hex) {
      if (!hex || hex === 'inherit' || hex === 'initial') return;
      const clean = hex.toUpperCase();
      sessionRecentColors = [clean, ...sessionRecentColors.filter(c => c !== clean)].slice(0, 6);
      document.querySelectorAll('.talacha-recent-swatches').forEach(bar => {
        renderRecentSwatches(bar);
      });
    }

    function renderRecentSwatches(container) {
      if (!container) return;
      container.innerHTML = '';
      sessionRecentColors.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'talacha-color-swatch-btn';
        if (c === 'transparent') {
          btn.classList.add('swatch-transparent');
          btn.title = 'Transparente (Reciente)';
        } else {
          btn.style.backgroundColor = c;
          btn.title = `${c} (Reciente)`;
        }
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const widget = container.closest('.talacha-color-widget');
          if (widget && widget.__applyColor) {
            widget.__applyColor(c);
          }
        });
        container.appendChild(btn);
      });
      const section = container.closest('.talacha-color-recent-section');
      if (section) {
        section.style.display = sessionRecentColors.length > 0 ? 'block' : 'none';
      }
    }

    const talachaColorPlugin = (ed) => {
      ed.StyleManager.addType('color', {
        create({ props, change, updateStyle }) {
          const el = document.createElement('div');
          el.className = 'talacha-color-widget';

          el.innerHTML = `
            <div class="talacha-color-input-row">
              <div class="talacha-color-preview-wrapper" title="Abrir selector cromático / cuentagotas">
                <div class="talacha-color-preview-box"></div>
                <input type="color" class="talacha-color-picker-native" value="#ffffff">
              </div>
              <input type="text" class="talacha-color-text-input" placeholder="ej. #D4AF37, azul, verde..." spellcheck="false">
              <button type="button" class="talacha-color-clear-btn" title="Restablecer (quitar color)">×</button>
            </div>
            <div class="talacha-color-palette-section">
              <div class="talacha-palette-label">Paleta Rápida (1 Clic):</div>
              <div class="talacha-palette-swatches"></div>
            </div>
            <div class="talacha-color-recent-section">
              <div class="talacha-palette-label">Recientes:</div>
              <div class="talacha-recent-swatches"></div>
            </div>
          `;

          const previewBox = el.querySelector('.talacha-color-preview-box');
          const nativePicker = el.querySelector('.talacha-color-picker-native');
          const textInput = el.querySelector('.talacha-color-text-input');
          const clearBtn = el.querySelector('.talacha-color-clear-btn');
          const swatchesContainer = el.querySelector('.talacha-palette-swatches');
          const recentsContainer = el.querySelector('.talacha-recent-swatches');

          // Generar muestras de la paleta fija
          QUICK_PALETTE.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'talacha-color-swatch-btn';
            if (item.color === 'transparent') {
              btn.classList.add('swatch-transparent');
              btn.title = `${item.label} (transparente)`;
            } else {
              btn.style.backgroundColor = item.color;
              btn.title = `${item.label} (${item.color})`;
            }
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              applyColor(item.color);
            });
            swatchesContainer.appendChild(btn);
          });

          // Renderizar recientes iniciales
          renderRecentSwatches(recentsContainer);

          function applyColor(val, fromNative = false) {
            const resolved = resolveColorInput(val);
            if (!fromNative) {
              textInput.value = resolved || '';
            }
            if (resolved && resolved !== 'transparent') {
              previewBox.style.background = resolved;
              nativePicker.value = colorToHex(resolved);
            } else if (resolved === 'transparent') {
              previewBox.style.background = 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 50% / 8px 8px';
            } else {
              previewBox.style.background = 'none';
            }

            if (resolved) {
              addRecentColor(resolved);
              updateStyle(resolved);
            } else {
              updateStyle('');
            }
          }

          el.__applyColor = applyColor;

          // Eventos del picker nativo
          nativePicker.addEventListener('input', (e) => {
            const hex = e.target.value.toUpperCase();
            textInput.value = hex;
            previewBox.style.background = hex;
            updateStyle(hex, { partial: true });
          });

          nativePicker.addEventListener('change', (e) => {
            const hex = e.target.value.toUpperCase();
            applyColor(hex, true);
          });

          // Eventos del input de texto
          textInput.addEventListener('input', (e) => {
            const raw = e.target.value;
            const resolved = resolveColorInput(raw);
            if (resolved && resolved !== 'transparent') {
              previewBox.style.background = resolved;
              nativePicker.value = colorToHex(resolved);
            } else if (resolved === 'transparent') {
              previewBox.style.background = 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 50% / 8px 8px';
            } else {
              previewBox.style.background = 'none';
            }
            updateStyle(resolved, { partial: true });
          });

          textInput.addEventListener('change', (e) => {
            const raw = e.target.value;
            const resolved = resolveColorInput(raw);
            textInput.value = resolved;
            applyColor(resolved);
          });

          textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const raw = textInput.value;
              const resolved = resolveColorInput(raw);
              textInput.value = resolved;
              applyColor(resolved);
            }
          });

          // Botón limpiar
          clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            applyColor('');
          });

          return el;
        },

        update({ value, createdEl }) {
          if (!createdEl) return;
          const textInput = createdEl.querySelector('.talacha-color-text-input');
          const previewBox = createdEl.querySelector('.talacha-color-preview-box');
          const nativePicker = createdEl.querySelector('.talacha-color-picker-native');

          const curVal = value || '';
          if (textInput && document.activeElement !== textInput) {
            textInput.value = curVal;
          }

          if (curVal && curVal !== 'transparent') {
            if (previewBox) previewBox.style.background = curVal;
            if (nativePicker) nativePicker.value = colorToHex(curVal);
          } else if (curVal === 'transparent') {
            if (previewBox) previewBox.style.background = 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 50% / 8px 8px';
          } else {
            if (previewBox) previewBox.style.background = 'none';
          }
        },

        destroy() {}
      });
    };

    // 3. Inicializar GrapesJS con límites de memoria estrictos
    editor = grapesjs.init({
      container: '#gjs-container',
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      panels: { defaults: [] },
      undoManager: {
        trackSelection: false,
        maxSteps: 15
      },
      plugins: ['gjs-blocks-basic', talachaColorPlugin],
      pluginsOpts: {
        'gjs-blocks-basic': {
          category: { id: 'basicos', label: 'Estructura & Básicos', open: true },
          flexGrid: true,
          labelColumn1: '1 Columna',
          labelColumn2: '2 Columnas',
          labelColumn3: '3 Columnas',
          labelColumn37: '2 Cols (30/70)',
          labelText: 'Texto',
          labelLink: 'Enlace',
          labelImage: 'Imagen',
          labelVideo: 'Video',
          labelMap: 'Mapa'
        }
      },
      blockManager: {
        appendTo: '#blocks-container'
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: '📐 Dimensiones & Espaciado',
            open: true,
            buildProps: ['width', 'min-width', 'max-width', 'height', 'margin', 'padding'],
            properties: [
              { name: 'Ancho', property: 'width' },
              { name: 'Alto', property: 'height' },
              { name: 'Margen', property: 'margin' },
              { name: 'Relleno', property: 'padding' }
            ]
          },
          {
            name: '✍️ Tipografía',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align'],
            properties: [
              { name: 'Fuente', property: 'font-family' },
              { name: 'Tamaño', property: 'font-size' },
              { name: 'Grosor', property: 'font-weight' },
              { name: 'Color Texto', property: 'color', type: 'color', defaults: '' },
              { name: 'Alineación', property: 'text-align' },
              { name: 'Interlineado', property: 'line-height' }
            ]
          },
          {
            name: '🎨 Fondo & Decoración',
            open: false,
            buildProps: ['background-color', 'background-image', 'border-radius', 'border', 'box-shadow', 'opacity'],
            properties: [
              { name: 'Color Fondo', property: 'background-color', type: 'color', defaults: '' },
              { name: 'Imagen Fondo', property: 'background-image' },
              { name: 'Borde Redondo', property: 'border-radius' },
              { name: 'Borde', property: 'border' },
              { name: 'Sombra', property: 'box-shadow' },
              { name: 'Opacidad', property: 'opacity' }
            ]
          },
          {
            name: '🔲 Disposición & Flexbox',
            open: false,
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
      layerManager: {
        appendTo: '#layers-container'
      },
      traitManager: {
        appendTo: '#traits-container'
      },
      assetManager: {
        assets: localAssets,
        upload: false,
        openAssetsOnDrop: true
      },
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
          'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600..900;1,9..144,600&family=Space+Grotesk:wght@500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap',
          'data:text/css;charset=utf-8,' + encodeURIComponent('html, body { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }')
        ]
      }
    });
    window.editor = editor;

    // 4. Bloques Oficiales de Rótulos Web (Memexicanísimos)
    const bm = editor.BlockManager;

    // Garantizar que la categoría "Estructura & Básicos" SIEMPRE esté presente
    const catBasicos = { id: 'basicos', label: 'Estructura & Básicos', open: true };
    if (!bm.get('column1')) {
      bm.add('column1', {
        label: '1 Columna',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-square" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: '<section style="padding:40px 20px; max-width:1200px; margin:0 auto; min-height:80px; box-sizing:border-box;"><div>Contenido de 1 columna</div></section>'
      });
    }
    if (!bm.get('column2')) {
      bm.add('column2', {
        label: '2 Columnas',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-columns" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: `
          <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
            <div style="flex:1 1 300px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna Izquierda</div>
            <div style="flex:1 1 300px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna Derecha</div>
          </div>
        `
      });
    }
    if (!bm.get('column3')) {
      bm.add('column3', {
        label: '3 Columnas',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-th-large" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: `
          <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
            <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 1</div>
            <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 2</div>
            <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 3</div>
          </div>
        `
      });
    }
    if (!bm.get('column3-7')) {
      bm.add('column3-7', {
        label: '2 Cols (30/70)',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-grip-vertical" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: `
          <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
            <div style="flex:0 0 30%; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Lateral (30%)</div>
            <div style="flex:1 1 65%; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Principal (70%)</div>
          </div>
        `
      });
    }
    if (!bm.get('text')) {
      bm.add('text', {
        label: 'Texto',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-font" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: '<p style="font-size:1rem; line-height:1.6; color:#F8F9FA;">Inserta aquí tu texto o descripción de párrafo.</p>'
      });
    }
    if (!bm.get('link')) {
      bm.add('link', {
        label: 'Enlace',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-link" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: '<a href="#" style="color:#55EBB2; text-decoration:underline;">Enlace personalizado</a>'
      });
    }
    if (!bm.get('image')) {
      bm.add('image', {
        label: 'Imagen',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-image" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: { type: 'image', style: { width: '100%', 'max-width': '400px', 'border-radius': '10px' } }
      });
    }
    if (!bm.get('video')) {
      bm.add('video', {
        label: 'Video',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-video" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: { type: 'video', src: 'https://www.youtube.com/embed/xODtWcCktYw', style: { width: '100%', height: '350px' } }
      });
    }
    if (!bm.get('map')) {
      bm.add('map', {
        label: 'Mapa',
        category: catBasicos,
        select: true,
        activate: true,
        media: '<i class="fas fa-map-marked-alt" style="font-size:18px; color:var(--texto-sec);"></i>',
        content: { type: 'map', style: { height: '350px', width: '100%' } }
      });
    }

    const catMemex = { id: 'rotulos_web', label: '🎨 Rótulos Web', open: true };

    bm.add('card-noticia', {
      label: 'Tarjeta Noticia',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-newspaper" style="font-size:20px; color:#D4AF37;"></i>',
      content: `
        <article style="background:#141B17; border:1px solid rgba(212,175,55,0.3); border-radius:16px; overflow:hidden; padding:16px; max-width:380px; margin:15px auto; box-shadow:0 8px 24px rgba(0,0,0,0.5); display:block;">
          <img src="/assets/news/reportero_taqueria.jpg" alt="Noticia Memexicanisimos" style="width:100%; height:200px; object-fit:cover; border-radius:10px; margin-bottom:12px; display:block;" />
          <div style="font-size:0.75rem; color:#D4AF37; font-weight:700; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.05em;">📢 Primicia Destacada</div>
          <h3 style="font-size:1.25rem; font-weight:700; color:#F8F9FA; margin-bottom:8px; line-height:1.2;">Nuevo encabezado aquí</h3>
          <p style="font-size:0.9rem; color:#9CA3AF; line-height:1.45; margin-bottom:12px;">Escribe el contenido o noticia patria aquí para que toda la banda se entere.</p>
          <a href="#" style="display:inline-block; font-size:0.85rem; font-weight:700; color:#55EBB2; text-decoration:none;">Leer crónica completa →</a>
        </article>
      `
    });

    bm.add('card-app-io', {
      label: 'Vitrina App .io',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-laptop-code" style="font-size:20px; color:#55EBB2;"></i>',
      content: `
        <div style="background:rgba(20,27,23,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:16px; padding:20px; max-width:360px; margin:15px auto; box-shadow:0 8px 24px rgba(0,0,0,0.5); display:block;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div style="background:rgba(0,104,71,0.3); border:1px solid #006847; width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">⚡</div>
            <div>
              <h3 style="color:#F8F9FA; font-size:1.15rem; font-weight:800; margin:0;">Nombre de la Herramienta</h3>
              <span style="font-size:0.75rem; color:#D4AF37; font-family:'Space Mono',monospace;">v1.0 · Open Source</span>
            </div>
          </div>
          <p style="color:#9CA3AF; font-size:0.85rem; line-height:1.4; margin-bottom:16px;">Describe la herramienta y qué problema resuelve para los usuarios.</p>
          <div style="display:flex; gap:8px;">
            <a href="#" style="flex:1; text-align:center; background:#006847; color:#FFF; padding:8px 12px; border-radius:8px; font-size:0.8rem; font-weight:700; text-decoration:none; display:inline-block;">Probar Demo</a>
            <a href="#" style="background:rgba(255,255,255,0.08); color:#F8F9FA; padding:8px 12px; border-radius:8px; font-size:0.8rem; font-weight:600; text-decoration:none; display:inline-block;">GitHub</a>
          </div>
        </div>
      `
    });

    bm.add('bloque-cta-patrio', {
      label: 'Llamada a la Acción (CTA)',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-bullseye" style="font-size:20px; color:#F5C542;"></i>',
      content: `
        <div style="background:linear-gradient(135deg, rgba(20,27,23,0.9), rgba(28,38,33,0.95)); border:2px solid rgba(212,175,55,0.4); border-radius:20px; padding:28px; text-align:center; max-width:540px; margin:20px auto; box-shadow:0 12px 32px rgba(0,0,0,0.6); display:block;">
          <div style="font-size:2.2rem; margin-bottom:8px;">🎨</div>
          <h3 style="color:#D4AF37; font-size:1.4rem; font-weight:800; margin-bottom:8px;">¡Diseña y personaliza tu proyecto!</h3>
          <p style="color:#9CA3AF; font-size:0.92rem; line-height:1.5; margin-bottom:18px;">Herramienta libre, rápida e intuitiva para embellecer cualquier sitio web sin enredos.</p>
          <a href="#" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg, #D4AF37, #B8860B); color:#111; padding:12px 28px; border-radius:999px; font-weight:800; text-decoration:none; box-shadow:0 4px 14px rgba(212,175,55,0.4); cursor:pointer;">
            <span>🚀</span> Conoce Más Aquí
          </a>
        </div>
      `
    });

    bm.add('banner-alerta-patria', {
      label: 'Banner de Alerta',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-bullhorn" style="font-size:20px; color:#CE1126;"></i>',
      content: `
        <div style="background:linear-gradient(90deg, rgba(0,104,71,0.25), rgba(206,17,38,0.25)); border-left:4px solid #D4AF37; border-radius:8px; padding:14px 18px; margin:15px auto; max-width:800px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.3rem;">📢</span>
          <div style="flex:1;">
            <strong style="color:#F5C542; font-size:0.88rem; text-transform:uppercase; letter-spacing:0.04em;">Aviso de la Comunidad:</strong>
            <span style="color:#F8F9FA; font-size:0.88rem; margin-left:6px;">Escribe el anuncio, primicia o novedad destacada aquí.</span>
          </div>
        </div>
      `
    });

    bm.add('tabla-atajos-teclado', {
      label: 'Tabla de Atajos',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-keyboard" style="font-size:20px; color:#D4AF37;"></i>',
      content: `
        <div style="background:#141B17; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px; max-width:440px; margin:15px auto; display:block;">
          <div style="font-size:0.8rem; color:#D4AF37; font-weight:700; text-transform:uppercase; margin-bottom:10px;">⌨️ Atajos Rápidos</div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.85rem; color:#F8F9FA;">
            <span>Guardar cambios</span>
            <kbd style="background:#1C2621; border:1px solid rgba(212,175,55,0.3); border-radius:4px; padding:2px 6px; font-family:'Space Mono',monospace; font-size:0.75rem; color:#55EBB2;">Ctrl + S</kbd>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.85rem; color:#F8F9FA;">
            <span>Deshacer acción</span>
            <kbd style="background:#1C2621; border:1px solid rgba(212,175,55,0.3); border-radius:4px; padding:2px 6px; font-family:'Space Mono',monospace; font-size:0.75rem; color:#55EBB2;">Ctrl + Z</kbd>
          </div>
        </div>
      `
    });

    bm.add('boton-charro', {
      label: 'Botón Dorado Charro',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-hand-pointer" style="font-size:20px; color:#D4AF37;"></i>',
      content: `
        <div style="padding:10px 0; text-align:center; display:block;">
          <a href="#" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#D4AF37,#B8860B); color:#111; padding:12px 24px; border-radius:999px; font-weight:800; text-decoration:none; box-shadow:0 4px 14px rgba(212,175,55,0.4); margin:8px; cursor:pointer;">
            <span>🇲🇽</span> ¡Pícale Aquí Compa!
          </a>
        </div>
      `
    });

    bm.add('badge-patrio', {
      label: 'Etiqueta Tricolor',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-tag" style="font-size:20px; color:#55EBB2;"></i>',
      content: `
        <div style="padding:6px 0; display:inline-block;">
          <span style="display:inline-flex; align-items:center; gap:6px; background:rgba(0,104,71,0.3); border:1px solid #006847; color:#55EBB2; padding:4px 12px; border-radius:999px; font-size:0.8rem; font-weight:700; font-family:'Space Mono',monospace;">
            🟢 100% Mexicano
          </span>
        </div>
      `
    });

    bm.add('caja-glass', {
      label: 'Caja Glassmorphism',
      category: catMemex,
      select: true,
      activate: true,
      media: '<i class="fas fa-square" style="font-size:20px; color:#9CA3AF;"></i>',
      content: `
        <div style="background:rgba(20,27,23,0.75); backdrop-filter:blur(12px); border:1px solid rgba(212,175,55,0.25); border-radius:20px; padding:28px; margin:20px auto; max-width:900px; box-shadow:0 12px 36px rgba(0,0,0,0.6); display:block;">
          <h2 style="color:#D4AF37; font-size:1.6rem; font-weight:800; margin-bottom:10px;">Nueva Sección Destacada</h2>
          <p style="color:#F8F9FA; font-size:1rem; line-height:1.5;">Arrastra aquí dentro cualquier bloque, imagen o texto para armar tu diseño.</p>
        </div>
      `
    });

    // 5. Acordeón de Categorías de Bloques con Persistencia (Sección 2)
    function setupBlockCategories() {
      const blocksBox = document.getElementById('blocks-container');
      if (!blocksBox) return;

      const collapsedState = JSON.parse(localStorage.getItem('blockCategoriesState') || '{}');

      const applyCategoryStates = () => {
        const categories = blocksBox.querySelectorAll('.gjs-block-category');
        categories.forEach((cat, idx) => {
          const titleEl = cat.querySelector('.gjs-title');
          const titleText = (titleEl ? titleEl.textContent.trim() : `cat-${idx}`).replace(/▾|▸/g, '').trim();
          const isCollapsed = Boolean(collapsedState[titleText]);

          cat.classList.toggle('collapsed', isCollapsed);
          cat.classList.toggle('gjs-open', !isCollapsed);

          const blocksList = cat.querySelector('.gjs-blocks-c');
          if (blocksList) {
            blocksList.style.display = isCollapsed ? 'none' : 'grid';
          }
        });
      };

      blocksBox.addEventListener('click', (e) => {
        const titleEl = e.target.closest('.gjs-title');
        if (!titleEl) return;
        const cat = titleEl.closest('.gjs-block-category');
        if (!cat) return;

        e.stopPropagation();
        const willCollapse = !cat.classList.contains('collapsed');
        cat.classList.toggle('collapsed', willCollapse);
        cat.classList.toggle('gjs-open', !willCollapse);

        const blocksList = cat.querySelector('.gjs-blocks-c');
        if (blocksList) {
          blocksList.style.display = willCollapse ? 'none' : 'grid';
        }

        const titleText = titleEl.textContent.replace(/▾|▸/g, '').trim();
        const state = JSON.parse(localStorage.getItem('blockCategoriesState') || '{}');
        state[titleText] = willCollapse;
        localStorage.setItem('blockCategoriesState', JSON.stringify(state));
      });

      setTimeout(applyCategoryStates, 200);
      setTimeout(applyCategoryStates, 600);
    }
    setupBlockCategories();

    // 6. Cargar componentes y estilos en el lienzo
    editor.setComponents(html);
    if (css) {
      editor.setStyle(css);
    }

    // ── GESTIÓN DINÁMICA DE PANELES Y SCROLL ──
    // ── GESTIÓN DEL DOCK IZQUIERDO Y CONMUTACIÓN DE SECCIONES (ZONA 3) ──
    const leftDock = document.getElementById('left-dock');
    const btnDockToggle = document.getElementById('btn-dock-toggle');
    const dockToggleIcon = document.getElementById('dock-toggle-icon');
    const dockButtons = document.querySelectorAll('.dock-btn');
    const panelIds = ['noticias-news', 'perfiles', 'redes-sociales', 'nosotros-apoyo', 'creador-contacto'];

    // Estado colapsado/expandido del dock persistido en localStorage
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

    function switchPagePanel(panelId) {
      const iframeDoc = editor.Canvas.getDocument();
      if (!iframeDoc) return;
      const iframeBody = iframeDoc.body;
      const sections = iframeDoc.querySelectorAll('.product-section');
      const tabButtons = iframeDoc.querySelectorAll('.tab-button');

      // Actualizar botones activos en el dock izquierdo
      dockButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === panelId);
      });

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
            setTimeout(() => {
              sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          } else {
            sec.classList.remove('active');
            sec.style.display = 'none';
            sec.style.opacity = '0';
          }
        });

        // Sincronizar botones de pestañas del lienzo
        tabButtons.forEach((btn, idx) => {
          btn.classList.toggle('active', panelIds[idx] === panelId);
        });

        // Sincronizar con el modelo de GrapesJS
        const wrapper = editor.getWrapper();
        if (wrapper) {
          sections.forEach(sec => {
            const comp = wrapper.find(`#${sec.id}`)[0];
            if (comp) {
              if (sec.id === panelId) {
                comp.addClass('active');
              } else {
                comp.removeClass('active');
              }
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

    // Escuchar clics en el dock izquierdo
    dockButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        switchPagePanel(btn.dataset.section);
      });
    });

    // ── GESTIÓN DEL DRAWER / MENÚ HAMBURGUESA (ZONA 2) ──
    const btnHamburger = document.getElementById('btn-hamburger');
    const drawerMenu = document.getElementById('drawer-menu');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');

    function openDrawer() {
      if (drawerMenu) drawerMenu.classList.add('open');
      if (drawerBackdrop) drawerBackdrop.classList.add('open');
    }

    function closeDrawer() {
      if (drawerMenu) drawerMenu.classList.remove('open');
      if (drawerBackdrop) drawerBackdrop.classList.remove('open');
    }

    if (btnHamburger) btnHamburger.addEventListener('click', openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerMenu && drawerMenu.classList.contains('open')) {
        closeDrawer();
      }
    });

    // ── BOTÓN DE APAGADO SEGURO ──
    const btnShutdown = document.getElementById('btn-shutdown');
    if (btnShutdown) {
      btnShutdown.addEventListener('click', async () => {
        const confirmed = confirm('🛑 ¿Deseas detener el servidor de Talachas y Rótulos Web y liberar el puerto 5050?');
        if (!confirmed) return;

        showToast('Apagando servidor...');
        try {
          await fetch('/api/shutdown', { method: 'POST' });
        } catch (e) {}

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

    // Configurar Scroll y Eventos al Cargar el Canvas
    editor.on('load', () => {
      const iframeDoc = editor.Canvas.getDocument();
      if (!iframeDoc) return;

      const fixStyle = iframeDoc.createElement('style');
      fixStyle.id = 'gjs-canvas-scroll-fixes';
      fixStyle.innerHTML = `
        html {
          overflow-y: auto !important;
          height: auto !important;
        }
        body {
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
        }
        /* Modo Edición de Todos los Paneles */
        body.editor-show-all .product-section {
          display: block !important;
          opacity: 1 !important;
          margin-bottom: 50px !important;
          border: 1px dashed rgba(212, 175, 55, 0.4) !important;
          border-radius: 16px;
          padding: 16px;
        }
      `;
      iframeDoc.head.appendChild(fixStyle);

      // En modo edición los enlaces dentro del lienzo no deben navegar ni saltar de sección
      iframeDoc.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          e.preventDefault();
        }
      }, true);

      // Restaurar última sección activa
      const savedSection = localStorage.getItem('editor_active_section');
      if (savedSection && (panelIds.includes(savedSection) || savedSection === 'all')) {
        switchPagePanel(savedSection);
      }
    });

    // 7. Pestañas de la barra lateral
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
        panes[tabKey].classList.toggle('active', tabKey === targetTab);
      });
    }

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
      updateBreadcrumbs(model);
      updateContextPanel(model);
    });

    editor.on('component:deselected', () => {
      updateBreadcrumbs(null);
      updateContextPanel(null);
    });

    editor.on('component:update', () => {
      setTimeout(updateLayerAttributes, 100);
      const selected = editor.getSelected();
      if (selected) {
        updateBreadcrumbs(selected);
        updateContextPanel(selected);
      }
    });

    // ===== 🥖 BARRA DE MIGAS (BREADCRUMBS) Y PANEL CONTEXTUAL (DUPLA OPERATIVA) =====
    function getTypeIcon(tag) {
      const map = {
        'a': '🔗',
        'button': '🔘',
        'div': '📦',
        'section': '📰',
        'header': '📰',
        'footer': '📰',
        'main': '📰',
        'nav': '🧭',
        'article': '📄',
        'aside': '📑',
        'p': '✏️',
        'span': '✏️',
        'h1': '📝',
        'h2': '📝',
        'h3': '📝',
        'h4': '📝',
        'h5': '📝',
        'h6': '📝',
        'img': '🖼️',
        'video': '🎬',
        'svg': '🎨',
        'ul': '📋',
        'ol': '📋',
        'li': '▪️',
        'form': '📝',
        'input': '⌨️',
        'label': '🏷️',
        'textarea': '⌨️'
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

    function updateBreadcrumbs(component) {
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

      // Eventos clic para seleccionar en el lienzo
      container.querySelectorAll('.breadcrumb-item').forEach(el => {
        el.addEventListener('click', () => {
          const cid = el.dataset.cid;
          const found = path.find(c => c.cid === cid);
          if (found) {
            editor.select(found);
          }
        });
      });
    }

    function updateContextPanel(component) {
      const content = document.getElementById('talachas-context-content');
      if (!content) return;

      if (!component) {
        content.innerHTML = `<p style="color:var(--texto-sec); font-size:0.85rem; padding:10px 0;">Selecciona un elemento en el lienzo para ver su contexto y hermanos.</p>`;
        return;
      }

      const parent = component.parent ? component.parent() : null;
      const siblings = parent ? parent.components().models : [component];
      const children = component.components ? component.components().models : [];

      // 1. Ruta de Ubicación
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

      // 2. Botones de Navegación Rápida Padre / Hijo
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

      // Botón de Edición Rápida de Texto si el elemento tiene contenido editable
      if (typeof isTextEditable === 'function' && isTextEditable(component)) {
        html += `
          <div style="padding: 4px 0 6px;">
            <button class="context-nav-btn" id="btn-context-edit-text" style="width:100%; background:rgba(212,175,55,0.18); border:1px solid var(--talacha-gold, #D4AF37); color:#F5C542; font-weight:700; font-size:0.82rem; padding:8px 12px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s ease;">
              <i class="fas fa-edit"></i> 📝 Editar Texto en Propiedades
            </button>
          </div>
        `;
      }

      // 3. Lista Plana de Hermanos (Siblings)
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

      // Eventos de botones
      const btnParent = content.querySelector('#btn-context-parent');
      if (btnParent && parent) {
        btnParent.addEventListener('click', () => editor.select(parent));
      }

      const btnChild = content.querySelector('#btn-context-child');
      if (btnChild && children.length > 0) {
        btnChild.addEventListener('click', () => editor.select(children[0]));
      }

      const btnEditText = content.querySelector('#btn-context-edit-text');
      if (btnEditText) {
        btnEditText.addEventListener('click', () => {
          if (typeof focusTextTrait === 'function') {
            focusTextTrait();
          } else {
            switchTab('traits');
          }
        });
      }

      content.querySelectorAll('.context-sibling').forEach(item => {
        item.addEventListener('click', () => {
          const cid = item.dataset.cid;
          const targetComp = siblings.find(s => s.cid === cid);
          if (targetComp) editor.select(targetComp);
        });
      });
    }

    // Alternar entre Vista Contextual Plana y Árbol Completo
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

    // Redimensionador de Sidebar y Botón Wide
    function setupSidebarResizer() {
      const resizer = document.getElementById('sidebar-resizer');
      const sidebar = document.getElementById('editor-sidebar');
      const btnToggleW = document.getElementById('btn-toggle-sidebar-w');
      const breadcrumbsBar = document.getElementById('breadcrumbs-bar');
      if (!sidebar) return;

      // Restaurar ancho previo
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
    setupSidebarResizer();

    // ===== REFINAMIENTO DEL ÁRBOL DE CAPAS (SECCIÓN 1) =====
    function updateLayerAttributes() {
      const layersBox = document.getElementById('layers-container') || document.querySelector('.gjs-layers');
      if (!layersBox) return;

      const items = layersBox.querySelectorAll('.gjs-layer');
      items.forEach(item => {
        // Nivel jerárquico contando ancestros .gjs-layer
        let depth = 0;
        let p = item.parentElement;
        while (p && p !== layersBox) {
          if (p.classList && p.classList.contains('gjs-layer')) {
            depth++;
          }
          p = p.parentElement;
        }
        item.setAttribute('data-level', Math.min(depth, 5));

        // Tipo semántico
        const text = (item.textContent || '').trim().toLowerCase();
        let type = 'div';
        if (/section|header|footer|main|nav|aside/i.test(text)) type = 'section';
        else if (/link|enlace|botón|button|\ba\b/i.test(text)) type = 'link';
        else if (/text|texto|heading|título|\bp\b|\bh\d\b|span/i.test(text)) type = 'text';
        else if (/image|imagen|video|img|svg/i.test(text)) type = 'image';

        item.setAttribute('data-type', type);

        // Flecha interactiva
        const caret = item.querySelector('.gjs-layer-caret');
        if (caret && !caret.dataset.bound) {
          caret.dataset.bound = 'true';
          caret.setAttribute('title', 'Expandir / Colapsar capa');
        }
      });
    }

    // ============================================================
    // TRAIT SEGURO DE TEXTO & ENLACES (v3.7 - Auditoría V3.5)
    // ============================================================

    // Determina estrictamente si un componente es un elemento de texto hoja editable
    function isTextEditable(component) {
      if (!component) return false;
      const type = (component.get('type') || '').toLowerCase();
      if (type === 'text' || type === 'textnode') return true;

      const tag = (component.get('tagName') || '').toLowerCase();

      // Contenedores estructurales: NUNCA se editan como texto plano (destruiría sus hijos)
      const structuralContainers = [
        'div', 'section', 'header', 'footer', 'aside', 'main', 'article',
        'nav', 'ul', 'ol', 'form', 'table', 'tbody', 'tr', 'td', 'body'
      ];

      const classesRaw = component.get('classes');
      const classes = classesRaw && classesRaw.models ? classesRaw.models.map(c => c.get('name')) :
                      (Array.isArray(classesRaw) ? classesRaw : []);
      const isBadgeOrTag = classes.some(c => typeof c === 'string' && (c.includes('badge') || c.includes('tag') || c.includes('news-live-tag')));

      // Si es contenedor y NO es un badge explícito de una sola línea, rechazar
      if (structuralContainers.includes(tag) && !isBadgeOrTag) {
        return false;
      }

      // Si tiene componentes hijos que sean contenedores o etiquetas complejas, rechazar
      const children = component.components ? component.components() : null;
      if (children && children.length > 0) {
        const hasComplexChildren = children.some(c => {
          const cTag = (c.get('tagName') || '').toLowerCase();
          return ['div', 'section', 'article', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'table', 'ul', 'ol', 'header', 'footer'].includes(cTag);
        });
        if (hasComplexChildren) return false;
      }

      const allowedTags = [
        'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'label', 'button', 'a', 'b', 'strong', 'i', 'em', 'small', 'mark'
      ];
      return allowedTags.includes(tag) || isBadgeOrTag;
    }

    // Obtener texto seguro sin desarmar el DOM
    function getComponentText(component) {
      if (!component) return '';
      const children = component.components ? component.components() : null;
      if (children && children.length > 0) {
        const textComp = children.find(c => c.is('text') || c.get('type') === 'textnode');
        if (textComp) {
          const c = textComp.get('content');
          if (c && typeof c === 'string') return c.trim();
        }
      }
      const content = component.get('content');
      if (content && typeof content === 'string') {
        const clean = content.replace(/<[^>]*>/g, '').trim();
        if (clean) return clean;
      }
      const raw = component.getInnerHTML ? component.getInnerHTML() : '';
      if (raw && typeof raw === 'string') {
        return raw.replace(/<[^>]*>/g, '').trim();
      }
      return '';
    }

    // Actualizar texto seguro protegiendo hijos existentes
    function setComponentText(component, newText) {
      if (!component || typeof newText !== 'string') return;
      const children = component.components ? component.components() : null;
      const nonTextChildren = [];
      let textComp = null;

      if (children && children.length > 0) {
        children.forEach(c => {
          const cType = (c.get('type') || '').toLowerCase();
          const cTag = (c.get('tagName') || '').toLowerCase();
          if (cType === 'textnode' || cType === 'text') {
            if (!textComp) textComp = c;
          } else if (cTag !== '') {
            nonTextChildren.push(c);
          }
        });
      }

      if (nonTextChildren.length > 0) {
        // Elemento con hijos compuestos (ej: ícono <i> o punto pulsante)
        if (textComp) {
          textComp.set('content', ' ' + newText);
          if (textComp.view && textComp.view.el) {
            textComp.view.el.nodeValue = ' ' + newText;
          } else if (component.view && component.view.el) {
            let foundTextNode = false;
            for (let node of component.view.el.childNodes) {
              if (node.nodeType === 3) {
                node.nodeValue = ' ' + newText;
                foundTextNode = true;
                break;
              }
            }
            if (!foundTextNode) {
              const doc = component.view.el.ownerDocument || document;
              component.view.el.appendChild(doc.createTextNode(' ' + newText));
            }
          }
        } else {
          component.components().add({ type: 'textnode', content: ' ' + newText });
          if (component.view && component.view.el) {
            const doc = component.view.el.ownerDocument || document;
            component.view.el.appendChild(doc.createTextNode(' ' + newText));
          }
        }
      } else {
        // Elemento de texto hoja puro (ej: .news-live-tag, h1, p, span)
        component.components().reset([]);
        component.set('content', newText);
        if (component.view && component.view.el) {
          component.view.el.textContent = newText;
        }
      }
      component.trigger('change:content');
    }

    // Añadir trait seguro al componente seleccionado
    function addTextTraitToComponent(component) {
      if (!component || !isTextEditable(component)) return;

      // Habilitar edición directa con doble clic en el lienzo
      component.set('editable', true);

      const isLink = component.is('link') || (component.get('tagName') || '').toUpperCase() === 'A';
      const existingTraits = component.get('traits') || [];
      const traitList = existingTraits.models ? existingTraits.models : (Array.isArray(existingTraits) ? existingTraits : []);
      const filteredTraits = traitList.filter(trait => {
        const name = trait.get ? trait.get('name') : (trait.name || '');
        return name !== 'text' && name !== 'text_label' && name !== 'text_content' && name !== 'content' && name !== 'innerText';
      }).map(t => (t.attributes ? t.attributes : t));

      const tag = (component.get('tagName') || '').toLowerCase();
      const isLongText = ['p'].includes(tag);

      // Cargar valor inicial en el componente Y en el modelo del trait
      const currentText = getComponentText(component);
      component.set('text_content', currentText, { silent: true });

      const textTrait = {
        type: isLongText ? 'textarea' : 'text',
        name: 'text_content',
        label: isLongText ? '📝 Contenido de Texto' : '📝 Texto visible',
        placeholder: isLongText ? 'Escribe el contenido...' : 'Escribe el texto...',
        value: currentText,
        changeProp: 1
      };
      if (isLongText) {
        textTrait.rows = 3;
      }

      let newTraits = [];
      if (isLink) {
        newTraits = [
          textTrait,
          {
            type: 'text',
            name: 'href',
            label: '🌐 Enlace (URL o #sección)',
            placeholder: 'https://... o #noticias-news'
          },
          {
            type: 'select',
            name: 'target',
            label: '↗️ Comportamiento',
            options: [
              { id: '_self', value: '_self', name: '🔗 Misma ventana' },
              { id: '_blank', value: '_blank', name: '🪟 Pestaña nueva (_blank)' }
            ]
          },
          {
            type: 'text',
            name: 'title',
            label: '💬 Texto flotante de ayuda',
            placeholder: 'Tooltip al pasar el ratón'
          }
        ];
      } else {
        newTraits = [textTrait, ...filteredTraits];
      }

      component.set('traits', newTraits);

      // Escuchar únicamente cambios directos del usuario sobre text_content
      component.off('change:text_content');
      component.on('change:text_content', () => {
        const val = component.get('text_content');
        if (typeof val === 'string') {
          setComponentText(component, val);
        }
      });

      if (editor.TraitManager && editor.TraitManager.render) {
        editor.TraitManager.render();
      }

      // Conectar sincronización reactiva inmediata (tecla por tecla) en el campo del trait
      setTimeout(() => {
        const traitInputs = document.querySelectorAll(
          '.gjs-trt-trait[data-trait-name="text_content"] input, ' +
          '.gjs-trt-trait[data-trait-name="text_content"] textarea, ' +
          '.gjs-trt-trait input[placeholder*="texto"], ' +
          '.gjs-trt-trait textarea[placeholder*="contenido"], ' +
          '.gjs-trt-trait input[placeholder*="Escribe"]'
        );
        traitInputs.forEach(input => {
          if (!input.dataset.realtimeBound) {
            input.dataset.realtimeBound = 'true';
            input.value = currentText;
            input.addEventListener('input', (e) => {
              const val = e.target.value;
              component.set('text_content', val, { silent: true });
              setComponentText(component, val);
            });
          }
        });
      }, 40);
    }

    // Atajo para enfocar el campo de texto en Propiedades
    function focusTextTrait() {
      switchTab('traits');
      setTimeout(() => {
        const textInput = document.querySelector('.gjs-trt-trait textarea') ||
                          document.querySelector('.gjs-trt-trait input[placeholder*="texto"]') ||
                          document.querySelector('.gjs-trt-trait input[placeholder*="Escribe"]') ||
                          document.querySelector('.gjs-trt-trait input');
        if (textInput) {
          textInput.focus();
          if (textInput.select) textInput.select();
        }
      }, 80);
    }
    document.addEventListener('focus-text-trait', focusTextTrait);

    function setupUniversalTextTraits() {
      try {
        const linkType = editor.DomComponents.getType('link');
        if (linkType) {
          editor.DomComponents.addType('link', {
            extend: 'link',
            model: {
              defaults: {
                ...linkType.model.prototype.defaults,
                traits: [
                  {
                    type: 'text',
                    name: 'text_content',
                    label: '📝 Texto Visible',
                    placeholder: 'Escribe el nombre del botón o enlace...',
                    changeProp: 1
                  },
                  {
                    type: 'text',
                    name: 'href',
                    label: '🌐 Enlace (URL o #sección)',
                    placeholder: 'https://... o #noticias-news'
                  },
                  {
                    type: 'select',
                    name: 'target',
                    label: '↗️ Comportamiento',
                    options: [
                      { id: '_self', value: '_self', name: '🔗 Misma ventana' },
                      { id: '_blank', value: '_blank', name: '🪟 Pestaña nueva (_blank)' }
                    ]
                  },
                  {
                    type: 'text',
                    name: 'title',
                    label: '💬 Texto flotante de ayuda',
                    placeholder: 'Tooltip al pasar el ratón'
                  }
                ]
              },
              init() {
                this.on('change:text_content', () => {
                  const newText = this.get('text_content');
                  if (typeof newText === 'string') {
                    setComponentText(this, newText);
                  }
                });
              }
            }
          });
        }

        editor.on('component:selected', (comp) => {
          if (comp) {
            addTextTraitToComponent(comp);
          }
        });

        editor.on('component:add', (comp) => {
          if (comp && isTextEditable(comp)) {
            setTimeout(() => addTextTraitToComponent(comp), 100);
          }
        });
      } catch (err) {
        console.warn('Error configurando universal text traits:', err);
      }
    }
    setupUniversalTextTraits();

    // ===== MÓDULO DOCS & CENTRO DE AYUDA (SECCIÓN 4) =====
    function setupDocsModule() {
      const btnOpenDocs = document.getElementById('btn-open-docs');
      if (!btnOpenDocs) return;

      btnOpenDocs.addEventListener('click', () => {
        closeDrawer();

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
        modal.className = 'docs-modal';
        modal.innerHTML = `
          <div class="docs-modal-content">
            <div class="docs-modal-header">
              <h2>📖 Guía de Uso & DOCS (Talachas y Rótulos Web)</h2>
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

        modal.querySelector('#docs-close').addEventListener('click', () => modal.remove());
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
    setupDocsModule();

    // 8. Selector de Dispositivos (PC / Tablet / Celular)
    const btnDesktop = document.getElementById('btn-dev-desktop');
    const btnTablet = document.getElementById('btn-dev-tablet');
    const btnMobile = document.getElementById('btn-dev-mobile');

    function setActiveDevice(btn, deviceId) {
      [btnDesktop, btnTablet, btnMobile].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editor.setDevice(deviceId);
    }

    btnDesktop.addEventListener('click', () => setActiveDevice(btnDesktop, 'desktop'));
    btnTablet.addEventListener('click', () => setActiveDevice(btnTablet, 'tablet'));
    btnMobile.addEventListener('click', () => setActiveDevice(btnMobile, 'mobile'));

    // 9. Botones de Historial y Herramientas
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnOpenAssets = document.getElementById('btn-open-assets');
    const btnDeleteItem = document.getElementById('btn-delete-item');
    const btnViewCode = document.getElementById('btn-view-code');

    btnUndo.addEventListener('click', () => editor.runCommand('core:undo'));
    btnRedo.addEventListener('click', () => editor.runCommand('core:redo'));
    btnOpenAssets.addEventListener('click', () => {
      closeDrawer();
      editor.runCommand('open-assets');
    });
    btnDeleteItem.addEventListener('click', () => {
      const selected = editor.getSelected();
      if (selected) {
        selected.remove();
        showToast('Elemento eliminado');
      } else {
        showToast('Selecciona un elemento primero', true);
      }
    });

    // 10. Modal de Código Fuente Limpio
    const codeModal = document.getElementById('code-modal');
    const codeContent = document.getElementById('code-content');
    const btnCloseCode = document.getElementById('btn-close-code');
    const btnCloseCodeFooter = document.getElementById('btn-close-code-footer');
    const btnCopyCode = document.getElementById('btn-copy-code');

    function openCodeInspector() {
      const cleanHtml = getSanitizedHtml(editor.getHtml());
      codeContent.value = cleanHtml;
      codeModal.classList.add('open');
    }

    function closeCodeInspector() {
      codeModal.classList.remove('open');
    }

    btnViewCode.addEventListener('click', () => {
      closeDrawer();
      openCodeInspector();
    });
    btnCloseCode.addEventListener('click', closeCodeInspector);
    btnCloseCodeFooter.addEventListener('click', closeCodeInspector);
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

    // 11. Modal de Estadísticas (Dashboard Ligero - Fase 3)
    const btnStats = document.getElementById('btn-stats');
    const statsModal = document.getElementById('stats-modal');
    const statsContent = document.getElementById('stats-content');
    const btnCloseStats = document.getElementById('btn-close-stats');
    const btnCloseStatsFooter = document.getElementById('btn-close-stats-footer');

    btnStats.addEventListener('click', async () => {
      closeDrawer();
      statsModal.classList.add('open');
      if (window.isStaticMode) {
        statsContent.innerHTML = `
          <div class="stat-row"><strong>Entorno:</strong> <span>GitHub Pages (Web Standalone)</span></div>
          <div class="stat-row"><strong>Plantilla:</strong> <span>Memexicanísimos Oficial v3.3</span></div>
          <div class="stat-row"><strong>Persistencia:</strong> <span>Descarga directa & LocalStorage</span></div>
          <div class="stat-row"><strong>Soberanía:</strong> <span>100% libre sin servidores externos</span></div>
        `;
        return;
      }
      statsContent.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
      try {
        const statsRes = await fetch('/api/stats');
        const json = await statsRes.json();
        if (json.success && json.data) {
          const d = json.data;
          statsContent.innerHTML = `
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label" data-i18n="stats_backups">${t('stats_backups', 'Respaldos almacenados')}</div>
                <div class="stat-value">${d.totalBackups} / 15</div>
              </div>
              <div class="stat-card">
                <div class="stat-label" data-i18n="stats_size">${t('stats_size', 'Tamaño total')}</div>
                <div class="stat-value">${d.totalSizeKB} KB</div>
              </div>
              <div class="stat-card">
                <div class="stat-label" data-i18n="stats_uptime">${t('stats_uptime', 'Tiempo activo')}</div>
                <div class="stat-value">${d.uptimeHuman}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label" data-i18n="stats_memory_rss">${t('stats_memory_rss', 'Memoria RSS')}</div>
                <div class="stat-value">${d.memory.rss}</div>
              </div>
            </div>
            <div style="font-size:0.8rem; color:var(--texto-sec); text-align:right; margin-top:8px;">
              Heap Usado: <strong>${d.memory.heapUsed}</strong>
            </div>
          `;
          applyTranslations();
        } else {
          statsContent.innerHTML = '<div style="color:#CE1126;">Error al obtener estadísticas del servidor.</div>';
        }
      } catch (err) {
        statsContent.innerHTML = '<div style="color:#CE1126;">Error de red al consultar estadísticas.</div>';
      }
    });

    const closeStatsModal = () => statsModal.classList.remove('open');
    btnCloseStats.addEventListener('click', closeStatsModal);
    btnCloseStatsFooter.addEventListener('click', closeStatsModal);
    statsModal.addEventListener('click', (e) => {
      if (e.target === statsModal) closeStatsModal();
    });

    // 12. Botón Publicar en GitHub (Fase 4 - FSM)
    const btnPublish = document.getElementById('btn-publish');
    btnPublish.addEventListener('click', async () => {
      if (publishState === 'PENDING') return;

      if (window.isStaticMode) {
        alert('🎉 ¡Reto Memexicanísimo!\n\nEn esta versión Web de GitHub Pages puedes presionar "Guardar en index.html" para descargar tu código completo con todas tus modificaciones, o tomar una captura de pantalla y compartirla en redes sociales etiquetando a @memexicanisimos (#RetoMemexicanisimo).');
        publishState = 'SUCCESS';
        updatePublishUI('SUCCESS', '¡Diseño listo! Descarga tu archivo.');
        return;
      }

      if (!confirm(t('publish_confirm', '¿Deseas compilar y publicar los cambios en GitHub?'))) {
        return;
      }

      publishState = 'PENDING';
      updatePublishUI('PENDING');

      try {
        const pubRes = await fetch('/api/publish', { method: 'POST' });
        const pubJson = await pubRes.json();
        if (pubJson.success) {
          publishState = 'SUCCESS';
          updatePublishUI('SUCCESS', pubJson.message);
        } else {
          publishState = 'FAULT';
          updatePublishUI('FAULT', pubJson.message);
        }
      } catch (err) {
        publishState = 'FAULT';
        updatePublishUI('FAULT', err.message);
      }
    });

    // 13. Selector de Temas (Fase 5)
    const themeSelector = document.getElementById('theme-selector');
    const savedTheme = localStorage.getItem('memex-theme') || 'patria';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;

    themeSelector.addEventListener('change', (e) => {
      const themeVal = e.target.value;
      document.documentElement.setAttribute('data-theme', themeVal);
      localStorage.setItem('memex-theme', themeVal);
    });

    // 14. Selector de Idioma (Fase 6)
    const langSelector = document.getElementById('lang-selector');
    langSelector.value = currentLang;
    await loadTranslations(currentLang);

    langSelector.addEventListener('change', async (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('memex-lang', selectedLang);
      currentLang = selectedLang;
      await loadTranslations(selectedLang);
      updatePublishUI(publishState);
    });

    // 15. Toggle Sidebar
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('editor-sidebar');
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      btnToggleSidebar.classList.toggle('active');
      editor.refresh();
    });

    // 16. Modo Vista Previa
    const btnPreview = document.getElementById('btn-preview');
    let isPreview = false;
    btnPreview.addEventListener('click', () => {
      isPreview = !isPreview;
      editor.runCommand(isPreview ? 'preview' : 'preview');
      btnPreview.innerHTML = isPreview 
        ? '<i class="fas fa-edit"></i> <span data-i18n="btn_edit_mode">' + t('btn_edit_mode', 'Modo Edición') + '</span>' 
        : '<i class="fas fa-eye"></i> <span data-i18n="btn_preview">' + t('btn_preview', 'Vista Previa') + '</span>';
      btnPreview.style.borderColor = isPreview ? 'var(--oro-charro)' : '';
      btnPreview.classList.toggle('active', isPreview);
    });

    // 17. Guardar en Disco con FSM y Sanitización
    const btnSave = document.getElementById('btn-save-disk');
    btnSave.addEventListener('click', async () => {
      btnSave.disabled = true;
      btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>' + t('btn_saving', 'Guardando...') + '</span>';

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
          btnSave.innerHTML = '<i class="fas fa-check"></i> <span>¡Descargado!</span>';
          setTimeout(() => {
            btnSave.innerHTML = '<i class="fas fa-save"></i> <span data-i18n="btn_save">' + t('btn_save', 'Guardar en index.html') + '</span>';
            btnSave.disabled = false;
          }, 2000);
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
          btnSave.innerHTML = '<i class="fas fa-check"></i> <span>' + t('btn_saved', '¡Guardado!') + '</span>';
          setTimeout(() => {
            btnSave.innerHTML = '<i class="fas fa-save"></i> <span data-i18n="btn_save">' + t('btn_save', 'Guardar en index.html') + '</span>';
            btnSave.disabled = false;
          }, 2000);
        } else {
          showToast('Error al guardar: ' + (saveResult.message || 'Desconocido'), true);
          btnSave.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Reintentar</span>';
          btnSave.disabled = false;
        }
      } catch (err) {
        showToast('Fallo de conexión al guardar: ' + err.message, true);
        btnSave.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Error</span>';
        btnSave.disabled = false;
      }
    });

    // 19. Centro de Salud, SEO & Accesibilidad (Fases A & B)
    const btnDiagnostics = document.getElementById('btn-diagnostics');
    const diagModal = document.getElementById('diag-modal');
    const btnCloseDiag = document.getElementById('btn-close-diag');
    const btnCloseDiagFooter = document.getElementById('btn-close-diag-footer');
    const btnRerunDiag = document.getElementById('btn-rerun-diag');
    const btnExportDiag = document.getElementById('btn-export-diag');
    const diagTabBtns = document.querySelectorAll('.diag-tab-btn');

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
      
      contentBox.innerHTML = '<div style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Analizando contratos, enlaces y accesibilidad...</p></div>';
      scoreNum.textContent = '--';
      scoreNum.className = 'score-circle';

      try {
        const integrity = await MemexDiagnostics.runIntegritySuite(editor);
        const a11ySeo = await MemexDiagnostics.runA11yAndSeoSuite(editor);

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

    if (btnDiagnostics) {
      btnDiagnostics.addEventListener('click', () => {
        closeDrawer();
        diagModal.classList.add('open');
        executeDiagnostics();
      });
    }

    const closeDiag = () => diagModal.classList.remove('open');
    if (btnCloseDiag) btnCloseDiag.addEventListener('click', closeDiag);
    if (btnCloseDiagFooter) btnCloseDiagFooter.addEventListener('click', closeDiag);
    if (btnRerunDiag) btnRerunDiag.addEventListener('click', executeDiagnostics);
    if (btnExportDiag) {
      btnExportDiag.addEventListener('click', () => {
        if (currentDiagReport) {
          MemexDiagnostics.downloadReport(currentDiagReport);
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

    // 20. Generador de Capturas HD con Puppeteer-core (Fase C)
    const btnScreenshot = document.getElementById('btn-screenshot');
    const screenshotModal = document.getElementById('screenshot-modal');
    const btnCloseScreenshot = document.getElementById('btn-close-screenshot');
    const btnCloseScreenshotFooter = document.getElementById('btn-close-screenshot-footer');
    const resOptions = document.querySelectorAll('.btn-res-option');
    const btnExecuteScreenshot = document.getElementById('btn-execute-screenshot');
    const chkFullPage = document.getElementById('chk-fullpage');
    const screenshotResultArea = document.getElementById('screenshot-result-area');

    let selectedScreenshotDevice = 'desktop';

    if (btnScreenshot) {
      btnScreenshot.addEventListener('click', () => {
        closeDrawer();
        screenshotModal.classList.add('open');
        screenshotResultArea.style.display = 'none';
      });
    }

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
        screenshotResultArea.style.display = 'block';
        screenshotResultArea.innerHTML = '<div style="text-align:center; padding:15px;"><i class="fas fa-camera fa-2x fa-bounce"></i><p style="margin-top:8px;">Renderizando en Chrome local...</p></div>';

        try {
          const currentTheme = localStorage.getItem('memex-theme') || 'patria';
          const isFullPage = chkFullPage ? chkFullPage.checked : false;

          const res = await fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device: selectedScreenshotDevice,
              fullPage: isFullPage,
              theme: currentTheme
            })
          });

          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
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
            showToast('¡Captura generada exitosamente!');
          } else {
            screenshotResultArea.innerHTML = `<div style="color:#CE1126; padding:10px;">${json.message || 'Error al generar captura'}</div>`;
            showToast('Error al capturar pantalla', true);
          }
        } catch (err) {
          screenshotResultArea.innerHTML = `<div style="color:#CE1126; padding:10px;">Fallo de conexión: ${err.message}</div>`;
          showToast('Fallo al conectar con el motor de capturas', true);
        } finally {
          btnExecuteScreenshot.disabled = false;
          btnExecuteScreenshot.innerHTML = '<i class="fas fa-camera"></i> <span>Generar Captura Ahora</span>';
        }
      });
    }

    // 21. Gestor Universal de Proyectos y Carpetas
    setupProjectSelector();
    await loadRecentProjects();

  } catch (err) {
    console.error('Error al inicializar editor:', err);
    showToast('Error cargando la web: ' + err.message, true);
  }
}

// ============================================================
// 📁 GESTOR UNIVERSAL DE PROYECTOS Y CARPETAS (FASE 2)
// ============================================================
async function loadRecentProjects() {
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
          const targetPath = btn.dataset.path;
          await switchProject(targetPath);
        });
      });
    } else {
      container.innerHTML = '<div style="color:var(--texto-sec); font-size:0.75rem; padding:6px 0;">No hay proyectos recientes</div>';
    }
  } catch (err) {
    console.warn('Error cargando proyectos recientes:', err);
  }
}

async function switchProject(targetPath) {
  if (!targetPath) return;
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
      showToast(json.message || 'Error al cambiar de proyecto', true);
    }
  } catch (err) {
    showToast('Fallo al conmutar proyecto: ' + err.message, true);
  }
}

function setupProjectSelector() {
  const btnOpenProject = document.getElementById('btn-open-project');
  if (!btnOpenProject) return;

  btnOpenProject.addEventListener('click', async () => {
    try {
      if (window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker();
        const folderName = dirHandle.name;
        const userPath = prompt(
          `📁 Carpeta seleccionada: "${folderName}"\n\nIngresa o confirma la ruta absoluta en tu disco:\n(Ejemplo: /home/usuario/mi-sitio-web)`,
          folderName.startsWith('/') ? folderName : `/${folderName}`
        );
        if (userPath && userPath.trim()) {
          await switchProject(userPath.trim());
        }
      } else {
        throw new Error('Fallback required');
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      // Fallback: input file con webkitdirectory
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', async (ev) => {
        const files = ev.target.files;
        if (files && files.length > 0) {
          const sample = files[0];
          const folderName = sample.webkitRelativePath.split('/')[0];
          const userPath = prompt(
            `📁 Carpeta seleccionada: "${folderName}"\n\nIngresa la ruta absoluta completa para que el servidor local pueda acceder a los archivos:\n(Ejemplo: /home/usuario/mi-sitio-web)`,
            folderName.startsWith('/') ? folderName : `/${folderName}`
          );
          if (userPath && userPath.trim()) {
            await switchProject(userPath.trim());
          }
        }
        document.body.removeChild(input);
      });

      input.click();
    }
  });
}

function startEditorApp() {
  if (typeof grapesjs !== 'undefined') {
    initEditor();
  } else {
    console.warn('GrapesJS aún no está listo... esperando carga');
    setTimeout(startEditorApp, 60);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startEditorApp);
} else {
  startEditorApp();
}
