/**
 * Tests para el plugin de color (color-plugin.js)
 */

import { describe, it, expect } from 'vitest';
import { resolveColorInput, colorToHex, SPANISH_COLOR_MAP, QUICK_PALETTE } from '../public/modules/color-plugin.js';

describe('resolveColorInput()', () => {
  it('resuelve nombre en español: azul → valor hex', () => {
    expect(resolveColorInput('azul')).toBe('#2563EB');
  });

  it('resuelve nombre con tilde: púrpura (normalizado)', () => {
    expect(resolveColorInput('purpura')).toBe('#9333EA');
  });

  it('resuelve verde bandera correctamente', () => {
    expect(resolveColorInput('verde bandera')).toBe('#006847');
  });

  it('devuelve el valor CSS si no es un nombre conocido', () => {
    expect(resolveColorInput('#AABBCC')).toBe('#AABBCC');
    expect(resolveColorInput('rgb(255,0,0)')).toBe('rgb(255,0,0)');
  });

  it('maneja string vacío', () => {
    expect(resolveColorInput('')).toBe('');
  });

  it('resuelve sin importar mayúsculas/minúsculas', () => {
    expect(resolveColorInput('AZUL')).toBe('#2563EB');
    expect(resolveColorInput('Verde Bandera')).toBe('#006847');
  });
});

describe('colorToHex()', () => {
  it('convierte rgb(255,0,0) a #ff0000', () => {
    expect(colorToHex('rgb(255,0,0)').toLowerCase()).toBe('#ff0000');
  });

  it('convierte rgba(0,104,71,1) a #006847', () => {
    expect(colorToHex('rgba(0,104,71,1)').toLowerCase()).toBe('#006847');
  });

  it('devuelve el hex directamente si ya lo es', () => {
    expect(colorToHex('#D4AF37')).toBe('#D4AF37');
  });

  it('expande hex corto de 4 caracteres', () => {
    expect(colorToHex('#FFF')).toBe('#FFFFFF');
  });

  it('maneja transparent sin crash', () => {
    expect(colorToHex('transparent')).toBe('#000000');
  });
});

describe('SPANISH_COLOR_MAP', () => {
  it('contiene colores de la bandera mexicana', () => {
    expect(SPANISH_COLOR_MAP['verde bandera']).toBe('#006847');
    expect(SPANISH_COLOR_MAP['rojo bandera']).toBe('#CE1126');
  });

  it('contiene al menos 20 colores', () => {
    expect(Object.keys(SPANISH_COLOR_MAP).length).toBeGreaterThanOrEqual(20);
  });
});

describe('QUICK_PALETTE', () => {
  it('contiene al menos 10 colores', () => {
    expect(QUICK_PALETTE.length).toBeGreaterThanOrEqual(10);
  });

  it('cada elemento tiene color y label', () => {
    QUICK_PALETTE.forEach(item => {
      expect(item).toHaveProperty('color');
      expect(item).toHaveProperty('label');
    });
  });

  it('incluye el color transparente', () => {
    expect(QUICK_PALETTE.some(p => p.color === 'transparent')).toBe(true);
  });
});
