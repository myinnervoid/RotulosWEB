/**
 * ============================================================
 * 🧪 welcome-hub.test.js — Suite de Pruebas Unitarias del Welcome Hub
 * Rótulos Web / Memexicanísimos Studio v5.1
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldShowWelcomeHub, showWelcomeHub } from '../public/modules/welcome-hub.js';

describe('welcome-hub.js — Pantalla de Bienvenida (Start Screen)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.restoreAllMocks();

    // Mock global fetch para simular endpoints del backend
    global.fetch = vi.fn((url) => {
      if (url === '/api/projects/list') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [
              { name: 'memexicanisimos', path: '/home/user/RotulosProjects/memexicanisimos', modifiedAt: Date.now() },
              { name: 'mi-tienda', path: '/home/user/RotulosProjects/mi-tienda', modifiedAt: Date.now() }
            ]
          })
        });
      }
      if (url === '/api/templates') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 'landing', name: 'Landing Page', category: 'Negocios', description: 'Plantilla de aterrizaje' },
              { id: 'blog', name: 'Blog', category: 'Editorial', description: 'Plantilla de noticias' }
            ]
          })
        });
      }
      if (url === '/api/current-project') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              projectPath: '/home/user/RotulosProjects/memexicanisimos',
              hasIndex: true
            }
          })
        });
      }
      return Promise.reject(new Error(`Fetch no implementado para ${url}`));
    });
  });

  it('shouldShowWelcomeHub() retorna true por defecto y false si se desactiva en localStorage', () => {
    expect(shouldShowWelcomeHub()).toBe(true);

    localStorage.setItem('rotulos_show_welcome', 'false');
    expect(shouldShowWelcomeHub()).toBe(false);

    localStorage.setItem('rotulos_show_welcome', 'true');
    expect(shouldShowWelcomeHub()).toBe(true);
  });

  it('showWelcomeHub() crea e inserta el diálogo modal en el DOM', async () => {
    await showWelcomeHub({ allowClose: true });

    const overlay = document.querySelector('.wh-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute('role')).toBe('dialog');

    // Comprobar elementos principales
    expect(document.querySelector('.wh-title').textContent).toContain('Rótulos Web');
    expect(document.querySelector('#wh-project-list')).not.toBeNull();
    expect(document.querySelector('#wh-templates-grid')).not.toBeNull();
    expect(document.querySelector('#wh-btn-create')).not.toBeNull();
    expect(document.querySelector('#wh-btn-create').disabled).toBe(true);
  });

  it('habilita el botón crear cuando se ingresa nombre y se selecciona una plantilla', async () => {
    await showWelcomeHub({ allowClose: true });

    const nameInput = document.querySelector('#wh-project-name');
    const btnCreate = document.querySelector('#wh-btn-create');
    const tplCards = document.querySelectorAll('.wh-tpl-card');

    expect(tplCards.length).toBeGreaterThan(0);
    expect(btnCreate.disabled).toBe(true);

    // Ingresar nombre
    nameInput.value = 'mi-nuevo-sitio';
    nameInput.dispatchEvent(new Event('input'));
    expect(btnCreate.disabled).toBe(true); // Aún falta seleccionar plantilla

    // Seleccionar primera plantilla (Lienzo en blanco)
    tplCards[0].click();
    expect(tplCards[0].classList.contains('selected')).toBe(true);
    expect(btnCreate.disabled).toBe(false);
  });

  it('permite cerrar el modal con el botón de cerrar o saltar', async () => {
    await showWelcomeHub({ allowClose: true });

    const closeBtn = document.querySelector('#wh-close');
    expect(closeBtn).not.toBeNull();

    closeBtn.click();
    expect(document.querySelector('.wh-overlay')).toBeNull();
  });

  it('deduplica el proyecto activo de la lista de otros proyectos y activa botón abrir al seleccionar', async () => {
    await showWelcomeHub({ allowClose: true });

    // El proyecto activo 'memexicanisimos' está en la tarjeta de sesión
    const activeName = document.querySelector('.wh-active-name');
    expect(activeName.textContent).toBe('memexicanisimos');

    // Y el botón continuar editando existe
    const btnContinue = document.querySelector('#wh-btn-continue');
    expect(btnContinue).not.toBeNull();

    // La lista inferior solo debe contener 'mi-tienda' (sin duplicar memexicanisimos)
    const items = document.querySelectorAll('.wh-project-item');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('.wh-proj-name').textContent).toBe('mi-tienda');

    // Botón abrir seleccionado inicialmente deshabilitado
    const btnOpenSelected = document.querySelector('#wh-btn-open-selected');
    expect(btnOpenSelected).not.toBeNull();
    expect(btnOpenSelected.disabled).toBe(true);

    // Al seleccionar 'mi-tienda', se resalta y habilita el botón abrir
    items[0].click();
    expect(items[0].classList.contains('selected')).toBe(true);
    expect(btnOpenSelected.disabled).toBe(false);
    expect(btnOpenSelected.textContent).toContain('mi-tienda');

    // Botón continuar solo remueve el modal sin lanzar error
    btnContinue.click();
    expect(document.querySelector('.wh-overlay')).toBeNull();
  });
});
