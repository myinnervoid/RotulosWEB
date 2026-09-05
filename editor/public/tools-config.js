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
    iconColor: '#55EBB2',
    label: 'Autodiagnóstico',
    subtitle: 'E2E & WCAG 2.2',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const modal = document.getElementById('diag-modal');
      if (modal && window.runWebsiteDiagnostics) {
        modal.classList.add('open');
        window.runWebsiteDiagnostics();
      }
    }
  },
  {
    id: 'screenshot',
    icon: 'fa-camera',
    iconColor: '#64B5F6',
    label: 'Captura HD',
    subtitle: 'Render Chrome',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const modal = document.getElementById('screenshot-modal');
      if (modal) modal.classList.add('open');
    }
  },
  {
    id: 'stats',
    icon: 'fa-chart-pie',
    iconColor: '#F5C542',
    label: 'Estadísticas',
    subtitle: 'Stats & Backups',
    category: 'diagnostics',
    drawer: true,
    action: () => {
      const modal = document.getElementById('stats-modal');
      if (modal && window.fetchAndShowStats) {
        modal.classList.add('open');
        window.fetchAndShowStats();
      }
    }
  },

  // ── SECCIÓN: RECURSOS Y CÓDIGO ──
  {
    id: 'assets',
    icon: 'fa-images',
    iconColor: '#D4AF37',
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
    iconColor: '#A7B8B0',
    label: 'Código Fuente',
    subtitle: 'HTML sanitizado',
    category: 'resources',
    drawer: true,
    action: () => {
      const codeModal = document.getElementById('code-modal');
      if (codeModal && window.openCodeInspector) {
        window.openCodeInspector();
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
