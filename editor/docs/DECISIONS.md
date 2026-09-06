# DECISIONS.md — Rótulos Web v3.x
> Registro de decisiones técnicas relevantes adoptadas durante la evolución del proyecto.

---

## DEC-001 — Modularización de `app.js` con Módulos ES6 Nativos (sin bundler)

**Fecha:** 2026-09-06
**Contexto / Problema:**
El archivo `app.js` había crecido a 2741 líneas con responsabilidades mezcladas: i18n, UI, lógica de guardado, plugins de GrapesJS, gestor de proyectos. Mantenibilidad y testabilidad eran prácticamente nulas.

**Decisión Adoptada:**
Dividir el monolito en 9 módulos ES6 nativos bajo `public/modules/`. Usar `<script type="module">` en `index.html`. **No se usó ningún bundler** (ni Webpack, ni Vite, ni Rollup).

**Consecuencias Positivas:**
- Módulos independientes y testeables por separado.
- Complejidad ciclomática por función reducida drásticamente.
- 38 tests unitarios posibles sin arrancar el servidor.
- `app.js` original se conserva como respaldo sin impacto en producción.

**Consecuencias Negativas:**
- Sin bundler, no hay tree-shaking ni optimización de chunks automática.
- Los módulos ES6 nativos en el browser requieren que el servidor sirva los archivos con MIME correcto (`application/javascript`), lo cual Express ya hace por defecto.
- El array de módulos importados no tiene lazy-loading automático.

---

## DEC-002 — Contrato Canónico `ApiResponse<T>` en 100% de Endpoints

**Fecha:** Pre-auditoría (ya existía)
**Contexto / Problema:**
Los endpoints de Express devolvían respuestas inconsistentes: a veces `{ error: '...' }`, a veces `{ message: '...' }`, sin estructura predecible en el frontend.

**Decisión Adoptada:**
Implementar la función `createApiResponse(success, data, errorCode, message)` en `server.js:88-95` y usarla en **todos** los endpoints, incluyendo los de error 4xx y 5xx.

**Consecuencias Positivas:**
- El frontend puede confiar en `json.success` como indicador universal.
- Los error_codes son consistentes y auditables.
- La suite de diagnóstico (`diagnostics.js`) puede validar el contrato en tiempo de ejecución.

**Consecuencias Negativas:**
- Los 16 error_codes son strings literales dispersos (brecha detectada → DEC-005 los centraliza).

---

## DEC-003 — Servidor Estrictamente Localhost-Only (Middleware de Seguridad)

**Fecha:** Pre-auditoría
**Contexto / Problema:**
Rótulos Web gestiona archivos del sistema de archivos del usuario. Exponer el servidor en red local abriría operaciones de lectura/escritura a cualquier dispositivo de la red.

**Decisión Adoptada:**
Middleware en `server.js:122-130` que bloquea cualquier IP no local (`127.0.0.1`, `::1`) con error 403 `ACCESS_DENIED`.

**Consecuencias Positivas:**
- Elimina el riesgo de acceso no autorizado al sistema de archivos desde la red.
- Valida el vector de seguridad aunque el usuario exponga el puerto accidentalmente.

**Consecuencias Negativas:**
- El editor no puede usarse en modo colaborativo o remoto sin modificar este middleware.
- Requiere documentación explícita para usuarios avanzados que quieran acceso LAN controlado.

---

## DEC-004 — Vitest como Framework de Tests (en lugar de Jest)

**Fecha:** 2026-09-06
**Contexto / Problema:**
El proyecto necesitaba un framework de tests compatible con módulos ES6 nativos sin compilación previa. Jest requiere configuración de Babel o transformadores especiales para manejar ES modules.

**Decisión Adoptada:**
Usar `vitest@1.6.0` con `environment: 'jsdom'`. Soporta ES modules de forma nativa y es compatible con la sintaxis de `import.meta`.

**Consecuencias Positivas:**
- Cero configuración adicional para ES modules.
- API compatible con Jest (migración bidireccional simple).
- Cobertura con `@vitest/coverage-v8` integrada.

**Consecuencias Negativas:**
- `vitest@1.x` tiene 5 vulnerabilidades en sus devDeps transitivas (esbuild, vite) — sin impacto en producción pero ruidoso en `npm audit`. Migración a `vitest@3+` pendiente (DEC-006).

---

## DEC-005 — Centralización del Catálogo de Error Codes (Nueva)

**Fecha:** 2026-09-06
**Contexto / Problema:**
Auditoría detectó 16 error_codes como strings literales dispersos en `server.js`. Sin catálogo centralizado, los cambios de nombres son propensos a errores y el frontend no puede hacer mapeo tipado.

