import { describe, it, expect, beforeEach } from 'vitest';
import { showConfirmDialog, showPromptDialog } from '../public/modules/dialog.js';

describe('dialog.js — Diálogos Modales Soberanos HTML5', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Mock de HTMLDialogElement showModal y close en jsdom
    const DialogProto = (window.HTMLDialogElement || window.HTMLElement).prototype;
    if (!DialogProto.showModal) {
      DialogProto.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!DialogProto.close) {
      DialogProto.close = function () {
        this.removeAttribute('open');
      };
    }
  });

  it('showConfirmDialog resuelve true al hacer clic en confirmar', async () => {
    const promise = showConfirmDialog({
      title: 'Confirmación de Prueba',
      message: '¿Estás seguro?',
      confirmText: 'Sí, continuar'
    });

    const confirmBtn = document.getElementById('btn-dialog-confirm');
    expect(confirmBtn).not.toBeNull();
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe(true);
  });

  it('showConfirmDialog resuelve false al hacer clic en cancelar', async () => {
    const promise = showConfirmDialog({
      title: 'Cancelar Acción',
      message: '¿Deseas cancelar?',
      cancelText: 'No, cancelar'
    });

    const cancelBtn = document.getElementById('btn-dialog-cancel');
    expect(cancelBtn).not.toBeNull();
    cancelBtn.click();

    const result = await promise;
    expect(result).toBe(false);
  });

  it('showPromptDialog resuelve con el valor introducido al confirmar', async () => {
    const promise = showPromptDialog({
      title: 'Ruta de Proyecto',
      defaultValue: '/mi/carpeta/proyecto'
    });

    const input = document.getElementById('dialog-prompt-input');
    expect(input).not.toBeNull();
    expect(input.value).toBe('/mi/carpeta/proyecto');

    input.value = '/otra/ruta/modificada';
    const confirmBtn = document.getElementById('btn-dialog-confirm');
    confirmBtn.click();

    const result = await promise;
    expect(result).toBe('/otra/ruta/modificada');
  });

  it('showPromptDialog resuelve null al cancelar', async () => {
    const promise = showPromptDialog({
      title: 'Ruta de Proyecto',
      defaultValue: '/mi/carpeta'
    });

    const cancelBtn = document.getElementById('btn-dialog-cancel');
    cancelBtn.click();

    const result = await promise;
    expect(result).toBeNull();
  });
});
