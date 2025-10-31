/**
 * Main - InnerQuest
 * Point d'entrée et initialisation complète de l'application
 */

import config from './config.js';
import Game from './game.js';
import UI from './ui.js';
import Storage from './storage.js';
import i18n from './i18n.js';
import { logger, errorHandler } from './utils.js';

/**
 * Application InnerQuest
 */
class InnerQuest {
  constructor() {
    this.game = null;
    this.ui = null;
    this.storage = null;
    this.initialized = false;
  }

  /**
   * Initialise l'application
   */
  async init() {
    try {
      logger.log('=== InnerQuest Initialization Started ===');

      // 1. Créer les instances
      this.game = new Game();
      this.ui = new UI();
      this.storage = new Storage();

      // 2. Détecter et charger la locale préférée
      const userLocale = i18n.detectUserLocale();
      await i18n.init(userLocale);

      // 3. Initialiser UI
      this.ui.init();

      // 4. Charger et appliquer les paramètres
      const settings = this.storage.getSettings();
      this.ui.loadSettings(settings);

      // 5. Initialiser le moteur de jeu
      const gameInitialized = await this.game.init();

      if (!gameInitialized) {
        throw new Error('Game engine failed to initialize');
      }

      // 6. Attacher les event listeners entre modules
      this.attachEventListeners();

      // 7. Vérifier si sauvegarde existe
      const saveInfo = this.storage.getSaveInfo();

      if (saveInfo) {
        this.ui.showWelcomeScreen(saveInfo);
      } else {
        this.ui.showWelcomeScreen();
      }

      // 8. Setup cleanup avant fermeture de page
      this.setupBeforeUnload();

      this.initialized = true;
      logger.log('=== InnerQuest Initialization Complete ===');

      // Annoncer succès
      this.ui.announceToScreenReader(i18n.t('game.welcome'));

    } catch (error) {
      errorHandler.critical('Application initialization failed', error);
      this.showCriticalError(error);
    }
  }

  /**
   * Attache les event listeners entre les modules
   */
  attachEventListeners() {
    // ========== UI Events  Game Actions ==========

    // Nouveau jeu
    this.ui.on('new-game', () => {
      this.startNewGame();
    });

    // Continuer
    this.ui.on('continue-game', () => {
      this.continueGame();
    });

    // Sauvegarder
    this.ui.on('save-game', () => {
      const success = this.game.save();
      if (success) {
        this.ui.showNotification(i18n.t('messages.gameSaved'), 'success');
      } else {
        this.ui.showNotification(i18n.t('messages.error'), 'error');
      }
    });

    // Exporter sauvegarde
    this.ui.on('export-save', () => {
      if (this.game.player) {
        const success = this.storage.exportSave(this.game.player);
        if (success) {
          this.ui.showNotification(i18n.t('messages.exportSuccess'), 'success');
        } else {
          this.ui.showNotification(i18n.t('messages.error'), 'error');
        }
      }
    });

    // Importer sauvegarde
    this.ui.on('import-save', async data => {
      try {
        const saveData = await this.storage.importSave(data.file);
        if (saveData) {
          this.game.restoreGame(saveData);
          this.ui.showGameScreen();
          this.ui.showNotification(i18n.t('messages.importSuccess'), 'success');
        }
      } catch (error) {
        errorHandler.handle('Import failed', error);
        this.ui.showNotification(i18n.t('messages.error'), 'error');
      }
    });

    // Redémarrer
    this.ui.on('restart-game', () => {
      this.game.restart(true);
    });

    // Journal soumis
    this.ui.on('journal-submit', data => {
      this.game.submitJournal(data.entry);
    });

    // ========== Game Events  UI Updates ==========

    // Nouveau jeu démarré
    this.game.on('new-game', data => {
      this.ui.showGameScreen();
      this.ui.updateDay(data.player.day);
      this.ui.updatePhase(data.player.getPhaseName());
      this.ui.updateStats(data.player.stats);
      this.ui.updateGlobalBalance(data.player.getGlobalBalance());
    });

    // Partie restaurée
    this.game.on('game-restored', data => {
      this.ui.showGameScreen();
      this.ui.updateDay(data.player.day);
      this.ui.updatePhase(data.player.getPhaseName());
      this.ui.updateStats(data.player.stats);
      this.ui.updateGlobalBalance(data.player.getGlobalBalance());
    });

    // Jour commence
    this.game.on('day:start', data => {
      this.ui.updateDay(data.day);
      this.ui.updatePhase(data.phase);
    });

    // Afficher événement
    this.game.on('event:display', data => {
      this.ui.displayEvent(data.event);
      this.ui.displayChoices(data.event.choices, index => {
        this.game.selectChoice(index);
      });
    });

    // Choix effectué
    this.game.on('choice:made', data => {
      this.ui.updateStats(data.newStats);
      this.ui.updateGlobalBalance(data.globalBalance);

      // Annoncer le changement aux screen readers
      this.ui.announceToScreenReader(
        `${i18n.t('stats.balance')}: ${Math.round(data.globalBalance)}%`
      );
    });

    // Jour se termine
    this.game.on('day:end', data => {
      this.ui.showJournalPrompt(entry => {
        this.game.submitJournal(entry);
      });
    });

    // Journal soumis (depuis game)
    this.game.on('journal:submitted', data => {
      // Transition visuelle optionnelle
      logger.log(`New day starting: ${data.newDay}`);
    });

    // Partie sauvegardée
    this.game.on('saved', () => {
      // Notification déjà affichée si manuelle
      logger.log('Game saved');
    });

    // Jeu redémarré
    this.game.on('restarted', () => {
      this.ui.showWelcomeScreen();
    });

    // Quête complétée
    this.game.on('quest-completed', data => {
      this.ui.showNotification(
        `${i18n.t('messages.questCompleted')} <¯`,
        'success',
        4000
      );
    });

    // Achievement débloqué
    this.game.on('achievement-unlocked', data => {
      this.ui.showNotification(
        `${i18n.t('messages.achievementUnlocked')} <Æ`,
        'success',
        4000
      );
    });

    // Erreurs
    window.addEventListener('app:error', e => {
      logger.error('Application error:', e.detail);
    });

    window.addEventListener('app:critical-error', e => {
      this.showCriticalError(e.detail.error);
    });

    // Changement de locale
    i18n.on('localeChanged', data => {
      logger.log(`Locale changed to: ${data.locale}`);

      // Sauvegarder la préférence
      const settings = this.storage.getSettings();
      settings.locale = data.locale;
      this.storage.saveSettings(settings);
    });
  }

