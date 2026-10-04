import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../public/modules/event-bus.js';
import { EDITOR_EVENTS } from '../public/modules/editor-events.js';

describe('Fase 2: Estabilidad de UI y Eventos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('eventBus debe despachar y desuscribir eventos sin fugar estado global', () => {
    let captured = null;
    const unsub = eventBus.subscribe(EDITOR_EVENTS.CONTENT_CHANGED, (data) => {
      captured = data;
    });

    eventBus.publish(EDITOR_EVENTS.CONTENT_CHANGED, { html: '<p>Prueba</p>', css: '' });
    expect(captured).toEqual({ html: '<p>Prueba</p>', css: '' });

    unsub();
    eventBus.publish(EDITOR_EVENTS.CONTENT_CHANGED, { html: '<div>Otro</div>', css: '' });
    expect(captured.html).toBe('<p>Prueba</p>');
  });

  it('el scheduler de requestAnimationFrame debe estar disponible para desacoplar eventos de mousemove', () => {
    expect(typeof window.requestAnimationFrame).toBe('function');
    expect(typeof window.cancelAnimationFrame).toBe('function');
  });

  it('el bus de eventos maneja múltiples eventos de ciclo de vida del editor', () => {
    let readyFired = false;
    eventBus.subscribe(EDITOR_EVENTS.EDITOR_READY, () => {
      readyFired = true;
    });

    eventBus.publish(EDITOR_EVENTS.EDITOR_READY, { version: '5.1.0' });
    expect(readyFired).toBe(true);
  });
});
