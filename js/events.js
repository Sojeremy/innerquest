/**
 * Events - InnerQuest
 * Syst�me de gestion des �v�nements narratifs
 */

import config from './config.js';
import { randomChoice, getLocalizedText, validateType, errorHandler, logger } from './utils.js';

export default class EventSystem {
  constructor() {
    this.events = [];
    this.loaded = false;
  }

  /**
   * Charge les �v�nements depuis le fichier JSON
   * @returns {Promise<boolean>} True si succ�s
   */
  async load() {
    try {
      const response = await fetch(config.PATHS.EVENTS);

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      this.events = await response.json();
      this.validateEvents();
      this.loaded = true;

      logger.log(`Loaded ${this.events.length} events`);
      return true;
    } catch (error) {
      errorHandler.critical('Failed to load events', error);
      return false;
    }
  }

  /**
   * Valide la structure de tous les �v�nements
   * @throws {Error} Si un �v�nement est invalide
   */
  validateEvents() {
    this.events.forEach((event, index) => {
      if (!event.id) {
        throw new Error(`Event at index ${index} missing 'id'`);
      }

      if (!event.text) {
        throw new Error(`Event ${event.id} missing 'text'`);
      }

      if (!Array.isArray(event.choices) || event.choices.length === 0) {
        throw new Error(`Event ${event.id} missing valid 'choices' array`);
      }

      // Valider chaque choix
      event.choices.forEach((choice, choiceIndex) => {
        if (!choice.label) {
          throw new Error(`Event ${event.id}, choice ${choiceIndex}: missing 'label'`);
        }

        if (!choice.effects || typeof choice.effects !== 'object') {
          throw new Error(`Event ${event.id}, choice ${choiceIndex}: missing 'effects'`);
        }
      });
    });

    logger.log('All events validated successfully');
  }

  /**
   * S�lectionne un �v�nement al�atoire bas� sur le contexte
   * @param {Object} context - Contexte du joueur {day, phase, balance, history}
   * @returns {Object} �v�nement s�lectionn�
   */
  getRandomEvent(context = {}) {
    if (!this.loaded || this.events.length === 0) {
      errorHandler.critical('Events not loaded or empty');
      return this.getFallbackEvent();
    }

    // 1. Filtrer par phase narrative
    let pool = this.filterByPhase(this.events, context.phase);

    // 2. Filtrer par conditions (si d�finies dans l'�v�nement)
    pool = this.filterByConditions(pool, context);

    // 3. Exclure �v�nements r�cents
    pool = this.excludeRecentEvents(pool, context.history);

    // 4. Si le pool est vide apr�s filtrage, utiliser tous les �v�nements de la phase
    if (pool.length === 0) {
      logger.warn('Event pool empty after filtering, using all phase events');
      pool = this.filterByPhase(this.events, context.phase);
    }

    // 5. Si encore vide, utiliser tous les �v�nements
    if (pool.length === 0) {
      logger.warn('No events for this phase, using all events');
      pool = this.events;
    }

    // 6. S�lection pond�r�e
    return this.selectWeightedRandom(pool);
  }

  /**
   * Filtre les �v�nements par phase narrative
   * @param {Array} events - Liste d'�v�nements
   * @param {number} phase - ID de phase
   * @returns {Array} �v�nements filtr�s
   */
  filterByPhase(events, phase) {
    return events.filter(event => {
      // Si pas de phase sp�cifi�e dans l'�v�nement, il est dispo pour toutes
      if (event.phase === undefined || event.phase === null) return true;

      // Supporter phase unique ou array de phases
      if (Array.isArray(event.phase)) {
        return event.phase.includes(phase);
      }

      return event.phase === phase;
    });
  }

  /**
   * Filtre les �v�nements selon leurs conditions
   * @param {Array} events - Liste d'�v�nements
   * @param {Object} context - Contexte joueur
   * @returns {Array} �v�nements filtr�s
   */
  filterByConditions(events, context) {
    return events.filter(event => {
      if (!event.conditions) return true;

      return this.checkConditions(event.conditions, context);
    });
  }

