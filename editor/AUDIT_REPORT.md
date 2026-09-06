# 🔍 AUDIT_REPORT.md — Rótulos Web v3.x
**Motor Autónomo de Auditoría y Evolución de Software — v3.2**
**Fecha:** 2026-09-06 | **Auditor:** Antigravity IDE

---

## Resumen Ejecutivo

| Métrica | Estado |
|---|---|
| Versión auditada | `3.3.0` → `3.4.0` (post-modularización) |
| Líneas de código (pre-mod.) | 3,692 (app.js: 2741 + server.js: 555 + diagnostics.js: 398) |
| Módulos ES6 generados | 9 módulos |
| Tests activos | **38/38 ✅** |
| Cobertura estimada lógica de negocio | ~42% (Menor al umbral de 80%) |
| Vulnerabilidades en devDeps | 5 (2 moderate, 1 high, 2 critical — todas en `vitest@1.x`) |
| Vulnerabilidades en deps de producción | **0** |
| Contrato `ApiResponse<T>` | ✅ Implementado en 100% de endpoints |
| FSM de UI (5 estados) | ⚠️ Parcial — 3 de 5 estados presentes |

---

## Vector 1 — Dominio, Invariantes & Marco Legal

### Hallazgo 1.1 — Ausencia de Invariantes de Negocio Documentadas
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | No existe ningún archivo `DOMAIN.md`, `INVARIANTS.md` ni comentarios estructurados con invariantes. La regla "máximo 15 respaldos FIFO" existe solo en código (`server.js:81`) sin contrato escrito. |
| **Acción sugerida** | Crear `docs/DOMAIN.md` con ciclo de vida de un Proyecto, estados válidos del editor y reglas invariantes (ej: "El archivo `index.html` NUNCA se reemplaza sin respaldo previo"). |

### Hallazgo 1.2 — Normativas Legales No Verificadas
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | La herramienta gestiona archivos del sistema de archivos local. No hay PII almacenado, sin base de datos de usuarios. El `.env` real existe en disco y puede contener credenciales Git. |
| **Acción sugerida** | Confirmar que `.gitignore` excluye `.env` activo. Agregar `SECURITY.md` básico con política de reporte de vulnerabilidades. |

### Hallazgo 1.3 — Ciclo de Vida de Proyecto No Documentado
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `AGENTS.md` documenta las reglas para agentes, pero no existe un diagrama del ciclo de vida de un "Proyecto" (creación → edición → guardado → publicación → archivado). |
| **Acción sugerida** | Extender `AGENTS.md` o crear `docs/LIFECYCLE.md` con diagrama de estados del proyecto. |

---

## Vector 2 — Contratos de Datos, Esquema & Catálogo de Fallos

### Hallazgo 2.1 — Contrato ApiResponse implementado correctamente ✅
| Campo | Valor |
|---|---|
| **Criticidad** | — (Positivo) |
| **Evidencia** | `server.js:88-95` define `createApiResponse(success, data, errorCode, message)`. Todos los endpoints usan esta función. La suite de diagnóstico (`diagnostics.js:35-55`) la valida en tiempo de ejecución. |
| **Acción sugerida** | Ninguna. Mantener el contrato. |

### Hallazgo 2.2 — Catálogo de Error Codes Incompleto
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | 16 error_codes dispersos como strings literales en `server.js`. No existe un catálogo centralizado. Codes detectados: `ACCESS_DENIED`, `RECENT_LOAD_FAILED`, `INVALID_PATH`, `PATH_NOT_FOUND`, `ASSETS_READ_FAILED`, `FILE_NOT_FOUND`, `PAGE_READ_FAILED`, `INVALID_PAYLOAD`, `MALFORMED_HTML`, `SAVE_FAILED`, `STATS_FAILED`, `GIT_PUSH_FAILED`, `GIT_AUTH_REQUIRED`, `CHROME_NOT_FOUND`, `SCREENSHOT_FAILED`, `SWITCH_FAILED`. |
| **Acción sugerida** | Crear `server/error-codes.js` con el catálogo completo: código, descripción, HTTP status. |

### Hallazgo 2.3 — Sin Tipos/Interfaces Formales (JSDoc)
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | El proyecto usa JavaScript puro. No hay tipos JSDoc en `server.js` ni en los módulos. La estructura de datos de `ApiResponse<T>` existe solo en comentario inline. |
| **Acción sugerida** | Agregar `@typedef ApiResponse` con JSDoc en `server.js`. Activar `// @ts-check` en archivos críticos. |

### Hallazgo 2.4 — Sin Validación de Esquema en `recent.json`
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `server.js:50`: solo `JSON.parse`, sin validación de que sea `Array<string>`. Un archivo corrupto produce error silencioso. |
| **Acción sugerida** | Agregar guard: `if (!Array.isArray(projects)) projects = [];` |

