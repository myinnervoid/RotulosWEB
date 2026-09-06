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
  }
};
