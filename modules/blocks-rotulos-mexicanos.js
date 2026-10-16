/**
 * ============================================================
 * 🇲🇽 blocks-rotulos-mexicanos.js — Catálogo de Rótulos Tradicionales Mexicanos
 * Rótulos Web / Memexicanísimos Studio v5.2
 * ============================================================
 * Arte popular mexicano de rotulación a pincel, bardas de baile sonidero,
 * láminas de taquería, marquesinas de ferretería ("El Segundo Piso"),
 * cartas de lotería y plecas del Noticiero de El Mashukita.
 */

export const CAT_ROTULOS_MEXICANOS = {
  id: 'rotulos_mexicanos',
  label: '🇲🇽 Rótulos Tradicionales Mexicanos',
  open: true
};

/**
 * Definición declarativa de bloques de rótulos mexicanos.
 * Compartida entre la UI (GrapesJS), el CLI (rotulos-cli) y el servidor MCP (rotulos-mcp).
 */
export const MEXICAN_ROTULOS_CATALOG = [
  {
    id: 'rotulo-sonidero-baile',
    label: 'Cartel Baile Sonidero (Wada #144)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Cartel callejero estilo barda sonidera con Combinación Sanzo Wada #144 (Rosolanc Purple #b73f74, Orange #f37420 y Black #111314) y sombra sólida.',
    media: '<i class="fas fa-compact-disc" style="font-size:20px; color:#b73f74;"></i>',
    content: `
      <section class="rotulo-mex-sonidero" style="max-width:920px; margin:28px auto; padding:8px; background:#b73f74; border:4px solid #111314; border-radius:18px; box-shadow:8px 8px 0 #111314; font-family:'Space Grotesk',sans-serif;">
        <div style="background:#111314; border:3px solid #f37420; border-radius:12px; padding:32px 24px; text-align:center; position:relative; overflow:hidden;">
          <div style="display:inline-block; background:#b73f74; color:#f5ecc2; font-family:'Space Mono',monospace; font-weight:700; font-size:0.82rem; padding:5px 16px; border-radius:999px; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:14px; border:2px solid #f5ecc2; box-shadow:3px 3px 0 #f37420;">
            ★ GRAN CAÑONAZO SONIDERO ESTELAR · WADA #144 ★
          </div>
          <h2 style="font-size:2.85rem; font-weight:900; color:#fff200; text-transform:uppercase; line-height:1.06; margin:0 0 10px; text-shadow:4px 4px 0 #cc1236; letter-spacing:0.02em;">
            ¡ESTA NOCHE EN LA EXPLANADA CENTRAL!
          </h2>
          <p style="font-size:1.15rem; font-weight:700; color:#f37420; margin:0 0 22px; text-transform:uppercase; letter-spacing:0.06em;">
            Sabor, Cumbia Rebajada y Tradición Popular en Vivo
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center; margin-bottom:24px;">
            <div style="flex:1 1 220px; background:#12354e; border:2px solid #b73f74; border-radius:12px; padding:14px; box-shadow:4px 4px 0 #b73f74;">
              <div style="font-size:0.75rem; color:#ffefae; font-family:'Space Mono',monospace; font-weight:700;">MANO A MANO MUSICAL</div>
              <div style="font-size:1.25rem; font-weight:800; color:#f5ecc2; margin-top:4px;">Sonido Fantasma vs La Changa</div>
            </div>
            <div style="flex:1 1 220px; background:#12354e; border:2px solid #f37420; border-radius:12px; padding:14px; box-shadow:4px 4px 0 #f37420;">
              <div style="font-size:0.75rem; color:#ffefae; font-family:'Space Mono',monospace; font-weight:700;">CITA E INVITACIÓN</div>
              <div style="font-size:1.25rem; font-weight:800; color:#f5ecc2; margin-top:4px;">Sábado · 20:00 Hrs · Entrada Libre</div>
            </div>
          </div>
          <a href="#" style="display:inline-block; background:#f37420; color:#111314; font-weight:900; font-size:1rem; text-transform:uppercase; padding:12px 30px; border-radius:999px; text-decoration:none; border:2px solid #f5ecc2; box-shadow:4px 4px 0 #b73f74;">
            🔊 ¡Aparta tu Lugar en la Pista!
          </a>
        </div>
      </section>
    `
  },
  {
    id: 'rotulo-pizarron-taqueria',
    label: 'Pizarrón de Taquería (Wada #284)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Menú tradicional pintado a mano con Tétrada Fresca de Feria Sanzo Wada #284 (Eugenia Red #e2625e, Apricot Yellow #ffdd00, Sea Green #00b49b, Dusky Green #004f46).',
    media: '<i class="fas fa-utensils" style="font-size:20px; color:#e2625e;"></i>',
    content: `
      <section class="rotulo-mex-taqueria" style="max-width:780px; margin:28px auto; padding:28px 24px; background:#004f46; border:4px double #ffdd00; border-radius:18px; box-shadow:8px 8px 0 #111314; font-family:'Space Grotesk',sans-serif; color:#f5ecc2;">
        <div style="text-align:center; border-bottom:2px dashed #00b49b; padding-bottom:16px; margin-bottom:20px;">
          <span style="display:inline-block; background:#e2625e; color:#111314; font-size:0.76rem; font-weight:900; padding:4px 14px; border-radius:999px; letter-spacing:0.08em; text-transform:uppercase; font-family:'Space Mono',monospace; border:1.5px solid #111314;">
            🌮 RÓTULO DE FONDA Y TAQUERÍA TRADICIONAL · WADA #284
          </span>
          <h2 style="font-size:2.2rem; font-weight:900; color:#ffdd00; margin:10px 0 4px; text-shadow:3px 3px 0 #111314; font-family:'Fraunces',serif;">
            "LOS REYES DEL TROMPO"
          </h2>
          <p style="font-size:0.9rem; color:#ffefae; margin:0; font-family:'Space Mono',monospace;">
             Tortilla recién hecha a mano · Salsa de molcajete · Servicio desde 1988
          </p>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px dotted #c2ae93; padding-bottom:6px;">
            <strong style="font-size:1.1rem; color:#f5ecc2;">Orden de Tacos al Pastor con Piña (5 pzas)</strong>
            <span style="font-family:'Space Mono',monospace; font-size:1.15rem; font-weight:800; color:#ffdd00;">$85 MXN</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px dotted #c2ae93; padding-bottom:6px;">
            <strong style="font-size:1.1rem; color:#f5ecc2;">Gringa Especial en Harina con Queso Oaxaca</strong>
            <span style="font-family:'Space Mono',monospace; font-size:1.15rem; font-weight:800; color:#ffdd00;">$65 MXN</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px dotted #c2ae93; padding-bottom:6px;">
            <strong style="font-size:1.1rem; color:#f5ecc2;">Agua Fresca de Horchata o Jamaica (1 Litro)</strong>
            <span style="font-family:'Space Mono',monospace; font-size:1.15rem; font-weight:800; color:#ffdd00;">$40 MXN</span>
          </div>
        </div>
        <div style="background:#111314; border:2px solid #00b49b; border-radius:10px; padding:10px 16px; text-align:center; font-size:0.88rem; color:#00b49b; font-weight:700;">
          🔥 ¡Si le pica la salsa, la segunda bebida va por cuenta de la casa!
        </div>
      </section>
    `
  },
  {
    id: 'rotulo-oferta-ferreteria',
    label: 'Marquesina Ferretera (Wada #190)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Rótulo comercial en Tríada Barda Tradicional Sanzo Wada #190 (Ivory Buff #ebd3a2, English Red #d96629, Black #111314) y Oro Cempasúchil (#f99d1b).',
    media: '<i class="fas fa-hammer" style="font-size:20px; color:#f99d1b;"></i>',
    content: `
      <section class="rotulo-mex-ferreteria" style="max-width:900px; margin:28px auto; background:#f99d1b; color:#111314; border:4px solid #111314; border-radius:18px; padding:28px 24px; box-shadow:8px 8px 0 #cc1236; font-family:'Space Grotesk',sans-serif;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:20px;">
          <div style="flex:1 1 420px;">
            <div style="display:inline-block; background:#cc1236; color:#f5ecc2; font-family:'Space Mono',monospace; font-weight:800; font-size:0.8rem; padding:4px 12px; border-radius:6px; text-transform:uppercase; margin-bottom:10px; border:2px solid #111314;">
              🛠️ EL SEGUNDO PISO DE LA FERRETERÍA · BARRA 09:00 AM
            </div>
            <h2 style="font-size:2.35rem; font-weight:900; color:#111314; line-height:1.1; margin:0 0 10px; text-transform:uppercase;">
              ¡HERRAMIENTAS DIGITALES QUE SÍ CHAMBEAN DURO!
            </h2>
            <p style="font-size:1rem; font-weight:700; color:#111314; line-height:1.5; margin:0;">
              Soluciones locales sin rentas mensuales: Rótulos Web, MASV, Fluidos Studio y Punto de Venta. Hechas a la medida del taller y del creador mexicano.
            </p>
          </div>
          <div style="flex:0 0 auto; background:#111314; color:#f5ecc2; padding:20px 26px; border-radius:14px; text-align:center; border:3px dashed #ebd3a2;">
            <div style="font-size:0.75rem; font-family:'Space Mono',monospace; color:#ebd3a2; text-transform:uppercase;">LICENCIA SOBERANA</div>
            <div style="font-size:2.4rem; font-weight:900; color:#fff200; line-height:1.1; margin:4px 0;">100%</div>
            <div style="font-size:0.85rem; font-weight:700; color:#00b49b; margin-bottom:12px;">CÓDIGO LOCAL</div>
            <a href="#" style="display:inline-block; background:#cc1236; color:#f5ecc2; font-weight:800; font-size:0.85rem; padding:8px 18px; border-radius:8px; text-decoration:none; text-transform:uppercase; border:1.5px solid #f5ecc2;">
              Subir al 2º Piso →
            </a>
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'rotulo-papel-picado-cintillo',
    label: 'Cintillo de Papel Picado (Wada)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Divisor ornamental con banderines festivos en pigmentos minerales Sanzo Wada (Diamine Green, Sulpher Yellow, Carmine, Yellow Ocher).',
    media: '<i class="fas fa-flag" style="font-size:20px; color:#00b49b;"></i>',
    content: `
      <div class="rotulo-mex-papel-picado" style="max-width:1050px; margin:24px auto; text-align:center; font-family:'Space Grotesk',sans-serif;">
        <div style="display:flex; justify-content:center; gap:6px; flex-wrap:nowrap; overflow:hidden; margin-bottom:14px;" aria-hidden="true">
          <span style="flex:1; height:18px; background:#1a7444; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#f5ecc2; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#cc1236; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#f99d1b; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#006eb8; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#b73f74; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#00b49b; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
          <span style="flex:1; height:18px; background:#e2b540; clip-path:polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);"></span>
        </div>
        <div style="display:inline-block; padding:8px 26px; background:#111314; border:2px solid #e2b540; border-radius:999px; box-shadow:3px 3px 0 #cc1236;">
          <span style="color:#f5ecc2; font-weight:800; font-size:0.95rem; letter-spacing:0.08em; text-transform:uppercase;">
            ✦ ORGULLO, TRADICIÓN Y CULTURA VIVA DE MÉXICO ✦
          </span>
        </div>
      </div>
    `
  },
  {
    id: 'rotulo-sello-hecho-en-mexico',
    label: 'Sello Hecho en México (Wada #190)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Insignia de autenticidad nacional en Negro Obsidiana (#111314), Ocre Charro (#e2b540) y Blanco Cal (#f5ecc2).',
    media: '<i class="fas fa-certificate" style="font-size:20px; color:#e2b540;"></i>',
    content: `
      <div class="rotulo-mex-sello" style="max-width:340px; margin:24px auto; padding:22px; background:#111314; border:3px solid #e2b540; border-radius:20px; text-align:center; box-shadow:6px 6px 0 #1a7444; font-family:'Space Grotesk',sans-serif;">
        <div style="width:76px; height:76px; margin:0 auto 12px; border-radius:50%; background:#1a7444; border:3px double #e2b540; display:flex; align-items:center; justify-content:center; font-size:2.2rem;">
          🦅
        </div>
        <div style="font-family:'Space Mono',monospace; font-size:0.75rem; font-weight:700; color:#00b49b; letter-spacing:0.15em; text-transform:uppercase;">
          CALIDAD CERTIFICADA
        </div>
        <h3 style="font-size:1.5rem; font-weight:900; color:#f5ecc2; margin:4px 0 6px; letter-spacing:0.04em; text-transform:uppercase;">
          HECHO EN MÉXICO
        </h3>
        <p style="font-size:0.82rem; color:#c2ae93; margin:0; line-height:1.45;">
          Diseñado, programado y respaldado localmente en Estudio Memexicanísimos.
        </p>
      </div>
    `
  },
  {
    id: 'rotulo-barda-publicitaria',
    label: 'Barda Pintada (Wada #154)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Barda blanqueada a la cal (#f5ecc2) con la Tríada Clásica de Rótulo Sanzo Wada #154: Carmine (#cc1236), Yellow (#fff200) y Blue (#006eb8).',
    media: '<i class="fas fa-paint-roller" style="font-size:20px; color:#006eb8;"></i>',
    content: `
      <section class="rotulo-mex-barda" style="max-width:960px; margin:28px auto; padding:10px; background:#f5ecc2; border:4px solid #006eb8; border-radius:12px; box-shadow:8px 8px 0 #111314; font-family:'Space Grotesk',sans-serif;">
        <div style="border:3px solid #cc1236; border-radius:8px; padding:26px 22px; text-align:center; background:#f5ecc2; color:#111314;">
          <div style="font-family:'Space Mono',monospace; font-size:0.82rem; font-weight:800; color:#006eb8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px;">
            ★ RÓTULOS Y PUBLICIDAD PINTADA A MANO · TRÍADA WADA #154 ★
          </div>
          <h2 style="font-size:2.6rem; font-weight:900; color:#cc1236; text-transform:uppercase; line-height:1.08; margin:0 0 10px; text-shadow:3px 3px 0 #fff200;">
            MEMEXICANÍSIMOS · CANAL DE TV Y ESTUDIO
          </h2>
          <p style="font-size:1.05rem; font-weight:700; color:#111314; margin:0 0 14px;">
            Farándula 12:55 · Tecnología 13:55 · Gaming 17:55 · Noticiero Central 20:00 Hrs
          </p>
          <div style="display:inline-block; background:#006eb8; color:#f5ecc2; font-weight:800; font-size:0.9rem; padding:8px 22px; border-radius:6px; text-transform:uppercase; letter-spacing:0.05em; border:2px solid #111314; box-shadow:3px 3px 0 #cc1236;">
            Con su anfitrión oficial: El Mashukita · Visita memexicanisimos.com
          </div>
        </div>
      </section>
    `
  },
  {
    id: 'rotulo-loteria-carta',
    label: 'Carta de Lotería (Wada #179)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Carta tradicional de Lotería con Combinación Sanzo Wada #179 (Red Orange #dd4027, Golden Yellow #f3a257 y Deep Lyons Blue #1c4286) sobre Papel Amate.',
    media: '<i class="fas fa-dice" style="font-size:20px; color:#dd4027;"></i>',
    content: `
      <article class="rotulo-mex-loteria" style="max-width:310px; margin:24px auto; padding:14px; background:#ebd3a2; border:4px solid #111314; border-radius:16px; box-shadow:7px 7px 0 #1c4286; font-family:'Space Grotesk',sans-serif; color:#111314;">
        <div style="border:2.5px solid #dd4027; border-radius:10px; padding:16px; position:relative; background:#f5ecc2; text-align:center;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-family:'Space Mono',monospace; font-size:1.35rem; font-weight:900; color:#dd4027;">54</span>
            <span style="font-family:'Space Mono',monospace; font-size:0.72rem; font-weight:800; color:#1c4286; text-transform:uppercase;">LOTERÍA NACIONAL</span>
          </div>
          <div style="height:170px; display:flex; align-items:center; justify-content:center; font-size:4.8rem; background:#ffefae; border:2px dashed #f3a257; border-radius:10px; margin-bottom:14px;">
            🎙️
          </div>
          <p style="font-size:0.84rem; font-style:italic; color:#34454c; font-weight:600; line-height:1.4; margin:0 0 12px;">
            "El que canta y da la nota con datos duros y sin chisme vacío."
          </p>
          <div style="background:#dd4027; color:#f5ecc2; font-weight:900; font-size:1.15rem; padding:6px 12px; border-radius:6px; letter-spacing:0.1em; text-transform:uppercase; border:2px solid #111314;">
            EL MASHUKITA
          </div>
        </div>
      </article>
    `
  },
  {
    id: 'rotulo-alerta-noticiero',
    label: 'Pleca Noticiero Nocturno (Wada)',
    category: CAT_ROTULOS_MEXICANOS,
    description: 'Cintillo del Noticiero Central Nocturno (20:00 hrs) en Deep Indigo (#051230), Carmine (#cc1236) y Pale Lemon Yellow (#ffefae).',
    media: '<i class="fas fa-tv" style="font-size:20px; color:#cc1236;"></i>',
    content: `
      <section class="rotulo-mex-noticiero" style="max-width:980px; margin:24px auto; background:#051230; border:2px solid #12354e; border-left:8px solid #cc1236; border-radius:14px; padding:18px 22px; box-shadow:6px 6px 0 #111314; font-family:'Space Grotesk',sans-serif; color:#f5ecc2;">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="display:inline-flex; align-items:center; gap:6px; background:#cc1236; color:#f5ecc2; font-family:'Space Mono',monospace; font-size:0.76rem; font-weight:800; padding:5px 12px; border-radius:6px; text-transform:uppercase; letter-spacing:0.08em;">
              ● PRIME TIME 20:00 HRS
            </span>
            <span style="font-family:'Space Mono',monospace; font-size:0.8rem; color:#f99d1b; font-weight:700;">
              PERIODISMO QUE IMPORTA · RESPALDO DOCUMENTAL LOCAL
            </span>
          </div>
          <span style="font-family:'Space Mono',monospace; font-size:0.78rem; color:#00b49b; font-weight:700;">
            Anfitrión: El Mashukita
          </span>
        </div>
        <h3 style="font-size:1.55rem; font-weight:800; color:#ffefae; margin:12px 0 6px; line-height:1.25;">
          Los 5 Temas Más Relevantes del Día en México: Cifras Oficiales, Causas e Impacto Social
        </h3>
        <p style="font-size:0.92rem; color:#c2ae93; margin:0; line-height:1.5;">
          Recuerda que Memexicanísimos tiene su barra diaria en farándula (12:55), tecnología (13:55), gaming (17:55) y el Noticiero Nocturno (20:00). Visita memexicanisimos.com.
        </p>
      </section>
    `
  }
];

/**
 * Registra los bloques de Rótulos Tradicionales Mexicanos en GrapesJS.
 * @param {object} editor - Instancia activa de GrapesJS
 */
export function registerMexicanRotulosBlocks(editor) {
  if (!editor || !editor.BlockManager) return;
  const bm = editor.BlockManager;

  for (const block of MEXICAN_ROTULOS_CATALOG) {
    bm.add(block.id, {
      label: block.label,
      category: block.category,
      select: true,
      activate: true,
      media: block.media,
      content: block.content
    });
  }
}
