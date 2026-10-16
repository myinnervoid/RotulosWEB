/**
 * ============================================================
 * 🎨 color-plugin.js — Plugin de Color Avanzado con Paleta Española
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

/** Mapa de nombres de colores en español (incluye Pigmentos Sanzo Wada × México) → valor CSS */
export const SPANISH_COLOR_MAP = {
  // Clásicos & Compatibilidad de Contratos
  'azul': '#2563EB',
  'azul cielo': '#0093a5',
  'celeste': '#7DD3FC',
  'azul marino': '#051230',
  'azul rey': '#1c4286',
  'verde': '#1a7444',
  'verde bandera': '#006847',
  'verde neon': '#00b49b',
  'verde menta': '#00b49b',
  'verde oscuro': '#004f46',
  'rojo': '#cc1236',
  'rojo bandera': '#CE1126',
  'rojo vivo': '#eb5324',
  'rojo coral': '#e2625e',
  'dorado': '#e2b540',
  'oro': '#e2b540',
  'oro charro': '#e2b540',
  'oro brillante': '#f99d1b',
  'amarillo': '#fff200',
  'amarillo mostaza': '#e2b540',
  'blanco': '#f5ecc2',
  'blanco hueso': '#f5ecc2',
  'negro': '#111314',
  'negro carbon': '#111314',
  'naranja': '#f37420',
  'naranja pastor': '#f37420',
  'morado': '#652c77',
  'purpura': '#9333EA',
  'bugambilia': '#b73f74',
  'rosa': '#f27291',
  'rosado': '#f27291',
  'gris': '#7b8a84',
  'gris claro': '#c2ae93',
  'gris oscuro': '#34454c',
  'cafe': '#8c4727',
  'marron': '#8c4727',
  // Pigmentos Oficiales Sanzo Wada × Identidad Mexicana
  'obsidiana': '#111314',
  'indigo profundo': '#051230',
  'azul tirio': '#12354e',
  'blanco cal': '#f5ecc2',
  'papel amate': '#ffefae',
  'cantera': '#ebd3a2',
  'arena ecru': '#c2ae93',
  'carmesi wada': '#cc1236',
  'barro oaxaca': '#d96629',
  'chile guajillo': '#eb5324',
  'cempasuchil': '#f37420',
  'oro cempasuchil': '#f99d1b',
  'ocre charro': '#e2b540',
  'amarillo rotulo': '#fff200',
  'amarillo feria': '#ffdd00',
  'verde jade': '#00b49b',
  'verde nopal': '#1a7444',
  'verde feria': '#004f46',
  'azul talavera': '#0093a5',
  'azul cobalto': '#006eb8',
  'azul mercado': '#1c4286',
  'rosa mexicano': '#b73f74',
  'rosa alfenique': '#f27291',
  'transparente': 'transparent',
  'ninguno': 'transparent'
};

/** Paleta rápida de 1 clic con Pigmentos Sanzo Wada × Identidad Mexicana (Combos #144, #154, #179, #190, #284) */
export const QUICK_PALETTE = [
  { color: '#cc1236', label: 'Carmesí Wada (#154)' },
  { color: '#1a7444', label: 'Verde Nopal / Patria' },
  { color: '#00b49b', label: 'Jade Mesoamericano (#284)' },
  { color: '#f99d1b', label: 'Oro Cempasúchil' },
  { color: '#e2b540', label: 'Ocre Charro' },
  { color: '#fff200', label: 'Amarillo Rótulo (#154)' },
  { color: '#f37420', label: 'Naranja Cempasúchil (#144)' },
  { color: '#d96629', label: 'Barro de Oaxaca (#190)' },
  { color: '#b73f74', label: 'Rosa Mexicano (#144)' },
  { color: '#006eb8', label: 'Azul Cobalto Rótulo (#154)' },
  { color: '#0093a5', label: 'Azul Talavera' },
  { color: '#f5ecc2', label: 'Blanco a la Cal (Wada)' },
  { color: '#ebd3a2', label: 'Cantera de Oaxaca (#190)' },
  { color: '#111314', label: 'Negro Obsidiana (#190)' },
  { color: '#051230', label: 'Índigo Nocturno (#155)' },
  { color: 'transparent', label: 'Transparente' }
];

let sessionRecentColors = ['#cc1236', '#f99d1b', '#00b49b', '#006eb8', '#f5ecc2', '#111314'];

function normalizeColorName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Resuelve un nombre de color en español o valor CSS a su valor final.
 * @param {string} raw
 * @returns {string}
 */
export function resolveColorInput(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  const normalized = normalizeColorName(trimmed);
  if (SPANISH_COLOR_MAP[normalized]) {
    return SPANISH_COLOR_MAP[normalized];
  }
  return trimmed;
}

/**
 * Convierte un color CSS a formato hexadecimal.
 * @param {string} color
 * @returns {string}
 */
export function colorToHex(color) {
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

/**
 * Plugin de GrapesJS que reemplaza el picker de color nativo
 * con uno con soporte de nombres en español y paleta rápida.
 * @param {object} ed - Instancia de GrapesJS editor
 */
export const talachaColorPlugin = (ed) => {
  ed.StyleManager.addType('color', {
    create({ props: _props, change: _change, updateStyle }) {
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
