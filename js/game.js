/**
 * Game - InnerQuest
 * Moteur de jeu principal et orchestration du game loop
 */

import config from './config.js';
import Player from './player.js';
import EventSystem from './events.js';
import Storage from './storage.js';
import { errorHandler, logger, debounce } from './utils.js';

export default class Game {
  constructor() {
    this.player = null;
    this.currentEvent = null;
    this.isPaused = false;
    this.isInitialized = false;

    // Systèmes
    this.eventSystem = new EventSystem();
    this.storage = new Storage();

    // Auto-save debouncé
    this.debouncedAutoSave = debounce(() => {
      if (this.player) {
        this.storage.save(this.player);
        logger.log('Auto-saved');
      }
    }, 2000);

    // Tracking temps de jeu
    this.sessionStartTime = Date.now();
    this.playtimeInterval = null;
  }

  /**
   * Initialise le jeu
   * @returns {Promise<boolean>} True si succès
   */
  async init() {
    try {
      logger.log('Initializing game...');

      // Charger les événements
      const eventsLoaded = await this.eventSystem.load();

      if (!eventsLoaded) {
        throw new Error('Failed to load events');
      }

      // Démarrer tracking du temps de jeu
      this.startPlaytimeTracking();

      this.isInitialized = true;
      logger.log('Game initialized successfully');

      // Émettre événement
      this.emit('initialized');

      return true;
    } catch (error) {
      errorHandler.critical('Game initialization failed', error);
      return false;
    }
  }

  /**
   * Démarre une nouvelle partie
   */
  newGame() {
    logger.log('Starting new game');

    this.player = new Player();
    this.currentEvent = null;

    // Sauvegarder immédiatement
    this.storage.save(this.player);

    // Émettre événement
    this.emit('new-game', { player: this.player });

    // Démarrer la première journée
    this.startDay();
  }

  /**
   * Restaure une partie sauvegardée
   * @param {string} saveData - Données JSON du joueur
   * @returns {boolean} True si succès
   */
  restoreGame(saveData) {
    try {
      logger.log('Restoring saved game');

      this.player = Player.deserialize(saveData);

      // Émettre événement
      this.emit('game-restored', { player: this.player });

      // Démarrer la journée en cours
      this.startDay();

      return true;
    } catch (error) {
      errorHandler.handle('Failed to restore game', error);
      return false;
    }
  }

  /**
   * Démarre une nouvelle journée
   */
  async startDay() {
    if (!this.player) {
      errorHandler.handle('Cannot start day: no player');
      return;
    }

    logger.log(`Starting day ${this.player.day}`);

    // Émettre événement de début de journée
    this.emit('day:start', {
      day: this.player.day,
      phase: this.player.getPhaseName()
    });

    // Obtenir un événement aléatoire basé sur le contexte du joueur
    this.currentEvent = this.eventSystem.getRandomEvent({
      day: this.player.day,
      phase: this.player.phase,
      balance: this.player.getGlobalBalance(),
      stats: this.player.stats,
      history: this.player.history,
      completedQuests: this.player.completedQuests,
      achievements: this.player.achievements
    });

    if (!this.currentEvent) {
      errorHandler.critical('No event returned');
      return;
    }

    // Émettre événement avec le nouvel événement narratif
    this.emit('event:display', { event: this.currentEvent });
  }

  /**
   * Le joueur sélectionne un choix
   * @param {number} choiceIndex - Index du choix dans currentEvent.choices
   */
  selectChoice(choiceIndex) {
    if (!this.currentEvent || !this.player) {
      errorHandler.handle('Cannot select choice: no event or player');
      return;
    }

    const choice = this.currentEvent.choices[choiceIndex];

    if (!choice) {
      errorHandler.handle(`Invalid choice index: ${choiceIndex}`);
      return;
    }

    logger.log(`Choice selected: ${choiceIndex}`, choice);

    // 1. Appliquer les effets sur les stats
    this.player.applyEffects(choice.effects);

    // 2. Enregistrer le choix dans l'historique
    this.player.recordChoice(this.currentEvent.id, choiceIndex, choice.effects);

    // 3. Émettre événement avec résultat du choix
    this.emit('choice:made', {
      event: this.currentEvent,
      choice,
      choiceIndex,
      newStats: this.player.stats,
      globalBalance: this.player.getGlobalBalance()
    });

    // 4. Auto-save
    this.debouncedAutoSave();

    // 5. Vérifier quêtes et achievements (futur)
    // this.checkQuestsProgress();
    // this.checkAchievements();

    // 6. Terminer la journée après un délai (pour animations)
    setTimeout(() => {
      this.endDay();
    }, 500);
  }

  /**
   * Termine la journée et demande entrée de journal
   */
  endDay() {
    logger.log(`Ending day ${this.player.day}`);

    // Émettre événement pour afficher prompt journal
    this.emit('day:end', {
      day: this.player.day,
      stats: this.player.stats,
      globalBalance: this.player.getGlobalBalance()
    });
  }

