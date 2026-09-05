# 🎨 Rótulos Web
> **El Estudio Visual y Maquetador Web con Identidad y Orgullo Mexicano.**  
> Diseñado para soberanía tecnológica, edición visual intuitiva y cero dependencia de suscripciones en la nube.

---

## 🇲🇽 ¿Qué es Rótulos Web?
Inspirado en la centenaria tradición gráfica de los **maestros rotulistas populares de México** —aquellos artesanos que con pincel, pulso y colores vibrantes visten las fachadas de taquerías, fondas, estéticas, bardas de baile y sonideros—, **Rótulos Web** es una herramienta de maquetación visual libre y soberana que te permite embellecer, componer y editar sitios web completos en tiempo real.

### 💡 El problema que resuelve:
Si generaste tu sitio web con herramientas de Inteligencia Artificial (Claude, ChatGPT, v0, Cursor o Bolt) o descargaste una plantilla, muchas veces necesitas cambiar un simple texto, ajustar un encabezado o probar colores. Pedirle a la IA que modifique un texto suele cambiarte la estructura del código, y abrir un entorno de desarrollo tradicional resulta tosco y pesado. **Con Rótulos Web solo abres tu página, das un clic en el elemento y cambias el texto al instante.**

Incluye como **plantilla predeterminada la web oficial de Memexicanísimos**, permitiendo a cualquier creador o desarrollador contar con un punto de partida completo, responsivo y con efectos de primer nivel, sin necesidad de comenzar desde un lienzo en blanco.

---

## ✨ Características Principales
- 🌮 **Plantilla Oficial Memexicanísimos Integrada**: Estructura de alta gama lista para personalizar, modificar o vaciar.
- 🎨 **Paleta de Rótulo Patrio**: Selector cromático visual con cuentagotas nativo, memoria de colores recientes y paleta rápida al estilo de los rótulos tradicionales.
- ⚡ **Soberanía y Edición Local**: Funciona 100% en tu propia computadora; tus archivos `index.html` y `style.css` se editan y guardan directamente en tu disco sin depender de nubes de pago.
- 🛡️ **Rotación Automática de Respaldos (FIFO)**: Cada vez que guardas, Rótulos Web crea un respaldo numerado para que nunca pierdas tu trabajo.
- 📱 **Visualizador Multidispositivo**: Alterna en un clic entre vistas de Escritorio, Tableta y Celular.
- 🔌 **Constructor Visual Basado en GrapesJS**: Añade secciones, botones, tipografías patrias, animaciones y modales con arrastrar y soltar.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js (v18 o superior)
- Navegador moderno (Chrome, Edge, Firefox, Brave)

### Instalación
```bash
git clone https://github.com/myinnervoid/RotulosWEB.git
cd RotulosWEB/editor
npm install
```

### Iniciar el Editor
Desde la raíz del proyecto:
```bash
./editor.sh start
```
Abre tu navegador en:
```
http://localhost:5050
```

### Comandos del Gestor
- `./editor.sh start [ruta-opcional]` : Inicia el servidor de edición.
- `./editor.sh stop`                 : Detiene el servidor y libera el puerto 5050.
- `./editor.sh restart`              : Reinicia el editor aplicando los cambios más recientes.
- `./editor.sh status`               : Muestra el estado del servidor y consumo de recursos.

---

## 🌐 Edición en la Web (Modo Cloud / Demo)
Rótulos Web está diseñado para ejecutarse tanto en servidor local como en navegadores estáticos (vía GitHub Pages o Web App):
1. **Modo Web**: Permite a los usuarios explorar la interfaz, modificar la plantilla en tiempo real y presionar **"Descargar Sitio Web"** para obtener su proyecto en un archivo `.zip` listo para publicar.
2. **File System Access**: En navegadores compatibles, permite abrir carpetas locales del usuario directamente desde la web sin necesidad de instalar Node.js.

---

## 🤝 Reconocimientos y Créditos Open Source
Rótulos Web se apoya con orgullo en el trabajo de proyectos pioneros del ecosistema de software libre. Agradecemos profundamente a sus autores y comunidades por las bases que hicieron posible esta herramienta:

- **[GrapesJS](https://grapesjs.com/)** *(creado por Artur Arseniev y la comunidad de GrapesJS)*: El poderoso motor central para manipulación de DOM en tiempo real, renderizado dentro de iframe y arquitectura modular de bloques y estilos.
- **[Webstudio](https://webstudio.is/)**: Inspiración en la distribución de paneles ergonómicos, jerarquía de árbol de elementos (DOM tree) y patrones de diseño para constructores visuales modernos.
- **[FontAwesome Free](https://fontawesome.com/)**: Por su completa colección de iconografía web libre.
- **[Google Fonts](https://fonts.google.com/)**: Por las familias tipográficas de libre uso (*Space Grotesk*, *Space Mono*, *Fraunces* e *Inter*).
- **[Axe-Core](https://github.com/dequelabs/axe-core)** *(Deque Systems)*: Motor integrado para diagnósticos y auditorías automáticas de accesibilidad web (WCAG 2.2).
- **[Simple-Git](https://github.com/steveukx/simple-git)** & **[Express](https://expressjs.com/)**: El núcleo ligero que garantiza la independencia y soberanía del guardado local en disco.
- **La Tradición Rotulista Mexicana**: Nuestro mayor homenaje a los maestros del pincel de barrio que llenan de vida, color e identidad las calles de México.

---

## 📜 Licencia
Software libre y soberano desarrollado por **Memexicanísimos**.  
Hecho con pasión y orgullo en México 🇲🇽.
