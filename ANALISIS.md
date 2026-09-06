# Informe Técnico y Análisis de Evolución — Rótulos Web v5.0

**Estudio Visual Memexicanísimos**  
*Fecha de actualización: 6 de septiembre de 2026*  
*Versión de software: 5.0.0*  
*Estado de calidad: 114/114 pruebas automatizadas aprobadas (15 suites en Vitest)*

---

## 1. Resumen Ejecutivo

Este documento consolida el diagnóstico técnico, la resolución de brechas y la arquitectura integral de **Rótulos Web v5.0**. 

El proyecto transitó exitosamente desde un prototipo monolítico con acoplamiento global (`window.editor`) y rutas hardcodeadas hacia una plataforma de autoría visual moderna, modular, altamente performante y soberana (offline-first). La versión 5.0 incorpora un panel completo de administración de proyectos locales, publicación simplificada en 1 clic (GitHub Pages y Netlify), soporte integral de Modo Oscuro con variables CSS semánticas y auditoría de accesibilidad WCAG 2.1 AA impulsada por `axe-core` sobre Web Workers.

---

## 2. Matriz de Brechas Originales y Estado de Resolución

| ID | Brecha Original Identificada | Estado | Solución Arquitectónica Implementada |
|---|---|---|---|
| **GAP-01** | Ausencia total de pruebas automatizadas en `package.json` | **RESUELTO** | Implementación de Vitest con Happy DOM. **114 pruebas en 15 suites** cubriendo backend, frontend, plugins, event bus, workers y storage. |
| **GAP-02** | Monolito frontend en `app.js` (>2300 líneas) | **RESUELTO** | Refactorizado y modularizado en arquitectura ES Modules (`public/modules/`): `editor-init.js`, `event-bus.js`, `project-manager.js`, `publish.js`, `templates.js`, `theme.js`, etc. |
| **GAP-03** | Acoplamiento a variable global mutable `window.editor` | **RESUELTO** | Sistema Pub/Sub tipado (`event-bus.js` y `editor-events.js` con JSDoc). Desacoplamiento total de módulos de UI. |
| **GAP-04** | Bloqueo del hilo principal en tareas pesadas (ZIP, a11y) | **RESUELTO** | Delegación de tareas a Web Workers (`zip-worker.js`, `dom-worker.js`) mediante un `worker-manager.js` basado en promesas. |
| **GAP-05** | Rutas hardcodeadas de desarrollo y Node NVM en `editor.sh` | **RESUELTO** | Detección dinámica de Node/NVM en scripts bash y rutas relativas con validación estricta de seguridad contra path traversal. |
| **GAP-06** | Condiciones de carrera en rotación de respaldos FIFO | **RESUELTO** | Guardado atómico en 3 pasos: verificación, rotación FIFO acotada (`MAX_BACKUPS=15`), escritura en archivo temporal y `fs.renameSync`. |
| **GAP-07** | Límite permisivo en Express (`50mb`) sin rate limiting | **RESUELTO** | Límite ajustado a `15mb`, timeout de conexiones y middleware de validación estricta de entrada con códigos de error canónicos (`error-codes.js`). |
| **GAP-08** | Falta de gestión de múltiples proyectos locales | **RESUELTO** | Panel de proyectos (`~/RotulosProjects`) con creación, duplicación, renombrado, favoritos y conmutación en caliente de contexto. |
| **GAP-09** | Proceso manual y engorroso de publicación web | **RESUELTO** | Flujo de despliegue automatizado con 1 clic hacia GitHub Pages (con OAuth2 efímero) y Netlify (preparación ZIP). |
| **GAP-10** | Carencia de tema oscuro y auditorías a11y reactivas | **RESUELTO** | Motor de temas (`light`, `dark`, `system`) sincronizado en `localStorage` y auditoría en background con `axe-core`. |

---

## 3. Arquitectura del Sistema (Rótulos Web v5.0)

### 3.1. Frontend Modular (ES Modules nativos)
El cliente no requiere herramientas complejas de empaquetado en tiempo de desarrollo. Utiliza JavaScript moderno en el navegador:
- **`public/modules/event-bus.js`**: Bus de eventos centralizado con tipado semántico (`EVENTS`).
- **`public/modules/editor-events.js`**: Diccionario canónico de eventos (`PROJECT_LOADED`, `PROJECT_SAVED`, `THEME_CHANGED`, `LAYER_UPDATED`, etc.).
- **`public/modules/project-manager.js`**: Interfaz visual y llamadas a la API para gestión integral de carpetas en `~/RotulosProjects`.
- **`public/modules/templates.js`**: Catálogo de plantillas con previsualización en vivo e inyección en caliente.
- **`public/modules/publish.js`**: Modal interactivo de publicación hacia GitHub Pages (vía token efímero) y Netlify.
- **`public/modules/theme.js`**: Conmutador de paleta cromática con detección automática de `prefers-color-scheme`.
- **`public/modules/history.js`**: Historial de versiones persistente en `localStorage` con previsualización de diferencias (Diff).
- **`public/modules/layers-virtual.js`**: Renderizado eficiente del árbol de capas mediante `content-visibility: auto`.
- **`public/modules/services/worker-manager.js`**: Puente asíncrono con los Web Workers.

