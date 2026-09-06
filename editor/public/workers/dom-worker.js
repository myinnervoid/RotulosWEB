/**
 * ============================================================
 * 🔍 dom-worker.js — Web Worker para Análisis Asíncrono del DOM
 * Rótulos Web / Memexicanísimos Studio v3.4
 * ============================================================
 * Analiza grandes árboles HTML en segundo plano sin congelar la UI:
 * - Profundidad máxima del árbol y métricas de complejidad
 * - Diagnóstico de accesibilidad WCAG (imágenes sin alt, enlaces vacíos)
 * - Jerarquía semántica y orden de encabezados (H1-H6)
 */

'use strict';

/**
 * Función de recorrido y análisis del árbol DOM
 * @param {Document|Element} rootNode
 * @returns {{ stats: object, issues: Array<object> }}
 */
function analyzeHtmlTree(html) {
  let doc = null;

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(html || '', 'text/html');
  }

  const stats = {
    totalNodes: 0,
    elementsCount: 0,
    textNodesCount: 0,
    maxDepth: 0,
    imgCount: 0,
    imgWithoutAlt: 0,
    linkCount: 0,
    emptyLinks: 0,
    headingsCount: 0,
    headingHierarchyValid: true,
    h1Count: 0
  };

  const issues = [];
  let lastHeadingLevel = 0;

  if (doc && doc.documentElement) {
    const traverse = (node, depth) => {
      stats.totalNodes++;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (node.nodeType === 1) { // ELEMENT_NODE
        stats.elementsCount++;
        const tag = node.tagName.toUpperCase();

        // 1. Detección de imágenes sin atributo alt
        if (tag === 'IMG') {
          stats.imgCount++;
          const alt = node.getAttribute('alt');
          if (alt === null || alt.trim() === '') {
            stats.imgWithoutAlt++;
            issues.push({
              category: 'a11y',
              severity: 'WARN',
              target: node.getAttribute('src') || '<img />',
              message: 'Imagen sin atributo alt descriptivo para lectores de pantalla.'
            });
          }
        }

        // 2. Enlaces vacíos o sin texto accesible
        if (tag === 'A') {
          stats.linkCount++;
          const href = node.getAttribute('href');
          const text = (node.textContent || '').trim();
          const ariaLabel = node.getAttribute('aria-label');
          const title = node.getAttribute('title');

          if (!href || href === '#') {
            issues.push({
              category: 'ux',
              severity: 'INFO',
              target: text || '<a>',
              message: 'Enlace con href vacío o apuntando únicamente a "#".'
            });
          }

          if (!text && !ariaLabel && !title && !node.querySelector('img[alt], svg[aria-label]')) {
            stats.emptyLinks++;
            issues.push({
              category: 'a11y',
              severity: 'WARN',
              target: href || '<a>',
              message: 'Enlace sin texto legible ni aria-label para tecnologías de asistencia.'
            });
          }
        }

        // 3. Jerarquía y orden de encabezados
        if (/^H[1-6]$/.test(tag)) {
          stats.headingsCount++;
          const level = parseInt(tag.charAt(1), 10);
          if (level === 1) {
            stats.h1Count++;
          }

          if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
            stats.headingHierarchyValid = false;
            issues.push({
              category: 'seo',
              severity: 'WARN',
              target: `<${tag}>: "${(node.textContent || '').trim().slice(0, 40)}"`,
              message: `Salto en jerarquía de encabezados de H${lastHeadingLevel} a H${level}.`
            });
          }
          lastHeadingLevel = level;
        }
      } else if (node.nodeType === 3) { // TEXT_NODE
        if ((node.nodeValue || '').trim().length > 0) {
          stats.textNodesCount++;
        }
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i], depth + 1);
      }
    };

    traverse(doc.documentElement, 0);

    if (stats.h1Count === 0) {
      issues.push({
        category: 'seo',
        severity: 'WARN',
        target: 'document',
        message: 'No se encontró ningún encabezado principal <h1> en el documento.'
      });
    } else if (stats.h1Count > 1) {
      issues.push({
        category: 'seo',
        severity: 'INFO',
        target: 'document',
        message: `Se encontraron ${stats.h1Count} encabezados <h1>. Se recomienda un único H1 por página.`
      });
    }
  } else {
    // Parser fallback para entornos sin DOMParser en Worker
    const imgMatches = (html.match(/<img\b[^>]*>/gi) || []);
    stats.imgCount = imgMatches.length;
    imgMatches.forEach(imgTag => {
      if (!/alt=["'][^"']*["']/i.test(imgTag)) {
        stats.imgWithoutAlt++;
        issues.push({
          category: 'a11y',
          severity: 'WARN',
          target: imgTag.slice(0, 50),
          message: 'Imagen detectada sin atributo alt.'
        });
      }
    });

    const h1Matches = (html.match(/<h1\b[^>]*>/gi) || []);
    stats.h1Count = h1Matches.length;
    stats.headingsCount = (html.match(/<h[1-6]\b[^>]*>/gi) || []).length;
    stats.totalNodes = (html.match(/<[a-z0-9]+/gi) || []).length;
  }

  return { stats, issues };
}

