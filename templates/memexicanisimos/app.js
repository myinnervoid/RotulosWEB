/**
 * ==========================================================================
 * Memexicanisimos.com — Plataforma Web y Ecosistema de Estudio (v3.1)
 * Implementación de Autómata Finito de Estados (FSM) y Contrato Canónico ApiResponse<T>
 * Compatible tanto con despliegue web HTTPS como con apertura local file:///
 * ==========================================================================
 */

// ── CATÁLOGO CANÓNICO DE ERRORES & CONTRATO ESTÁNDAR ─────────────────────
const ErrorCode = Object.freeze({
  CLIPBOARD_WRITE_FAILED: 'CLIPBOARD_WRITE_FAILED',
  CLIPBOARD_PERMISSION_DENIED: 'CLIPBOARD_PERMISSION_DENIED',
  STORAGE_READ_FAILED: 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  INVALID_STORAGE_VERSION: 'INVALID_STORAGE_VERSION',
  FILTER_NO_MATCH: 'FILTER_NO_MATCH',
  COMPONENT_STATE_INVALID: 'COMPONENT_STATE_INVALID',
  EXTERNAL_FEED_BLOCKED: 'EXTERNAL_FEED_BLOCKED',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE'
});

const ErrorCatalog = Object.freeze({
  [ErrorCode.CLIPBOARD_WRITE_FAILED]: {
    code: ErrorCode.CLIPBOARD_WRITE_FAILED,
    userMessage: 'No fue posible copiar el texto al portapapeles. Intenta seleccionarlo manualmente.',
    severity: 'Menor'
  },
  [ErrorCode.CLIPBOARD_PERMISSION_DENIED]: {
    code: ErrorCode.CLIPBOARD_PERMISSION_DENIED,
    userMessage: 'El navegador bloqueó el permiso para acceder al portapapeles.',
    severity: 'Mayor'
  },
  [ErrorCode.STORAGE_WRITE_FAILED]: {
    code: ErrorCode.STORAGE_WRITE_FAILED,
    userMessage: 'No se pudieron guardar tus preferencias en el almacenamiento local.',
    severity: 'Menor'
  },
  [ErrorCode.FILTER_NO_MATCH]: {
    code: ErrorCode.FILTER_NO_MATCH,
    userMessage: 'No se encontraron elementos que coincidan con tu búsqueda.',
    severity: 'Menor'
  },
  [ErrorCode.EXTERNAL_FEED_BLOCKED]: {
    code: ErrorCode.EXTERNAL_FEED_BLOCKED,
    userMessage: 'El feed social fue bloqueado por tu navegador o extensión de privacidad.',
    severity: 'Menor'
  },
  [ErrorCode.CONSENT_REQUIRED]: {
    code: ErrorCode.CONSENT_REQUIRED,
    userMessage: 'Se requiere consentimiento de cookies para cargar el contenido de terceros.',
    severity: 'Menor'
  }
});

