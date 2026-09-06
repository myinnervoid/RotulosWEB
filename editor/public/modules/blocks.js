/**
 * ============================================================
 * 🧱 blocks.js — Bloques GrapesJS (Básicos + Rótulos Web)
 * Rótulos Web / Memexicanísimos Studio v3.3
 * ============================================================
 */

/**
 * Registra todos los bloques de GrapesJS: básicos y de Rótulos Web.
 * @param {object} editor - Instancia activa de GrapesJS
 */
export function registerBlocks(editor) {
  const bm = editor.BlockManager;

  const catBasicos = { id: 'basicos', label: 'Estructura & Básicos', open: true };

  if (!bm.get('column1')) {
    bm.add('column1', {
      label: '1 Columna', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-square" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: '<section style="padding:40px 20px; max-width:1200px; margin:0 auto; min-height:80px; box-sizing:border-box;"><div>Contenido de 1 columna</div></section>'
    });
  }
  if (!bm.get('column2')) {
    bm.add('column2', {
      label: '2 Columnas', category: catBasicos, select: true, activate: true,
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
      label: '3 Columnas', category: catBasicos, select: true, activate: true,
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
      label: '2 Cols (30/70)', category: catBasicos, select: true, activate: true,
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
      label: 'Texto', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-font" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: '<p style="font-size:1rem; line-height:1.6; color:#F8F9FA;">Inserta aquí tu texto o descripción de párrafo.</p>'
    });
  }
  if (!bm.get('link')) {
    bm.add('link', {
      label: 'Enlace', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-link" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: '<a href="#" style="color:#55EBB2; text-decoration:underline;">Enlace personalizado</a>'
    });
  }
  if (!bm.get('image')) {
    bm.add('image', {
      label: 'Imagen', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-image" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: { type: 'image', style: { width: '100%', 'max-width': '400px', 'border-radius': '10px' } }
    });
  }
  if (!bm.get('video')) {
    bm.add('video', {
      label: 'Video', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-video" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: { type: 'video', src: 'https://www.youtube.com/embed/xODtWcCktYw', style: { width: '100%', height: '350px' } }
    });
  }
  if (!bm.get('map')) {
    bm.add('map', {
      label: 'Mapa', category: catBasicos, select: true, activate: true,
      media: '<i class="fas fa-map-marked-alt" style="font-size:18px; color:var(--texto-sec);"></i>',
      content: { type: 'map', style: { height: '350px', width: '100%' } }
    });
  }

  // ── BLOQUES RÓTULOS WEB (Memexicanísimos) ──────────────────
  const catMemex = { id: 'rotulos_web', label: '🎨 Rótulos Web', open: true };

  bm.add('card-noticia', {
    label: 'Tarjeta Noticia', category: catMemex, select: true, activate: true,
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
    label: 'Vitrina App .io', category: catMemex, select: true, activate: true,
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
    label: 'Llamada a la Acción (CTA)', category: catMemex, select: true, activate: true,
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
    label: 'Banner de Alerta', category: catMemex, select: true, activate: true,
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
    label: 'Tabla de Atajos', category: catMemex, select: true, activate: true,
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
    label: 'Botón Dorado Charro', category: catMemex, select: true, activate: true,
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
    label: 'Etiqueta Tricolor', category: catMemex, select: true, activate: true,
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
    label: 'Caja Glassmorphism', category: catMemex, select: true, activate: true,
    media: '<i class="fas fa-square" style="font-size:20px; color:#9CA3AF;"></i>',
    content: `
      <div style="background:rgba(20,27,23,0.75); backdrop-filter:blur(12px); border:1px solid rgba(212,175,55,0.25); border-radius:20px; padding:28px; margin:20px auto; max-width:900px; box-shadow:0 12px 36px rgba(0,0,0,0.6); display:block;">
        <h2 style="color:#D4AF37; font-size:1.6rem; font-weight:800; margin-bottom:10px;">Nueva Sección Destacada</h2>
        <p style="color:#F8F9FA; font-size:1rem; line-height:1.5;">Arrastra aquí dentro cualquier bloque, imagen o texto para armar tu diseño.</p>
      </div>
    `
  });

  // ── ACORDEÓN DE CATEGORÍAS CON PERSISTENCIA ──────────────────
  setupBlockCategories();
}

/**
 * Aplica comportamiento de acordeón a las categorías de bloques GrapesJS
 * con persistencia en localStorage.
 */
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