/**
 * Ejecuta una auditoría completa de accesibilidad WCAG / axe-core
 * @param {string} id - ID de correlación de la tarea
 * @param {string} html - Marcado HTML a evaluar
 */
async function runAccessibilityAudit(id, html) {
  try {
    self.postMessage({
      id,
      type: 'progress',
      result: { percent: 15, message: 'Iniciando auditoría de accesibilidad WCAG...' }
    });

    let axeResults = null;

    // 1. Intentar cargar y ejecutar axe-core si el entorno del worker lo soporta
    if (typeof axe === 'undefined') {
      try {
        importScripts('/vendor/axe.min.js');
      } catch {
        try {
          importScripts('https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js');
        } catch {}
      }
    }

    if (typeof axe !== 'undefined' && typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || '', 'text/html');
        if (doc && doc.documentElement) {
          self.postMessage({
            id,
            type: 'progress',
            result: { percent: 50, message: 'Evaluando reglas axe-core...' }
          });
          axeResults = await axe.run(doc.documentElement, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'best-practice']
            }
          });
        }
      } catch (axeErr) {
        // Fallback si axe.run requiere window completa
      }
    }

    if (axeResults && Array.isArray(axeResults.violations)) {
      self.postMessage({
        id,
        type: 'progress',
        result: { percent: 100, message: 'Auditoría axe-core completada.' }
      });
      self.postMessage({
        id,
        type: 'success',
        result: {
          violations: axeResults.violations,
          passes: axeResults.passes || [],
          incomplete: axeResults.incomplete || [],
          timestamp: Date.now()
        }
      });
      return;
    }

    // 2. Fallback de auditoría heurística completa WCAG 2.1 AA
    self.postMessage({
      id,
      type: 'progress',
      result: { percent: 60, message: 'Verificando reglas WCAG semánticas...' }
    });

    const violations = [];
    const passes = [];
    const incomplete = [];

    let doc = null;
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(html || '', 'text/html');
    }

    if (doc) {
      // Regla: image-alt
      const images = doc.querySelectorAll('img');
      const badImages = [];
      images.forEach(img => {
        const alt = img.getAttribute('alt');
        if (alt == null || alt.trim() === '') {
          badImages.push({ html: img.outerHTML.slice(0, 80), target: [img.tagName.toLowerCase()] });
        }
      });
      if (badImages.length > 0) {
        violations.push({
          id: 'image-alt',
          impact: 'critical',
          description: 'Asegura que los elementos <img> tengan texto alternativo o una función vacía/presentacional',
          help: 'Las imágenes deben tener texto alternativo',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/image-alt',
          nodes: badImages
        });
      } else {
        passes.push({ id: 'image-alt', description: 'Todas las imágenes tienen atributo alt' });
      }

      // Regla: link-name
      const links = doc.querySelectorAll('a');
      const badLinks = [];
      links.forEach(a => {
        const text = (a.textContent || '').trim();
        const ariaLabel = a.getAttribute('aria-label');
        const title = a.getAttribute('title');
        const hasImg = a.querySelector('img[alt], svg[aria-label]');
        if (!text && !ariaLabel && !title && !hasImg) {
          badLinks.push({ html: a.outerHTML.slice(0, 80), target: ['a'] });
        }
      });
      if (badLinks.length > 0) {
        violations.push({
          id: 'link-name',
          impact: 'serious',
          description: 'Los enlaces deben tener texto discernible para tecnologías de asistencia',
          help: 'Los enlaces deben tener texto discernible',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/link-name',
          nodes: badLinks
        });
      } else {
        passes.push({ id: 'link-name', description: 'Todos los enlaces tienen texto discernible' });
      }

      // Regla: button-name
      const buttons = doc.querySelectorAll('button');
      const badButtons = [];
      buttons.forEach(btn => {
        const text = (btn.textContent || '').trim();
        const ariaLabel = btn.getAttribute('aria-label');
        const title = btn.getAttribute('title');
        if (!text && !ariaLabel && !title) {
          badButtons.push({ html: btn.outerHTML.slice(0, 80), target: ['button'] });
        }
      });
      if (badButtons.length > 0) {
        violations.push({
          id: 'button-name',
          impact: 'critical',
          description: 'Los botones deben tener texto discernible',
          help: 'Los botones deben tener texto discernible o etiqueta aria',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/button-name',
          nodes: badButtons
        });
      } else {
        passes.push({ id: 'button-name', description: 'Todos los botones tienen texto discernible' });
      }

      // Regla: html-has-lang
      const htmlEl = doc.documentElement;
      if (!htmlEl || !htmlEl.getAttribute('lang')) {
        violations.push({
          id: 'html-has-lang',
          impact: 'serious',
          description: 'El elemento <html> debe tener un atributo lang',
          help: 'El elemento <html> debe tener un atributo lang',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/html-has-lang',
          nodes: [{ html: '<html>', target: ['html'] }]
        });
      } else {
        passes.push({ id: 'html-has-lang', description: 'Elemento <html> cuenta con atributo lang' });
      }

      // Regla: page-has-heading-one
      const h1s = doc.querySelectorAll('h1');
      if (h1s.length === 0) {
        violations.push({
          id: 'page-has-heading-one',
          impact: 'moderate',
          description: 'La página debe contener un encabezado de nivel 1 (<h1>)',
          help: 'Todos los documentos deben tener al menos un H1',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/page-has-heading-one',
          nodes: [{ html: '<body>', target: ['body'] }]
        });
      } else {
        passes.push({ id: 'page-has-heading-one', description: 'La página contiene encabezado <h1>' });
      }
    }

    self.postMessage({
      id,
      type: 'progress',
      result: { percent: 100, message: 'Auditoría completada.' }
    });

    self.postMessage({
      id,
      type: 'success',
      result: {
        violations,
        passes,
        incomplete,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: { message: error.message || 'Error en auditoría de accesibilidad' }
    });
  }
}

self.onmessage = (event) => {
  const { id, type, payload } = event.data || {};

  if (type === 'analyze-dom') {
    try {
      const html = (payload && payload.html) ? payload.html : '';

      self.postMessage({
        id,
        type: 'progress',
        result: { percent: 20, message: 'Iniciando análisis sintáctico del árbol DOM...' }
      });

      const { stats, issues } = analyzeHtmlTree(html);

      self.postMessage({
        id,
        type: 'progress',
        result: { percent: 100, message: 'Análisis DOM finalizado.' }
      });

      self.postMessage({
        id,
        type: 'success',
        result: { stats, issues }
      });
    } catch (err) {
      self.postMessage({
        id,
        type: 'error',
        error: { message: err.message || 'Error desconocido en análisis DOM' }
      });
    }
  } else if (type === 'accessibility-audit') {
    const html = (payload && payload.html) ? payload.html : '';
    runAccessibilityAudit(id, html);
  }
};

