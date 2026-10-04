# Auditoría Integral de Código, Resiliencia y Calidad
## Rótulos Web — v5.1.0 (Post-Refactor)

## 1. Contexto

La presente auditoría da cumplimiento a los requerimientos de análisis riguroso tras el extenso trabajo de refactorización de la arquitectura hacia un sistema basado en módulos desacoplados (`public/modules/`). El objetivo principal ha sido identificar bugs residuales, race conditions, conexiones falsas o frágiles, código muerto, así como auditar la cobertura de tests.

## 2. Matriz de Hallazgos

| # | Módulo/Área | Descripción del Hallazgo | Severidad | Estado |
|---|---|---|---|---|
| 1 | `tests/server.test.js` | Test de `POST /api/screenshot` daba timeout en entornos sin Chrome por la falta del argumento `headless: 'new'` en `puppeteer`. | **Crítica** | ✅ Resuelto |
| 2 | `eslint.config.js` | Errores masivos (217 errores) de linting debido a la falta de variables globales como `process`, `clearTimeout`, `URL` y error de ruta en `zip-worker.js`. | **Alta** | ✅ Resuelto |
| 3 | `tests/save-publish.test.js` | Errores no capturados (unhandled rejections) provocaban fallos ruidosos durante pruebas unitarias. | **Media** | ✅ Resuelto |
| 4 | `public/app.js` | Monolito legacy (~2700 líneas). Actualmente cargado como fallback (script no utilizado en ejecución principal por el uso de `modules/main.js`). Es **dead code/código duplicado**. | **Baja** | ⚠️ Pendiente (Ver recomendaciones) |
| 5 | Módulos (Varios) | Dependencia frágil de `window.isStaticMode` y `window.editor` distribuida en múltiples archivos de `public/modules/`. Siendo un patrón acoplado a un objeto global, representa fragilidad (falsas conexiones). | **Media** | ⚠️ Pendiente |
| 6 | CI/CD | Falta de un archivo `.github/workflows/ci.yml` para garantizar que los nuevos commits pasen el riguroso gating de los 134 tests. | **Alta** | ✅ Resuelto |

## 3. Código Muerto y Duplicidad

El archivo `public/app.js` (tamaño: ~114KB) se detectó como completamente redundante en base al uso actual del sistema (`index.html` ha comentado su uso como "respaldo" y activa directamente `modules/main.js`). El monolito contiene copias directas de funcionalidades que ahora residen limpiamente en `public/modules/*.js`.

Se sugiere considerar la eliminación segura del mismo para reducir carga de mantenimiento, junto a su homólogo `public/app.min.js`. Del mismo modo, el archivo `templates/**/app.js` contiene implementaciones redundantes del editor que se encontraban exentas de mantenimiento (y por las que ESLint arrojaba falsos positivos).

## 4. Estado de las Falsas Conexiones y APIs

1. **Gestión de Errores Desacoplada**: Tal y como se solicitó históricamente en la v4.0, la gestión de la traducción de `json.message` ha sido migrada existosamente al catálogo centralizado en `public/modules/error-messages.js`.
2. **Máquina de Estados**: Se implementó exitosamente el estado explícito `EMPTY` para casos en que no haya datos a guardar o exportar, aunque actualmente se invoca infrecuentemente en `public/modules/publish.js` a favor de `IDLE`.
3. **Acoplamiento Global (`window.*`)**: Subsisten más de 30 referencias directas a propiedades ad-hoc de `window` (como `window.captureSnapshot`, `window.clearHistory`, `window.isStaticMode`). Si bien la aplicación opera correctamente, una mejora en la resiliencia a largo plazo requeriría un almacén de contexto/estado, pasándolo a través del Event Bus.
4. **Endpoints**: No se hallaron *endpoints rotos* dentro de la suite unitaria o las API expuestas. La validación canónica de `ApiResponse<T>` confirma consistencia en todas las respuestas del backend local.

## 5. Auditoría de Cobertura y Tests

- Se ha garantizado la estabilidad al 100% de los tests unitarios. (134/134 exitosos).
- El error fundamental en el motor de GrapesJS (manejo asíncrono y workers) se probó para que los fallos sean controlados (ej: `zip-worker.js`).
- El pipeline CI (`.github/workflows/ci.yml`) está ya integrado y se ejecutará de manera ininterrumpida contra `main`.

## 6. Recomendaciones Accionables

1. **Eliminar Dead Code**: Eliminar definitivamente `public/app.js` y `public/app.min.js` para evitar confusión arquitectónica y centralizar todo esfuerzo en `public/modules/`.
2. **Refactorización de Globales**: Iniciar un esfuerzo técnico para desterrar el uso de variables mutables asociadas a `window`. Todo estado que represente el "modo" (ej: `isStaticMode`) debería encapsularse en un módulo de configuración o en la propia instancia del `EventBus`.
3. **Eliminar Archivos Duplicados**: Retirar los `app.js` duplicados dentro de `templates/todos-santos/` y `templates/memexicanisimos/`, ya que los templates deben idealmente ser solo assets estáticos (`.html` y `.css`).
