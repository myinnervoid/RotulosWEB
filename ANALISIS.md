# Análisis de Brechas y Mejoras - Rótulos Web

Este documento presenta un análisis del código fuente y la arquitectura del proyecto **Rótulos Web** (Estudio Visual Memexicanísimos) con el objetivo de identificar brechas (gaps/bugs) y proponer mejoras para optimizar su estabilidad, mantenibilidad y escalabilidad.

## 1. Brechas Identificadas (Gaps & Issues)

### A. Infraestructura y Pruebas
- **Ausencia de pruebas automatizadas (Tests):** El archivo `package.json` tiene el script de testeo configurado por defecto (`echo "Error: no test specified" && exit 1`). No hay pruebas unitarias ni de integración para el servidor backend (`server.js`) ni para la lógica del frontend.
- **Falta de configuración de Linter (ESLint):** Al ejecutar el linter se produce un error porque no existe un archivo de configuración (`eslint.config.js` o `.eslintrc.json`). Esto propicia inconsistencias en el estilo del código y la potencial introducción de errores de sintaxis.

### B. Mantenibilidad del Código
- **Monolito Frontend (`app.js`):** El archivo `app.js` contiene más de 2300 líneas de código. Mezcla la inicialización de GrapesJS, la creación de componentes personalizados, el manejo del DOM, el estado de publicación y las llamadas a la API. Esto hace que el mantenimiento y la escalabilidad del frontend sean muy complicados.
- **Rutas Hardcodeadas y Dependencia de Entorno Local:**
  - En `server.js` (Línea 20): `defaultCandidate = path.resolve(__dirname, '../../Pagina web memexicanisimos');`. Esta ruta está hardcodeada para un entorno de desarrollo específico y no es portable.
  - En `editor.sh` (Línea 5): `export PATH="/home/myinnervoid/.nvm/versions/node/v24.18.0/bin:$PATH"`. Esto rompe el script en máquinas que no tienen exactamente este usuario y ruta de NVM.

### C. Seguridad y Rendimiento
- **Límites excesivos en Express:** En `server.js`, el middleware `express.json({ limit: '50mb' })` es permisivo. Aunque el servidor solo admite conexiones locales, esto podría representar un vector de ataque de denegación de servicio (DoS) local.
- **Condiciones de Carrera (Race Conditions) en Respaldos:** La rotación de respaldos en `/api/save` podría experimentar problemas de simultaneidad si múltiples peticiones de guardado ocurren al mismo tiempo.

---

## 2. Propuestas de Mejora (Improvements)

### A. Modularización y Refactorización
- **Modularizar el Frontend:** Dividir `app.js` en módulos especializados:
  - `config/grapes-init.js`
  - `components/custom-blocks.js`
  - `services/api-client.js`
  - `ui/sidebar-handlers.js`
  - `utils/color-plugin.js`
- **Uso de un Bundler Moderno:** Implementar Vite o Webpack en lugar de un script simple de `terser` en `package.json`, facilitando la importación de módulos ES6 e integrando pre-procesadores de CSS si fuera necesario.

### B. Calidad de Código y Testing
- **Implementar ESLint y Prettier:** Añadir las configuraciones adecuadas para asegurar un formato de código estandarizado.
- **Configurar un Framework de Testing (Jest / Mocha):**
  - Backend: Pruebas para `/api/save`, `/api/page`, y validaciones de los respaldos rotativos FIFO.
  - Frontend: Pruebas E2E (usando Playwright o Cypress) para verificar que GrapesJS se carga correctamente y que los bloques personalizados funcionan.

### C. Mejoras en la Experiencia de Desarrollo (DX)
- **Variables de Entorno Universales:** Modificar `editor.sh` para detectar el binario de Node global o usar el entorno activo sin hardcodear el path de `.nvm`.
- **Detección Automática de Proyectos:** Mejorar la lógica de fallback en `server.js` para que solo busque un directorio `.html` válido o pida al usuario especificar un directorio por defecto a través de un archivo global `.rotulosconfig`.

### D. Mejoras Funcionales y Accesibilidad
- **Automatización de axe-core (CI/CD):** Actualmente axe-core se ejecuta en el navegador bajo demanda (`diagnostics.js`). Se recomienda integrar verificaciones de accesibilidad en los flujos de pre-commit utilizando herramientas como `axe-cli` o dentro de los tests de Playwright.
- **Manejo de Errores (Error Boundaries):** En el panel del editor, si una llamada a la API local falla o el navegador del sistema para `puppeteer` (Fase C) no está, la aplicación debería ofrecer opciones más resilientes de recuperación y no solo toasts de error temporales.

## Conclusión
Rótulos Web es un proyecto robusto enfocado en la soberanía tecnológica local, pero puede beneficiarse significativamente aplicando patrones de desarrollo de software estándar como modularización (ES Modules), pruebas automatizadas y estandarización del código (Linting). Implementar estas mejoras fortalecerá su viabilidad a largo plazo y facilitará contribuciones de código abierto.
