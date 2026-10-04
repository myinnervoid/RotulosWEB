# Findings & Research Log — Rótulos Web

## Canvas Ergonomics & Drag & Drop in GrapesJS

### Initial Observations
1. **Salto entre líneas al arrastrar**:
   - En GrapesJS, cuando dos elementos de bloque o texto están contiguos sin margen vertical amplio, el drop placeholder (`.gjs-placeholder`) por defecto es una línea muy delgada (1–2px) que titila rápidamente entre el final del primer elemento y el inicio del segundo cuando el cursor se mueve un solo píxel.
   - Si los contenedores hijos están vacíos o colapsados, la altura cero hace que el cálculo de `getBoundingClientRect()` devuelva coordenadas idénticas, causando parpadeo del objetivo de inserción.
2. **Solución Técnica en GrapesJS**:
   - **Estilos en el iframe**: Inyectar estilos específicos en el canvas iframe:
     - `.gjs-placeholder`: convertirlo en una franja visible con altura (`min-height: 12px; border: 2px dashed #55EBB2; background: rgba(85,235,178,0.15); border-radius: 6px; margin: 8px 0;`).
     - `.gjs-hovered`: resaltar con un borde suave (`outline: 2px dashed rgba(212,175,55,0.6); outline-offset: -2px;`).
     - `.gjs-selected`: contorno dorado continuo (`outline: 2px solid #D4AF37 !important; outline-offset: -2px;`).
     - Regla para contenedores vacíos: `[data-gjs-type]:empty, section:empty, div:empty { min-height: 60px !important; outline: 1px dashed rgba(255,255,255,0.15) !important; padding: 12px !important; }`.
   - **Configuración de canvas**: GrapesJS admite `customHtml` o inyección dinámica de CSS en `Canvas.getDocument()`.

## Component Requirements from User

### 1. Blog
- Cuadro de texto para narración / artículo editorial.
- Caja automática de título + subtítulo + metadatos (autor, fecha, tiempo de lectura).
- Despliegue de notas con imágenes (Grid 2/3 columnas de posts con cards responsivas).
- Cuadro de texto con imagen al lado (layout 50/50 o 40/60 para descripciones detalladas).

### 2. Personal / Portafolio
- Avatar circular estilizado con badge de estado y bio introductoria.
- Grid de iconos personalizados para trabajo, conocimientos, tecnologías y habilidades.
- Ficha de perfil CV / Biografía con trayectoria y enlace de descarga o contacto.
- Galería de arte / proyectos con estilos visuales modernos (3D hover, sombras elegantes).
- Mapa conceptual / árbol de conocimientos o timeline de trayectoria.

### 3. Profesional / Landing Page
- Hero section profesional con imagen de fondo traslúcida (overlay) y titular nítido al frente.
- Bento Grid de servicios / soluciones profesionales.
- Barra de estadísticas y métricas (Key Metrics / Impact numbers).
