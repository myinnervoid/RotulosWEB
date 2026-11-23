/**
 * @file tools-config.js
 * @description Registro centralizado y extensible de herramientas del Estudio Visual (v3.3)
 * Permite añadir nuevas utilidades al Menú Hamburguesa (Drawer) o al Dock de Secciones
 * de manera modular sin modificar la estructura del HTML base.
 */

export const toolsConfig = [
  // ── SECCIÓN: DIAGNÓSTICO Y SALUD ──
  {
    id: 'diagnostics',
    icon: 'fa-heartbeat',
    iconColor: '#00b49b',
    label: 'Autodiagnóstico',
    subtitle: 'E2E & WCAG 2.2',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const btn = document.getElementById('btn-diagnostics');
      if (btn) {
        btn.click();
      } else {
        const modal = document.getElementById('diag-modal');
        if (modal) modal.classList.add('open');
      }
    }
  },
  {
    id: 'screenshot',
    icon: 'fa-camera',
    iconColor: '#0093a5',
    label: 'Captura HD',
    subtitle: 'Render Chrome',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const btn = document.getElementById('btn-screenshot');
      if (btn) {
        btn.click();
      } else {
        const modal = document.getElementById('screenshot-modal');
        if (modal) modal.classList.add('open');
      }
    }
  },
  {
    id: 'stats',
    icon: 'fa-chart-pie',
    iconColor: '#e2b540',
    label: 'Estadísticas',
    subtitle: 'Stats & Backups',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const btn = document.getElementById('btn-stats');
      if (btn) {
        btn.click();
      } else {
        const modal = document.getElementById('stats-modal');
        if (modal) modal.classList.add('open');
      }
    }
  },

  // ── SECCIÓN: RECURSOS Y CÓDIGO ──
  {
    id: 'assets',
    icon: 'fa-images',
    iconColor: '#e2b540',
    label: 'Galería Assets',
    subtitle: 'Imágenes locales',
    category: 'resources',
    drawer: true,
    action: (editor) => {
      if (editor) editor.runCommand('open-assets');
    }
  },
  {
    id: 'clean-code',
    icon: 'fa-file-code',
    iconColor: '#c2ae93',
    label: 'Código Fuente',
    subtitle: 'HTML sanitizado',
    category: 'resources',
    drawer: true,
    action: () => {
      const btn = document.getElementById('btn-view-code');
      if (btn) {
        btn.click();
      } else {
        const codeModal = document.getElementById('code-modal');
        if (codeModal) codeModal.classList.add('open');
      }
    }
  }
];

export const sectionsConfig = [
  { id: 'noticias-news', icon: '📰', label: 'Noticias & Humor' },
  { id: 'perfiles', icon: '🛠️', label: 'Suite de Apps (.io)' },
  { id: 'redes-sociales', icon: '📱', label: 'Redes & Live' },
  { id: 'nosotros-apoyo', icon: '🌮', label: 'Nosotros & Apoyo' },
  { id: 'creador-contacto', icon: '🤠', label: 'Creador & Contacto' },
  { id: 'all', icon: '👁️', label: 'Ver Todo el Sitio' }
];