  /**
   * Le joueur soumet son entrée de journal et passe au jour suivant
   * @param {string} journalEntry - Texte du journal (peut être vide)
   */
  submitJournal(journalEntry = '') {
    if (!this.player) return;

    // Ajouter entrée si non vide
    if (journalEntry.trim()) {
      this.player.addJournalEntry(journalEntry.trim());
    }

    // Passer au jour suivant
    this.player.nextDay();

    // Sauvegarder
    this.storage.save(this.player);

    // Émettre événement
    this.emit('journal:submitted', {
      entry: journalEntry,
      newDay: this.player.day
    });

    // Démarrer la nouvelle journée après un délai (pour transition)
    setTimeout(() => {
      this.startDay();
    }, 1000);
  }

  /**
   * Met en pause le jeu
   */
  pause() {
    this.isPaused = true;
    this.emit('paused');
    logger.log('Game paused');
  }

  /**
   * Reprend le jeu
   */
  resume() {
    this.isPaused = false;
    this.emit('resumed');
    logger.log('Game resumed');
  }

  /**
   * Sauvegarde manuelle
   * @returns {boolean} True si succès
   */
  save() {
    if (!this.player) return false;

    const success = this.storage.save(this.player);

    if (success) {
      this.emit('saved');
    }

    return success;
  }

  /**
   * Charge une sauvegarde
   * @returns {boolean} True si succès
   */
  load() {
    const saveData = this.storage.load();

    if (!saveData) {
      return false;
    }

    return this.restoreGame(saveData);
  }

  /**
   * Redémarre le jeu (réinitialisation complète)
   * @param {boolean} confirm - Confirmation de reset
   * @returns {boolean} True si succès
   */
  restart(confirm = false) {
    if (!confirm) {
      logger.warn('Restart called without confirmation');
      return false;
    }

    logger.log('Restarting game');

    // Sauvegarder backup avant de supprimer
    this.storage.createBackup();

    // Supprimer la sauvegarde
    this.storage.deleteSave();

    // Démarrer nouveau jeu
    this.newGame();

    this.emit('restarted');

    return true;
  }

  /**
   * Obtient les statistiques de jeu
   * @returns {Object} Statistiques
   */
  getGameStats() {
    if (!this.player) return null;

    return {
      ...this.player.getStats(),
      currentEvent: this.currentEvent?.id,
      eventStatistics: this.eventSystem.getStatistics()
    };
  }

  /**
   * Démarre le tracking du temps de jeu
   */
  startPlaytimeTracking() {
    this.sessionStartTime = Date.now();

    // Mettre à jour toutes les minutes
    this.playtimeInterval = setInterval(() => {
      if (this.player && !this.isPaused) {
        this.player.updatePlaytime(60); // +60 secondes
      }
    }, 60000);
  }

  /**
   * Arrête le tracking du temps de jeu
   */
  stopPlaytimeTracking() {
    if (this.playtimeInterval) {
      clearInterval(this.playtimeInterval);
      this.playtimeInterval = null;
    }

    // Mettre à jour le temps de jeu final
    if (this.player) {
      const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      this.player.updatePlaytime(sessionDuration);
    }
  }

  /**
   * Vérifie les conditions de fin de jeu (optionnel)
   * @returns {boolean} True si le jeu doit se terminer
   */
  checkEndGameConditions() {
    if (!this.player) return false;

    const { maxDays, allQuestsCompleted } = config.GAME.END_GAME_CONDITIONS;

    // Condition 1: Nombre de jours maximum atteint
    if (maxDays && this.player.day >= maxDays) {
      this.emit('game:end', { reason: 'max-days' });
      return true;
    }

    // Condition 2: Toutes les quêtes complétées (si activé)
    if (allQuestsCompleted && this.player.completedQuests.length > 0) {
      // À implémenter : vérifier si TOUTES les quêtes disponibles sont complétées
    }

    return false;
  }

  /**
   * Système d'événements personnalisé
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  emit(eventName, data = {}) {
    const event = new CustomEvent(`game:${eventName}`, {
      detail: data
    });

    window.dispatchEvent(event);
    logger.log(`Event emitted: game:${eventName}`, data);
  }

  /**
   * S'abonner à un événement de jeu
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(eventName, callback) {
    window.addEventListener(`game:${eventName}`, e => {
      callback(e.detail);
    });
  }

  /**
   * Se désabonner d'un événement
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  off(eventName, callback) {
    window.removeEventListener(`game:${eventName}`, callback);
  }

  /**
   * Nettoie les ressources (appelé avant fermeture)
   */
  cleanup() {
    logger.log('Cleaning up game resources');

    // Arrêter tracking temps de jeu
    this.stopPlaytimeTracking();

    // Sauvegarder une dernière fois
    if (this.player) {
      this.storage.save(this.player);
    }

    // Émettre événement
    this.emit('cleanup');
  }
}

// Auto-cleanup avant fermeture de page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Note: game instance doit être accessible globalement pour cela
    // Sera géré dans main.js
  });
}
