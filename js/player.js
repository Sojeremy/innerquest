/**
 * Player - InnerQuest
 * Gestion de l'état du joueur et de sa progression
 */

import config from './config.js';
import { clamp } from './utils.js';

export default class Player {
  constructor() {
    // Stats principales (0-100)
    this.stats = { ...config.GAME.INITIAL_STATS };

    // Progression
    this.day = 1;
    this.phase = 0; // Index de la phase narrative actuelle

    // Historique des choix
    this.history = []; // {day, eventId, choiceIndex, effects}

    // Journal intime
    this.journal = []; // {day, text, timestamp}

    // Quêtes
    this.activeQuests = [];
    this.completedQuests = [];

    // Achievements
    this.achievements = [];

    // Métadonnées
    this.startDate = Date.now();
    this.lastPlayDate = Date.now();
    this.totalPlaytime = 0; // en secondes
  }

  /**
   * Calcule l'indice d'équilibre global (moyenne des 4 stats)
   * @returns {number} Indice entre 0 et 100
   */
  getGlobalBalance() {
    const { energie, mental, emotionnel, spiritualite } = this.stats;
    return (energie + mental + emotionnel + spiritualite) / 4;
  }

  /**
   * Met à jour une stat spécifique (avec clamping)
   * @param {string} statName - Nom de la stat
   * @param {number} delta - Modification (peut être positive ou négative)
   */
  updateStat(statName, delta) {
    if (this.stats.hasOwnProperty(statName)) {
      this.stats[statName] = clamp(
        this.stats[statName] + delta,
        config.GAME.STAT_MIN,
        config.GAME.STAT_MAX
      );
    }
  }

  /**
   * Applique les effets d'un choix
   * @param {Object} effects - Objet {stat: delta}
   */
  applyEffects(effects) {
    for (const [stat, delta] of Object.entries(effects)) {
      this.updateStat(stat, delta);
    }
  }

  /**
   * Passe au jour suivant
   */
  nextDay() {
    this.day++;
    this.updatePhase();
    this.lastPlayDate = Date.now();

    // Limiter taille historique pour éviter surcharge mémoire
    if (this.history.length > config.GAME.MAX_HISTORY_LENGTH) {
      this.history = this.history.slice(-config.GAME.MAX_HISTORY_LENGTH);
    }
  }

  /**
   * Met à jour la phase narrative selon le jour
   */
  updatePhase() {
    const currentPhase = config.GAME.PHASES.find(
      phase => this.day >= phase.minDay && this.day <= phase.maxDay
    );

    if (currentPhase) {
      this.phase = currentPhase.id;
    }
  }

  /**
   * Récupère le nom de la phase actuelle
   * @returns {string} Nom de la phase
   */
  getPhaseName() {
    const phase = config.GAME.PHASES.find(p => p.id === this.phase);
    return phase ? phase.name : 'awakening';
  }

  /**
   * Ajoute une entrée de journal
   * @param {string} text - Texte de l'entrée
   */
  addJournalEntry(text) {
    this.journal.push({
      day: this.day,
      text,
      timestamp: Date.now()
    });
  }

  /**
   * Enregistre un choix dans l'historique
   * @param {string} eventId - ID de l'événement
   * @param {number} choiceIndex - Index du choix
   * @param {Object} effects - Effets appliqués
   */
  recordChoice(eventId, choiceIndex, effects) {
    this.history.push({
      day: this.day,
      eventId,
      choiceIndex,
      effects,
      timestamp: Date.now()
    });
  }

  /**
   * Ajoute une quête active
   * @param {Object} quest - Objet quête
   */
  addQuest(quest) {
    if (!this.activeQuests.find(q => q.id === quest.id)) {
      this.activeQuests.push({
        id: quest.id,
        progress: 0,
        startedAt: this.day
      });
    }
  }

  /**
   * Met à jour la progression d'une quête
   * @param {string} questId - ID de la quête
   * @param {number} progress - Nouvelle progression (0-100)
   */
  updateQuestProgress(questId, progress) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (quest) {
      quest.progress = clamp(progress, 0, 100);

      // Si complétée, la déplacer vers completedQuests
      if (quest.progress >= 100) {
        this.completeQuest(questId);
      }
    }
  }

  /**
   * Marque une quête comme complétée
   * @param {string} questId - ID de la quête
   */
  completeQuest(questId) {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
      const quest = this.activeQuests[questIndex];
      this.completedQuests.push({
        ...quest,
        completedAt: this.day
      });
      this.activeQuests.splice(questIndex, 1);

      // Émettre événement
      window.dispatchEvent(
        new CustomEvent('player:quest-completed', {
          detail: { questId }
        })
      );
    }
  }

  /**
   * Débloque un achievement
   * @param {string} achievementId - ID de l'achievement
   */
  unlockAchievement(achievementId) {
    if (!this.achievements.includes(achievementId)) {
      this.achievements.push(achievementId);

      // Émettre événement
      window.dispatchEvent(
        new CustomEvent('player:achievement-unlocked', {
          detail: { achievementId }
        })
      );
    }
  }

  /**
   * Vérifie si un achievement est débloqué
   * @param {string} achievementId - ID de l'achievement
   * @returns {boolean} True si débloqué
   */
  hasAchievement(achievementId) {
    return this.achievements.includes(achievementId);
  }

  /**
   * Met à jour le temps de jeu
   * @param {number} seconds - Secondes à ajouter
   */
  updatePlaytime(seconds) {
    this.totalPlaytime += seconds;
  }

  /**
   * Obtient des statistiques de jeu
   * @returns {Object} Objet de statistiques
   */
  getStats() {
    return {
      day: this.day,
      phase: this.getPhaseName(),
      globalBalance: this.getGlobalBalance(),
      stats: { ...this.stats },
      totalChoices: this.history.length,
      journalEntries: this.journal.length,
      activeQuests: this.activeQuests.length,
      completedQuests: this.completedQuests.length,
      achievements: this.achievements.length,
      totalPlaytime: this.totalPlaytime,
      startDate: this.startDate,
      lastPlayDate: this.lastPlayDate
    };
  }

  /**
   * Sérialise le joueur en JSON
   * @returns {string} JSON string
   */
  serialize() {
    return JSON.stringify({
      stats: this.stats,
      day: this.day,
      phase: this.phase,
      history: this.history,
      journal: this.journal,
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
      achievements: this.achievements,
      startDate: this.startDate,
      lastPlayDate: this.lastPlayDate,
      totalPlaytime: this.totalPlaytime
    });
  }

  /**
   * Désérialise un JSON en objet Player
   * @param {string} json - JSON string
   * @returns {Player} Instance de Player
   */
  static deserialize(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const player = new Player();

    // Restaurer toutes les propriétés
    Object.assign(player, data);

    return player;
  }

  /**
   * Réinitialise le joueur (nouveau jeu)
   */
  reset() {
    Object.assign(this, new Player());
  }
}
