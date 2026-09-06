/**
 * ============================================================
 * ⚡ layers-virtual.js — Optimización Virtual de Capas DOM
 * Rótulos Web / Memexicanísimos Studio v4.0
 * ============================================================
 * Optimiza la renderización del panel de capas (GrapesJS Layers)
 * usando IntersectionObserver y content-visibility para árboles DOM grandes.
 */

'use strict';

/**
 * Optimiza la renderización del panel de capas (GrapesJS Layers)
 * @param {object} [editor] - Instancia opcional de GrapesJS
 * @returns {Function} Función de limpieza para observadores
 */
export function setupVirtualLayers(editor) {
  if (typeof document === 'undefined') return () => {};

  const layersContainer = document.querySelector('.gjs-layers') || document.getElementById('layers-container');
  if (!layersContainer) {
    return () => {};
  }

  // Inyectar CSS para content-visibility y optimización de reflow
  const styleId = 'gjs-virtual-layers-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .gjs-layer {
        content-visibility: auto;
        contain-intrinsic-size: 36px;
      }
      .gjs-layer-children {
        content-visibility: auto;
        contain-intrinsic-size: 100px;
      }
    `;
    document.head.appendChild(style);
  }

  // Observer ligero para pre-cargar capas próximas a entrar al viewport
  let observer = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const layer = entry.target;
          layer.setAttribute('data-visible', 'true');
        }
      });
    }, {
      root: layersContainer,
      rootMargin: '200px',
      threshold: 0.01
    });
  }

  const observeLayers = () => {
    if (!observer) return;
    const layers = layersContainer.querySelectorAll('.gjs-layer, .gjs-layer-children');
    layers.forEach(el => observer.observe(el));
  };

  observeLayers();

  let mutationObserver = null;
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      observeLayers();
    });
    mutationObserver.observe(layersContainer, {
      childList: true,
      subtree: true
    });
  }

  return () => {
    if (observer) observer.disconnect();
    if (mutationObserver) mutationObserver.disconnect();
  };
}
