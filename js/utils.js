/**
 * Utilitaires - InnerQuest
 * Fonctions helper r�utilisables
 */

import config from './config.js';

/**
 * Limite une valeur entre un min et un max
 * @param {number} value - Valeur � limiter
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Valeur clamp�e
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * G�n�re un entier al�atoire entre min et max (inclus)
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Entier al�atoire
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * S�lectionne un �l�ment al�atoire d'un tableau
 * @param {Array} array - Tableau source
 * @returns {*} �l�ment al�atoire
 */
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * M�lange un tableau (Fisher-Yates shuffle)
 * @param {Array} array - Tableau � m�langer
 * @returns {Array} Tableau m�lang�
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Debounce une fonction (retarde son ex�cution)
 * @param {Function} func - Fonction � debounce
 * @param {number} delay - D�lai en ms
 * @returns {Function} Fonction debounc�e
 */
export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle une fonction (limite sa fr�quence d'ex�cution)
 * @param {Function} func - Fonction � throttle
 * @param {number} limit - Intervalle minimum en ms
 * @returns {Function} Fonction throttl�e
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Attend un certain d�lai (pour async/await)
 * @param {number} ms - Dur�e en millisecondes
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formate une date en string lisible
 * @param {Date} date - Date � formater
 * @param {string} locale - Code langue
 * @returns {string} Date format�e
 */
export function formatDate(date, locale = 'fr-FR') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Formate un nombre avec s�parateurs
 * @param {number} number - Nombre � formater
 * @param {string} locale - Code langue
 * @returns {string} Nombre format�
 */
export function formatNumber(number, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Sanitize HTML pour �viter XSS
 * @param {string} str - String � nettoyer
 * @returns {string} String sanitized
 */
export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * R�cup�re un texte localis� depuis un objet multilingue
 * @param {Object|string} textObj - Objet {fr: "...", en: "..."} ou string directe
 * @param {string} locale - Code langue
 * @param {string} fallback - Langue fallback
 * @returns {string} Texte dans la langue demand�e
 */
export function getLocalizedText(textObj, locale = 'fr', fallback = 'fr') {
  if (typeof textObj === 'string') return textObj;
  return textObj[locale] || textObj[fallback] || Object.values(textObj)[0];
}

/**
 * Validation de type simple
 * @param {*} value - Valeur � valider
 * @param {string} type - Type attendu ('string', 'number', 'array', 'object', 'boolean')
 * @returns {boolean} True si valide
 */
export function validateType(value, type) {
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return typeof value === 'object' && !Array.isArray(value) && value !== null;
  return typeof value === type;
}

/**
 * Deep clone d'un objet (JSON method)
 * @param {Object} obj - Objet � cloner
 * @returns {Object} Clone profond
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Calcule le pourcentage d'un nombre
 * @param {number} value - Valeur
 * @param {number} total - Total
 * @returns {number} Pourcentage (0-100)
 */
export function percentage(value, total) {
  return total === 0 ? 0 : (value / total) * 100;
}

/**
 * Gestion d'erreurs centralis�e
 */
export const errorHandler = {
  /**
   * G�re une erreur non-critique
   * @param {string} message - Message d'erreur
   * @param {Error} error - Objet erreur
   */
  handle(message, error) {
    console.error(`[ERROR] ${message}`, error);

    if (config.DEBUG) {
      this.logToDebugPanel(message, error);
    }

    // �mettre �v�nement pour UI
    window.dispatchEvent(
      new CustomEvent('app:error', {
        detail: { message, error }
      })
    );
  },

  /**
   * G�re une erreur critique (crash potentiel)
   * @param {string} message - Message d'erreur
   * @param {Error} error - Objet erreur
   */
  critical(message, error) {
    console.error(`[CRITICAL] ${message}`, error);

    // �mettre �v�nement pour afficher �cran d'erreur
    window.dispatchEvent(
      new CustomEvent('app:critical-error', {
        detail: { message, error }
      })
    );

    // Tenter de sauvegarder avant crash
    try {
      const autosave = localStorage.getItem(config.STORAGE.SAVE_KEY);
      if (autosave) {
        localStorage.setItem(`${config.STORAGE.SAVE_KEY}_backup`, autosave);
      }
    } catch (e) {
      console.error('Failed to create backup save', e);
    }
  },

  /**
   * Log vers un panneau de debug (si en mode DEBUG)
   * @param {string} message - Message
   * @param {Error} error - Erreur
   */
  logToDebugPanel(message, error) {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      const entry = document.createElement('div');
      entry.className = 'debug-entry';
      entry.innerHTML = `
        <strong>${new Date().toLocaleTimeString()}</strong> - ${message}
        <pre>${error?.stack || error}</pre>
      `;
      debugPanel.appendChild(entry);
    }
  }
};

/**
 * Logger conditionnel (seulement si DEBUG = true)
 */
export const logger = {
  log(...args) {
    if (config.DEBUG) console.log('[InnerQuest]', ...args);
  },
  warn(...args) {
    if (config.DEBUG) console.warn('[InnerQuest]', ...args);
  },
  error(...args) {
    if (config.DEBUG) console.error('[InnerQuest]', ...args);
  },
  group(label) {
    if (config.DEBUG) console.group(label);
  },
  groupEnd() {
    if (config.DEBUG) console.groupEnd();
  }
};
