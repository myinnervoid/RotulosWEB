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

  // ── BLOQUES: BLOG & EDITORIAL ────────────────────────────
  const catBlog = { id: 'blog', label: '📰 Blog & Editorial', open: true };

  bm.add('blog-articulo-narracion', {
    label: 'Artículo & Narración', category: catBlog, select: true, activate: true,
    media: '<i class="fas fa-paragraph" style="font-size:20px; color:#F5C542;"></i>',
    content: `
      <article style="max-width:820px; margin:30px auto; padding:32px 24px; background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.5); font-family:'Space Grotesk',sans-serif; color:#F8F9FA;">
        <p style="font-size:1.15rem; line-height:1.8; margin-bottom:20px; color:#E5E7EB;">
          <span style="float:left; font-size:3.2rem; line-height:0.85; font-weight:800; color:#D4AF37; padding-right:12px; font-family:'Fraunces',serif;">E</span>ste es el punto de partida de la narración. Escribe aquí el desarrollo de tu crónica, análisis profundo o artículo periodístico con un ritmo visual claro y tipografía de máxima legibilidad.
        </p>
        <blockquote style="margin:28px 0; padding:16px 24px; border-left:4px solid #D4AF37; background:rgba(212,175,55,0.06); border-radius:0 12px 12px 0; font-size:1.2rem; font-style:italic; color:#F5C542; line-height:1.6;">
          "Una frase destacada o declaración contundente que resuma el impacto principal del artículo."
        </blockquote>
        <p style="font-size:1.05rem; line-height:1.8; color:#D1D5DB; margin-bottom:16px;">
          Continúa el relato con datos comprobables, argumentos contextuales o testimonios. Los párrafos fluidos mantienen al lector enganchado desde el inicio hasta el desenlace de la historia.
        </p>
      </article>
    `
  });

  bm.add('blog-caja-titular', {
    label: 'Encabezado con Firma', category: catBlog, select: true, activate: true,
    media: '<i class="fas fa-heading" style="font-size:20px; color:#55EBB2;"></i>',
    content: `
      <header style="max-width:860px; margin:30px auto; padding:20px; text-align:left; font-family:'Space Grotesk',sans-serif;">
        <div style="display:inline-block; background:rgba(0,104,71,0.3); border:1px solid #006847; color:#55EBB2; padding:4px 14px; border-radius:999px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:14px; font-family:'Space Mono',monospace;">
          Investigación & Reportaje
        </div>
        <h1 style="font-size:2.4rem; font-weight:800; color:#F8F9FA; line-height:1.2; margin-bottom:14px;">
          Título de Impacto: La Crónica Central del Momento
        </h1>
        <p style="font-size:1.15rem; color:#9CA3AF; line-height:1.5; margin-bottom:24px;">
          Una bajada o subtítulo explicativo que detalla en dos líneas el alcance y la premisa fundamental de esta entrega.
        </p>
        <div style="display:flex; align-items:center; gap:14px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.08);">
          <img src="/assets/news/reportero_zocalo.jpg" alt="Autor" style="width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid #D4AF37;" />
          <div>
            <div style="font-weight:700; color:#F8F9FA; font-size:0.95rem;">Eduardo Fuentes</div>
            <div style="font-size:0.78rem; color:#9CA3AF; font-family:'Space Mono',monospace;">4 Oct 2026 · 5 min de lectura</div>
          </div>
        </div>
      </header>
    `
  });

  bm.add('blog-feed-grid', {
    label: 'Despliegue de Notas', category: catBlog, select: true, activate: true,
    media: '<i class="fas fa-layer-group" style="font-size:20px; color:#D4AF37;"></i>',
    content: `
      <section style="max-width:1100px; margin:30px auto; padding:20px; font-family:'Space Grotesk',sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px;">
          <div>
            <span style="font-size:0.78rem; color:#D4AF37; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace;">Archivo Editorial</span>
            <h2 style="font-size:1.8rem; font-weight:800; color:#F8F9FA; margin-top:4px;">Últimas Publicaciones</h2>
          </div>
          <a href="#" style="color:#55EBB2; font-size:0.9rem; font-weight:700; text-decoration:none;">Ver todas →</a>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:24px;">
          <article style="flex:1 1 300px; background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; display:flex; flex-direction:column;">
            <img src="/assets/news/reportero_taqueria.jpg" alt="Nota 1" style="width:100%; height:180px; object-fit:cover;" />
            <div style="padding:18px; display:flex; flex-direction:column; flex:1;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace; margin-bottom:6px;">REPORTAJE · AYER</span>
              <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin-bottom:8px; line-height:1.3;">Primer gran acontecimiento registrado</h3>
              <p style="font-size:0.85rem; color:#9CA3AF; line-height:1.45; margin-bottom:14px; flex:1;">Breve resumen introductorio para captar el interés inmediato del lector.</p>
              <a href="#" style="color:#55EBB2; font-size:0.85rem; font-weight:700; text-decoration:none;">Leer artículo →</a>
            </div>
          </article>
          <article style="flex:1 1 300px; background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; display:flex; flex-direction:column;">
            <img src="/assets/news/reportero_mercado.jpg" alt="Nota 2" style="width:100%; height:180px; object-fit:cover;" />
            <div style="padding:18px; display:flex; flex-direction:column; flex:1;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace; margin-bottom:6px;">CRÓNICA · HACE 2 DÍAS</span>
              <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin-bottom:8px; line-height:1.3;">Segunda entrega de la serie especial</h3>
              <p style="font-size:0.85rem; color:#9CA3AF; line-height:1.45; margin-bottom:14px; flex:1;">Análisis testimonial directo desde las calles con imágenes exclusivas.</p>
              <a href="#" style="color:#55EBB2; font-size:0.85rem; font-weight:700; text-decoration:none;">Leer artículo →</a>
            </div>
          </article>
          <article style="flex:1 1 300px; background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:14px; overflow:hidden; display:flex; flex-direction:column;">
            <img src="/assets/news/reportero_plaza.jpg" alt="Nota 3" style="width:100%; height:180px; object-fit:cover;" />
            <div style="padding:18px; display:flex; flex-direction:column; flex:1;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace; margin-bottom:6px;">TECNOLOGÍA · HACE 3 DÍAS</span>
              <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin-bottom:8px; line-height:1.3;">Balance de la semana y aprendizajes</h3>
              <p style="font-size:0.85rem; color:#9CA3AF; line-height:1.45; margin-bottom:14px; flex:1;">Compilatorio de avances y recursos destacados para la comunidad.</p>
              <a href="#" style="color:#55EBB2; font-size:0.85rem; font-weight:700; text-decoration:none;">Leer artículo →</a>
            </div>
          </article>
        </div>
      </section>
    `
  });

  bm.add('blog-media-texto', {
    label: 'Texto con Imagen al Lado', category: catBlog, select: true, activate: true,
    media: '<i class="fas fa-align-left" style="font-size:20px; color:#7AA2E7;"></i>',
    content: `
      <section style="max-width:1050px; margin:30px auto; padding:24px; display:flex; flex-wrap:wrap; align-items:center; gap:36px; font-family:'Space Grotesk',sans-serif;">
        <div style="flex:1 1 380px;">
          <img src="/assets/news/reportero_taqueria.jpg" alt="Fotografía descriptiva" style="width:100%; height:320px; object-fit:cover; border-radius:16px; border:1px solid rgba(212,175,55,0.3); box-shadow:0 12px 30px rgba(0,0,0,0.6);" />
          <p style="font-size:0.8rem; color:#9CA3AF; font-style:italic; margin-top:8px; text-align:center; font-family:'Space Mono',monospace;">Figura 1: Registro en campo y documentación testimonial.</p>
        </div>
        <div style="flex:1 1 380px;">
          <span style="font-size:0.75rem; color:#55EBB2; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace; letter-spacing:0.05em;">Contexto & Análisis</span>
          <h2 style="font-size:1.85rem; font-weight:800; color:#F8F9FA; margin:8px 0 14px; line-height:1.25;">
            Descripción Detallada con Enfoque Visual
          </h2>
          <p style="font-size:0.98rem; line-height:1.7; color:#D1D5DB; margin-bottom:16px;">
            Este módulo empareja imagen y texto para explicar proyectos, obras, procedimientos o notas informativas con un balance visual balanceado que no fatiga la lectura.
          </p>
          <ul style="padding-left:20px; color:#9CA3AF; font-size:0.92rem; line-height:1.6; margin-bottom:20px;">
            <li>Punto clave analizado en campo sin intermediarios.</li>
            <li>Sustento fotográfico y verificación de datos duros.</li>
            <li>Conclusiones accionables para el lector y la comunidad.</li>
          </ul>
          <a href="#" style="display:inline-block; background:#006847; color:#FFF; padding:10px 22px; border-radius:8px; font-weight:700; font-size:0.88rem; text-decoration:none;">Profundizar en el tema →</a>
        </div>
      </section>
    `
  });

  // ── BLOQUES: PERSONAL & PORTAFOLIO ────────────────────────
  const catPortfolio = { id: 'portafolio', label: '👤 Personal & Portafolio', open: true };

  bm.add('portfolio-avatar-bio', {
    label: 'Avatar Circular & Bio', category: catPortfolio, select: true, activate: true,
    media: '<i class="fas fa-user-circle" style="font-size:20px; color:#D4AF37;"></i>',
    content: `
      <section style="max-width:760px; margin:30px auto; padding:32px 24px; text-align:center; font-family:'Space Grotesk',sans-serif;">
        <div style="position:relative; width:130px; height:130px; margin:0 auto 18px;">
          <img src="/assets/news/reportero_zocalo.jpg" alt="Foto de Perfil" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:3px solid #D4AF37; box-shadow:0 8px 24px rgba(212,175,55,0.35);" />
          <span style="position:absolute; bottom:6px; right:6px; width:18px; height:18px; background:#55EBB2; border:3px solid #060907; border-radius:50%;" title="Disponible para proyectos"></span>
        </div>
        <h1 style="font-size:2.2rem; font-weight:800; color:#F8F9FA; margin-bottom:6px;">Eduardo Fuentes</h1>
        <p style="font-size:1.05rem; color:#D4AF37; font-weight:700; font-family:'Space Mono',monospace; margin-bottom:14px;">
          Fotógrafo & Creador de Software Soberano
        </p>
        <p style="font-size:0.95rem; color:#9CA3AF; line-height:1.6; max-width:580px; margin:0 auto 22px;">
          Especialista en captura de estudio, narrativa visual y herramientas locales libres. Ayudo a creadores y marcas a forjar su presencia digital sin plataformas cautivas.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <a href="#" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#111; padding:10px 24px; border-radius:999px; font-weight:800; font-size:0.88rem; text-decoration:none;">Contactar Conmigo</a>
          <a href="#" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#F8F9FA; padding:10px 20px; border-radius:999px; font-weight:600; font-size:0.88rem; text-decoration:none;">Ver Portafolio</a>
        </div>
      </section>
    `
  });

  bm.add('portfolio-skills-grid', {
    label: 'Grid de Conocimientos', category: catPortfolio, select: true, activate: true,
    media: '<i class="fas fa-th" style="font-size:20px; color:#55EBB2;"></i>',
    content: `
      <section style="max-width:980px; margin:30px auto; padding:20px; font-family:'Space Grotesk',sans-serif;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="font-size:0.75rem; color:#D4AF37; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace;">Stack & Capacidades</span>
          <h2 style="font-size:1.8rem; font-weight:800; color:#F8F9FA; margin-top:4px;">Habilidades & Herramientas</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:18px;">
          <div style="background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; text-align:center;">
            <div style="font-size:2rem; color:#D4AF37; margin-bottom:10px;">📸</div>
            <h3 style="font-size:1.05rem; font-weight:700; color:#F8F9FA; margin-bottom:6px;">Fotografía Réflex & Móvil</h3>
            <p style="font-size:0.8rem; color:#9CA3AF; margin-bottom:10px;">Composición, iluminación de 3 puntos y revelado RAW.</p>
            <span style="font-size:0.72rem; color:#55EBB2; font-family:'Space Mono',monospace;">NIVEL EXPERTO · 10+ AÑOS</span>
          </div>
          <div style="background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; text-align:center;">
            <div style="font-size:2rem; color:#55EBB2; margin-bottom:10px;">💻</div>
            <h3 style="font-size:1.05rem; font-weight:700; color:#F8F9FA; margin-bottom:6px;">Desarrollo Web Soberano</h3>
            <p style="font-size:0.8rem; color:#9CA3AF; margin-bottom:10px;">JavaScript ES6+, HTML5 semántico, Node.js y GrapesJS.</p>
            <span style="font-size:0.72rem; color:#55EBB2; font-family:'Space Mono',monospace;">AVANZADO · FULL STACK</span>
          </div>
          <div style="background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; text-align:center;">
            <div style="font-size:2rem; color:#7AA2E7; margin-bottom:10px;">🎨</div>
            <h3 style="font-size:1.05rem; font-weight:700; color:#F8F9FA; margin-bottom:6px;">Dirección de Arte & UI</h3>
            <p style="font-size:0.8rem; color:#9CA3AF; margin-bottom:10px;">Identidad visual mexicana, colorimetría y diseño responsivo.</p>
            <span style="font-size:0.72rem; color:#55EBB2; font-family:'Space Mono',monospace;">CREATIVO · SENIOR</span>
          </div>
          <div style="background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; text-align:center;">
            <div style="font-size:2rem; color:#C792EA; margin-bottom:10px;">🎙️</div>
            <h3 style="font-size:1.05rem; font-weight:700; color:#F8F9FA; margin-bottom:6px;">Streaming & Producción</h3>
            <p style="font-size:0.8rem; color:#9CA3AF; margin-bottom:10px;">OBS Studio, V4L2, sincronización de cámaras y MASV.</p>
            <span style="font-size:0.72rem; color:#55EBB2; font-family:'Space Mono',monospace;">PRODUCCIÓN EN VIVO</span>
          </div>
        </div>
      </section>
    `
  });

  bm.add('portfolio-perfil-cv', {
    label: 'Ficha de Perfil CV', category: catPortfolio, select: true, activate: true,
    media: '<i class="fas fa-id-card" style="font-size:20px; color:#C792EA;"></i>',
    content: `
      <section style="max-width:820px; margin:30px auto; padding:28px; background:#141B17; border:1px solid rgba(212,175,55,0.3); border-radius:16px; font-family:'Space Grotesk',sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div>
            <h2 style="font-size:1.5rem; font-weight:800; color:#F8F9FA; margin:0;">Perfil Profesional & Hitos</h2>
            <span style="font-size:0.8rem; color:#D4AF37; font-family:'Space Mono',monospace;">Trayectoria verificada</span>
          </div>
          <a href="#" style="background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#D4AF37; padding:8px 18px; border-radius:8px; font-size:0.82rem; font-weight:700; text-decoration:none;">📄 Descargar CV (PDF)</a>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:18px; margin-bottom:24px;">
          <div style="background:rgba(255,255,255,0.02); padding:14px; border-radius:10px;">
            <div style="color:#9CA3AF; font-size:0.75rem; text-transform:uppercase;">Ubicación</div>
            <div style="color:#F8F9FA; font-weight:700; font-size:0.95rem;">Cancún / CDMX, México</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); padding:14px; border-radius:10px;">
            <div style="color:#9CA3AF; font-size:0.75rem; text-transform:uppercase;">Experiencia</div>
            <div style="color:#F8F9FA; font-weight:700; font-size:0.95rem;">14 Años en Medios Digitales</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); padding:14px; border-radius:10px;">
            <div style="color:#9CA3AF; font-size:0.75rem; text-transform:uppercase;">Modalidad</div>
            <div style="color:#55EBB2; font-weight:700; font-size:0.95rem;">Remoto / Proyectos Clave</div>
          </div>
        </div>
        <div style="font-size:0.9rem; color:#D1D5DB; line-height:1.6;">
          Escribe aquí un resumen conciso de los hitos más relevantes: reconocimientos, proyectos de mayor envergadura o publicaciones destacadas.
        </div>
      </section>
    `
  });

  bm.add('portfolio-galeria-3d', {
    label: 'Galería de Arte 3D', category: catPortfolio, select: true, activate: true,
    media: '<i class="fas fa-images" style="font-size:20px; color:#F5C542;"></i>',
    content: `
      <section style="max-width:1080px; margin:30px auto; padding:20px; font-family:'Space Grotesk',sans-serif;">
        <div style="text-align:center; margin-bottom:26px;">
          <span style="font-size:0.75rem; color:#D4AF37; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace;">Obras & Visuales</span>
          <h2 style="font-size:1.8rem; font-weight:800; color:#F8F9FA; margin-top:4px;">Galería de Proyectos</h2>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:24px; justify-content:center;">
          <div style="flex:1 1 310px; max-width:340px; background:#141B17; border:1px solid rgba(212,175,55,0.3); border-radius:16px; overflow:hidden; box-shadow:0 12px 28px rgba(0,0,0,0.6); transition:transform 0.3s ease;">
            <img src="/assets/news/reportero_zocalo.jpg" alt="Obra 1" style="width:100%; height:220px; object-fit:cover; display:block;" />
            <div style="padding:16px;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace;">RETRATO URBANO · 2026</span>
              <h3 style="font-size:1.1rem; font-weight:700; color:#F8F9FA; margin:6px 0;">Crónica de la Plaza Mayor</h3>
              <p style="font-size:0.83rem; color:#9CA3AF; line-height:1.4;">Captura de alto contraste con iluminación natural al atardecer.</p>
            </div>
          </div>
          <div style="flex:1 1 310px; max-width:340px; background:#141B17; border:1px solid rgba(212,175,55,0.3); border-radius:16px; overflow:hidden; box-shadow:0 12px 28px rgba(0,0,0,0.6); transition:transform 0.3s ease;">
            <img src="/assets/news/reportero_taqueria.jpg" alt="Obra 2" style="width:100%; height:220px; object-fit:cover; display:block;" />
            <div style="padding:16px;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace;">CULTURA POPULAR · 2026</span>
              <h3 style="font-size:1.1rem; font-weight:700; color:#F8F9FA; margin:6px 0;">La Esencia de Barrio</h3>
              <p style="font-size:0.83rem; color:#9CA3AF; line-height:1.4;">Documentación de oficios tradicionales y texturas nocturnas.</p>
            </div>
          </div>
          <div style="flex:1 1 310px; max-width:340px; background:#141B17; border:1px solid rgba(212,175,55,0.3); border-radius:16px; overflow:hidden; box-shadow:0 12px 28px rgba(0,0,0,0.6); transition:transform 0.3s ease;">
            <img src="/assets/news/reportero_plaza.jpg" alt="Obra 3" style="width:100%; height:220px; object-fit:cover; display:block;" />
            <div style="padding:16px;">
              <span style="font-size:0.72rem; color:#D4AF37; font-family:'Space Mono',monospace;">ESTUDIO DE LUZ · 2026</span>
              <h3 style="font-size:1.1rem; font-weight:700; color:#F8F9FA; margin:6px 0;">Contrastes y Sombras</h3>
              <p style="font-size:0.83rem; color:#9CA3AF; line-height:1.4;">Esquema de luz puntual enfocado en la geometría del espacio.</p>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('portfolio-mapa-timeline', {
    label: 'Línea de Tiempo / Árbol', category: catPortfolio, select: true, activate: true,
    media: '<i class="fas fa-project-diagram" style="font-size:20px; color:#55EBB2;"></i>',
    content: `
      <section style="max-width:780px; margin:30px auto; padding:24px; font-family:'Space Grotesk',sans-serif;">
        <div style="text-align:center; margin-bottom:28px;">
          <span style="font-size:0.75rem; color:#55EBB2; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace;">Cronología</span>
          <h2 style="font-size:1.8rem; font-weight:800; color:#F8F9FA; margin-top:4px;">Mapa de Evolución & Trayectoria</h2>
        </div>
        <div style="position:relative; padding-left:32px; border-left:2px solid rgba(212,175,55,0.3); margin-left:16px;">
          <div style="position:relative; margin-bottom:30px;">
            <div style="position:absolute; left:-41px; top:2px; width:16px; height:16px; border-radius:50%; background:#D4AF37; border:3px solid #060907;"></div>
            <span style="font-size:0.75rem; color:#D4AF37; font-family:'Space Mono',monospace; font-weight:700;">2024 — PRESENTE</span>
            <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin:4px 0 6px;">Lanzamiento de Suite Memexicanísimos</h3>
            <p style="font-size:0.88rem; color:#9CA3AF; line-height:1.5;">Desarrollo de herramientas locales (Rótulos Web, Aetheria Studio, MASV) para edición y streaming autónomo.</p>
          </div>
          <div style="position:relative; margin-bottom:30px;">
            <div style="position:absolute; left:-41px; top:2px; width:16px; height:16px; border-radius:50%; background:#55EBB2; border:3px solid #060907;"></div>
            <span style="font-size:0.75rem; color:#55EBB2; font-family:'Space Mono',monospace; font-weight:700;">2018 — 2024</span>
            <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin:4px 0 6px;">Consolidación de Contenido & Medios</h3>
            <p style="font-size:0.88rem; color:#9CA3AF; line-height:1.5;">Crecimiento de la comunidad digital a decenas de miles de seguidores mediante periodismo de datos y sátira visual.</p>
          </div>
          <div style="position:relative;">
            <div style="position:absolute; left:-41px; top:2px; width:16px; height:16px; border-radius:50%; background:#7AA2E7; border:3px solid #060907;"></div>
            <span style="font-size:0.75rem; color:#7AA2E7; font-family:'Space Mono',monospace; font-weight:700;">2012 — INICIO</span>
            <h3 style="font-size:1.15rem; font-weight:700; color:#F8F9FA; margin:4px 0 6px;">Fundación del Proyecto</h3>
            <p style="font-size:0.88rem; color:#9CA3AF; line-height:1.5;">Nacimiento de la marca con enfoque en humor patrio, memoria colectiva e identidad popular mexicana.</p>
          </div>
        </div>
      </section>
    `
  });

  // ── BLOQUES: LANDING PAGE PROFESIONAL ────────────────────
  const catLanding = { id: 'landing', label: '💼 Landing Profesional', open: true };

  bm.add('landing-hero-overlay', {
    label: 'Hero con Fondo Traslúcido', category: catLanding, select: true, activate: true,
    media: '<i class="fas fa-star" style="font-size:20px; color:#D4AF37;"></i>',
    content: `
      <section style="position:relative; min-height:480px; display:flex; align-items:center; justify-content:center; text-align:center; padding:60px 24px; background:linear-gradient(rgba(10,15,13,0.85), rgba(10,15,13,0.92)), url('/assets/news/reportero_zocalo.jpg') center/cover no-repeat; border-radius:20px; margin:20px auto; max-width:1150px; border:1px solid rgba(212,175,55,0.3); box-shadow:0 16px 40px rgba(0,0,0,0.7); font-family:'Space Grotesk',sans-serif;">
        <div style="max-width:760px; position:relative; z-index:2;">
          <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(212,175,55,0.15); border:1px solid #D4AF37; color:#F5C542; padding:6px 16px; border-radius:999px; font-size:0.8rem; font-weight:700; font-family:'Space Mono',monospace; margin-bottom:18px;">
            <span>⚡</span> SOLUCIÓN PROFESIONAL DISPONIBLE
          </div>
          <h1 style="font-size:2.8rem; font-weight:800; color:#F8F9FA; line-height:1.15; margin-bottom:16px;">
            Impulsa tus Proyectos con Diseño Soberano e Inteligente
          </h1>
          <p style="font-size:1.1rem; line-height:1.6; color:#D1D5DB; margin-bottom:28px;">
            Una plataforma ligera y rápida para construir páginas web que cautivan a tu audiencia, sin pagar suscripciones mensuales ni depender de servicios en la nube.
          </p>
          <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
            <a href="#" style="background:linear-gradient(135deg, #D4AF37, #B8860B); color:#111; padding:12px 28px; border-radius:999px; font-weight:800; font-size:0.95rem; text-decoration:none; box-shadow:0 4px 16px rgba(212,175,55,0.4);">
              🚀 Comenzar Ahora
            </a>
            <a href="#" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.2); color:#F8F9FA; padding:12px 24px; border-radius:999px; font-weight:600; font-size:0.95rem; text-decoration:none;">
              Conoce las Características
            </a>
          </div>
        </div>
      </section>
    `
  });

  bm.add('landing-bento-grid', {
    label: 'Bento Grid de Servicios', category: catLanding, select: true, activate: true,
    media: '<i class="fas fa-cubes" style="font-size:20px; color:#7AA2E7;"></i>',
    content: `
      <section style="max-width:1100px; margin:30px auto; padding:20px; font-family:'Space Grotesk',sans-serif;">
        <div style="text-align:center; margin-bottom:30px;">
          <span style="font-size:0.75rem; color:#D4AF37; font-weight:700; text-transform:uppercase; font-family:'Space Mono',monospace;">Propuesta de Valor</span>
          <h2 style="font-size:2rem; font-weight:800; color:#F8F9FA; margin-top:4px;">Todo lo que necesitas en un solo lugar</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
          <div style="grid-column:span 2; background:rgba(20,27,23,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:18px; padding:30px; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
            <span style="font-size:2rem;">⚡</span>
            <h3 style="font-size:1.4rem; font-weight:800; color:#D4AF37; margin:10px 0 8px;">Arquitectura Local & Soberana</h3>
            <p style="font-size:0.95rem; color:#9CA3AF; line-height:1.55; max-width:600px;">
              El código se procesa íntegramente en tu máquina. Respaldos automáticos con retención FIFO, soporte offline garantizado y sin riesgos de censura o tarifas imprevistas.
            </p>
          </div>
          <div style="background:rgba(20,27,23,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:26px;">
            <span style="font-size:2rem;">🎨</span>
            <h3 style="font-size:1.2rem; font-weight:700; color:#F8F9FA; margin:10px 0 6px;">Edición Visual Universal</h3>
            <p style="font-size:0.88rem; color:#9CA3AF; line-height:1.5;">Arrastra componentes, personaliza estilos en vivo y exporta HTML5/CSS3 limpio.</p>
          </div>
          <div style="background:rgba(20,27,23,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:26px;">
            <span style="font-size:2rem;">🔒</span>
            <h3 style="font-size:1.2rem; font-weight:700; color:#F8F9FA; margin:10px 0 6px;">Auditoría de Accesibilidad</h3>
            <p style="font-size:0.88rem; color:#9CA3AF; line-height:1.5;">Motor axe-core y verificación WCAG 2.1 AA en Web Workers para no congelar la UI.</p>
          </div>
          <div style="grid-column:span 2; background:linear-gradient(135deg, rgba(0,104,71,0.2), rgba(20,27,23,0.9)); border:1px solid #006847; border-radius:18px; padding:30px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div>
                <h3 style="font-size:1.3rem; font-weight:800; color:#55EBB2; margin-bottom:6px;">Publicación en 1 Clic a GitHub Pages</h3>
                <p style="font-size:0.92rem; color:#9CA3AF; margin:0;">Despliega tu sitio públicamente con HTTPS gratuito en segundos.</p>
              </div>
              <a href="#" style="background:#006847; color:#FFF; padding:10px 22px; border-radius:999px; font-weight:700; font-size:0.88rem; text-decoration:none;">Explorar Módulo</a>
            </div>
          </div>
        </div>
      </section>
    `
  });

  bm.add('landing-metricas-impacto', {
    label: 'Métricas de Impacto', category: catLanding, select: true, activate: true,
    media: '<i class="fas fa-chart-line" style="font-size:20px; color:#55EBB2;"></i>',
    content: `
      <section style="max-width:1050px; margin:30px auto; padding:28px 20px; background:#141B17; border:1px solid rgba(255,255,255,0.08); border-radius:16px; font-family:'Space Grotesk',sans-serif;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:20px; text-align:center;">
          <div>
            <div style="font-size:2.4rem; font-weight:800; color:#D4AF37; font-family:'Space Mono',monospace;">100%</div>
            <div style="font-size:0.85rem; color:#9CA3AF; margin-top:4px;">Software Soberano</div>
          </div>
          <div>
            <div style="font-size:2.4rem; font-weight:800; color:#55EBB2; font-family:'Space Mono',monospace;">0 ms</div>
            <div style="font-size:0.85rem; color:#9CA3AF; margin-top:4px;">Latencia en la Nube</div>
          </div>
          <div>
            <div style="font-size:2.4rem; font-weight:800; color:#D4AF37; font-family:'Space Mono',monospace;">+28K</div>
            <div style="font-size:0.85rem; color:#9CA3AF; margin-top:4px;">Comunidad Activa</div>
          </div>
          <div>
            <div style="font-size:2.4rem; font-weight:800; color:#55EBB2; font-family:'Space Mono',monospace;">15+</div>
            <div style="font-size:0.85rem; color:#9CA3AF; margin-top:4px;">Respaldos FIFO Atómicos</div>
          </div>
        </div>
      </section>
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
