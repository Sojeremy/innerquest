/**
 * UI - InnerQuest
 * Gestion de l'interface utilisateur et des interactions
 */

import config from './config.js';
import i18n from './i18n.js';
import { getLocalizedText, sanitizeHTML, logger } from './utils.js';

export default class UI {
  constructor() {
    this.elements = {};
    this.currentScreen = null;
    this.modals = {};
  }

  /**
   * Initialise l'interface
   */
  init() {
    logger.log('Initializing UI...');

    // Cache des éléments DOM
    this.cacheElements();

    // Attacher les event listeners
    this.attachListeners();

    // Initialiser les modales
    this.initModals();

    logger.log('UI initialized');
  }

  /**
   * Met en cache les références aux éléments DOM
   */
  cacheElements() {
    // Screens
    this.elements.loadingScreen = document.getElementById('loading-screen');
    this.elements.welcomeScreen = document.getElementById('welcome-screen');
    this.elements.gameScreen = document.getElementById('game-screen');

    // Game elements
    this.elements.dayNumber = document.getElementById('day-number');
    this.elements.phaseIndicator = document.getElementById('phase-indicator');
    this.elements.statsContainer = document.getElementById('stats');
    this.elements.globalBalanceValue = document.getElementById('global-balance-value');
    this.elements.eventText = document.getElementById('event-text');
    this.elements.choicesContainer = document.getElementById('choices');

    // Modals
    this.elements.menuModal = document.getElementById('menu-modal');
    this.elements.journalModal = document.getElementById('journal-modal');
    this.elements.settingsModal = document.getElementById('settings-modal');

    // Buttons
    this.elements.btnNewGame = document.getElementById('btn-new-game');
    this.elements.btnContinue = document.getElementById('btn-continue');
    this.elements.btnMenu = document.getElementById('btn-menu');

    // Journal
    this.elements.journalTextarea = document.getElementById('journal-textarea');
    this.elements.btnSubmitJournal = document.getElementById('btn-submit-journal');
    this.elements.btnSkipJournal = document.getElementById('btn-skip-journal');

    // Settings
    this.elements.settingTheme = document.getElementById('setting-theme');
    this.elements.settingFontSize = document.getElementById('setting-font-size');
    this.elements.settingAnimations = document.getElementById('setting-animations');
    this.elements.settingHighContrast = document.getElementById('setting-high-contrast');
    this.elements.settingReduceMotion = document.getElementById('setting-reduce-motion');

    // Notifications
    this.elements.notifications = document.getElementById('notifications');
    this.elements.srAnnouncements = document.getElementById('sr-announcements');
  }

