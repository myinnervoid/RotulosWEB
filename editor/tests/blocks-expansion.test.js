import { describe, it, expect } from 'vitest';
import { registerBlocks } from '../public/modules/blocks.js';

describe('Blocks Expansion Suite — Blog, Portafolio y Landing Profesional', () => {
  function createMockEditor() {
    const blocks = new Map();
    return {
      BlockManager: {
        get: (id) => blocks.get(id),
        add: (id, config) => {
          blocks.set(id, config);
          return config;
        },
        getAll: () => Array.from(blocks.values())
      }
    };
  }

  it('registra correctamente todos los bloques de la categoría Blog & Editorial', () => {
    const editor = createMockEditor();
    registerBlocks(editor);

    const blogBlocks = [
      'blog-articulo-narracion',
      'blog-caja-titular',
      'blog-feed-grid',
      'blog-media-texto'
    ];

    for (const id of blogBlocks) {
      const block = editor.BlockManager.get(id);
      expect(block).toBeDefined();
      expect(block.category.id).toBe('blog');
      expect(typeof block.content).toBe('string');
      expect(block.content.length).toBeGreaterThan(50);
    }
  });

  it('registra correctamente todos los bloques de la categoría Personal & Portafolio', () => {
    const editor = createMockEditor();
    registerBlocks(editor);

    const portfolioBlocks = [
      'portfolio-avatar-bio',
      'portfolio-skills-grid',
      'portfolio-perfil-cv',
      'portfolio-galeria-3d',
      'portfolio-mapa-timeline'
    ];

    for (const id of portfolioBlocks) {
      const block = editor.BlockManager.get(id);
      expect(block).toBeDefined();
      expect(block.category.id).toBe('portafolio');
      expect(typeof block.content).toBe('string');
      expect(block.content.length).toBeGreaterThan(50);
    }
  });

  it('registra correctamente todos los bloques de la categoría Landing Profesional', () => {
    const editor = createMockEditor();
    registerBlocks(editor);

    const landingBlocks = [
      'landing-hero-overlay',
      'landing-bento-grid',
      'landing-metricas-impacto'
    ];

    for (const id of landingBlocks) {
      const block = editor.BlockManager.get(id);
      expect(block).toBeDefined();
      expect(block.category.id).toBe('landing');
      expect(typeof block.content).toBe('string');
      expect(block.content.length).toBeGreaterThan(50);
    }
  });

  it('los bloques de blog y portafolio contienen elementos estructurales esperados', () => {
    const editor = createMockEditor();
    registerBlocks(editor);

    const hero = editor.BlockManager.get('landing-hero-overlay');
    expect(hero.content).toContain('background:linear-gradient');

    const timeline = editor.BlockManager.get('portfolio-mapa-timeline');
    expect(timeline.content).toContain('border-left:2px solid');

    const bento = editor.BlockManager.get('landing-bento-grid');
    expect(bento.content).toContain('grid-column:span 2');

    const avatar = editor.BlockManager.get('portfolio-avatar-bio');
    expect(avatar.content).toContain('border-radius:50%');
  });
});
