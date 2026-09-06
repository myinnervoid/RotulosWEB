import { describe, it, expect, beforeEach } from 'vitest';
import { rebuildDockSections, setupDocsModule } from '../public/modules/ui-panels.js';

describe('ui-panels.js — rebuildDockSections() & setupDocsModule()', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="left-dock">
        <div class="dock-items-wrapper"></div>
      </div>
      <button id="btn-open-docs"></button>
    `;
    // Clean up any previously appended docs modals
    const existingModal = document.getElementById('docs-modal');
    if (existingModal) existingModal.remove();
  });

  it('reconstruye el dock con las 5 secciones estándar si el documento contiene .product-section', () => {
    const fakeHtml = `
      <div>
        <section id="noticias-news" class="product-section">Noticias</section>
        <section id="perfiles" class="product-section">Perfiles</section>
        <section id="redes-sociales" class="product-section">Redes</section>
        <section id="nosotros-apoyo" class="product-section">Nosotros</section>
        <section id="creador-contacto" class="product-section">Creador</section>
      </div>
    `;
    const mockEditor = {
      getHtml: () => fakeHtml,
      Canvas: null
    };

    rebuildDockSections(mockEditor);

    const buttons = document.querySelectorAll('#left-dock .dock-btn');
    // 5 secciones estándar + botón "Ver Todo"
    expect(buttons.length).toBe(6);
    expect(buttons[0].dataset.section).toBe('noticias-news');
    expect(buttons[1].dataset.section).toBe('perfiles');
    expect(buttons[2].dataset.section).toBe('redes-sociales');
    expect(buttons[3].dataset.section).toBe('nosotros-apoyo');
    expect(buttons[4].dataset.section).toBe('creador-contacto');
    expect(buttons[5].dataset.section).toBe('all');
  });

  it('reconstruye dinámicamente el dock para una página externa/importada con etiquetas semánticas', () => {
    const fakeHtml = `
      <div>
        <header id="main-header"><h1>Encabezado Principal</h1></header>
        <nav id="navbar"><a href="#home">Inicio</a></nav>
        <main id="main-content">
          <section id="servicios"><h2>Nuestros Servicios</h2></section>
          <article id="articulo-1"><h3>Artículo 1</h3></article>
        </main>
        <footer id="footer">Pie de página</footer>
      </div>
    `;
    const mockEditor = {
      getHtml: () => fakeHtml,
      Canvas: null
    };

    rebuildDockSections(mockEditor);

    const buttons = document.querySelectorAll('#left-dock .dock-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(4);

    // Verify sections contain header, nav, main, footer
    const buttonTexts = Array.from(buttons).map(b => b.textContent.trim().toLowerCase());
    expect(buttonTexts.some(t => t.includes('encabezado principal') || t.includes('main-header'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('navbar') || t.includes('inicio'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('footer') || t.includes('pie'))).toBe(true);
  });

  it('setupDocsModule() abre el modal interactivo de Guías de uso al hacer clic en #btn-open-docs', () => {
    setupDocsModule();

    const btn = document.getElementById('btn-open-docs');
    expect(btn).not.toBeNull();

    btn.click();

    const modal = document.getElementById('docs-modal');
    expect(modal).not.toBeNull();
    expect(modal.classList.contains('docs-modal')).toBe(true);

    // Verify tab contents are present
    expect(modal.querySelector('.docs-tabs')).not.toBeNull();
    expect(modal.querySelector('[data-tab="editar"]')).not.toBeNull();
    expect(modal.querySelector('[data-tab="atajos"]')).not.toBeNull();
  });
});