  /**
   * Démarre un nouveau jeu
   */
  startNewGame() {
    logger.log('Starting new game...');

    // Confirmation si une sauvegarde existe
    if (this.storage.hasSave()) {
      const confirmed = confirm(i18n.t('settings.resetConfirm'));
      if (!confirmed) {
        return;
      }
    }

    // Démarrer nouveau jeu
    this.game.newGame();
  }

  /**
   * Continue une partie sauvegardée
   */
  continueGame() {
    logger.log('Continuing saved game...');

    const saveData = this.storage.load();

    if (!saveData) {
      this.ui.showNotification(i18n.t('messages.noSaveFound'), 'warning');
      return;
    }

    const success = this.game.restoreGame(saveData);

    if (!success) {
      this.ui.showNotification(i18n.t('messages.error'), 'error');
    }
  }

  /**
   * Affiche un écran d'erreur critique
   * @param {Error} error - Erreur
   */
  showCriticalError(error) {
    const errorScreen = document.createElement('div');
    errorScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #E63946 0%, #C5303E 100%);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 2rem;
      text-align: center;
    `;

    errorScreen.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">=</h1>
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Une erreur critique est survenue</h2>
      <p style="max-width: 600px; margin-bottom: 2rem; opacity: 0.9;">
        InnerQuest a rencontré un problème et ne peut pas continuer.
        Une sauvegarde de secours a été créée.
      </p>
      <button onclick="location.reload()" style="
        padding: 1rem 2rem;
        font-size: 1rem;
        background: white;
        color: #E63946;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">
        Recharger la page
      </button>
      <details style="margin-top: 2rem; max-width: 600px; text-align: left;">
        <summary style="cursor: pointer; margin-bottom: 0.5rem;">Détails techniques</summary>
        <pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; overflow: auto; font-size: 0.875rem;">
${error?.stack || error?.message || 'Unknown error'}
        </pre>
      </details>
    `;

    document.body.appendChild(errorScreen);
  }

  /**
   * Setup cleanup avant fermeture de page
   */
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.game) {
        this.game.cleanup();
      }

      logger.log('Application cleanup complete');
    });
  }
}

// ========== Initialisation au chargement du DOM ==========

document.addEventListener('DOMContentLoaded', async () => {
  logger.log('DOM Content Loaded');

  // Créer instance globale
  const app = new InnerQuest();

  // Rendre accessible globalement pour debug
  if (config.DEBUG) {
    window.innerQuest = app;
    window.i18n = i18n;
    logger.log('Debug mode: app accessible via window.innerQuest');
  }

  // Initialiser l'app
  await app.init();
});

// ========== Service Worker Registration (PWA) ==========

if ('serviceWorker' in navigator && !config.DEBUG) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        logger.log('Service Worker registered:', registration);
      })
      .catch(error => {
        logger.warn('Service Worker registration failed:', error);
      });
  });
}

// ========== Export pour tests ==========

export { InnerQuest };
