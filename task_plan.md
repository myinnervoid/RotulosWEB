# Task Plan: Ampliación de Plantillas, Elementos de Diseño Rápido y Ergonomía del Canvas

## Goal
Ampliar Rótulos Web para diseño visual acelerado con tres familias de bloques especializados (Blog, Personal/Portafolio, Landing Page Profesional) y perfeccionar la ergonomía, selección y arrastre en el lienzo (canvas) de GrapesJS, eliminando saltos imprecisos entre líneas cercanas.

## Architecture & Scope
1. **Ergonomía del Canvas de GrapesJS**:
   - Configuración de drag & drop preciso (`dragMode`, drop placeholder con altura mínima y animación visual clara).
   - Inyección de reglas CSS para drop-zones en el iframe del canvas: contornos nítidos para `.gjs-selected` (oro charro), `.gjs-hovered` (punteado elegante), `.gjs-placeholder` (indicador verde neón con área delimitada).
   - Prevención de colapso de elementos vacíos (`min-height` y padding visual mientras se maqueta).
2. **Nuevos Bloques de Diseño Rápido ([`editor/public/modules/blocks.js`](file:///home/myinnervoid/Estudio%20Memexicanisimos/Rotulos%20Web/editor/public/modules/blocks.js))**:
   - **Categoría Blog (`cat_blog`)**:
     - *Cuadro de texto de artículo / narración con tipografía editorial*.
     - *Caja automática de Título, Subtítulo y Metadatos de autor/fecha*.
     - *Despliegue de notas con imágenes (Feed / Grid de posts con miniaturas)*.
     - *Cuadro de texto con imagen al lado (Media + Texto descriptivo 50/50 o 40/60)*.
   - **Categoría Personal / Portafolio (`cat_portfolio`)**:
     - *Avatar / Imagen circular con anillo de acento y bio de bienvenida*.
     - *Grid de iconos personalizados de habilidades, conocimientos y herramientas*.
     - *Ficha de perfil CV / Biografía con trayectoria y enlace de contacto*.
     - *Galería de proyectos / Arte con tarjetas 3D hover y badges*.
     - *Mapa conceptual / Timeline de trayectoria (árbol o semántico)*.
   - **Categoría Profesional / Landing Page (`cat_landing`)**:
     - *Hero section profesional con fondo translúcido (overlay oscuro + imagen) y titular nítido al frente*.
     - *Bento Grid de servicios / Propuestas de valor*.
     - *Barra de métricas e impacto (Contadores de estadísticas y logros)*.
3. **Plantillas Completas Expandidas**:
   - Actualizar el catálogo de plantillas ([`editor/templates/`](file:///home/myinnervoid/Estudio%20Memexicanisimos/Rotulos%20Web/editor/templates/)) integrando estas composiciones en los arquetipos de Blog, Portafolio y Landing Profesional.
4. **Pruebas y Verificación**:
   - Tests automatizados en Vitest para los nuevos bloques y renderizado.
   - Verificación de no-regresión de toda la suite (143+ tests).

## Phases

### Phase 1: Diagnóstico e Investigación de Ergonomía del Canvas <!-- id: 0 -->
- **Status:** complete
- **Files:** `editor/public/modules/editor-init.js`, `editor/public/style.css`, `editor/public/modules/blocks.js`

### Phase 2: Implementación de Ergonomía y Precisión en el Canvas <!-- id: 1 -->
- **Status:** complete
- **Files:** `editor/public/modules/editor-init.js`, `editor/public/style.css`

### Phase 3: Creación de Bloques de Blog, Portafolio y Landing Profesional <!-- id: 2 -->
- **Status:** complete
- **Files:** `editor/public/modules/blocks.js`, `editor/docs/BLOQUES_MANIFEST.md`

### Phase 4: Integración en Plantillas y Pruebas Vitest <!-- id: 3 -->
- **Status:** complete
- **Files:** `editor/tests/blocks-expansion.test.js`, `editor/docs/BLOQUES_MANIFEST.md`

### Phase 5: Verificación en Vivo y Entrega <!-- id: 4 -->
- **Status:** complete
- **Files:** Documentación final y verificación en vivo

## Next Step
Todos los objetivos completados satisfactoriamente. Pruebas 100% pasando (147/147).
