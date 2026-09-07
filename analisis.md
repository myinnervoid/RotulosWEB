# Análisis de Arquitectura y Buenas Prácticas - Rótulos Web

Este informe documenta los hallazgos de una auditoría profunda sobre la arquitectura, calidad del código y buenas prácticas del proyecto Rótulos Web. La evaluación se realizó bajo los siguientes 5 pilares de ingeniería de software solicitados.

## 1. Contratos de API y Transporte (Contratos/ApiResponse)

### Evaluación Actual
El backend (implementado en `editor/server.js`) define una función `createApiResponse(success, data, errorCode, message)` que estandariza las respuestas en el formato canónico `{ success, data, error_code, message }`.
Se ha verificado que la gran mayoría de los endpoints (`/api/save`, `/api/current-project`, `/api/recent-projects`, `/api/stats`, `/api/switch-project`, `/api/assets`, `/api/screenshot`, etc.) envuelven correctamente su salida en esta función. El diccionario de errores está centralizado en `editor/server/error-codes.js`.

### Oportunidades de Mejora y Refactorizaciones
- **Fuga de Abstracción en Fallbacks (Bug Detectado):**
  Existe un punto donde el contrato se rompe. En la ruta `app.get('*')` (línea 205 aproximadamente), cuando no se encuentra un archivo estático y se hace *fallback*, el servidor responde con:
  `res.status(404).send('No se encontró index.html en el proyecto activo');`
  **Refactorización:** Se debe reemplazar este `send` por `res.status(404).json(createApiResponse(false, null, ERROR_CODES.FILE_NOT_FOUND.code, 'No se encontró index.html...'))`.

## 2. Manejo de Estados de UI

### Evaluación Actual
La gestión de estados en la interfaz gráfica, específicamente en el flujo de publicación a GitHub (`toast.js`), utiliza una máquina de estados finitos (FSM) parcial. Los estados actuales implementados en `updatePublishUI` son `IDLE`, `PENDING`, `SUCCESS`, y `FAULT`.

### Oportunidades de Mejora y Refactorizaciones
- **Ausencia del Estado EMPTY:**
  La FSM en `toast.js` no contempla un estado `EMPTY`.
  De igual forma, en `project-manager.js`, el estado de "no hay proyectos recientes" se maneja imperativamente inyectando HTML crudo (`container.innerHTML = '<div...>No hay proyectos recientes</div>'`), en lugar de usar un estado declarativo.
  **Refactorización:** Añadir el caso `EMPTY` al switch en `updatePublishUI`. En el gestor de proyectos, centralizar la vista vacía usando un estado formal que indique a la UI mostrar el estado sin datos (Empty State visual y accesible).

## 3. Accesibilidad y Ergonomía (WCAG 2.2 AA)

### Evaluación Actual
El editor incluye un script valioso (`editor/public/diagnostics.js`) que realiza comprobaciones semánticas y ejecuta un análisis con **axe-core**. Este es un punto muy fuerte para el cumplimiento de WCAG 2.2 AA. El proyecto ha iniciado también la migración de modales bloqueantes nativos (`prompt()`, `confirm()`) hacia elementos de la plataforma HTML5 `<dialog>` (`dialog.test.js` confirma su uso parcial).

### Oportunidades de Mejora y Refactorizaciones
- **Ausencia de Verificación Automatizada (Gate CI):**
  Aunque `diagnostics.js` existe, su ejecución depende de una acción manual del usuario en el editor. No hay tests en la suite de Vitest que usen `axe-core` para garantizar que el DOM inicial y las plantillas creadas cumplan con estándares WCAG 2.2 de manera automatizada.
  **Refactorización:** Crear un test en Vitest (`accessibility.test.js`) que renderice el HTML del editor (`index.html`) y ejecute `axe` sobre el JSDOM para asegurar que el contraste y las etiquetas ARIA (ej. botones sin texto explícito en el dock) nunca sufran una regresión.
- **Botones Iconográficos sin Atributos ARIA:** Algunos botones del Dock que dependen enteramente de iconos (FontAwesome) deben revisarse rigurosamente para asegurar que cuentan con un `aria-label` descriptivo.

## 4. Lógica de Negocio y Modularidad (Hardening)

### Evaluación Actual
El frontend está parcialmente modularizado en `editor/public/modules/`, separando responsabilidades como el panel, la configuración de bloques, colores, etc. El backend utiliza una lógica razonable para los respaldos en `/api/save`, implementando escrituras atómicas mediante `write-then-rename`.

### Oportunidades de Mejora y Refactorizaciones
- **Condición de Carrera en la Variable Global `projectPath`:**
  En `editor/server.js`, la variable global `projectPath` se muta directamente dentro del manejador `GET /api/page` si el request contiene un query parameter (`?project=`). Dado que Node maneja requests concurrentes, un request `GET` malicioso o simultáneo podría cambiar la ruta del proyecto activo para todos los usuarios u otras peticiones asíncronas en vuelo.
  **Refactorización:** La mutación del estado global `projectPath` debería reservarse exclusivamente al endpoint `POST /api/switch-project`. El `GET /api/page` debería usar únicamente variables locales derivadas del request.
- **Complejidad del Archivo `server.js`:**
  Aún existe demasiada lógica acoplada en un solo archivo (más de 600 líneas). Rutas, inicialización, lógica de respaldos (rotación FIFO) y el conector a Puppeteer conviven.
  **Refactorización:** Extraer routers (`routes/project.js`, `routes/screenshot.js`) y servicios (`services/backup.js`, `services/git.js`).

## 5. Cobertura de Pruebas

### Evaluación Actual
Existen tests unitarios y de integración para el frontend y backend en la carpeta `editor/tests/`, corriendo con Vitest (`jsdom`). Actualmente se ejecutan 55 pruebas que validan funciones utilitarias, internacionalización y los contratos HTTP del backend (`server.test.js`).
La cobertura global ronda el 31%, dejando muchas ramas funcionales sin probar (como `project-manager.js`).

### Oportunidades de Mejora y Casos de Prueba Sugeridos (Vitest)
- **El Test de Captura Tiembla/Falla:** El test `POST /api/screenshot` sufre de "Timeouts" porque el manejo asíncrono o la ausencia de Chrome no se simulan (mock) correctamente.
  **Refactorización:** Usar `vi.mock('puppeteer-core')` para probar el comportamiento del endpoint sin levantar un navegador real.
- **Nuevos Casos Sugeridos en Backend (`server.test.js`):**
  - Simular el guardado de un documento con y sin `style.css` y verificar que la rotación FIFO (`backups/`) borra efectivamente el elemento más antiguo si se supera el límite de 15.
  - Verificar que el endpoint `POST /api/publish` falla con el contrato adecuado si las credenciales de Git no están disponibles.
- **Nuevos Casos Sugeridos en Frontend:**
  - `project-manager.test.js`: Probar que cuando el backend devuelve un arreglo vacío, la interfaz refleja el estado `EMPTY` (o renderiza el mensaje de "No hay proyectos").
  - `accessibility.test.js`: Como se mencionó antes, cargar la estructura base del editor y ejecutar `@axe-core/jsdom` para probar contraste, `aria-labels` y navegación por teclado.