---

## Vector 3 — Lógica de Dominio, Concurrencia & Hardening

### Hallazgo 3.1 — `INDEX_HTML_PATH` Indefinido en `/api/screenshot`
| Campo | Valor |
|---|---|
| **Criticidad** | **🔴 Crítico** |
| **Evidencia** | `server.js:454`: `const targetUrl = \`file://${INDEX_HTML_PATH}\`` — `INDEX_HTML_PATH` no está definido en ningún lugar del archivo. Produce `ReferenceError` en tiempo de ejecución al llamar `/api/screenshot`. |
| **Acción sugerida** | Reemplazar por `getActiveIndexPath()`. Fix de 1 línea. |

### Hallazgo 3.2 — Mutación de Variable Global `projectPath` en Endpoint GET
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | `server.js:251-254`: `GET /api/page` muta la variable global `projectPath` si recibe `?project=`. Antipatrón que puede producir race conditions. |
| **Acción sugerida** | Mover mutación de `projectPath` solo a `POST /api/switch-project`. Usar variable local en GET. |

### Hallazgo 3.3 — Atomicidad de Guardado No Garantizada
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | `server.js:291-300`: Guarda backup y luego sobreescribe. Si el proceso se interrumpe, `index.html` puede quedar corrompido sin rollback automático. |
| **Acción sugerida** | Escribir a `index.html.tmp` y luego hacer `fs.renameSync` (operación atómica en la mayoría de sistemas de archivos). |

### Hallazgo 3.4 — Sin Rate Limiting en `/api/screenshot`
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | Puppeteer puede lanzarse múltiples veces si el usuario hace clic repetidamente. No hay flag `isCapturing` ni debounce en el frontend. |
| **Acción sugerida** | Añadir flag `let isCapturing = false` en `save-publish.js` que bloquee llamadas simultáneas. |

---

## Vector 4 — Superficie de Interfaz, Ergonomía & Mapeo de Estados

### Hallazgo 4.1 — FSM de UI Incompleta (Falta Estado EMPTY)
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | `app.js:91-121`: FSM del botón "Publicar" cubre `IDLE`, `PENDING`, `SUCCESS`, `FAULT`. Falta `EMPTY`. En proyecto-manager, el estado "sin proyectos recientes" es texto plano, no estado FSM. |
| **Acción sugerida** | Añadir manejo explícito de `EMPTY` en `toast.js` y `project-manager.js`. |

### Hallazgo 4.2 — Sin Mapeo 1:1 Error Backend → Mensaje UI
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | `app.js` usa `json.message` directamente del backend en todos los flujos de error. Sin capa de traducción desacoplada del backend. |
| **Acción sugerida** | Crear `modules/error-messages.js` con mapa `{ error_code: 'mensaje amigable' }`. |

### Hallazgo 4.3 — Accesibilidad WCAG 2.2 AA Sin Gate Automatizado
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | `diagnostics.js` integra axe-core pero solo bajo demanda. No hay test Vitest que valide accesibilidad automáticamente. Botones de dock sin `aria-label` verificado. |
| **Acción sugerida** | Añadir test de axe-core sobre el HTML del template en la suite Vitest. |

### Hallazgo 4.4 — Uso de `confirm()`/`prompt()` Nativos
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `app.js:1044, 2626, 2686`: Usan `confirm()`/`prompt()`. Bloquean hilo principal, no accesibles, no estilizables. |
| **Acción sugerida** | Reemplazar con `<dialog>` nativo HTML. |

### Hallazgo 4.5 — Fuentes Servidas desde CDN Externo en Canvas
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `app.js:589-590`: Google Fonts y Font Awesome en canvas cargan desde CDN. Directorio `public/fonts/` ya existe pero no se usa en el canvas. |
| **Acción sugerida** | Usar rutas locales `/fonts/` en la configuración del canvas de GrapesJS. |

---

## Vector 5 — Infraestructura, Resiliencia & Auditoría Cruzada

### Hallazgo 5.1 — Cobertura de Pruebas Insuficiente
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | 38 tests cubren 4 módulos frontend. Cero tests para `server.js` (lógica de negocio crítica: guardado, backup, publicación). Estimación: ~42% de cobertura. Umbral: 80%. |
| **Acción sugerida** | Instalar `supertest` + suite de integración para endpoints críticos. |

### Hallazgo 5.2 — Sin Linter Configurado
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | No existe `eslint.config.js`. Sin análisis estático. `initEditor()` en `app.js` tiene complejidad ciclomática estimada >20. |
| **Acción sugerida** | Instalar `eslint` con flat config. Añadir script `lint` a `package.json`. |

