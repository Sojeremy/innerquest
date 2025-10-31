/**
 * Events - InnerQuest
 * Système de gestion des événements narratifs
 */

import config from './config.js';
import { randomChoice, getLocalizedText, validateType, errorHandler, logger } from './utils.js';

export default class EventSystem {
  constructor() {
    this.events = [];
    this.loaded = false;
  }

  /**
   * Charge les événements depuis le fichier JSON
   * @returns {Promise<boolean>} True si succès
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
   * Valide la structure de tous les événements
   * @throws {Error} Si un événement est invalide
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
   * Sélectionne un événement aléatoire basé sur le contexte
   * @param {Object} context - Contexte du joueur {day, phase, balance, history}
   * @returns {Object} Événement sélectionné
   */
  getRandomEvent(context = {}) {
    if (!this.loaded || this.events.length === 0) {
      errorHandler.critical('Events not loaded or empty');
      return this.getFallbackEvent();
    }

    // 1. Filtrer par phase narrative
    let pool = this.filterByPhase(this.events, context.phase);

    // 2. Filtrer par conditions (si définies dans l'événement)
    pool = this.filterByConditions(pool, context);

    // 3. Exclure événements récents
    pool = this.excludeRecentEvents(pool, context.history);

    // 4. Si le pool est vide après filtrage, utiliser tous les événements de la phase
    if (pool.length === 0) {
      logger.warn('Event pool empty after filtering, using all phase events');
      pool = this.filterByPhase(this.events, context.phase);
    }

    // 5. Si encore vide, utiliser tous les événements
    if (pool.length === 0) {
      logger.warn('No events for this phase, using all events');
      pool = this.events;
    }

    // 6. Sélection pondérée
    return this.selectWeightedRandom(pool);
  }

  /**
   * Filtre les événements par phase narrative
   * @param {Array} events - Liste d'événements
   * @param {number} phase - ID de phase
   * @returns {Array} Événements filtrés
   */
  filterByPhase(events, phase) {
    return events.filter(event => {
      // Si pas de phase spécifiée dans l'événement, il est dispo pour toutes
      if (event.phase === undefined || event.phase === null) return true;

      // Supporter phase unique ou array de phases
      if (Array.isArray(event.phase)) {
        return event.phase.includes(phase);
      }

      return event.phase === phase;
    });
  }

  /**
   * Filtre les événements selon leurs conditions
   * @param {Array} events - Liste d'événements
   * @param {Object} context - Contexte joueur
   * @returns {Array} Événements filtrés
   */
  filterByConditions(events, context) {
    return events.filter(event => {
      if (!event.conditions) return true;

      return this.checkConditions(event.conditions, context);
    });
  }

  /**
   * Vérifie si les conditions d'un événement sont remplies
   * @param {Object} conditions - Conditions de l'événement
   * @param {Object} context - Contexte joueur
   * @returns {boolean} True si conditions remplies
   */
  checkConditions(conditions, context) {
    // Condition sur l'équilibre global
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

    // Condition sur une stat spécifique
    if (conditions.stats && context.stats) {
      for (const [stat, requirement] of Object.entries(conditions.stats)) {
        const value = context.stats[stat] || 0;
        if (requirement.min && value < requirement.min) return false;
        if (requirement.max && value > requirement.max) return false;
      }
    }

    // Condition sur quêtes complétées
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
   * Exclut les événements récemment joués
   * @param {Array} events - Liste d'événements
   * @param {Array} history - Historique des choix
   * @returns {Array} Événements filtrés
   */
  excludeRecentEvents(events, history = []) {
    if (history.length === 0) return events;

    // Récupérer les IDs des N derniers événements
    const recentEventIds = history
      .slice(-config.GAME.RECENT_EVENTS_EXCLUSION)
      .map(h => h.eventId);

    return events.filter(event => !recentEventIds.includes(event.id));
  }

  /**
   * Sélection aléatoire avec pondération
   * @param {Array} events - Liste d'événements
   * @returns {Object} Événement sélectionné
   */
  selectWeightedRandom(events) {
    // Créer un tableau pondéré
    const weighted = events.flatMap(event => {
      const weight = event.weight || 1;
      return Array(weight).fill(event);
    });

    return randomChoice(weighted);
  }

  /**
   * Récupère un événement par son ID
   * @param {string} eventId - ID de l'événement
   * @returns {Object|null} Événement ou null
   */
  getEventById(eventId) {
    return this.events.find(e => e.id === eventId) || null;
  }

  /**
   * Récupère tous les événements d'une phase
   * @param {number} phase - ID de phase
   * @returns {Array} Événements de cette phase
   */
  getEventsByPhase(phase) {
    return this.filterByPhase(this.events, phase);
  }

  /**
   * Compte les événements par phase
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
   * Événement de fallback en cas d'erreur
   * @returns {Object} Événement simple
   */
  getFallbackEvent() {
    return {
      id: 'fallback_event',
      text: {
        fr: "Tu prends un moment pour réfléchir à ta journée...",
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
   * Recherche d'événements par tag (si implémenté)
   * @param {string} tag - Tag à rechercher
   * @returns {Array} Événements avec ce tag
   */
  getEventsByTag(tag) {
    return this.events.filter(event => event.tags && event.tags.includes(tag));
  }

  /**
   * Statistiques sur les événements
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
   * Nettoie le système (pour tests ou reload)
   */
  reset() {
    this.events = [];
    this.loaded = false;
    logger.log('EventSystem reset');
  }
}
