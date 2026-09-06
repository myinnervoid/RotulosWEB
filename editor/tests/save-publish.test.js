/**
 * Tests para el módulo save-publish.js
 * Foco en getSanitizedHtml() que es puro y testeable sin DOM real.
 */

import { describe, it, expect } from 'vitest';
import { getSanitizedHtml, resolveColorInput } from '../public/modules/save-publish.js';

// getSanitizedHtml usa DOMParser — disponible en jsdom
describe('getSanitizedHtml()', () => {
  it('elimina atributos data-gjs-* del HTML', () => {
    const input = `<div data-gjs-type="wrapper" data-gjs-id="abc"><p>Hola</p></div>`;
    const result = getSanitizedHtml(input);
    expect(result).not.toContain('data-gjs-type');
    expect(result).not.toContain('data-gjs-id');
  });

  it('elimina data-highlightable', () => {
    const input = `<section data-highlightable="true"><h1>Título</h1></section>`;
    const result = getSanitizedHtml(input);
    expect(result).not.toContain('data-highlightable');
    expect(result).toContain('Título');
  });

  it('elimina clases gjs-selected y gjs-hovered', () => {
    const input = `<div class="container gjs-selected gjs-hovered">contenido</div>`;
    const result = getSanitizedHtml(input);
    expect(result).not.toContain('gjs-selected');
    expect(result).not.toContain('gjs-hovered');
  });

  it('elimina el elemento #gjs-canvas-scroll-fixes', () => {
    const input = `<style id="gjs-canvas-scroll-fixes">body{overflow:hidden}</style><p>Texto</p>`;
    const result = getSanitizedHtml(input);
    expect(result).not.toContain('gjs-canvas-scroll-fixes');
  });

  it('quita la clase editor-show-all del body', () => {
    const input = `<body class="editor-show-all"><div>contenido</div></body>`;
    const result = getSanitizedHtml(input);
    expect(result).not.toContain('editor-show-all');
  });

  it('devuelve HTML que comienza con DOCTYPE', () => {
    const input = `<div><p>Test</p></div>`;
    const result = getSanitizedHtml(input);
    expect(result.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('preserva el contenido de texto', () => {
    const input = `<h1>¡Bienvenido a Memexicanísimos!</h1>`;
    const result = getSanitizedHtml(input);
    expect(result).toContain('¡Bienvenido a Memexicanísimos!');
  });
});
