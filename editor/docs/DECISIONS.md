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
