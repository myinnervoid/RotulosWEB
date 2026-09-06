# Modelo de Dominio, Reglas de Negocio e Invariantes — Rótulos Web

Este documento formaliza la arquitectura conceptual, el ciclo de vida del proyecto, las entidades clave y las leyes inmutables del sistema **Rótulos Web** (Estudio Visual Memexicanísimos).

---

## 1. Filosofía y Propósito

**Rótulos Web** es un editor visual universal y soberano diseñado para componer, maquetar, estilizar y mantener páginas web locales sin intermediarios externos, telemetría ni dependencias de plataformas privativas en la nube.

### Principios Fundamentales
1. **Soberanía Digital**: El software corre íntegramente en la máquina del usuario (`localhost` / `127.0.0.1`), controlando sus propios archivos sin subirlos a servicios de terceros.
2. **Offline First**: La tipografía, herramientas, bloques y estilos se resuelven de forma local. La desconexión a internet no interrumpe el flujo de diseño ni la exportación.
3. **Respeto a la Integridad del Código**: El editor no destruye código personalizado, maquetando dentro del contexto estándar de HTML5 y CSS3.

---

## 2. Entidades Principales del Dominio

```mermaid
classDiagram
    class WebProject {
        +String projectPath
        +String indexHtml
        +String styleCss
        +Array assets
        +Boolean hasGit
        +read()
        +saveAtomic()
        +switch()
    }

    class BackupArtifact {
        +String filename
        +Number timestamp
        +Number sizeBytes
        +rotateFIFO()
    }

    class ApiResponse {
        +Boolean success
        +Object data
        +String error_code
        +String message
    }

    class CanvasSession {
        +Object grapesInstance
        +Array components
        +Object styles
        +String activeSection
        +render()
        +sanitizeHtml()
    }

    WebProject "1" --> "*" BackupArtifact : genera antes de sobrescribir
    WebProject "1" --> "1" CanvasSession : se carga en
    WebProject ..> ApiResponse : comunica vía
```

### 2.1. Proyecto Web (`WebProject`)
- Representa la carpeta en disco que contiene el sitio web en edición.
- Posee obligatoriamente o de forma inferida:
  - `index.html`: Punto de entrada principal y lienzo persistente.
  - `style.css`: Hoja de estilos complementaria.
  - `backups/`: Subdirectorio de resguardo de revisiones históricas.
  - `.git/` (opcional): Repositorio de control de versiones para publicación remota.

### 2.2. Artefacto de Respaldo (`BackupArtifact`)
- Archivo con nomenclatura `index_backup_<TIMESTAMP>.html`.
- Creado en disco *antes* de que cualquier nueva versión sobrescriba el archivo activo.
- Administrado por una cola FIFO con cuota máxima parametrizable (`MAX_BACKUPS`, por defecto 15).

### 2.3. Contrato Canónico de API (`ApiResponse<T>`)
- Formato único y universal para todas las respuestas HTTP JSON del backend:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error_code: string | null;
  message: string;
}
```

### 2.4. Sesión de Lienzo (`CanvasSession`)
- Estado en memoria del editor GrapesJS en el navegador.
- Contiene el árbol de componentes DOM, las reglas CSS calculadas, el historial de cambios (Undo/Redo) y la selección de sección activa.

---

## 3. Ciclo de Vida y Máquina de Estados

### 3.1. Máquina de Estados del Servidor y Editor

```mermaid
stateDiagram-v2
    [*] --> ServidorIniciado: node server.js (127.0.0.1:5050)
    ServidorIniciado --> ProyectoCargado: GET /api/page (Lee index.html)
    ServidorIniciado --> ModoEstatico: Fallback Plantilla Memexicanísimos
    
    ProyectoCargado --> EditandoEnLienzo: Usuario arrastra bloques / altera estilos
    ModoEstatico --> EditandoEnLienzo
    
    EditandoEnLienzo --> GuardadoAtómico: Clic en "Guardar en index.html" (Ctrl+S)
    GuardadoAtómico --> RotacionFIFO: 1. Crear backup previo
    RotacionFIFO --> EscrituraTmp: 2. Escribir temp_index.html
    EscrituraTmp --> RenameAtómico: 3. fs.renameSync -> index.html
    RenameAtómico --> EditandoEnLienzo: Confirmación Toast
    
    EditandoEnLienzo --> PublicacionGit: Clic en "Publicar"
    PublicacionGit --> GitPending: Estado PENDING en UI
    GitPending --> GitSuccess: Commit & Push exitoso -> IDLE
    GitPending --> GitFault: Conflicto o sin auth -> Reintentar
    
    EditandoEnLienzo --> ApagadoServidor: Clic en "Apagar" -> POST /api/shutdown
    ApagadoServidor --> [*]: Proceso liberado