function createApiResponse(success, data = null, errorCode = null, message = '') {
  return {
    success: Boolean(success),
    data: data,
    error_code: errorCode,
    message: message || (errorCode && ErrorCatalog[errorCode] ? ErrorCatalog[errorCode].userMessage : (success ? 'Operación exitosa' : 'Error desconocido'))
  };
}

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. NAVEGACIÓN POR PESTAÑAS (WAI-ARIA + View Transitions) ───────────
  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
  const productSections = document.querySelectorAll('.product-section');
  const tabsContainer = document.querySelector('.tabs-container');

  function activateTab(selectedBtn) {
    if (!selectedBtn) return;
    const target = selectedBtn.getAttribute('data-target');

    const updateDOM = () => {
      tabButtons.forEach(btn => {
        const isSelected = (btn === selectedBtn);
        btn.classList.toggle('active', isSelected);
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        btn.setAttribute('tabindex', isSelected ? '0' : '-1');
      });

      productSections.forEach(section => {
        const isTarget = (section.id === target);
        section.classList.toggle('active', isTarget);
      });
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => updateDOM());
    } else {
      updateDOM();
    }

    const targetSection = document.getElementById(target);
    if (targetSection) {
      const targetOffset = targetSection.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: targetOffset,
        behavior: 'smooth'
      });
    }
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => activateTab(button));
  });

  if (tabsContainer) {
    tabsContainer.addEventListener('keydown', (e) => {
      const currentIndex = tabButtons.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        newIndex = (currentIndex + 1) % tabButtons.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        newIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        newIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        newIndex = tabButtons.length - 1;
        e.preventDefault();
      }

      if (newIndex !== currentIndex) {
        tabButtons[newIndex].focus();
        activateTab(tabButtons[newIndex]);
      }
    });
  }

  // Enlace / Botón "Editar en Rótulos Web" del Header abre el editor visual en http://localhost:5050

  // ── 2. AUTÓMATA FINITO (FSM): COPIADO DE CORREO OFICIAL ────────────────
  // Estados: [IDLE] -> [PENDING] -> [SUCCESS] | [FAULT]
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const emailText = document.querySelector('.email-text');

  async function copyToClipboardSafe(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return createApiResponse(false, null, ErrorCode.CLIPBOARD_PERMISSION_DENIED);
    }
    try {
      await navigator.clipboard.writeText(text);
      return createApiResponse(true, { copiedText: text });
    } catch (err) {
      return createApiResponse(false, null, ErrorCode.CLIPBOARD_WRITE_FAILED, err.message);
    }
  }

  if (copyEmailBtn && emailText) {
    const originalContent = copyEmailBtn.innerHTML;

    copyEmailBtn.addEventListener('click', async () => {
      // Estado: [PENDING]
      copyEmailBtn.disabled = true;
      copyEmailBtn.setAttribute('data-fsm-state', 'PENDING');
      copyEmailBtn.innerHTML = '<span class="spinner-patrio"></span> Copiando...';

      const response = await copyToClipboardSafe(emailText.textContent.trim());

      if (response.success) {
        // Estado: [SUCCESS]
        copyEmailBtn.setAttribute('data-fsm-state', 'SUCCESS');
        copyEmailBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado con Éxito!';
        copyEmailBtn.classList.add('btn-state-success');

        setTimeout(() => {
          // Retorno a [IDLE]
          copyEmailBtn.disabled = false;
          copyEmailBtn.setAttribute('data-fsm-state', 'IDLE');
          copyEmailBtn.innerHTML = originalContent;
          copyEmailBtn.classList.remove('btn-state-success');
        }, 2200);
      } else {
        // Estado: [FAULT]
        copyEmailBtn.setAttribute('data-fsm-state', 'FAULT');
        copyEmailBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al Copiar';
        copyEmailBtn.classList.add('btn-state-fault');

        const toast = document.createElement('div');
        toast.className = 'toast-patrio-error';
        toast.setAttribute('role', 'alert');
        toast.textContent = `[${response.error_code}]: ${response.message}`;
        copyEmailBtn.parentNode.appendChild(toast);

        setTimeout(() => {
          // Retorno a [IDLE]
          copyEmailBtn.disabled = false;
          copyEmailBtn.setAttribute('data-fsm-state', 'IDLE');
          copyEmailBtn.innerHTML = originalContent;
          copyEmailBtn.classList.remove('btn-state-fault');
          toast.remove();
        }, 3500);
      }
    });
  }

  // ── 3. AUTÓMATA FINITO (FSM): BUSCADOR DE ATAJOS MASV ──────────────────
  // Estados: [IDLE] -> [PENDING] -> [SUCCESS] (con resultados) | [EMPTY] (sin coincidencias)
  const shortcutSearch = document.getElementById('shortcut-search');
  const shortcutsGrid = document.getElementById('shortcuts-grid');
  const shortcutCards = document.querySelectorAll('.short-card');

  if (shortcutSearch && shortcutsGrid) {
    let emptyStateBanner = document.getElementById('shortcuts-empty-state');
    if (!emptyStateBanner) {
      emptyStateBanner = document.createElement('div');
      emptyStateBanner.id = 'shortcuts-empty-state';
      emptyStateBanner.className = 'fsm-empty-state hidden';
      emptyStateBanner.innerHTML = `
        <div class="empty-icon">🔍</div>
        <h4>Sin coincidencias</h4>
        <p>No se encontraron atajos para el término ingresado. Intenta con "volumen", "inicio" o "atrás".</p>
      `;
      shortcutsGrid.parentNode.appendChild(emptyStateBanner);
    }

    shortcutSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      let matchCount = 0;

      shortcutCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const tags = card.getAttribute('data-shortcut') || '';
        const isMatch = (query === '') || text.includes(query) || tags.includes(query);
        card.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) matchCount++;
      });

      if (matchCount === 0) {
        // Estado: [EMPTY]
        shortcutsGrid.style.display = 'none';
        emptyStateBanner.classList.remove('hidden');
      } else {
        // Estado: [SUCCESS]
        shortcutsGrid.style.display = 'grid';
        emptyStateBanner.classList.add('hidden');
      }
    });
  }

  // ── 4. AUTÓMATA FINITO (FSM): CONSOLA INTERACTIVA DE BURNER ───────────
  // Estados: [IDLE] -> [PENDING] (simulando split wimlib) -> [SUCCESS]
  const consoleBody = document.getElementById('burner-console-body');
  const btnRunConsole = document.getElementById('btn-run-console');
  const btnResetConsole = document.getElementById('btn-reset-console');

  if (consoleBody && btnRunConsole) {
    const originalConsoleLines = [
      '<p class="console-line text-muted">[INFO] Analizando ISO de Windows 10/11...</p>',
      '<p class="console-line text-warning">[WARN] Archivo \'sources/install.wim\' excede los 4GB (Tamaño: 5.2 GB)</p>',
      '<p class="console-line text-patrio-green">[PROCESS] Dividiendo install.wim usando wimlib en install.swm...</p>',
      '<div class="console-progress"><div class="progress-bar patrio-green" style="width: 0%;">0%</div></div>',
      '<p class="console-line text-muted">[INFO] Creando partición de arranque UEFI en USB /dev/sdb...</p>'
    ];

    let loopInterval = null;

    function resetConsole() {
      if (loopInterval) clearInterval(loopInterval);
      consoleBody.innerHTML = originalConsoleLines.join('');
      btnRunConsole.disabled = false;
      btnRunConsole.innerHTML = '<i class="fas fa-play"></i> Simular Flasheo';
    }

    function runConsoleMockupLoop() {
      resetConsole();
      btnRunConsole.disabled = true;
      btnRunConsole.innerHTML = '<span class="spinner-patrio"></span> Procesando...';

      const bar = consoleBody.querySelector('.progress-bar');
      let progress = 0;

      loopInterval = setInterval(() => {
        progress += 5;
        if (bar) {
          bar.style.width = `${progress}%`;
          bar.textContent = `${progress}%`;
        }

        if (progress >= 100) {
          clearInterval(loopInterval);
          const doneLine = document.createElement('p');
          doneLine.className = 'console-line text-success-bold';
          doneLine.innerHTML = '[OK] install.wim dividido y copiado en install.swm (Parte 1 y Parte 2). USB Listo para instalar.';
          consoleBody.appendChild(doneLine);
          btnRunConsole.disabled = false;
          btnRunConsole.innerHTML = '<i class="fas fa-check"></i> Flasheo Completado';
        }
      }, 120);
    }

    btnRunConsole.addEventListener('click', runConsoleMockupLoop);
    if (btnResetConsole) {
      btnResetConsole.addEventListener('click', resetConsole);
    }

    // Inicializar simulación visual
    runConsoleMockupLoop();
  }

  // ── 5. AUTÓMATA FINITO (FSM): EXPLORADOR INTERACTIVO DE FILES ──────────
  const filterTags = document.querySelectorAll('.filter-tag');
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const fileRows = document.querySelectorAll('.file-row');
  const filesListContainer = document.getElementById('explorer-files-list');

  let emptyFilesState = document.getElementById('files-empty-state');
  if (!emptyFilesState && filesListContainer) {
    emptyFilesState = document.createElement('div');
    emptyFilesState.id = 'files-empty-state';
    emptyFilesState.className = 'fsm-empty-state hidden';
    emptyFilesState.innerHTML = `
      <div class="empty-icon">📁</div>
      <h4>Directorio vacío</h4>
      <p>No se encontraron archivos en esta categoría.</p>
    `;
    filesListContainer.parentNode.appendChild(emptyFilesState);
  }

  function filterFiles(category) {
    let visibleCount = 0;
    fileRows.forEach(row => {
      const rowType = row.getAttribute('data-type');
      const isVisible = (category === 'all' || rowType === category);
      row.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    if (visibleCount === 0 && emptyFilesState) {
      filesListContainer.style.display = 'none';
      emptyFilesState.classList.remove('hidden');
    } else if (emptyFilesState) {
      filesListContainer.style.display = 'flex';
      emptyFilesState.classList.add('hidden');
    }
  }

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      const filter = tag.getAttribute('data-filter');
      filterFiles(filter);
    });
  });

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebarItems.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const category = item.getAttribute('data-category');
      if (category) {
        filterTags.forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-filter') === category);
        });
        filterFiles(category);
      }
    });
  });

  // ── 6. GESTOR DE PRIVACIDAD LFPDPPP & MODAL ARTESANAL DE BIENVENIDA ───
  const welcomeModal = document.getElementById('welcome-modal-overlay');
  const btnWelcomeAccept = document.getElementById('welcome-btn-accept');
  const btnWelcomeReject = document.getElementById('welcome-btn-reject');
  const btnWelcomeClose = document.getElementById('welcome-modal-close');
  const fbContainer = document.getElementById('fb-embed-container');

  const STORAGE_KEY = 'memex_cookie_consent_v1';

  function closeWelcomeModal() {
    if (welcomeModal) {
      welcomeModal.style.opacity = '0';
      welcomeModal.style.transition = 'opacity 0.25s ease-out';
      setTimeout(() => {
        welcomeModal.classList.add('hidden');
        welcomeModal.style.opacity = '';
        welcomeModal.style.transition = '';
      }, 250);
    }
  }

  function openWelcomeModal() {
    if (welcomeModal) {
      welcomeModal.classList.remove('hidden');
    }
  }

  function renderFacebookWidgetSecure() {
    if (!fbContainer) return;
    fbContainer.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FMemexicanisimos&tabs=timeline&width=500&height=550&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true';
    iframe.width = '100%';
    iframe.height = '550';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.borderRadius = '16px';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');
    iframe.setAttribute('loading', 'lazy');

    iframe.onerror = () => {
      fbContainer.innerHTML = `
        <div class="fb-blocked-placeholder">
          <i class="fab fa-facebook-f"></i>
          <h4>Conexión Segura con Facebook</h4>
          <p>Tu navegador o bloqueador de rastreadores impidió la conexión directa con Meta.</p>
          <a href="https://facebook.com/Memexicanisimos" target="_blank" rel="noopener noreferrer" class="btn btn-patrio-green" style="margin-top: 12px;">
            <i class="fas fa-external-link-alt"></i> Abrir Facebook Oficial
          </a>
        </div>
      `;
    };

    fbContainer.appendChild(iframe);
  }

  function checkCookieConsent() {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (consent === 'accepted') {
        renderFacebookWidgetSecure();
        if (welcomeModal) welcomeModal.classList.add('hidden');
      } else if (consent === 'rejected') {
        if (welcomeModal) welcomeModal.classList.add('hidden');
      } else {
        // Mostrar Modal de Bienvenida con Rótulo Mexicano si no hay decisión tomada
        if (welcomeModal) {
          setTimeout(() => openWelcomeModal(), 500);
        }
      }
    } catch (e) {
      console.warn('[STORAGE] LocalStorage no disponible:', e);
    }
  }

  if (btnWelcomeAccept) {
    btnWelcomeAccept.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, 'accepted');
      } catch (e) {}
      closeWelcomeModal();
      renderFacebookWidgetSecure();
    });
  }

  if (btnWelcomeReject) {
    btnWelcomeReject.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, 'rejected');
      } catch (e) {}
      closeWelcomeModal();
    });
  }

  if (btnWelcomeClose) {
    btnWelcomeClose.addEventListener('click', () => {
      closeWelcomeModal();
    });
  }

  // Cerrar modal al tocar el fondo oscuro (overlay backdrop) para accesibilidad táctil móvil
  if (welcomeModal) {
    welcomeModal.addEventListener('click', (e) => {
      if (e.target === welcomeModal) {
        closeWelcomeModal();
      }
    });
  }

  // Cerrar modal al presionar tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && welcomeModal && !welcomeModal.classList.contains('hidden')) {
      closeWelcomeModal();
    }
  });

  // Inicializar verificación de bienvenida
  checkCookieConsent();
});
