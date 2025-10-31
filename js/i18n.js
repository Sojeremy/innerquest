/**
 * i18n - InnerQuest
 * Système d'internationalisation et traductions
 */

import config from './config.js';
import { logger, errorHandler } from './utils.js';

class I18n {
  constructor() {
    this.currentLocale = config.I18N.DEFAULT_LOCALE;
    this.fallbackLocale = config.I18N.FALLBACK_LOCALE;
    this.translations = {};
    this.loaded = false;
  }

  /**
   * Initialise le système i18n avec une locale
   * @param {string} locale - Code langue (fr, en, es...)
   * @returns {Promise<boolean>} True si succès
   */
  async init(locale = config.I18N.DEFAULT_LOCALE) {
    try {
      logger.log(`Initializing i18n with locale: ${locale}`);

      this.currentLocale = locale;

      // Charger la locale demandée
      await this.loadLocale(locale);

      // Charger fallback si différent
      if (locale !== this.fallbackLocale) {
        await this.loadLocale(this.fallbackLocale);
      }

      // Mettre à jour l'attribut lang du HTML
      this.updateHTMLLang();

      // Traduire le DOM
      this.translateDOM();

      this.loaded = true;
      logger.log('i18n initialized successfully');

      return true;
    } catch (error) {
      errorHandler.critical('Failed to initialize i18n', error);
      return false;
    }
  }

  /**
   * Charge un fichier de traduction
   * @param {string} locale - Code langue
   * @returns {Promise<boolean>} True si succès
   */
  async loadLocale(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch locale: ${locale}`);
      }

      const data = await response.json();
      this.translations[locale] = data;

      logger.log(`Locale ${locale} loaded successfully`);
      return true;
    } catch (error) {
      errorHandler.handle(`Failed to load locale: ${locale}`, error);
      return false;
    }
  }

  /**
   * Traduit une clé
   * @param {string} key - Clé de traduction (ex: "ui.title")
   * @param {Object} params - Paramètres pour interpolation {key: value}
   * @returns {string} Texte traduit
   */
  t(key, params = {}) {
    if (!key) return '';

    const keys = key.split('.');
    let value = this.translations[this.currentLocale];

    // Parcourir les clés imbriquées
    for (const k of keys) {
      value = value?.[k];
    }

    // Si traduction non trouvée, essayer fallback
    if (!value && this.currentLocale !== this.fallbackLocale) {
      value = this.translations[this.fallbackLocale];
      for (const k of keys) {
        value = value?.[k];
      }
    }

    // Si toujours pas trouvée, retourner la clé
    if (!value) {
      logger.warn(`Translation missing: ${key}`);
      return key;
    }

    // Interpoler les paramètres
    return this.interpolate(value, params);
  }

  /**
   * Interpole les paramètres dans une chaîne
   * @param {string} str - Chaîne avec placeholders {key}
   * @param {Object} params - Paramètres {key: value}
   * @returns {string} Chaîne interpolée
   */
  interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Change la locale actuelle
   * @param {string} locale - Nouvelle locale
   * @returns {Promise<boolean>} True si succès
   */
  async setLocale(locale) {
    if (!config.I18N.SUPPORTED_LOCALES.includes(locale)) {
      logger.warn(`Locale ${locale} not supported`);
      return false;
    }

    // Charger la locale si pas déjà chargée
    if (!this.translations[locale]) {
      await this.loadLocale(locale);
    }

    this.currentLocale = locale;
    this.updateHTMLLang();
    this.translateDOM();

    // Émettre événement de changement
    this.emit('localeChanged', { locale });

    // Sauvegarder préférence
    localStorage.setItem('preferredLocale', locale);

    logger.log(`Locale changed to: ${locale}`);
    return true;
  }

  /**
   * Met à jour l'attribut lang du HTML
   */
  updateHTMLLang() {
    document.documentElement.lang = this.currentLocale;
    document.documentElement.dir = this.getTextDirection();
  }

  /**
   * Retourne la direction du texte (ltr ou rtl)
   * @returns {string} 'ltr' ou 'rtl'
   */
  getTextDirection() {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLocale) ? 'rtl' : 'ltr';
  }

  /**
   * Traduit tous les éléments du DOM avec data-i18n
   */
  translateDOM() {
    // Traduire les textes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);

      // Préserver les éléments enfants si présents
      if (el.children.length === 0) {
        el.textContent = text;
      } else {
        // Utiliser innerHTML mais c'est moins safe
        // Pour InnerQuest, on n'a que du texte simple
        el.innerHTML = text;
      }
    });

    // Traduire les placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Traduire les titres (title attribute)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Traduire les aria-labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', this.t(key));
    });
  }

  /**
   * Récupère la locale actuelle
   * @returns {string} Code locale
   */
  getCurrentLocale() {
    return this.currentLocale;
  }

  /**
   * Récupère toutes les locales disponibles
   * @returns {Array<string>} Liste des codes locales
   */
  getAvailableLocales() {
    return config.I18N.SUPPORTED_LOCALES;
  }

  /**
   * Récupère les locales chargées
   * @returns {Array<string>} Liste des locales chargées
   */
  getLoadedLocales() {
    return Object.keys(this.translations);
  }

  /**
   * Détecte la locale préférée de l'utilisateur
   * @returns {string} Code locale
   */
  detectUserLocale() {
    // 1. Préférence sauvegardée
    const saved = localStorage.getItem('preferredLocale');
    if (saved && config.I18N.SUPPORTED_LOCALES.includes(saved)) {
      return saved;
    }

    // 2. Langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // 'fr-FR' → 'fr'

    // 3. Vérifier si supportée
    if (config.I18N.SUPPORTED_LOCALES.includes(langCode)) {
      return langCode;
    }

    // 4. Fallback
    return config.I18N.DEFAULT_LOCALE;
  }

  /**
   * Formate une date selon la locale
   * @param {Date} date - Date à formater
   * @param {Object} options - Options Intl.DateTimeFormat
   * @returns {string} Date formatée
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat(
      this.currentLocale,
      { ...defaultOptions, ...options }
    ).format(date);
  }

  /**
   * Formate un nombre selon la locale
   * @param {number} number - Nombre à formater
   * @param {Object} options - Options Intl.NumberFormat
   * @returns {string} Nombre formaté
   */
  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

  /**
   * Émet un événement i18n
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  emit(eventName, data = {}) {
    window.dispatchEvent(
      new CustomEvent(`i18n:${eventName}`, { detail: data })
    );
  }

  /**
   * S'abonne à un événement i18n
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(eventName, callback) {
    window.addEventListener(`i18n:${eventName}`, e => {
      callback(e.detail);
    });
  }

  /**
   * Récupère toutes les traductions d'une clé (pour debug)
   * @param {string} key - Clé de traduction
   * @returns {Object} Objet {locale: traduction}
   */
  getAllTranslations(key) {
    const result = {};

    for (const [locale, translations] of Object.entries(this.translations)) {
      const keys = key.split('.');
      let value = translations;

      for (const k of keys) {
        value = value?.[k];
      }

      if (value) {
        result[locale] = value;
      }
    }

    return result;
  }
}

// Créer instance globale
const i18n = new I18n();

// Export par défaut
export default i18n;
