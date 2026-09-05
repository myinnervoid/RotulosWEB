# 🎨 Rótulos Web
> **El Estudio Visual y Maquetador Web con Identidad y Orgullo Mexicano.**  
> Diseñado para soberanía tecnológica, edición visual intuitiva y cero dependencia de suscripciones en la nube.

---

## 🇲🇽 ¿Qué es Rótulos Web?
Inspirado en la centenaria tradición gráfica de los **maestros rotulistas populares de México** —aquellos artesanos que con pincel, pulso y colores vibrantes visten las fachadas de taquerías, fondas, estéticas, bardas de baile y sonideros—, **Rótulos Web** es una herramienta de maquetación visual libre y soberana que te permite embellecer, componer y editar sitios web completos en tiempo real.

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

## 📜 Licencia
Software libre y soberano desarrollado por **Memexicanísimos**.  
Hecho con pasión y orgullo en México 🇲🇽.
