/**
 * ============================================================
 * 🎨 color-plugin.js — Plugin de Color Avanzado con Paleta Española
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

/** Mapa de nombres de colores en español → valor CSS */
export const SPANISH_COLOR_MAP = {
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

/** Paleta rápida de 1 clic con colores patrios y esenciales */
export const QUICK_PALETTE = [
  { color: '#006847', label: 'Verde Bandera' },
  { color: '#55EBB2', label: 'Verde Neón' },
  { color: '#D4AF37', label: 'Oro Charro' },
  { color: '#F5C542', label: 'Oro Brillante' },
  { color: '#CE1126', label: 'Rojo Bandera' },
  { color: '#FF4D4D', label: 'Rojo Coral' },
  { color: '#F8F9FA', label: 'Blanco Hueso' },
  { color: '#111111', label: 'Negro Carbón' },
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
