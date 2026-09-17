/**
 * ==========================================================================
 * Memexicanisimos.com — Plataforma Web y Ecosistema de Estudio (v3.1)
 * Implementación de Autómata Finito de Estados (FSM) y Contrato Canónico ApiResponse<T>
 * Compatible tanto con despliegue web HTTPS como con apertura local file:///
 * ==========================================================================
 */

import { ErrorCode, ErrorCatalog, createApiResponse } from './contracts/errors.js';


// ==========================================================================
// ── INICIALIZADORES MODULARES ───────────────────────────────────────────────
// ==========================================================================

function initTabsNavigation() {
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

  function navigateToHash(hashValue) {
    if (!hashValue || hashValue.length <= 1) return;
    const cleanHash = hashValue.replace('#', '');
    
    let targetTab = cleanHash;
    if (['rotulos-anchor', 'aetheria-anchor', 'masv-anchor', 'files-anchor'].includes(cleanHash)) {
      targetTab = 'perfiles';
    }
    
    const matchingBtn = tabButtons.find(btn => btn.getAttribute('data-target') === targetTab);
    if (matchingBtn) {
      activateTab(matchingBtn);
      if (cleanHash !== targetTab) {
        setTimeout(() => {
          const el = document.getElementById(cleanHash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 350);
      }
    }
  }

  function handleHashNavigation() {
    navigateToHash(window.location.hash);
  }

  window.addEventListener('hashchange', handleHashNavigation);

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      navigateToHash(href);
    });
  });

  handleHashNavigation();
}

function initClipboardFSM() {
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
      copyEmailBtn.disabled = true;
      copyEmailBtn.setAttribute('data-fsm-state', 'PENDING');
      copyEmailBtn.innerHTML = '<span class="spinner-patrio"></span> Copiando...';

      const response = await copyToClipboardSafe(emailText.textContent.trim());

      if (response.success) {
        copyEmailBtn.setAttribute('data-fsm-state', 'SUCCESS');
        copyEmailBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado con Éxito!';
        copyEmailBtn.classList.add('btn-state-success');

        setTimeout(() => {
          copyEmailBtn.disabled = false;
          copyEmailBtn.setAttribute('data-fsm-state', 'IDLE');
          copyEmailBtn.innerHTML = originalContent;
          copyEmailBtn.classList.remove('btn-state-success');
        }, 2200);
      } else {
        copyEmailBtn.setAttribute('data-fsm-state', 'FAULT');
        copyEmailBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al Copiar';
        copyEmailBtn.classList.add('btn-state-fault');

        const toast = document.createElement('div');
        toast.className = 'toast-patrio-error';
        toast.setAttribute('role', 'alert');
        toast.textContent = `[${response.error_code}]: ${response.message}`;
        copyEmailBtn.parentNode.appendChild(toast);

        setTimeout(() => {
          copyEmailBtn.disabled = false;
          copyEmailBtn.setAttribute('data-fsm-state', 'IDLE');
          copyEmailBtn.innerHTML = originalContent;
          copyEmailBtn.classList.remove('btn-state-fault');
          toast.remove();
        }, 3500);
      }
    });
  }
}