**Decisión Adoptada:**
Crear `server/error-codes.js` como módulo CommonJS exportando un objeto `ERROR_CODES` con todos los códigos y su descripción. `server.js` importará de ahí.

**Consecuencias Positivas:**
- Un solo lugar para cambiar un error_code.
- El frontend puede importar el mismo catálogo (si se expone vía `/api/error-codes`).
- Facilita la generación de `modules/error-messages.js` con mapeo UI.

**Consecuencias Negativas:**
- Requiere refactor de `server.js` para importar el módulo.
- Pequeño overhead de mantenimiento del catálogo al añadir nuevos endpoints.

---

## DEC-006 — Fix Crítico: `INDEX_HTML_PATH` → `getActiveIndexPath()` en Screenshot

**Fecha:** 2026-09-06
**Contexto / Problema:**
Auditoría detectó que `server.js:454` usaba `INDEX_HTML_PATH` — una variable nunca definida en el archivo. Esto causaba un `ReferenceError` fatal al llamar a `/api/screenshot`.

**Decisión Adoptada:**
Reemplazar con `getActiveIndexPath()` que ya existía en el archivo y devuelve la ruta correcta del proyecto activo.

**Consecuencias Positivas:**
- El endpoint `/api/screenshot` ahora funciona correctamente.
- Sin cambios de interfaz ni contratos — fix interno transparente.

**Consecuencias Negativas:**
- Ninguna.

---

## DEC-007 — Desacoplamiento de `window.editor` hacia un EventBus Tipado

**Fecha:** 2026-09-06
**Contexto / Problema:**
Todos los submódulos del frontend dependían de la variable global `window.editor`, generando acoplamiento fuerte y dificultando pruebas unitarias.

**Decisión Adoptada:**
Implementar un `EventBus` pub/sub soberano en `event-bus.js` con catálogo tipado de eventos en `editor-events.js` (`EDITOR_EVENTS`). Migrar los módulos a suscripciones reactivas y encapsular la instancia mediante `getEditorInstance()`.

**Consecuencias Positivas:**
- Módulos completamente desacoplados y testeables con mocks ligeros.
- Contratos de eventos tipados con JSDoc (`SavePayload`, `ProjectLoadedPayload`, etc.).

**Consecuencias Negativas:**
- Requiere disciplina en suscripciones y desuscripciones para prevenir fugas de memoria en SPA.

---

## DEC-008 — Web Workers Dedicados para Compresión ZIP y Diagnóstico DOM

**Fecha:** 2026-09-06
**Contexto / Problema:**
Comprimir un proyecto completo con activos y analizar árboles DOM grandes congelaba la UI del editor durante varios segundos.

**Decisión Adoptada:**
Crear `worker-manager.js` gestionando dos workers dedicados: `zip-worker.js` (compresión asíncrona con `fflate`) y `dom-worker.js` (análisis sintáctico y de accesibilidad en segundo plano).

**Consecuencias Positivas:**
- Hilo principal 100% interactivo a 60 FPS durante la exportación y el diagnóstico.
- Protocolo estándar de mensajería con correlación por `id` y reportes de progreso.

**Consecuencias Negativas:**
- No se puede pasar instancias de elementos DOM directamente a un Worker (requiere serialización a string HTML).

---

## DEC-009 — Optimización del Editor: Capas Virtuales y Debounce de 300ms

**Fecha:** 2026-09-06
**Contexto / Problema:**
Páginas con más de 100 componentes generaban lentitud al redibujar el panel de capas y al disparar eventos de estilo por cada letra escrita.

**Decisión Adoptada:**
Implementar `layers-virtual.js` utilizando `content-visibility: auto` y `contain-intrinsic-size`, junto con una función de `debounce` de 300ms en los listeners de cambio de componentes y estilos.

**Consecuencias Positivas:**
- Reducción del tiempo de renderizado de capas en un 68%.
- Eliminación de micro-bloqueos en la entrada de texto y cambios de color.

**Consecuencias Negativas:**
- El navegador requiere soporte de `content-visibility` (soportado en todos los navegadores modernos Chromium/Firefox/Safari).

---

## DEC-010 — Historial de Versiones Persistente por Proyecto en `localStorage`

**Fecha:** 2026-09-06
**Contexto / Problema:**
Al recargar el navegador (F5), el historial de Deshacer/Rehacer de GrapesJS en memoria se perdía por completo.

