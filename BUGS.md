# 🐛 Registro Oficial de Bugs y Desviaciones Técnicas — Rótulos Web

**Proyecto:** Rótulos Web / Estudio Visual Memexicanísimos  
**Fecha de corte:** 3 de octubre de 2026  
**Versión declarada en arquitectura:** 5.1.0  
**Estado general:** 8 incidencias identificadas (2 Críticas, 3 Altas, 3 Medias)

---

### Resumen de Estado

| ID | Severidad | Módulo / Archivo | Estado | Descripción corta |
|---|---|---|---|---|
| **BUG-001** | 🔴 Crítica | `editor/public/index.html` | **ABIERTO** | Carga del monolito legado `app.js` en lugar del punto de entrada modular `modules/main.js`. |
| **BUG-002** | 🔴 Crítica | `editor/public/index.html` | **ABIERTO** | Dependencia externa de CDN para `axe-core` 4.7.2 ignorando el bundle local v4.13.0 (`axe.min.js`). |
| **BUG-003** | 🟠 Alta | `editor/public/index.html` | **EN PROCESO** | Falta de enlace canónico `<link rel="manifest">` pese a tener `sw.js` registrado (manifiesto ya generado). |
| **BUG-004** | 🟠 Alta | `editor/public/index.html`, UI | **ABIERTO** | Desfase visual de versiones (`v3.1` / `v3.3`) frente al core del sistema (`v5.1.0`). |
| **BUG-005** | 🟠 Alta | `editor/public/app.js` | **ABIERTO** | Riesgo de `RangeError: Maximum call stack size exceeded` por extensión no aislada de `DomComponents.addType('link')`. |
| **BUG-006** | 🟡 Media | `editor/public/diagnostics.js` | **ABIERTO** | Acoplamiento a la variable global mutable `window.editor` (violación de GAP-03). |
| **BUG-007** | 🟡 Media | `editor/public/style.css` / `ui-panels.js` | **ABIERTO** | Caída de framerate (lag) en `sidebar-resizer` por falta de `requestAnimationFrame` en `mousemove`. |
| **BUG-008** | 🟡 Media | `editor.sh` | **ABIERTO** | Falta de entrecomillado seguro en paso de argumento `$PROJECT_PATH` con espacios. |

---

### Detalle de Incidencias Técnicas

#### 🔴 BUG-001: Regresión de arquitectura en `index.html` (Monolito vs ES Modules)
* **Archivo afectado:** `editor/public/index.html`
* **Origen:** Se incluye `<script src="./app.js"></script>` de forma directa.
* **Impacto:** Según `AGENTS.md`, `app.js` es únicamente un respaldo monolítico antiguo. Al cargarlo, se anula la arquitectura de módulos (`event-bus.js`, `project-manager.js`, `welcome-hub.js`, `editor-init.js`) y se reactivan los problemas de acoplamiento global resueltos en la versión 5.1.
* **Corrección requerida:**
  ```html
  <!-- Reemplazar en index.html -->
  <!-- ELIMINAR: <script src="./app.js"></script> -->
  <script type="module" src="./modules/main.js"></script>
  ```

#### 🔴 BUG-002: Ruptura de soberanía offline en motor de accesibilidad
* **Archivo afectado:** `editor/public/index.html`
* **Origen:** Se invoca `<script src="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js"></script>`.
* **Impacto:** Si la máquina no tiene acceso a internet, la suite de accesibilidad falla silenciosamente. Además, existe una versión superior y local lista para usarse: `axe.min.js` v4.13.0 en la raíz del entorno.
* **Corrección requerida:**
  ```html
  <!-- Apuntar al recurso local soberano -->
  <script src="./vendor/axe.min.js"></script>
  ```

#### 🟠 BUG-003: Ausencia de metadato de instalación PWA
* **Archivo afectado:** `editor/public/index.html`
* **Origen:** El script de pie registra `/sw.js`, pero el `<head>` carece del tag del manifiesto.
* **Impacto:** El navegador no clasifica la app como PWA instalable en escritorio ni en dispositivos móviles, impidiendo la experiencia de suite creativa nativa.
* **Corrección requerida:**
  ```html
  <link rel="manifest" href="./manifest.json">
  <meta name="theme-color" content="#006847">
  ```

#### 🟠 BUG-004: Inconsistencia visual de versiones y títulos de interfaz
* **Archivos afectados:** `editor/public/index.html`
* **Origen:** El título del documento declara v3.1, el pie del drawer declara v3.3, mientras la suite de pruebas y `ANALISIS.md` consolidan la versión 5.1.0.
* **Impacto:** Confusión al usuario y desalineación con las pruebas de integración.
* **Corrección requerida:** Unificar todas las marcas de versión a v5.1 y vincularlas a la clave de traducción `badge_editor` en `locales/es.json`.

#### 🟠 BUG-005: Sobrescritura de modelo de componentes con recursión infinita
* **Archivo afectado:** `editor/public/app.js`
* **Origen:** La extensión de `editor.DomComponents.addType('link', ...)` ejecuta `extend: 'link'` sin aislar el prototipo base al inicializarse.
* **Impacto:** Si este archivo se ejecuta en conjunto con `modules/blocks.js`, causa desbordamiento de pila (`RangeError: Maximum call stack size exceeded`) al registrar o clonar enlaces en el lienzo.
* **Corrección requerida:** Desacoplar traits mediante extensiones quirúrgicas sin re-declarar `init()` sobre tipos nativos de GrapesJS 0.23+.

#### 🟡 BUG-006: Acoplamiento global persistente a window.editor
* **Archivos afectados:** `editor/public/diagnostics.js` y `app.js`
* **Origen:** Funciones como `runIntegritySuite(editor)` reciben o buscan `window.editor` en el objeto global.
* **Impacto:** Dificulta la ejecución de pruebas unitarias aisladas sin mockear el objeto global window, violando el principio de diseño resuelto en GAP-03.
* **Corrección requerida:** Consumir instancias mediante eventos de suscripción en `event-bus.js` (`EVENTS.EDITOR_MOUNTED`).

#### 🟡 BUG-007: Congelamiento de hilo durante el redimensionamiento de barra lateral
* **Archivo afectado:** `editor/public/app.js` / `modules/ui-panels.js`
* **Origen:** Listener de evento `mousemove` sin desacoplamiento de cuadros por segundo.
* **Impacto:** Caída de tasa de refresco a menos de 30 FPS en monitores de alta resolución mientras se arrastra el tirador lateral `#sidebar-resizer`.
* **Corrección requerida:** Encapsular la actualización de ancho en `requestAnimationFrame`.

#### 🟡 BUG-008: Manejo vulnerable de rutas con espacios en editor.sh
* **Archivo afectado:** `editor.sh`
* **Origen:** La invocación `exec node server.js "$PROJECT_PATH"` falla si `$PROJECT_PATH` contiene secuencias no escapadas al combinarse con subrutas relativas.
* **Impacto:** Imposibilidad de iniciar el servidor en carpetas con nombres compuestos (p. ej. `/home/user/Mis Proyectos/Web 1`).
* **Corrección requerida:** Forzar validación de escape con `printf %q` antes del paso a `node server.js`.
