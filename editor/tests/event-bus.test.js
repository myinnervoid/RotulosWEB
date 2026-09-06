import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../public/modules/event-bus.js';
import { EDITOR_EVENTS } from '../public/modules/editor-events.js';

describe('EventBus — Suite de Pruebas Unitarias', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('debe registrar un suscriptor y recibir eventos con su payload', () => {
    const callback = vi.fn();
    eventBus.subscribe(EDITOR_EVENTS.CONTENT_CHANGED, callback);

    const payload = { html: '<section><h1>Título</h1></section>', css: 'h1 { color: red; }' };
    eventBus.publish(EDITOR_EVENTS.CONTENT_CHANGED, payload);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(payload);
  });

  it('debe permitir cancelar suscripciones mediante la función de retorno (unsubscribe)', () => {
    const callback = vi.fn();
    const unsubscribe = eventBus.subscribe(EDITOR_EVENTS.COMPONENT_SELECTED, callback);

    expect(eventBus.listenerCount(EDITOR_EVENTS.COMPONENT_SELECTED)).toBe(1);

    unsubscribe();
    expect(eventBus.listenerCount(EDITOR_EVENTS.COMPONENT_SELECTED)).toBe(0);

    eventBus.publish(EDITOR_EVENTS.COMPONENT_SELECTED, { componentId: 'c123' });
    expect(callback).not.toHaveBeenCalled();
  });

  it('debe soportar múltiples suscriptores independientes para un mismo evento', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    eventBus.subscribe(EDITOR_EVENTS.PROJECT_LOADED, cb1);
    eventBus.subscribe(EDITOR_EVENTS.PROJECT_LOADED, cb2);

    expect(eventBus.listenerCount(EDITOR_EVENTS.PROJECT_LOADED)).toBe(2);

    eventBus.publish(EDITOR_EVENTS.PROJECT_LOADED, { projectPath: '/proyectos/mex' });

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('un error en un suscriptor no debe interrumpir la ejecución de los demás', () => {
    const faultyListener = vi.fn(() => {
      throw new Error('Falla en listener aislado');
    });
    const healthyListener = vi.fn();

    eventBus.subscribe(EDITOR_EVENTS.BEFORE_SAVE, faultyListener);
    eventBus.subscribe(EDITOR_EVENTS.BEFORE_SAVE, healthyListener);

    // No debe lanzar excepción
    expect(() => {
      eventBus.publish(EDITOR_EVENTS.BEFORE_SAVE, { html: '<div></div>' });
    }).not.toThrow();

    expect(faultyListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar TypeError si el callback no es una función', () => {
    expect(() => {
      eventBus.subscribe(EDITOR_EVENTS.ERROR_OCCURRED, null);
    }).toThrow(TypeError);
  });

  it('clear() elimina todos los suscriptores', () => {
    eventBus.subscribe(EDITOR_EVENTS.EDITOR_READY, vi.fn());
    eventBus.subscribe(EDITOR_EVENTS.AFTER_SAVE, vi.fn());

    expect(eventBus.listenerCount(EDITOR_EVENTS.EDITOR_READY)).toBe(1);
    expect(eventBus.listenerCount(EDITOR_EVENTS.AFTER_SAVE)).toBe(1);

    eventBus.clear();

    expect(eventBus.listenerCount(EDITOR_EVENTS.EDITOR_READY)).toBe(0);
    expect(eventBus.listenerCount(EDITOR_EVENTS.AFTER_SAVE)).toBe(0);
  });
});
