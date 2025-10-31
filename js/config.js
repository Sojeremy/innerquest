/**
 * Configuration centralisée - InnerQuest
 * Toutes les constantes et valeurs par défaut du jeu
 */

const config = {
  // Configuration du jeu
  GAME: {
    INITIAL_STATS: {
      energie: 50,
      mental: 50,
      emotionnel: 50,
      spiritualite: 50
    },
    STAT_MIN: 0,
    STAT_MAX: 100,

    // Phases narratives et leurs seuils de jours
    PHASES: [
      { id: 0, name: 'awakening', minDay: 1, maxDay: 14 },
      { id: 1, name: 'chaos', minDay: 15, maxDay: 29 },
      { id: 2, name: 'quest', minDay: 30, maxDay: 49 },
      { id: 3, name: 'harmony', minDay: 50, maxDay: Infinity }
    ],

    // Auto-sauvegarde toutes les 30 secondes
    AUTO_SAVE_INTERVAL: 30000,

    // Nombre d'événements récents à exclure de la sélection
    RECENT_EVENTS_EXCLUSION: 5,

    // Limite d'historique stocké (pour éviter surcharge mémoire)
    MAX_HISTORY_LENGTH: 100,

    // Conditions de fin de jeu (optionnel, pour futur)
    END_GAME_CONDITIONS: {
      maxDays: 365,
      allQuestsCompleted: false
    }
  },

  // Configuration UI
  UI: {
    ANIMATION_DURATION: 300, // ms
    TEXT_FADE_IN_DELAY: 50, // ms par caractère (effet typewriter)
    CHOICE_STAGGER_DELAY: 100, // ms entre chaque bouton

    // Thème par défaut
    DEFAULT_THEME: 'light',

    // Tailles de police disponibles
    FONT_SIZES: {
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 20
    },
    DEFAULT_FONT_SIZE: 'medium',

    // Durées d'affichage des notifications
    NOTIFICATION_DURATION: 3000,

    // Activer/désactiver les animations par défaut
    ANIMATIONS_ENABLED: true
  },

  // Configuration i18n
  I18N: {
    DEFAULT_LOCALE: 'fr',
    FALLBACK_LOCALE: 'fr',
    SUPPORTED_LOCALES: ['fr', 'en', 'es', 'de']
  },

  // Configuration stockage
  STORAGE: {
    SAVE_KEY: 'innerquest_save',
    SETTINGS_KEY: 'innerquest_settings',
    VERSION: '1.0.0'
  },

  // Configuration audio
  AUDIO: {
    DEFAULT_VOLUME: 0.5,
    MUSIC_ENABLED: true,
    SFX_ENABLED: true,
    TRACKS: {
      day: '/assets/audio/day-ambient.mp3',
      night: '/assets/audio/night-ambient.mp3',
      meditation: '/assets/audio/meditation.mp3'
    }
  },

  // Analytics locaux (pas de tracking externe)
  ANALYTICS: {
    ENABLED: true,
    TRACK_CHOICES: true,
    TRACK_STATS: true,
    TRACK_PLAYTIME: true
  },

  // Paths
  PATHS: {
    EVENTS: '/data/events.json',
    QUESTS: '/data/quests.json',
    ACHIEVEMENTS: '/data/achievements.json',
    TIPS: '/data/tips.json',
    STATS_CONFIG: '/data/stats.json'
  },

  // Mode debug (mettre à true pour logs détaillés)
  DEBUG: false
};

// Freeze config pour éviter modifications accidentelles
Object.freeze(config);

export default config;