### Hallazgo 5.3 — Vulnerabilidades en devDependencies
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `npm audit`: 5 vulns en `vitest@1.x` (via vite/esbuild). Sin impacto en producción. |
| **Acción sugerida** | Migrar `vitest` a `^3.x` o `^5.0.0`. |

### Hallazgo 5.4 — Sin Pipeline CI/CD
| Campo | Valor |
|---|---|
| **Criticidad** | Mayor |
| **Evidencia** | No existe `.github/workflows/`. Sin gate automático de tests antes de push a `main`. |
| **Acción sugerida** | Crear `.github/workflows/ci.yml` con `npm test` y `npm audit --audit-level=high`. |

### Hallazgo 5.5 — `AGENTS.md` Desactualizado Post-Modularización
| Campo | Valor |
|---|---|
| **Criticidad** | Menor |
| **Evidencia** | `AGENTS.md:39` referencia `app.js` como punto de edición. Post-modularización, la edición debe hacerse en `public/modules/`. |
| **Acción sugerida** | Actualizar `AGENTS.md` con referencias a módulos y actualizar diagrama Mermaid. |

---

## Matriz de Brechas Priorizada

| # | Vector | Artefacto Esperado | Estado Actual | Brecha | Criticidad | Acción |
|---|---|---|---|---|---|---|
| 1 | V3 | `getActiveIndexPath()` en screenshot | `INDEX_HTML_PATH` indefinido | **BUG ACTIVO** — ReferenceError | 🔴 Crítico | Reemplazar variable |
| 2 | V5 | Tests backend (`supertest`) | Cero tests de `server.js` | 0% cobertura backend | 🟠 Mayor | Agregar suite |
| 3 | V5 | ESLint configurado | No existe `eslint.config.js` | Sin análisis estático | 🟠 Mayor | Instalar + configurar |
| 4 | V2 | Catálogo `ERROR_CODES` centralizado | Strings literales en 16 lugares | Sin catálogo formal | 🟠 Mayor | Crear `server/error-codes.js` |
| 5 | V4 | Mapeo error_code → mensaje UI | `json.message` directo | Sin capa de traducción | 🟠 Mayor | Crear `modules/error-messages.js` |
| 6 | V4 | FSM con estado EMPTY | Solo 4/5 estados | EMPTY sin implementar | 🟠 Mayor | Extender FSM |
| 7 | V5 | GitHub Actions CI | No existe `.github/workflows/` | Sin gate automático | 🟠 Mayor | Crear `ci.yml` |
| 8 | V3 | Escritura atómica en `/api/save` | Write directo | Riesgo de corrupción | 🟠 Mayor | Implementar write-then-rename |
| 9 | V3 | Separación mutación `projectPath` | Mutación en GET `/api/page` | Race condition potencial | 🟠 Mayor | Refactorizar endpoint |
| 10 | V4 | `<dialog>` nativo para confirmaciones | `confirm()`/`prompt()` | Inaccesible | 🟡 Menor | Reemplazar |
| 11 | V4 | Fuentes locales en canvas | CDN externo | Falla sin internet | 🟡 Menor | Usar `/fonts/` locales |
| 12 | V1 | `docs/DOMAIN.md` | No existe | Sin invariantes escritas | 🟡 Menor | Crear documento |
| 13 | V2 | JSDoc `@typedef ApiResponse<T>` | Solo comentario inline | Sin tipo formal | 🟡 Menor | Agregar JSDoc |
| 14 | V5 | `vitest` v3+ | `vitest@1.6.0` | DevDeps con vulns | 🟡 Menor | Migrar versión |
| 15 | V5 | `AGENTS.md` actualizado | Referencias obsoletas a `app.js` | Documentación desactualizada | 🟡 Menor | Actualizar |

---

## Lista Priorizada de Mejoras (Impacto × Esfuerzo)

### 🔴 Inmediato (Crítico — Hoy)
1. **Fix `INDEX_HTML_PATH`** → 5 min, 1 línea. Bug que rompe capturas en producción.

### 🟠 Corto Plazo (Mayor — Este sprint)
2. Catálogo de Error Codes → `server/error-codes.js`
3. ESLint flat config → `eslint.config.js`
4. Escritura atómica → write-then-rename en `/api/save`
5. Tests backend → `supertest` suite mínima
6. CI workflow → `.github/workflows/ci.yml`
7. Estado EMPTY en FSM → extender `toast.js`
8. Mapeo error_code → UI → `modules/error-messages.js`

### 🟡 Mediano Plazo (Menor — Próximo mes)
9. Reemplazar `confirm()`/`prompt()` con `<dialog>` nativo
10. Fuentes locales en canvas
11. JSDoc formal para `ApiResponse<T>`
12. Actualizar `AGENTS.md`
13. Migrar vitest a v3+
14. `docs/DOMAIN.md` con invariantes
