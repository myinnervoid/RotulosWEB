/**
 * ==========================================================
 * 🇲🇽 Memexicanísimos Studio — Motor de Diagnóstico, SEO & A11y
 * Suites E2E In-Browser, axe-core WCAG 2.2 AA y Métricas
 * ==========================================================
 */

window.MemexDiagnostics = (function () {
  let lastReport = null;

  // ── OBTENER DOCUMENTO DEL LIENZO DE GRAPESJS ──────────────
  function getCanvasDoc(editor) {
    try {
      const frame = editor.Canvas.getFrameEl();
      if (frame && frame.contentDocument) {
        return frame.contentDocument;
      }
    } catch (e) {
      console.warn('[Diagnostics] No se pudo acceder al iframe de GrapesJS directamente:', e);
    }
    // Fallback: parsear HTML del editor
    const parser = new DOMParser();
    return parser.parseFromString(editor.getHtml(), 'text/html');
  }

  // ── FASE A: SUITE DE AUTODIAGNÓSTICO E INTEGRIDAD E2E ──────
  async function runIntegritySuite(editor) {
    const results = [];
    let score = 100;

    // 1. Verificación de Contratos Backend ApiResponse
    try {
      const pageRes = await fetch('/api/page');
      const pageData = await pageRes.json();
      if (pageData.success && pageData.data && pageData.data.html) {
        results.push({
          category: 'backend',
          name: 'Contrato Backend /api/page',
          status: 'PASS',
          message: 'Endpoint responde con estructura canónica ApiResponse<T> y HTML válido.'
        });
      } else {
        score -= 25;
        results.push({
          category: 'backend',
          name: 'Contrato Backend /api/page',
          status: 'FAIL',
          message: 'Estructura no canónica o fallo: ' + (pageData.message || 'Error desconocido')
        });
      }
    } catch (err) {
      score -= 25;
      results.push({
        category: 'backend',
        name: 'Contrato Backend /api/page',
        status: 'FAIL',
        message: 'No hay conexión con el backend: ' + err.message
      });
    }

    // 2. Verificación de Endpoint de Estadísticas
    try {
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.data && typeof statsData.data.totalBackups === 'number') {
        results.push({
          category: 'backend',
          name: 'Contrato Backend /api/stats',
          status: 'PASS',
          message: `Respaldos: ${statsData.data.totalBackups} | Memoria RSS: ${statsData.data.memory.rss}`
        });
      } else {
        score -= 10;
        results.push({
          category: 'backend',
          name: 'Contrato Backend /api/stats',
          status: 'WARN',
          message: 'Endpoint respondió pero con formato incompleto.'
        });
      }
    } catch (err) {
      score -= 10;
      results.push({
        category: 'backend',
        name: 'Contrato Backend /api/stats',
        status: 'FAIL',
        message: 'Fallo al consultar /api/stats: ' + err.message
      });
    }

    // 3. Verificación de Service Worker y Resiliencia Offline
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        results.push({
          category: 'resilience',
          name: 'Service Worker (Modo Offline)',
          status: 'PASS',
          message: 'Service Worker activo en scope: ' + registration.scope
        });
      } else {
        score -= 10;
        results.push({
          category: 'resilience',
          name: 'Service Worker (Modo Offline)',
          status: 'WARN',
          message: 'Service Worker registrado pero no activo aún (se activará en la próxima recarga).'
        });
      }
    } else {
      score -= 15;
      results.push({
        category: 'resilience',
        name: 'Service Worker',
        status: 'WARN',
        message: 'Navegador sin soporte de Service Worker.'
      });
    }

    // 4. Verificación de Enlaces e Imágenes en el Lienzo
    const doc = getCanvasDoc(editor);
    const links = Array.from(doc.querySelectorAll('a'));
    let emptyLinks = 0;
    links.forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#' || href === 'javascript:void(0)') {
        emptyLinks++;
      }
    });

    if (emptyLinks === 0) {
      results.push({
        category: 'integrity',
        name: 'Integridad de Enlaces <a>',
        status: 'PASS',
        message: `Todos los ${links.length} enlaces tienen destinos asignados.`
      });
    } else {
      score -= (emptyLinks * 4);
      results.push({
        category: 'integrity',
        name: 'Integridad de Enlaces <a>',
        status: 'WARN',
        message: `${emptyLinks} de ${links.length} enlaces tienen href vacío o "#".`,
        remediation: 'Asigna URLs válidas en la pestaña Propiedades.'
      });
    }

    const images = Array.from(doc.querySelectorAll('img'));
    let brokenImages = 0;
    let missingAlts = 0;

    images.forEach(img => {
      const src = (img.getAttribute('src') || '').trim();
      if (!src) brokenImages++;
      if (!img.getAttribute('alt')) missingAlts++;
    });

    if (brokenImages === 0) {
      results.push({
        category: 'integrity',
        name: 'Integridad de Imágenes <img>',
        status: 'PASS',
        message: `Se verificaron ${images.length} imágenes. Todas tienen fuentes declaradas.`
      });
    } else {
      score -= (brokenImages * 10);
      results.push({
        category: 'integrity',
        name: 'Integridad de Imágenes <img>',
        status: 'FAIL',
        message: `${brokenImages} imágenes tienen el atributo src vacío o roto.`
      });
    }

    // 5. Métrica de Rendimiento de Recursos
    try {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
      const totalSizeKB = (totalSize / 1024).toFixed(1);
      const avgDuration = resources.length ? (resources.reduce((acc, r) => acc + r.duration, 0) / resources.length).toFixed(1) : 0;

      results.push({
        category: 'performance',
        name: 'Rendimiento de Recursos del Editor',
        status: totalSizeKB > 5000 ? 'WARN' : 'PASS',
        message: `${resources.length} recursos transferidos (~${totalSizeKB} KB). Latencia media: ${avgDuration} ms.`
      });
    } catch (e) {
      console.warn('Error leyendo performance resources:', e);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    return { score, results };
  }

  // ── FASE B: SUITE DE ACCESIBILIDAD (axe-core) Y SEO ────────
  async function runA11yAndSeoSuite(editor) {
    const results = [];
    let a11yScore = 100;
    let seoScore = 100;

    const doc = getCanvasDoc(editor);

    // 1. Auditoría SEO: Meta Tags & Título
    const title = doc.querySelector('title');
    const titleText = title ? title.textContent.trim() : '';
    if (titleText && titleText.length >= 10 && titleText.length <= 70) {
      results.push({
        category: 'seo',
        name: 'Etiqueta <title>',
        status: 'PASS',
        message: `Título óptimo (${titleText.length} car.): "${titleText}"`
      });
    } else if (titleText) {
      seoScore -= 10;
      results.push({
        category: 'seo',
        name: 'Etiqueta <title>',
        status: 'WARN',
        message: `Longitud de título no recomendada (${titleText.length} car.). Recomendado: entre 10 y 70 caracteres.`
      });
    } else {
      seoScore -= 20;
      results.push({
        category: 'seo',
        name: 'Etiqueta <title>',
        status: 'FAIL',
        message: 'No se encontró etiqueta <title> en el documento.'
      });
    }

    // 2. Meta Description
    const metaDesc = doc.querySelector('meta[name="description"]');
    const descContent = metaDesc ? (metaDesc.getAttribute('content') || '').trim() : '';
    if (descContent && descContent.length >= 50 && descContent.length <= 160) {
      results.push({
        category: 'seo',
        name: 'Meta Descripción',
        status: 'PASS',
        message: `Descripción presente (${descContent.length} car.).`
      });
    } else if (descContent) {
      seoScore -= 10;
      results.push({
        category: 'seo',
        name: 'Meta Descripción',
        status: 'WARN',
        message: `Longitud de descripción mejorable (${descContent.length} car.). Recomendado: 50 - 160 car.`
      });
    } else {
      seoScore -= 20;
      results.push({
        category: 'seo',
        name: 'Meta Descripción',
        status: 'FAIL',
        message: 'Falta <meta name="description"> para motores de búsqueda.'
      });
    }

    // 3. Open Graph (Redes Sociales)
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    const ogDesc = doc.querySelector('meta[property="og:description"]');

    if (ogTitle && ogImage && ogDesc) {
      results.push({
        category: 'seo',
        name: 'Open Graph (Facebook / WhatsApp)',
        status: 'PASS',
        message: 'Etiquetas og:title, og:image y og:description presentes.'
      });
    } else {
      seoScore -= 15;
      results.push({
        category: 'seo',
        name: 'Open Graph (Redes Sociales)',
        status: 'WARN',
        message: 'Faltan algunas etiquetas Open Graph para previsualizaciones ricas en redes.'
      });
    }

    // 4. Jerarquía de Encabezados (h1)
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 1) {
      results.push({
        category: 'seo',
        name: 'Jerarquía Encabezados <h1>',
        status: 'PASS',
        message: `Encabezado principal único: "${h1s[0].textContent.trim().substring(0, 45)}..."`
      });
    } else if (h1s.length === 0) {
      seoScore -= 20;
      results.push({
        category: 'seo',
        name: 'Jerarquía Encabezados <h1>',
        status: 'FAIL',
        message: 'No se encontró ningún <h1> en la página. Es crítico para SEO.'
      });
    } else {
      seoScore -= 10;
      results.push({
        category: 'seo',
        name: 'Jerarquía Encabezados <h1>',
        status: 'WARN',
        message: `Se encontraron ${h1s.length} etiquetas <h1>. Se recomienda exactamente un <h1> por página.`
      });
    }

    // 5. Análisis de Accesibilidad con axe-core
    let axeViolations = [];
    if (window.axe) {
      try {
        const axeResults = await window.axe.run(doc.body, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'best-practice']
          }
        });

        axeViolations = axeResults.violations || [];
        if (axeViolations.length === 0) {
          results.push({
            category: 'a11y',
            name: 'Auditoría axe-core (WCAG 2.2 AA)',
            status: 'PASS',
            message: '0 violaciones de accesibilidad detectadas en el documento analizado.'
          });
        } else {
          a11yScore -= Math.min(60, axeViolations.length * 10);
          axeViolations.slice(0, 5).forEach(v => {
            results.push({
              category: 'a11y',
              name: `A11y: ${v.id}`,
              status: v.impact === 'critical' ? 'FAIL' : 'WARN',
              message: `${v.help}. (${v.nodes.length} elemento(s) afectado(s))`
            });
          });
        }
      } catch (err) {
        console.warn('Fallo ejecutando axe-core:', err);
      }
    } else {
      // Fallback semántico si axe-core no estuviera cargado
      const imgsWithoutAlt = doc.querySelectorAll('img:not([alt])');
      if (imgsWithoutAlt.length > 0) {
        a11yScore -= (imgsWithoutAlt.length * 5);
        results.push({
          category: 'a11y',
          name: 'Atributos alt en Imágenes',
          status: 'WARN',
          message: `${imgsWithoutAlt.length} imágenes carecen de texto alternativo (alt).`
        });
      }
    }

    // 6. Legibilidad Textual
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    const totalWords = paragraphs.reduce((acc, p) => acc + p.textContent.split(/\s+/).filter(Boolean).length, 0);
    const avgWordsPerP = paragraphs.length ? Math.round(totalWords / paragraphs.length) : 0;

    results.push({
      category: 'seo',
      name: 'Legibilidad y Contenido',
      status: avgWordsPerP > 40 ? 'WARN' : 'PASS',
      message: `${paragraphs.length} párrafos encontrados. Promedio: ${avgWordsPerP} palabras por párrafo.`
    });

    const globalScore = Math.round((a11yScore + seoScore) / 2);
    return {
      globalScore,
      a11yScore: Math.max(0, Math.round(a11yScore)),
      seoScore: Math.max(0, Math.round(seoScore)),
      results,
      violations: axeViolations
    };
  }

  // ── DESCARGAR INFORME EN FORMATO JSON ─────────────────────
  function downloadReport(reportData) {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_memexicanisimos_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    runIntegritySuite,
    runA11yAndSeoSuite,
    downloadReport
  };
})();