### 3.2. Web Workers (Procesamiento fuera del hilo principal)
- **`public/workers/zip-worker.js`**: Empaquetado comprimido `.zip` del proyecto usando JSZip sin congelar la UI de GrapesJS.
- **`public/workers/dom-worker.js`**: Ejecución de reglas WCAG de `axe-core` y extracción estructural de elementos DOM.

### 3.3. Backend Soberano (Express 5.0)
- **Contrato canónico `ApiResponse<T>`**: Todas las respuestas JSON siguen `{ success, data, error_code, message }`.
- **Diccionario canónico de errores (`server/error-codes.js`)**: Identificadores semánticos desacoplados de los textos en la UI.
- **Seguridad en red LAN**: Confinamiento en interfaces seguras locales (`127.0.0.1`), saneamiento de nombres de proyectos y prevención de escapes de directorio.
- **Sincronización en tiempo real (SSE)**: `EventSource` para reflejar cambios externos de archivos CSS/JS en el lienzo sin recarga forzada.

---

## 4. Métricas de Pruebas Automatizadas

La suite se ejecuta mediante Vitest con el entorno DOM provisto por Happy DOM:

```bash
cd editor && npm test
```

### Resultados de la Suite (15 archivos, 114 pruebas):
1. `tests/color-plugin.test.js` — 16/16 pruebas (Conversiones HEX/RGB, contraste WCAG y paletas mexicanas)
2. `tests/dialog.test.js` — 4/4 pruebas (Accesibilidad ARIA y ciclos de foco en modales)
3. `tests/event-bus.test.js` — 6/6 pruebas (Patrón Pub/Sub, suscripciones y aislamiento de errores)
4. `tests/history.test.js` — 7/7 pruebas (Persistencia en localStorage, snapshots y límites de retención)
5. `tests/i18n.test.js` — 6/6 pruebas (Interpolación de textos y soporte multi-idioma)
6. `tests/projects.test.js` — 10/10 pruebas (CRUD de proyectos, validación de nombres y prevención path traversal)
7. `tests/publish.test.js` — 9/9 pruebas (Despliegue a GitHub Pages, validación de repos y contratos)
8. `tests/save-file.test.js` — 6/6 pruebas (Guardado de archivos individuales y validación de extensiones)
9. `tests/save-publish.test.js` — 7/7 pruebas (Flujo de guardado con respaldo y publicación Git)
10. `tests/server.test.js` — 12/12 pruebas (Endpoints Express, rotación FIFO de backups y sanitización HTML)
11. `tests/templates.test.js` — 4/4 pruebas (Catálogo de plantillas, clonación y estructura inicial)
12. `tests/theme.test.js` — 8/8 pruebas (Conmutación de temas, persistencia y eventos reactivos)
13. `tests/toast.test.js` — 9/9 pruebas (Notificaciones no intrusivas en pantalla)
14. `tests/ui-panels.test.js` — 3/3 pruebas (Comportamiento de paneles laterales y layout)
15. `tests/worker-manager.test.js` — 7/7 pruebas (Comunicación Worker, timeouts y resolución de promesas)

**Total:** **114 pruebas exitosas (0 fallos, 100% pasando)**.

---

## 5. Guía de Ejecución Rápida

### Iniciar el entorno de desarrollo:
```bash
# Desde la raíz del repositorio
./editor.sh
# O manualmente:
cd editor && npm start
```
El editor estará disponible de inmediato en `http://127.0.0.1:5050`.

### Ejecutar las pruebas automatizadas:
```bash
cd editor && npm test
```

---

## 6. Próximos Pasos Recomendados (Roadmap v6.0)

1. **Colaboración Local P2P**: Sincronización multi-dispositivo en red LAN local mediante WebRTC sin servidores externos.
2. **Generador de Componentes Asistido por IA**: Integración de endpoints locales (Ollama / Llama.cpp) para sugerir bloques HTML/CSS semánticos a partir de lenguaje natural.
3. **Internacionalización Completa (i18n)**: Soporte bilingüe completo (Español / Inglés / Náhuatl) en toda la interfaz de usuario.
