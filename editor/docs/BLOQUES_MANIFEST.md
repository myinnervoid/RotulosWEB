# 🧱 Manifiesto y Catálogo Oficial de Bloques — Rótulos Web v5.1

> **Estudio Visual Memexicanísimos**  
> Catálogo canónico de componentes visuales, estructurales y bloques de diseño registrados en [`editor/public/modules/blocks.js`](file:///home/myinnervoid/Estudio%20Memexicanisimos/Rotulos%20Web/editor/public/modules/blocks.js).

---

## 📋 Resumen del Sistema de Bloques

Rótulos Web organiza sus bloques en dos categorías principales accesibles desde la barra lateral izquierda (panel de Bloques con acordeón persistente):

1. **Estructura & Básicos (`basicos`)**: Bloques de layout responsive (flexbox), maquetación base, medios y tipografía esencial.
2. **Rótulos Web / Memexicanísimos (`rotulos_web`)**: Bloques estilizados listos para producción con identidad visual soberana (oro charro `#D4AF37`, verde patrio `#006847`, glassmorphism, tipografías Space Grotesk / Space Mono y estados interactivos).

---

## 1. Categoría: Estructura & Básicos (`basicos`)

### 1.1. `column1` — 1 Columna (Sección Contenedora)
- **ID:** `column1`
- **Icono:** `fa-square`
- **Propósito:** Contenedor semántico principal `<section>` para organizar contenido centrado con ancho máximo controlado.
- **Estructura HTML generada:**
  ```html
  <section style="padding:40px 20px; max-width:1200px; margin:0 auto; min-height:80px; box-sizing:border-box;">
    <div>Contenido de 1 columna</div>
  </section>
  ```
- **Comportamiento:** Se adapta al 100% en pantallas móviles y mantiene margen simétrico automático (`margin: 0 auto`) en monitores grandes.
- **Casos de uso recomendados:** Cabeceras de sección, divisores temáticos, contenedores padre para otros bloques.

---

### 1.2. `column2` — 2 Columnas (Flexbox 50/50 Responsivo)
- **ID:** `column2`
- **Icono:** `fa-columns`
- **Propósito:** Distribución en dos columnas simétricas con quiebre automático cuando la pantalla es reducida.
- **Estructura HTML generada:**
  ```html
  <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
    <div style="flex:1 1 300px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna Izquierda</div>
    <div style="flex:1 1 300px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna Derecha</div>
  </div>
  ```
- **Comportamiento:** Cada columna tiene una base de `300px`. En pantallas de menos de 640px colapsan verticalmente una encima de la otra de forma natural sin desbordar el viewport.
- **Casos de uso:** Texto a la izquierda + imagen a la derecha, comparativas, módulos de características duales.

---

### 1.3. `column3` — 3 Columnas (Grid Flexbox Tríptico)
- **ID:** `column3`
- **Icono:** `fa-th-large`
- **Propósito:** Disposición en tríptico ideal para tarjetas de servicios, planes o pilares temáticos.
- **Estructura HTML generada:**
  ```html
  <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
    <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 1</div>
    <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 2</div>
    <div style="flex:1 1 240px; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Columna 3</div>
  </div>
  ```
- **Comportamiento:** Base `240px` por columna con `flex-wrap: wrap`.
- **Casos de uso:** Mostrar las 3 noticias del día, 3 servicios o 3 aplicaciones destacadas.

---

### 1.4. `column3-7` — 2 Columnas Asimétricas (30% Lateral / 70% Principal)
- **ID:** `column3-7`
- **Icono:** `fa-grip-vertical`
- **Propósito:** Layout de tipo Dashboard o Blog con barra lateral fija y área de lectura ancha.
- **Estructura HTML generada:**
  ```html
  <div style="display:flex; flex-wrap:wrap; gap:20px; padding:20px 0; box-sizing:border-box;">
    <div style="flex:0 0 30%; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Lateral (30%)</div>
    <div style="flex:1 1 65%; min-height:80px; padding:15px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.15); border-radius:8px;">Principal (70%)</div>
  </div>
  ```
- **Casos de uso:** Menú de navegación lateral + panel de lectura, índice de temas + artículo principal.

---

### 1.5. `text` — Texto / Párrafo
- **ID:** `text`
- **Icono:** `fa-font`
- **Propósito:** Párrafo estándar con interlineado optimizado para lectura (`line-height: 1.6`) y color de alto contraste (`#F8F9FA`).
- **Estructura:** `<p style="font-size:1rem; line-height:1.6; color:#F8F9FA;">Inserta aquí tu texto o descripción de párrafo.</p>`
- **Edición:** Admite doble clic directo en el lienzo para edición RichText inmediata.

---

### 1.6. `link` — Enlace Hipervínculo
- **ID:** `link`
- **Icono:** `fa-link`
- **Propósito:** Vínculo de texto con color verde acento (`#55EBB2`).
- **Estructura:** `<a href="#" style="color:#55EBB2; text-decoration:underline;">Enlace personalizado</a>`
- **Edición:** Configurable desde la barra lateral derecha en la pestaña **Propiedades** (`href`, target `_blank`, tooltip).

---

### 1.7. `image` — Imagen Responsiva
- **ID:** `image`
- **Icono:** `fa-image`
- **Propósito:** Componente nativo de imagen GrapesJS con esquinas redondeadas (`10px`) y ancho responsivo máximo (`400px`).
- **Configuración:** Doble clic abre el Asset Manager local para seleccionar o subir archivos.

---

### 1.8. `video` — Reproductor de Video Embebido
- **ID:** `video`
- **Icono:** `fa-video`
- **Propósito:** Embebe videos de YouTube o fuentes HTML5 con altura predefinida de `350px` y 100% de ancho adaptativo.
- **Configuración:** Modificable desde la pestaña de Componente para cambiar el enlace de YouTube/Vimeo o fuente local.

---

### 1.9. `map` — Mapa Interactivo
- **ID:** `map`
- **Icono:** `fa-map-marked-alt`
- **Propósito:** Bloque de mapa embebido para ubicación física, talleres o eventos.

---

## 2. Categoría: 🎨 Rótulos Web (Memexicanísimos) (`rotulos_web`)

### 2.1. `card-noticia` — Tarjeta Noticia
- **ID:** `card-noticia`
- **Icono:** `fa-newspaper` (Dorado)
- **Propósito:** Tarjeta editorial para notas periodísticas, reportajes o comunicados oficiales.
- **Elementos integrados:**
  - Etiqueta de primicia en **Oro Charro** (`#D4AF37`): `📢 Primicia Destacada`.
  - Imagen de portada (`height: 200px`, `object-fit: cover`).
  - Encabezado `H3` (`#F8F9FA`).
  - Párrafo de extracto legible (`#9CA3AF`).
  - Botón de enlace a crónica completa (`#55EBB2`).
- **Estilo:** Fondo `#141B17`, borde dorado semitransparente, radio de curvatura de `16px` y sombra de profundidad (`box-shadow: 0 8px 24px rgba(0,0,0,0.5)`).

---

### 2.2. `card-app-io` — Vitrina App .io
- **ID:** `card-app-io`
- **Icono:** `fa-laptop-code` (Verde Neón)
- **Propósito:** Exhibir aplicaciones web, herramientas CLI o proyectos open source.
- **Elementos integrados:**
  - Icono distintivo con contenedor verde patrio (`#006847`).
  - Título del software + versión/licencia en fuente monospaciada (`Space Mono`).
  - Párrafo explicativo del problema que soluciona.
  - Botones gemelos: **Probar Demo** (verde sólido) y **GitHub** (translúcido).

---

### 2.3. `bloque-cta-patrio` — Llamada a la Acción (CTA)
- **ID:** `bloque-cta-patrio`
- **Icono:** `fa-bullseye` (Amarillo oro)
- **Propósito:** Sección central de conversión para motivar al visitante a suscribirse, registrarse o contactar.
- **Elementos integrados:**
  - Gradiente de fondo nocturno (`rgba(20,27,23,0.9)` a `rgba(28,38,33,0.95)`).
  - Borde doble dorado (`rgba(212,175,55,0.4)`).
  - Emoji o icono superior en gran formato.
  - Título `H3` de impacto en `#D4AF37`.
  - Botón pastilla (`border-radius: 999px`) en gradiente dorado `#D4AF37` / `#B8860B` con tipografía de alto peso (`800`).

---

### 2.4. `banner-alerta-patria` — Banner de Alerta
- **ID:** `banner-alerta-patria`
- **Icono:** `fa-bullhorn` (Rojo mexicano)
- **Propósito:** Barra de notificación horizontal para anuncios urgentes, novedades o avisos comunitarios.
- **Elementos integrados:**
  - Gradiente tricolor horizontal tenue (`rgba(0,104,71,0.25)` verde a `rgba(206,17,38,0.25)` rojo).
  - Franja izquierda sólida de 4px en Oro Charro (`#D4AF37`).
  - Texto con prefijo `Aviso de la Comunidad:` en amarillo dorado.

---

### 2.5. `tabla-atajos-teclado` — Tabla de Atajos
- **ID:** `tabla-atajos-teclado`
- **Icono:** `fa-keyboard` (Dorado)
- **Propósito:** Widget de referencia que despliega atajos de productividad para los usuarios de la página o editor.
- **Elementos integrados:**
  - Filas semánticas con etiquetas `<kbd>` de estilo terminal (`Space Mono`, fondo `#1C2621`, texto `#55EBB2`).
  - Atajos predefinidos: `Ctrl + S` (Guardar) y `Ctrl + Z` (Deshacer).

---

### 2.6. `boton-charro` — Botón Dorado Charro
- **ID:** `boton-charro`
- **Icono:** `fa-hand-pointer` (Dorado)
- **Propósito:** Botón de acción principal (Primary Action Button) de alta visibilidad.
- **Elementos integrados:**
  - Gradiente metálico dorado (`#D4AF37` a `#B8860B`).
  - Texto en negro profundo `#111` con peso tipográfico `800`.
  - Sombra dorada flotante (`rgba(212,175,55,0.4)`).
  - Radio cápsula (`999px`).

---

### 2.7. `badge-patrio` — Etiqueta Tricolor
- **ID:** `badge-patrio`
- **Icono:** `fa-tag` (Verde)
- **Propósito:** Chip/insignia pequeña para destacar características (`100% Mexicano`, `Open Source`, `En Vivo`, etc.).
- **Elementos integrados:**
  - Fondo verde bosque translúcido (`rgba(0,104,71,0.3)`).
  - Borde verde `#006847` y texto verde neón `#55EBB2`.
  - Tipografía `Space Mono` de 0.8rem.

---

### 2.8. `caja-glass` — Caja Glassmorphism
- **ID:** `caja-glass`
- **Icono:** `fa-square` (Gris tenue)
- **Propósito:** Contenedor de cristal esmerilado translúcido de última generación para agrupar cualquier contenido dentro de un marco estético premium.
- **Elementos integrados:**
  - Propiedad CSS `backdrop-filter: blur(12px)`.
  - Fondo oscuro translúcido `rgba(20,27,23,0.75)`.
  - Borde fino dorado `rgba(212,175,55,0.25)` y curvatura de `20px`.
  - Permite anidar cualquier otro bloque dentro.

---

## 3. Categoría: 📰 Blog & Editorial (`blog`)

### 3.1. `blog-articulo-narracion` — Artículo & Narración
- **ID:** `blog-articulo-narracion`
- **Icono:** `fa-paragraph` (Oro claro `#F5C542`)
- **Propósito:** Composición editorial de lectura profunda con letra capital drop-cap en Oro Charro, cita destacada (`blockquote`) con borde izquierdo y párrafos con interlineado `1.8`.

### 3.2. `blog-caja-titular` — Encabezado con Firma
- **ID:** `blog-caja-titular`
- **Icono:** `fa-heading` (Verde Neón `#55EBB2`)
- **Propósito:** Cabecera completa de artículo con chip de categoría, titular H1 de 2.4rem, subtítulo explicativo y firma de autor con avatar circular, fecha y tiempo estimado de lectura.

### 3.3. `blog-feed-grid` — Despliegue de Notas
- **ID:** `blog-feed-grid`
- **Icono:** `fa-layer-group` (Dorado `#D4AF37`)
- **Propósito:** Cuadrícula responsiva de 3 artículos con portadas fotográficas, metadatos en Space Mono, titulares H3 y enlaces directos de lectura.

### 3.4. `blog-media-texto` — Texto con Imagen al Lado
- **ID:** `blog-media-texto`
- **Icono:** `fa-align-left` (Azul `#7AA2E7`)
- **Propósito:** Disposición en 2 columnas 50/50 balanceada con fotografía descriptiva y pie de foto en un lado, y caja narrativa con viñetas destacadas en el otro.

---

## 4. Categoría: 👤 Personal & Portafolio (`portafolio`)

### 4.1. `portfolio-avatar-bio` — Avatar Circular & Bio
- **ID:** `portfolio-avatar-bio`
- **Icono:** `fa-user-circle` (Dorado `#D4AF37`)
- **Propósito:** Tarjeta de presentación con fotografía circular (`border-radius: 50%`) de 130px, indicador de disponibilidad en línea verde, título profesional y botones de acción.

### 4.2. `portfolio-skills-grid` — Grid de Conocimientos
- **ID:** `portfolio-skills-grid`
- **Icono:** `fa-th` (Verde `#55EBB2`)
- **Propósito:** Mosaico de 4 tarjetas de habilidades con iconos temáticos (Cámara, Código, Arte, Producción en vivo), badges de experiencia y descripciones de stack.

### 4.3. `portfolio-perfil-cv` — Ficha de Perfil CV
- **ID:** `portfolio-perfil-cv`
- **Icono:** `fa-id-card` (Púrpura `#C792EA`)
- **Propósito:** Resumen profesional con métricas clave (Ubicación, Años de experiencia, Modalidad) y botón de descarga de CV en PDF.

### 4.4. `portfolio-galeria-3d` — Galería de Arte 3D
- **ID:** `portfolio-galeria-3d`
- **Icono:** `fa-images` (Oro claro `#F5C542`)
- **Propósito:** Escaparate visual de 3 proyectos u obras fotográficas con tarjetas elevadas, sombra de profundidad 3D y marco dorado sutil.

### 4.5. `portfolio-mapa-timeline` — Línea de Tiempo / Árbol
- **ID:** `portfolio-mapa-timeline`
- **Icono:** `fa-project-diagram` (Verde `#55EBB2`)
- **Propósito:** Mapa cronológico vertical con línea conectora central, nodos circulares dorados y descripción de hitos de trayectoria artística o laboral.

---

## 5. Categoría: 💼 Landing Profesional (`landing`)

### 5.1. `landing-hero-overlay` — Hero con Fondo Traslúcido
- **ID:** `landing-hero-overlay`
- **Icono:** `fa-star` (Dorado `#D4AF37`)
- **Propósito:** Cabecera de aterrizaje de alto impacto con imagen de fondo cubierta por overlay oscuro traslúcido (`rgba(10,15,13,0.85)` a `0.92`), titular H1 nítido en primer plano y botones duales de llamada a la acción.

### 5.2. `landing-bento-grid` — Bento Grid de Servicios
- **ID:** `landing-bento-grid`
- **Icono:** `fa-cubes` (Azul `#7AA2E7`)
- **Propósito:** Disposición moderna asimétrica estilo Bento (tarjeta principal 2x2 + tarjetas medianas + barra de llamada a la acción) para exponer servicios y propuestas de valor.

### 5.3. `landing-metricas-impacto` — Métricas de Impacto
- **ID:** `landing-metricas-impacto`
- **Icono:** `fa-chart-line` (Verde `#55EBB2`)
- **Propósito:** Franja de 4 estadísticas contundentes con números gigantes en Space Mono / Oro Charro y etiquetas descriptivas.

---

## 6. Matriz Comparativa Completa de Bloques

| ID de Bloque | Categoría | Tipo Semántico | Responsivo Móvil | Acento de Color | Uso Principal |
|:---|:---|:---|:---:|:---:|:---|
| `column1` | Básicos | `<section>` | ✅ Automático | Neutro | Layout centrado |
| `column2` | Básicos | `<div>` Flexbox | ✅ Auto-wrap 300px | Neutro | Columnas 50/50 |
| `column3` | Básicos | `<div>` Flexbox | ✅ Auto-wrap 240px | Neutro | Tríptico de tarjetas |
| `column3-7`| Básicos | `<div>` Flexbox | ✅ Wrap | Neutro | Sidebar + Contenido |
| `text` | Básicos | `<p>` | ✅ Fluido | Blanco hueso | Párrafos de lectura |
| `link` | Básicos | `<a>` | ✅ Inline | Verde Neón | Enlaces y anclas |
| `image` | Básicos | `<img>` | ✅ max-width | Neutro | Fotografías e ilustraciones |
| `video` | Básicos | `<iframe>` | ✅ 100% ancho | Neutro | Videos YouTube/HTML5 |
| `map` | Básicos | `<iframe>` | ✅ 100% ancho | Neutro | Mapas y ubicaciones |
| `card-noticia` | Rótulos | `<article>` | ✅ Max 380px | Oro `#D4AF37` | Artículos periodísticos |
| `card-app-io` | Rótulos | `<div>` | ✅ Max 360px | Verde `#55EBB2` | Vitrina de herramientas |
| `bloque-cta-patrio`| Rótulos| `<div>` | ✅ Max 540px | Oro `#D4AF37` | Conversión y llamados |
| `banner-alerta-patria`| Rótulos| `<div>` | ✅ Flex-wrap | Rojo / Oro | Anuncios importantes |
| `tabla-atajos-teclado`| Rótulos| `<div>` | ✅ Max 440px | Oro / Verde | Guía de atajos de teclado |
| `boton-charro` | Rótulos | `<a>` | ✅ Inline-flex | Oro metálico | Botón de acción principal |
| `badge-patrio` | Rótulos | `<span>` | ✅ Inline | Verde bosque | Chips e insignias |
| `caja-glass` | Rótulos | `<div>` | ✅ Max 900px | Glass / Blur | Contenedor de cristal |
| `blog-articulo-narracion` | Blog | `<article>` | ✅ Max 820px | Oro / Fraunces | Lectura profunda con capitular y cita |
| `blog-caja-titular` | Blog | `<header>` | ✅ Max 860px | Verde Neón | Titular H1 con metadatos y firma |
| `blog-feed-grid` | Blog | `<section>` | ✅ Flex-wrap | Oro Charro | Feed visual de 3 notas con miniatura |
| `blog-media-texto` | Blog | `<section>` | ✅ Flex-wrap 380px | Azul / Oro | Imagen y descripción side-by-side |
| `portfolio-avatar-bio` | Portafolio | `<section>` | ✅ Max 760px | Oro / Verde | Avatar circular con indicador online y bio |
| `portfolio-skills-grid` | Portafolio | `<section>` | ✅ Auto-fit 210px | Oro / Neón | Grid de habilidades con iconos |
| `portfolio-perfil-cv` | Portafolio | `<section>` | ✅ Auto-fit 220px | Púrpura | Ficha CV con hitos y descarga |
| `portfolio-galeria-3d` | Portafolio | `<section>` | ✅ Flex 310px | Oro Charro | Galería de obras con sombra 3D |
| `portfolio-mapa-timeline` | Portafolio | `<section>` | ✅ Padding-left 32px | Verde / Oro | Línea de tiempo vertical cronológica |
| `landing-hero-overlay` | Landing | `<section>` | ✅ Max 1150px | Oro / Neón | Hero con fondo traslúcido y botones duales |
| `landing-bento-grid` | Landing | `<section>` | ✅ Auto-fit 300px | Bento / Vidrio | Grid asimétrico de propuestas y servicios |
| `landing-metricas-impacto` | Landing | `<section>` | ✅ Auto-fit 180px | Oro / Verde | 4 Contadores gigantes de estadísticas |

---

## 7. Cómo registrar nuevos bloques personalizados

Para agregar un nuevo bloque al editor, se edita [`editor/public/modules/blocks.js`](file:///home/myinnervoid/Estudio%20Memexicanisimos/Rotulos%20Web/editor/public/modules/blocks.js) agregando una llamada a `bm.add(id, options)`:

```javascript
bm.add('mi-nuevo-bloque', {
  label: 'Mi Nuevo Bloque',
  category: { id: 'mi_categoria', label: 'Mi Categoría', open: true },
  select: true,
  activate: true,
  media: '<i class="fas fa-star" style="font-size:20px; color:#D4AF37;"></i>',
  content: `
    <div style="padding:20px; background:#141B17; border-radius:12px; color:#F8F9FA;">
      <h3>Título de Mi Bloque</h3>
      <p>Contenido editable</p>
    </div>
  `
});
```