  /**
   * Attache les event listeners
   */
  attachListeners() {
    // Welcome screen buttons
    this.elements.btnNewGame?.addEventListener('click', () => {
      this.emit('new-game');
    });

    this.elements.btnContinue?.addEventListener('click', () => {
      this.emit('continue-game');
    });

    // Menu button
    this.elements.btnMenu?.addEventListener('click', () => {
      this.openModal('menu-modal');
    });

    // Menu actions
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.closeModal('menu-modal');
    });

    document.getElementById('btn-save-game')?.addEventListener('click', () => {
      this.emit('save-game');
    });

    document.getElementById('btn-export-save')?.addEventListener('click', () => {
      this.emit('export-save');
    });

    document.getElementById('btn-import-save')?.addEventListener('click', () => {
      document.getElementById('file-import-save')?.click();
    });

    document.getElementById('file-import-save')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        this.emit('import-save', { file });
      }
    });

    document.getElementById('btn-settings-menu')?.addEventListener('click', () => {
      this.closeModal('menu-modal');
      this.openModal('settings-modal');
    });

    document.getElementById('btn-new-game-menu')?.addEventListener('click', () => {
      if (confirm(i18n.t('settings.resetConfirm'))) {
        this.emit('restart-game');
      }
    });

    // Settings welcome
    document.getElementById('btn-settings-welcome')?.addEventListener('click', () => {
      this.openModal('settings-modal');
    });

    // Journal actions
    this.elements.btnSubmitJournal?.addEventListener('click', () => {
      const entry = this.elements.journalTextarea.value;
      this.emit('journal-submit', { entry });
      this.closeModal('journal-modal');
      this.elements.journalTextarea.value = '';
    });

    this.elements.btnSkipJournal?.addEventListener('click', () => {
      this.emit('journal-submit', { entry: '' });
      this.closeModal('journal-modal');
      this.elements.journalTextarea.value = '';
    });

    // Settings changes
    this.elements.settingTheme?.addEventListener('change', e => {
      this.applyTheme(e.target.value);
    });

    this.elements.settingFontSize?.addEventListener('change', e => {
      this.applyFontSize(e.target.value);
    });

    this.elements.settingAnimations?.addEventListener('change', e => {
      this.applyAnimations(e.target.checked);
    });

    this.elements.settingHighContrast?.addEventListener('change', e => {
      this.applyHighContrast(e.target.checked);
    });

    this.elements.settingReduceMotion?.addEventListener('change', e => {
      this.applyReduceMotion(e.target.checked);
    });

    // Footer buttons
    document.getElementById('btn-journal-footer')?.addEventListener('click', () => {
      // TODO: Show journal history modal
      this.showNotification(i18n.t('messages.error'), 'info');
    });

    document.getElementById('btn-quests-footer')?.addEventListener('click', () => {
      // TODO: Show quests modal
      this.showNotification(i18n.t('messages.error'), 'info');
    });

    document.getElementById('btn-achievements-footer')?.addEventListener('click', () => {
      // TODO: Show achievements modal
      this.showNotification(i18n.t('messages.error'), 'info');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        const modalId = e.target.getAttribute('data-close-modal');
        if (modalId) {
          this.closeModal(modalId);
        }
      });
    });

    // Close modals on close button
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', e => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Keyboard accessibility (ESC to close modal)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[aria-hidden="false"]');
        if (openModal) {
          this.closeModal(openModal.id);
        }
      }
    });
  }

  /**
   * Initialise les modales
   */
  initModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      this.modals[modal.id] = {
        element: modal,
        isOpen: false
      };
    });
  }

  /**
   * Affiche un écran
   * @param {string} screenId - ID de l'écran
   */
  showScreen(screenId) {
    // Cacher tous les écrans
    [this.elements.loadingScreen, this.elements.welcomeScreen, this.elements.gameScreen]
      .forEach(screen => {
        if (screen) screen.style.display = 'none';
      });

    // Afficher l'écran demandé
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.display = 'flex';
      screen.classList.add('fade-in');
      this.currentScreen = screenId;
      logger.log(`Showing screen: ${screenId}`);
    }
  }

  /**
   * Affiche l'écran de bienvenue avec info de sauvegarde
   * @param {Object} saveInfo - Info sur la sauvegarde (optionnel)
   */
  showWelcomeScreen(saveInfo = null) {
    this.showScreen('welcome-screen');

    if (saveInfo) {
      this.elements.btnContinue.style.display = 'flex';
      const saveInfoEl = document.getElementById('save-info');
      if (saveInfoEl) {
        saveInfoEl.textContent = i18n.t('messages.saveInfo', {
          day: saveInfo.day,
          balance: saveInfo.globalBalance
        });
        saveInfoEl.style.display = 'block';
      }
    } else {
      this.elements.btnContinue.style.display = 'none';
    }
  }

  /**
   * Affiche l'écran de jeu
   */
  showGameScreen() {
    this.showScreen('game-screen');
  }

  /**
   * Met à jour l'affichage du jour
   * @param {number} day - Numéro du jour
   */
  updateDay(day) {
    if (this.elements.dayNumber) {
      this.elements.dayNumber.textContent = day;
    }
  }

  /**
   * Met à jour l'affichage de la phase
   * @param {string} phaseName - Nom de la phase
   */
  updatePhase(phaseName) {
    if (this.elements.phaseIndicator) {
      this.elements.phaseIndicator.textContent = i18n.t(`phases.${phaseName}`);
    }

    // Appliquer data-phase au body pour thèmes
    document.body.setAttribute('data-phase', phaseName);
  }

  /**
   * Met à jour les barres de stats
   * @param {Object} stats - Objet des stats {energie, mental, emotionnel, spiritualite}
   */
  updateStats(stats) {
    for (const [statName, value] of Object.entries(stats)) {
      const statBar = this.elements.statsContainer?.querySelector(`[data-stat="${statName}"]`);

      if (statBar) {
        const valueEl = statBar.querySelector('.stat-value');
        const fillEl = statBar.querySelector('.stat-fill');
        const progressBar = statBar.querySelector('.stat-progress');

        if (valueEl) {
          valueEl.textContent = Math.round(value);
        }

        if (fillEl) {
          fillEl.style.width = `${value}%`;

          // Ajouter niveau pour styling
          fillEl.removeAttribute('data-level');
          if (value < 25) {
            fillEl.setAttribute('data-level', 'critical');
          } else if (value < 50) {
            fillEl.setAttribute('data-level', 'low');
          }
        }

        if (progressBar) {
          progressBar.setAttribute('aria-valuenow', Math.round(value));
        }
      }
    }
  }

  /**
   * Met à jour l'équilibre global
   * @param {number} balance - Valeur de l'équilibre (0-100)
   */
  updateGlobalBalance(balance) {
    if (this.elements.globalBalanceValue) {
      this.elements.globalBalanceValue.textContent = `${Math.round(balance)}%`;
    }
  }

  /**
   * Affiche un événement
   * @param {Object} event - Objet événement
   */
  displayEvent(event) {
    if (!event) return;

    const text = getLocalizedText(event.text, i18n.getCurrentLocale());

    // Fade out puis fade in
    this.fadeOut(this.elements.eventText, () => {
      this.elements.eventText.innerHTML = sanitizeHTML(text);
      this.fadeIn(this.elements.eventText);
    });

    // Annoncer aux screen readers
    this.announceToScreenReader(text);
  }

  /**
   * Affiche les choix
   * @param {Array} choices - Tableau des choix
   * @param {Function} onSelect - Callback quand un choix est sélectionné
   */
  displayChoices(choices, onSelect) {
    if (!choices || !this.elements.choicesContainer) return;

    // Vider les choix précédents
    this.elements.choicesContainer.innerHTML = '';

    // Créer les boutons de choix
    choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index, onSelect);
      this.elements.choicesContainer.appendChild(button);
    });
  }

  /**
   * Crée un bouton de choix
   * @param {Object} choice - Objet choix
   * @param {number} index - Index du choix
   * @param {Function} onSelect - Callback de sélection
   * @returns {HTMLElement} Bouton créé
   */
  createChoiceButton(choice, index, onSelect) {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = getLocalizedText(choice.label, i18n.getCurrentLocale());
    button.dataset.index = index;

    button.addEventListener('click', () => {
      // Désactiver tous les boutons pour éviter double-click
      this.elements.choicesContainer.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
      });

      onSelect(index);
    });

    return button;
  }

  /**
   * Affiche le prompt de journal
   * @param {Function} onSubmit - Callback quand le journal est soumis
   */
  showJournalPrompt(onSubmit) {
    this.openModal('journal-modal');

    // Stocker le callback
    this._journalCallback = onSubmit;

    // Re-attacher les listeners avec le nouveau callback
    const submitHandler = () => {
      const entry = this.elements.journalTextarea.value;
      onSubmit(entry);
      this.closeModal('journal-modal');
      this.elements.journalTextarea.value = '';
    };

    const skipHandler = () => {
      onSubmit('');
      this.closeModal('journal-modal');
      this.elements.journalTextarea.value = '';
    };

    // Remove old listeners et ajouter nouveaux
    const newSubmitBtn = this.elements.btnSubmitJournal.cloneNode(true);
    const newSkipBtn = this.elements.btnSkipJournal.cloneNode(true);

    this.elements.btnSubmitJournal.replaceWith(newSubmitBtn);
    this.elements.btnSkipJournal.replaceWith(newSkipBtn);

    this.elements.btnSubmitJournal = newSubmitBtn;
    this.elements.btnSkipJournal = newSkipBtn;

    newSubmitBtn.addEventListener('click', submitHandler);
    newSkipBtn.addEventListener('click', skipHandler);
  }

  /**
   * Affiche une notification toast
   * @param {string} message - Message à afficher
   * @param {string} type - Type (success, error, warning, info)
   * @param {number} duration - Durée en ms (défaut: 3000)
   */
  showNotification(message, type = 'info', duration = config.UI.NOTIFICATION_DURATION) {
    if (!this.elements.notifications) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = {
      success: '',
      error: '',
      warning: ' ',
      info: '9'
    };

    notification.innerHTML = `
      <span class="notification-icon">${icons[type] || icons.info}</span>
      <span class="notification-text">${sanitizeHTML(message)}</span>
    `;

    this.elements.notifications.appendChild(notification);

    // Auto-remove après duration
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);

    // Annoncer aux screen readers
    this.announceToScreenReader(message);
  }

  /**
   * Ouvre une modale
   * @param {string} modalId - ID de la modale
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    // Focus sur premier élément focusable
    const focusable = modal.querySelector('button, input, textarea, select');
    if (focusable) {
      setTimeout(() => focusable.focus(), 100);
    }

    this.modals[modalId].isOpen = true;
    logger.log(`Modal opened: ${modalId}`);
  }

  /**
   * Ferme une modale
   * @param {string} modalId - ID de la modale
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.setAttribute('aria-hidden', 'true');

    // Attendre la fin de l'animation avant de cacher
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);

    this.modals[modalId].isOpen = false;
    logger.log(`Modal closed: ${modalId}`);
  }

  /**
   * Applique un thème
   * @param {string} theme - Nom du thème (light, dark, auto)
   */
  applyTheme(theme) {
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '');

    document.body.classList.add(`theme-${theme}`);

    localStorage.setItem('theme', theme);
    logger.log(`Theme applied: ${theme}`);
  }

  /**
   * Applique une taille de police
   * @param {string} size - Taille (small, medium, large, xlarge)
   */
  applyFontSize(size) {
    document.body.className = document.body.className
      .replace(/font-\w+/g, '');

    document.body.classList.add(`font-${size}`);

    localStorage.setItem('fontSize', size);
    logger.log(`Font size applied: ${size}`);
  }

  /**
   * Active/désactive les animations
   * @param {boolean} enabled - Activer ou non
   */
  applyAnimations(enabled) {
    if (enabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }

    localStorage.setItem('animationsEnabled', enabled);
    logger.log(`Animations ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Active/désactive le contraste élevé
   * @param {boolean} enabled - Activer ou non
   */
  applyHighContrast(enabled) {
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    localStorage.setItem('highContrast', enabled);
    logger.log(`High contrast ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Active/désactive la réduction de mouvement
   * @param {boolean} enabled - Activer ou non
   */
  applyReduceMotion(enabled) {
    if (enabled) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    localStorage.setItem('reduceMotion', enabled);
    logger.log(`Reduce motion ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Charge et applique les paramètres sauvegardés
   * @param {Object} settings - Objet des paramètres
   */
  loadSettings(settings) {
    if (settings.theme) {
      this.applyTheme(settings.theme);
      if (this.elements.settingTheme) {
        this.elements.settingTheme.value = settings.theme;
      }
    }

    if (settings.fontSize) {
      this.applyFontSize(settings.fontSize);
      if (this.elements.settingFontSize) {
        this.elements.settingFontSize.value = settings.fontSize;
      }
    }

    if (settings.animationsEnabled !== undefined) {
      this.applyAnimations(settings.animationsEnabled);
      if (this.elements.settingAnimations) {
        this.elements.settingAnimations.checked = settings.animationsEnabled;
      }
    }

    if (settings.highContrast !== undefined) {
      this.applyHighContrast(settings.highContrast);
      if (this.elements.settingHighContrast) {
        this.elements.settingHighContrast.checked = settings.highContrast;
      }
    }

    if (settings.reduceMotion !== undefined) {
      this.applyReduceMotion(settings.reduceMotion);
      if (this.elements.settingReduceMotion) {
        this.elements.settingReduceMotion.checked = settings.reduceMotion;
      }
    }

    logger.log('Settings loaded and applied');
  }

  /**
   * Annonce un message aux lecteurs d'écran
   * @param {string} message - Message à annoncer
   */
  announceToScreenReader(message) {
    if (this.elements.srAnnouncements) {
      this.elements.srAnnouncements.textContent = message;

      // Clear après 1 seconde
      setTimeout(() => {
        this.elements.srAnnouncements.textContent = '';
      }, 1000);
    }
  }

  /**
   * Fade out un élément
   * @param {HTMLElement} element - Élément à fade out
   * @param {Function} callback - Callback après fade out
   * @param {number} duration - Durée en ms
   */
  fadeOut(element, callback, duration = config.UI.ANIMATION_DURATION) {
    if (!element) return;

    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '0';

    setTimeout(() => {
      if (callback) callback();
    }, duration);
  }

  /**
   * Fade in un élément
   * @param {HTMLElement} element - Élément à fade in
   * @param {number} duration - Durée en ms
   */
  fadeIn(element, duration = config.UI.ANIMATION_DURATION) {
    if (!element) return;

    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '1';
  }

  /**
   * Émet un événement UI
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  emit(eventName, data = {}) {
    window.dispatchEvent(
      new CustomEvent(`ui:${eventName}`, { detail: data })
    );
    logger.log(`UI event emitted: ${eventName}`, data);
  }

  /**
   * S'abonne à un événement UI
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(eventName, callback) {
    window.addEventListener(`ui:${eventName}`, e => {
      callback(e.detail);
    });
  }
}