function initShortcutSearchFSM() {
  const shortcutSearch = document.getElementById('shortcut-search');
  const shortcutsGrid = document.getElementById('shortcuts-grid');
  const shortcutCards = document.querySelectorAll('.short-card');

  if (shortcutSearch && shortcutsGrid) {
    let emptyStateBanner = document.getElementById('shortcuts-empty-state');
    if (!emptyStateBanner) {
      emptyStateBanner = document.createElement('div');
      emptyStateBanner.id = 'shortcuts-empty-state';
      emptyStateBanner.className = 'fsm-empty-state hidden';

      const iconDiv = document.createElement('div');
      iconDiv.className = 'empty-icon';
      iconDiv.textContent = '🔍';

      const title = document.createElement('h4');
      title.textContent = 'Sin coincidencias';

      const desc = document.createElement('p');
      desc.textContent = 'No se encontraron atajos para el término ingresado. Intenta con "volumen", "inicio" o "atrás".';

      emptyStateBanner.appendChild(iconDiv);
      emptyStateBanner.appendChild(title);
      emptyStateBanner.appendChild(desc);

      shortcutsGrid.parentNode.appendChild(emptyStateBanner);
    }

    const cachedShortcutData = Array.from(shortcutCards).map(card => {
      return {
        card: card,
        text: card.textContent.toLowerCase(),
        tags: card.getAttribute('data-shortcut') || ''
      };
    });

    shortcutSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      let matchCount = 0;

      cachedShortcutData.forEach(data => {
        const isMatch = (query === '') || data.text.includes(query) || data.tags.includes(query);
        data.card.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) matchCount++;
      });

      if (matchCount === 0) {
        shortcutsGrid.style.display = 'none';
        emptyStateBanner.classList.remove('hidden');
      } else {
        shortcutsGrid.style.display = 'grid';
        emptyStateBanner.classList.add('hidden');
      }
    });
  }
}

function initBurnerConsoleFSM() {
  const consoleBody = document.getElementById('burner-console-body');
  const btnRunConsole = document.getElementById('btn-run-console');
  const btnResetConsole = document.getElementById('btn-reset-console');

  if (consoleBody && btnRunConsole) {
    const originalConsoleLines = [
      '<p class="console-line text-muted">[INFO] Analizando ISO de Windows 10/11...</p>',
      '<p class="console-line text-warning">[WARN] Archivo \'sources/install.wim\' excede los 4GB (Tamaño: 5.2 GB)</p>',
      '<p class="console-line text-patrio-green">[PROCESS] Dividiendo install.wim usando wimlib en install.swm...</p>',
      '<div class="console-progress"><div class="progress-bar patrio-green" data-progress="0">0%</div></div>',
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
          bar.setAttribute('data-progress', progress);
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

    runConsoleMockupLoop();
  }
}

function initFileExplorerFSM() {
  const filterTags = document.querySelectorAll('.filter-tag');
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const fileRows = document.querySelectorAll('.file-row');
  const filesListContainer = document.getElementById('explorer-files-list');

  let emptyFilesState = document.getElementById('files-empty-state');
  if (!emptyFilesState && filesListContainer) {
    emptyFilesState = document.createElement('div');
    emptyFilesState.id = 'files-empty-state';
    emptyFilesState.className = 'fsm-empty-state hidden';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'empty-icon';
    iconDiv.textContent = '📁';

    const title = document.createElement('h4');
    title.textContent = 'Directorio vacío';

    const desc = document.createElement('p');
    desc.textContent = 'No se encontraron archivos en esta categoría.';

    emptyFilesState.appendChild(iconDiv);
    emptyFilesState.appendChild(title);
    emptyFilesState.appendChild(desc);

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
}

function initPrivacyConsent() {
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
          <a href="https://facebook.com/Memexicanisimos" target="_blank" rel="noopener noreferrer" class="btn btn-patrio-green mt-12">
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
      } catch (e) {
        console.warn('[STORAGE] Error guardando preferencia:', e);
      }
      closeWelcomeModal();
      renderFacebookWidgetSecure();
    });
  }

  if (btnWelcomeReject) {
    btnWelcomeReject.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_KEY, 'rejected');
      } catch (e) {
        console.warn('[STORAGE] Error guardando preferencia:', e);
      }
      closeWelcomeModal();
    });
  }

  if (btnWelcomeClose) {
    btnWelcomeClose.addEventListener('click', () => {
      closeWelcomeModal();
    });
  }

  if (welcomeModal) {
    welcomeModal.addEventListener('click', (e) => {
      if (e.target === welcomeModal) {
        closeWelcomeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && welcomeModal && !welcomeModal.classList.contains('hidden')) {
      closeWelcomeModal();
    }
  });

  checkCookieConsent();
}

document.addEventListener('DOMContentLoaded', () => {
  initTabsNavigation();
  initClipboardFSM();
  initShortcutSearchFSM();
  initBurnerConsoleFSM();
  initFileExplorerFSM();
  initPrivacyConsent();
});