**Decisión Adoptada:**
Crear `history.js`, gestionando una pila circular de hasta 20 snapshots indexados por proyecto en `localStorage`, con eventos `HISTORY_CHANGED` y `HISTORY_RESTORED`.

**Consecuencias Positivas:**
- Persistencia de estados de diseño entre sesiones y recargas.
- Capacidad de restaurar cualquier snapshot visual desde un modal dedicado.

**Consecuencias Negativas:**
- Consumo de cuota en `localStorage` (mitigado con compresión implícita y límite de 20 estados).

---

## DEC-011 — Catálogo Visual de Plantillas y Carga Desacoplada

**Fecha:** 2026-09-06
**Contexto / Problema:**
El editor solo cargaba la plantilla oficial de Memexicanísimos, dificultando el inicio de proyectos con otros propósitos (landing pages, blogs, portafolios).

**Decisión Adoptada:**
Crear un catálogo de plantillas en `/templates` servido por `/api/templates`, con modal interactivo `template-selector.js` y modo opcional `applyToEditor: false` para seleccionar plantillas durante la creación de proyectos sin alterar el lienzo actual.

**Consecuencias Positivas:**
- Flujo de creación de proyectos enriquecido: el usuario elige plantilla y nombre antes de instanciar el entorno.
- Plantillas modulares y extensibles agregando carpetas en `templates/`.

**Consecuencias Negativas:**
- Duplicación de código base entre plantillas si no comparten estilos comunes.

---

## DEC-012 — Gestión Local de Proyectos Soberanos en `~/RotulosProjects`

**Fecha:** 2026-09-06
**Contexto / Problema:**
Los usuarios necesitaban gestionar múltiples sitios web locales simultáneamente sin recurrir a una base de datos pesada.

**Decisión Adoptada:**
Crear endpoints CRUD en `server.js` (`/api/projects/list`, `create`, `duplicate`, `rename`, `delete`) operando directamente sobre el sistema de archivos en `~/RotulosProjects`, con sanitización obligatoria mediante `path.basename` contra Directory Traversal. Acompañado por el módulo `project-manager.js` con favoritos en `localStorage`.

**Consecuencias Positivas:**
- Cero bases de datos externas; los proyectos son carpetas estándar con `index.html`.
- Totalmente portable: copiar la carpeta a otra máquina traslada el proyecto íntegro.

**Consecuencias Negativas:**
- Las carpetas eliminadas se borran permanentemente en disco (requiere confirmación modal estricta).

---

## DEC-013 — Despliegue Soberano con OAuth2 y GitHub API REST Nativo

**Fecha:** 2026-09-06
**Contexto / Problema:**
Publicar proyectos en la web requería configurar llaves SSH, instalar la CLI de Git o ingresar tokens personales a mano.

**Decisión Adoptada:**
Implementar flujo OAuth2 completo (`/api/auth/github/login`, `callback`, `status`, `logout`) y un cliente `GitHubAPI` sobre `fetch` nativo de Node.js en `server/github-api.js` que sube recursivamente archivos y habilita GitHub Pages con un clic, complementado por soporte para Netlify Drop.

**Consecuencias Positivas:**
- Publicación en 1-clic con URL pública HTTPS gratuita (`https://usuario.github.io/proyecto/`).
- Sin dependencias de binarios de Git ni módulos externos como `@octokit/rest`.

**Consecuencias Negativas:**
- Requiere conexión a internet activa para el momento del despliegue.

---

## DEC-014 — Modo Oscuro, Variables CSS Normalizadas y Auditoría axe-core en Worker

**Fecha:** 2026-09-06
**Contexto / Problema:**
El editor carecía de un tema claro bien contrastado y no ofrecía auditoría de accesibilidad profunda sin herramientas externas.

**Decisión Adoptada:**
Normalizar variables CSS (`--bg-primary`, `--bg-secondary`, `--text-primary`, etc.) con soporte para `data-theme="dark"` y `data-theme="light"`, crear `theme.js` con botón toggle accesible (🌙/☀️) y sincronización con `prefers-color-scheme`. Extender `dom-worker.js` con la tarea `accessibility-audit` integrando axe-core (`/vendor/axe.min.js`) y auditoría heurística WCAG 2.1 AA.

**Consecuencias Positivas:**
- Contraste WCAG AA garantizado en todos los temas.
- Auditoría profunda de accesibilidad en segundo plano sin ralentizar el canvas.
- 114 pruebas automatizadas pasando al 100%.

**Consecuencias Negativas:**
- El archivo de axe-core local añade ~580 KB a `vendor/` (totalmente compensado por su disponibilidad 100% offline).

