/**
 * Tests para el módulo save-publish.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as toastModule from '../public/modules/toast.js';
import { getSanitizedHtml, downloadProjectAsZip } from '../public/modules/save-publish.js';
import { workerManager } from '../public/modules/worker-manager.js';
import { eventBus } from '../public/modules/event-bus.js';

vi.mock('../public/modules/toast.js', () => ({
  showToast: vi.fn(),
  getPublishState: vi.fn(),
  setPublishState: vi.fn(),
  updatePublishUI: vi.fn()
}));

describe('save-publish.js', () => {
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

    it('maneja HTML malformado sin romperse', () => {
      const input = `<<<<<malformed>>>>> <div unclosed="true">  <p>broken</p>`;
      const result = getSanitizedHtml(input);
      expect(result).toContain('broken');
      expect(result.startsWith('<!DOCTYPE html>')).toBe(true);
    });

    it('maneja input vacío o nulo', () => {
      const result = getSanitizedHtml(null);
      expect(result).toBe('');
      const result2 = getSanitizedHtml('');
      expect(result2).toBe('');
    });
  });

  describe('downloadProjectAsZip() edge cases', () => {
    let mockRevoke;

    beforeEach(() => {
      vi.spyOn(workerManager, 'createWorker').mockImplementation(() => {});
      vi.spyOn(eventBus, 'publish').mockImplementation(() => {});

      // Mock global URL functions
      global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
      mockRevoke = vi.fn();
      global.URL.revokeObjectURL = mockRevoke;

      // Mock DOM element creation for a.click()
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('debe propagar errores si el worker falla', async () => {
      vi.spyOn(workerManager, 'sendTask').mockRejectedValue(new Error('Worker crashed'));

      await expect(downloadProjectAsZip('', [{ path: 'test.txt', content: 'hello' }]))
        .rejects.toThrow('Worker crashed');

      expect(eventBus.publish).toHaveBeenCalledWith('editor:zip:error', { message: 'Worker crashed' });
      expect(toastModule.showToast).toHaveBeenCalledWith('Error al generar ZIP: Worker crashed', true);
    });

    it('debe publicar eventos de progreso y de éxito al completar la descarga', async () => {
      const mockBuffer = new Uint8Array([80, 75, 3, 4]); // ZIP header signature
      vi.spyOn(workerManager, 'sendTask').mockResolvedValue(mockBuffer);

      const blob = await downloadProjectAsZip('', [{ path: 'test.txt', content: 'hello' }]);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/zip');

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockRevoke).toHaveBeenCalledWith('blob:test-url');

      expect(eventBus.publish).toHaveBeenCalledWith('editor:zip:completed', { success: true, sizeBytes: mockBuffer.byteLength });
      expect(toastModule.showToast).toHaveBeenCalledWith(expect.stringContaining('¡Proyecto descargado en ZIP correctamente!'));
    });
  });
});