```

### 3.2. Fases de la Sesión de Trabajo

1. **Inicialización y Descubrimiento**:
   - El servidor Express verifica los certificados SSL locales (HTTPS con fallback HTTP en puerto 5050).
   - Resuelve la ruta inicial (`projectPath`). Si no se pasa como parámetro, adopta la raíz del repositorio de Memexicanísimos.
   - Envía el HTML y CSS al cliente vía `GET /api/page`.

2. **Edición Soberana en el Cliente**:
   - Se instancian los módulos desacoplados: bloques, paleta cromática, dock lateral, inspector de código y gestor de proyectos.
   - El lienzo de GrapesJS opera aislado dentro de un `iframe` seguro.

3. **Guardado Atómico y Rotación FIFO**:
   - El cliente higieniza el HTML (`getSanitizedHtml`), purgando identificadores temporales `data-gjs-*` y preservando la semántica limpia de HTML5.
   - El servidor copia el archivo actual a `backups/index_backup_<TIMESTAMP>.html`.
   - Se purgan los respaldos más antiguos que excedan el límite `MAX_BACKUPS`.
   - Se escribe el nuevo contenido en un archivo temporal (`temp_index_TIMESTAMP.html`) y se aplica `fs.renameSync` para garantizar atomicidad ante caídas de corriente o fallos de proceso.

4. **Publicación y Entrega**:
   - `POST /api/publish`: Ejecuta `git add -A`, genera un commit con mensaje legible y fecha ISO, y empuja hacia la rama remota (`main`).
   - `POST /api/screenshot`: Lanza una instancia headless de Chrome/Chromium del sistema mediante Puppeteer para producir una renderización fidedigna PNG en resolución Desktop, Tablet o Móvil.

---

## 4. Invariantes Inmutables del Sistema (Leyes Arquitectónicas)

> [!IMPORTANT]
> Estas leyes son requisitos obligatorios y no negociables en cualquier evolución futura de Rótulos Web.

### Ley 1: Límite de Seguridad LAN (Local-Only Boundary)
- El editor solo escucha en interfaces de bucle invertido (`127.0.0.1`, `localhost`) o red local controlada.
- Ninguna petición originada desde dominios externos no autorizados debe tener acceso a las APIs de lectura o escritura de archivos.

### Ley 2: Principio de Cero Pérdida de Datos (Zero Data Loss)
- Está estrictamente prohibido sobrescribir `index.html` de forma directa o destructiva.
- Todo guardado debe ir precedido de:
  1. Verificación de existencia del archivo previo.
  2. Generación de copia de seguridad con timestamp.
  3. Escritura en archivo temporal antes del reemplazo (`fs.renameSync`).

### Ley 3: Política de Retención FIFO Acotada
- El directorio `backups/` nunca debe crecer indefinidamente en disco.
- La rotación debe eliminar los archivos más antiguos cuando la cuenta exceda `MAX_BACKUPS`.

### Ley 4: Soberanía Visual y Offline First
- El editor y su lienzo no deben depender de CDNs externos para su funcionamiento estructural ni para la renderización de sus fuentes (`Space Grotesk`, `Space Mono`).
- Todos los assets tipográficos base deben residir localmente en `public/fonts/`.

### Ley 5: Unicidad y Canonicidad de Contrato (`ApiResponse<T>`)
- Ningún endpoint JSON del backend puede devolver objetos heterogéneos o cadenas de texto sueltas.
- Todo payload debe cumplir estrictamente con los cuatro campos: `success`, `data`, `error_code` y `message`.

### Ley 6: Desacoplamiento de la Mensajería de Error
- El backend emite identificadores canónicos de error (`error_code` listados en `server/error-codes.js`).
- La interfaz de usuario es la encargada de traducir dichos códigos a mensajes empáticos y comprensibles en español mediante `error-messages.js`.