  /**
   * V�rifie si les conditions d'un �v�nement sont remplies
   * @param {Object} conditions - Conditions de l'�v�nement
   * @param {Object} context - Contexte joueur
   * @returns {boolean} True si conditions remplies
   */
  checkConditions(conditions, context) {
    // Condition sur l'�quilibre global
    if (conditions.balance) {
      const balance = context.balance || 50;
      if (conditions.balance.min && balance < conditions.balance.min) return false;
      if (conditions.balance.max && balance > conditions.balance.max) return false;
    }

    // Condition sur le jour
    if (conditions.day) {
      const day = context.day || 1;
      if (conditions.day.min && day < conditions.day.min) return false;
      if (conditions.day.max && day > conditions.day.max) return false;
    }

    // Condition sur une stat sp�cifique
    if (conditions.stats && context.stats) {
      for (const [stat, requirement] of Object.entries(conditions.stats)) {
        const value = context.stats[stat] || 0;
        if (requirement.min && value < requirement.min) return false;
        if (requirement.max && value > requirement.max) return false;
      }
    }

    // Condition sur qu�tes compl�t�es
    if (conditions.questCompleted && context.completedQuests) {
      if (!context.completedQuests.includes(conditions.questCompleted)) {
        return false;
      }
    }

    // Condition sur achievements
    if (conditions.achievement && context.achievements) {
      if (!context.achievements.includes(conditions.achievement)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Exclut les �v�nements r�cemment jou�s
   * @param {Array} events - Liste d'�v�nements
   * @param {Array} history - Historique des choix
   * @returns {Array} �v�nements filtr�s
   */
  excludeRecentEvents(events, history = []) {
    if (history.length === 0) return events;

    // R�cup�rer les IDs des N derniers �v�nements
    const recentEventIds = history
      .slice(-config.GAME.RECENT_EVENTS_EXCLUSION)
      .map(h => h.eventId);

    return events.filter(event => !recentEventIds.includes(event.id));
  }

  /**
   * S�lection al�atoire avec pond�ration
   * @param {Array} events - Liste d'�v�nements
   * @returns {Object} �v�nement s�lectionn�
   */
  selectWeightedRandom(events) {
    // Cr�er un tableau pond�r�
    const weighted = events.flatMap(event => {
      const weight = event.weight || 1;
      return Array(weight).fill(event);
    });

    return randomChoice(weighted);
  }

  /**
   * R�cup�re un �v�nement par son ID
   * @param {string} eventId - ID de l'�v�nement
   * @returns {Object|null} �v�nement ou null
   */
  getEventById(eventId) {
    return this.events.find(e => e.id === eventId) || null;
  }

  /**
   * R�cup�re tous les �v�nements d'une phase
   * @param {number} phase - ID de phase
   * @returns {Array} �v�nements de cette phase
   */
  getEventsByPhase(phase) {
    return this.filterByPhase(this.events, phase);
  }

  /**
   * Compte les �v�nements par phase
   * @returns {Object} {phase: count}
   */
  countEventsByPhase() {
    const counts = {};

    config.GAME.PHASES.forEach(phase => {
      counts[phase.name] = this.getEventsByPhase(phase.id).length;
    });

    return counts;
  }

  /**
   * �v�nement de fallback en cas d'erreur
   * @returns {Object} �v�nement simple
   */
  getFallbackEvent() {
    return {
      id: 'fallback_event',
      text: {
        fr: "Tu prends un moment pour r�fl�chir � ta journ�e...",
        en: "You take a moment to reflect on your day..."
      },
      choices: [
        {
          label: {
            fr: "Continuer",
            en: "Continue"
          },
          effects: {}
        }
      ]
    };
  }

  /**
   * Recherche d'�v�nements par tag (si impl�ment�)
   * @param {string} tag - Tag � rechercher
   * @returns {Array} �v�nements avec ce tag
   */
  getEventsByTag(tag) {
    return this.events.filter(event => event.tags && event.tags.includes(tag));
  }

  /**
   * Statistiques sur les �v�nements
   * @returns {Object} Statistiques
   */
  getStatistics() {
    return {
      total: this.events.length,
      byPhase: this.countEventsByPhase(),
      withConditions: this.events.filter(e => e.conditions).length,
      weighted: this.events.filter(e => e.weight && e.weight > 1).length,
      tagged: this.events.filter(e => e.tags && e.tags.length > 0).length
    };
  }

  /**
   * Nettoie le syst�me (pour tests ou reload)
   */
  reset() {
    this.events = [];
    this.loaded = false;
    logger.log('EventSystem reset');
  }
}
