# Architecture technique – InnerQuest

## Vue d'ensemble

InnerQuest est une application web statique construite selon une architecture modulaire MVC-like, avec séparation claire entre données, logique métier et présentation.

### Principes architecturaux

1. **Modularité** : Chaque module a une responsabilité unique et bien définie
2. **Séparation des préoccupations** : Données (JSON) ↔ Logique (JS) ↔ Présentation (HTML/CSS)
3. **Vanilla First** : Pas de frameworks, ES6+ modules natifs
4. **Progressive Enhancement** : Fonctionnel sans JS avancé, amélioré avec
5. **Offline-First** : PWA avec service worker, localStorage pour persistance

---

## Arborescence complète

```
/innerquest
├── index.html                 # Point d'entrée HTML
├── manifest.json              # PWA manifest
├── service-worker.js          # Cache offline
├── .gitignore
├── README.md
│
├── assets/                    # Ressources médias
│   ├── images/               # Images (backgrounds, sprites)
│   ├── audio/                # Musiques et sons
│   ├── fonts/                # Polices custom
│   └── icons/                # Icônes PWA et UI
│
├── css/                       # Feuilles de style
│   ├── base.css              # Reset, variables, typographie
│   ├── layout.css            # Structure grille, zones
│   ├── ui.css                # Composants (boutons, barres, cartes)
│   ├── animations.css        # Transitions, keyframes
│   └── themes.css            # Mode clair/sombre, thèmes jour/nuit
│
├── js/                        # Modules JavaScript
│   ├── main.js               # Point d'entrée, initialisation
│   ├── config.js             # Configuration centralisée
│   ├── game.js               # Moteur de jeu, loop principal
│   ├── player.js             # État joueur, stats, progression
│   ├── events.js             # Système d'événements
│   ├── quests.js             # Système de quêtes
│   ├── ui.js                 # Mise à jour interface
│   ├── storage.js            # Sauvegarde localStorage
│   ├── audio.js              # Gestion audio
│   ├── i18n.js               # Internationalisation
│   ├── analytics.js          # Statistiques locales
│   ├── achievements.js       # Système de succès
│   └── utils.js              # Fonctions utilitaires
│
├── data/                      # Données de jeu (JSON)
│   ├── events.json           # Événements narratifs
│   ├── quests.json           # Quêtes de transformation
│   ├── achievements.json     # Succès débloquables
│   ├── tips.json             # Citations inspirantes
│   └── stats.json            # Configuration stats/balance
│
├── locales/                   # Traductions i18n
│   ├── fr.json               # Français (défaut)
│   ├── en.json               # Anglais
│   └── ...
│
├── tests/                     # Suite de tests
│   ├── unit/                 # Tests unitaires
│   ├── integration/          # Tests d'intégration
│   ├── fixtures/             # Données de test
│   └── test-framework.js     # Mini framework de test
│
└── docs/                      # Documentation
    ├── note-de-cadrage.md
    ├── cahier-des-charges.md
    ├── roadmap.md
    ├── architecture-technique.md  # Ce fichier
    ├── data-model.md
    ├── mechanics.md
    ├── narrative.md
    ├── design.md
    ├── style-guide.md
    ├── accessibility.md
    ├── internationalization.md
    ├── testing-guide.md
    ├── contribution-guide.md
    ├── product-backlog.md
    └── changelog.md
```

---

## Modules JavaScript détaillés

### 1. config.js - Configuration centralisée

**Responsabilités** :

- Centraliser toutes les constantes de configuration
- Définir les valeurs par défaut
- Configurer comportements système

**Exports** :

```javascript
export default {
  GAME: {
    INITIAL_STATS: { energie: 50, mental: 50, emotionnel: 50, spiritualite: 50 },
    STAT_MIN: 0,
    STAT_MAX: 100,
    PHASES: [...],
    AUTO_SAVE_INTERVAL: 30000 // ms
  },
  UI: {
    ANIMATION_DURATION: 300,
    TEXT_FADE_IN_DELAY: 50,
    DEFAULT_THEME: 'light',
    DEFAULT_FONT_SIZE: 16
  },
  I18N: {
    DEFAULT_LOCALE: 'fr',
    FALLBACK_LOCALE: 'fr',
    SUPPORTED_LOCALES: ['fr', 'en', 'es']
  },
  STORAGE: {
    SAVE_KEY: 'innerquest_save',
    SETTINGS_KEY: 'innerquest_settings',
    VERSION: '1.0.0'
  },
  DEBUG: false
}
```

---

### 2. main.js - Point d'entrée

**Responsabilités** :

- Initialiser tous les modules
- Charger ressources critiques (traductions, événements)
- Détecter sauvegarde existante ou nouveau jeu
- Attacher event listeners globaux
- Gérer lifecycle de l'app

**Flux d'initialisation** :

```javascript
async function init() {
  try {
    // 1. Charger configuration
    await loadConfig();

    // 2. Initialiser i18n
    const locale = detectUserLocale();
    await i18n.init(locale);

    // 3. Initialiser UI
    ui.init();

    // 4. Charger données de jeu
    await Promise.all([
      events.load(),
      quests.load(),
      achievements.load()
    ]);

    // 5. Vérifier sauvegarde existante
    const savedGame = storage.load();
    if (savedGame) {
      game.restore(savedGame);
      ui.showContinuePrompt();
    } else {
      ui.showNewGamePrompt();
    }

    // 6. Initialiser audio (lazy)
    audio.init();

    // 7. Enregistrer service worker (si supporté)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }

  } catch (error) {
    errorHandler.critical('Initialization failed', error);
  }
}

document.addEventListener('DOMContentLoaded', init);
```

---

### 3. player.js - État du joueur

**Responsabilités** :

- Gérer les stats (énergie, mental, émotionnel, spiritualité)
- Calculer indice d'équilibre global
- Appliquer effets des choix
- Tracker progression (jour, phase narrative)
- Historique des choix et journal

**Structure de données** :

```javascript
class Player {
  constructor() {
    this.stats = { ...config.GAME.INITIAL_STATS };
    this.day = 1;
    this.phase = 0; // Index dans config.GAME.PHASES
    this.history = []; // {day, eventId, choiceIndex, effects}
    this.journal = []; // {day, text}
    this.completedQuests = [];
    this.activeQuests = [];
    this.achievements = [];
  }

  getGlobalBalance() {
    const { energie, mental, emotionnel, spiritualite } = this.stats;
    return (energie + mental + emotionnel + spiritualite) / 4;
  }

  applyEffects(effects) {
    for (const [stat, delta] of Object.entries(effects)) {
      this.stats[stat] = clamp(this.stats[stat] + delta, 0, 100);
    }
  }

  nextDay() {
    this.day++;
    this.updatePhase();
  }

  updatePhase() {
    // Changer de phase narrative selon progression
    const phaseTresholds = [1, 15, 30, 50];
    for (let i = 0; i < phaseTresholds.length; i++) {
      if (this.day >= phaseTresholds[i]) {
        this.phase = i;
      }
    }
  }

  addJournalEntry(text) {
    this.journal.push({ day: this.day, text });
  }

  serialize() {
    return JSON.stringify(this);
  }

  static deserialize(json) {
    const data = JSON.parse(json);
    const player = new Player();
    Object.assign(player, data);
    return player;
  }
}
```

---

### 4. game.js - Moteur de jeu

**Responsabilités** :

- Orchestrer le game loop
- Gérer cycle jour/nuit
- Déclencher événements
- Appliquer choix du joueur
- Vérifier conditions de quêtes/achievements
- Auto-sauvegarde

**API publique** :

```javascript
class Game {
  constructor() {
    this.player = null;
    this.currentEvent = null;
    this.isPaused = false;
  }

  newGame() {
    this.player = new Player();
    this.startDay();
  }

  restore(savedData) {
    this.player = Player.deserialize(savedData);
    this.startDay();
  }

  async startDay() {
    // 1. Trigger day start event
    this.emit('day:start', { day: this.player.day });

    // 2. Get random event based on player state
    this.currentEvent = await events.getRandomEvent({
      phase: this.player.phase,
      balance: this.player.getGlobalBalance()
    });

    // 3. Display event
    ui.displayEvent(this.currentEvent);
  }

  selectChoice(choiceIndex) {
    const choice = this.currentEvent.choices[choiceIndex];

    // 1. Apply effects
    this.player.applyEffects(choice.effects);

    // 2. Record history
    this.player.history.push({
      day: this.player.day,
      eventId: this.currentEvent.id,
      choiceIndex,
      effects: choice.effects
    });

    // 3. Update UI
    ui.updateStats(this.player.stats);
    ui.showChoiceResult(choice);

    // 4. Check quests/achievements
    quests.checkProgress(this.player);
    achievements.checkUnlocks(this.player);

    // 5. Auto-save
    storage.save(this.player);

    // 6. Transition to end of day
    this.endDay();
  }

  endDay() {
    // Show journal prompt
    ui.showJournalPrompt((entry) => {
      this.player.addJournalEntry(entry);
      this.player.nextDay();
      storage.save(this.player);

      // Transition to next day
      setTimeout(() => this.startDay(), 1000);
    });
  }

  // Event emitter pattern
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`game:${event}`, { detail: data }));
  }

  on(event, callback) {
    window.addEventListener(`game:${event}`, (e) => callback(e.detail));
  }
}
```

---

### 5. events.js - Système d'événements

**Responsabilités** :

- Charger events.json
- Filtrer événements selon contexte (phase, stats, historique)
- Sélectionner événement aléatoire pondéré
- Validation structure événement

**Logique de sélection** :

```javascript
class EventSystem {
  constructor() {
    this.events = [];
    this.eventPool = [];
  }

  async load() {
    const response = await fetch('/data/events.json');
    this.events = await response.json();
    this.validateEvents();
  }

  getRandomEvent(context) {
    // 1. Filter by phase
    let pool = this.events.filter(e => {
      return !e.phase || e.phase === context.phase;
    });

    // 2. Filter by conditions (if any)
    pool = pool.filter(e => {
      if (!e.conditions) return true;
      return this.checkConditions(e.conditions, context);
    });

    // 3. Exclude recently played (last 5 days)
    const recentIds = context.history?.slice(-5).map(h => h.eventId) || [];
    pool = pool.filter(e => !recentIds.includes(e.id));

    // 4. Weight selection (events can have weight property)
    const weighted = pool.flatMap(e => {
      const weight = e.weight || 1;
      return Array(weight).fill(e);
    });

    // 5. Random pick
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  checkConditions(conditions, context) {
    // Example: { "balance": { "min": 50 }, "day": { "min": 10 } }
    for (const [key, value] of Object.entries(conditions)) {
      if (key === 'balance') {
        if (value.min && context.balance < value.min) return false;
        if (value.max && context.balance > value.max) return false;
      }
      if (key === 'day') {
        if (value.min && context.day < value.min) return false;
        if (value.max && context.day > value.max) return false;
      }
      // Add more conditions as needed
    }
    return true;
  }

  validateEvents() {
    this.events.forEach(event => {
      if (!event.id || !event.text || !event.choices) {
        throw new Error(`Invalid event structure: ${event.id}`);
      }
    });
  }
}
```

---

### 6. ui.js - Interface utilisateur

**Responsabilités** :

- Mettre à jour DOM
- Afficher événements et choix
- Animer transitions
- Gérer interactions utilisateur
- Responsive aux événements game

**Composants clés** :

```javascript
class UI {
  constructor() {
    this.elements = {}; // Cache des éléments DOM
    this.animationQueue = [];
  }

  init() {
    // Cache DOM references
    this.elements = {
      statsContainer: document.querySelector('#stats'),
      narrativeBox: document.querySelector('#narrative'),
      choicesContainer: document.querySelector('#choices'),
      journalModal: document.querySelector('#journal-modal'),
      settingsModal: document.querySelector('#settings-modal')
    };

    // Attach event listeners
    this.attachListeners();
  }

  updateStats(stats) {
    for (const [stat, value] of Object.entries(stats)) {
      const bar = this.elements.statsContainer.querySelector(`[data-stat="${stat}"]`);
      this.animateBar(bar, value);
    }
  }

  displayEvent(event) {
    // 1. Fade out previous content
    this.fadeOut(this.elements.narrativeBox, () => {

      // 2. Update text
      const text = getLocalizedText(event.text);
      this.elements.narrativeBox.innerHTML = this.formatText(text);

      // 3. Fade in new content
      this.fadeIn(this.elements.narrativeBox);
    });

    // 4. Display choices
    this.displayChoices(event.choices);
  }

  displayChoices(choices) {
    this.elements.choicesContainer.innerHTML = '';

    choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index);
      this.elements.choicesContainer.appendChild(button);
    });

    // Animate in
    this.staggerFadeIn(this.elements.choicesContainer.children);
  }

  createChoiceButton(choice, index) {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = getLocalizedText(choice.label);
    button.dataset.index = index;

    button.addEventListener('click', () => {
      game.selectChoice(index);
    });

    return button;
  }

  showJournalPrompt(callback) {
    const modal = this.elements.journalModal;
    const textarea = modal.querySelector('textarea');

    this.showModal(modal);

    const submitBtn = modal.querySelector('.submit');
    submitBtn.onclick = () => {
      const entry = textarea.value;
      callback(entry);
      textarea.value = '';
      this.hideModal(modal);
    };
  }

  // Animation helpers
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';

    setTimeout(() => {
      element.style.transition = `opacity ${duration}ms`;
      element.style.opacity = '1';
    }, 10);
  }

  fadeOut(element, callback, duration = 300) {
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '0';

    setTimeout(() => {
      element.style.display = 'none';
      callback?.();
    }, duration);
  }

  animateBar(barElement, targetValue) {
    const fill = barElement.querySelector('.bar-fill');
    const label = barElement.querySelector('.bar-label');

    fill.style.transition = 'width 500ms ease-out';
    fill.style.width = `${targetValue}%`;

    label.textContent = Math.round(targetValue);
  }
}
```

---

### 7. storage.js - Persistance

**Responsabilités** :

- Sauvegarder/charger état joueur (localStorage)
- Export/import sauvegardes (JSON download)
- Gestion versions (migration si structure change)
- Compression (optionnel, LZ-string)

**API** :

```javascript
class Storage {
  constructor() {
    this.saveKey = config.STORAGE.SAVE_KEY;
    this.version = config.STORAGE.VERSION;
  }

  save(player) {
    try {
      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        player: player.serialize()
      };

      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      return true;
    } catch (error) {
      errorHandler.handle('Save failed', error);
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return null;

      const saveData = JSON.parse(raw);

      // Check version compatibility
      if (saveData.version !== this.version) {
        return this.migrate(saveData);
      }

      return saveData.player;
    } catch (error) {
      errorHandler.handle('Load failed', error);
      return null;
    }
  }

  export(player) {
    const saveData = {
      version: this.version,
      timestamp: Date.now(),
      player: player.serialize()
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `innerquest-save-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);
          resolve(saveData.player);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  migrate(oldSave) {
    // Handle version migrations
    console.warn('Migrating save from version', oldSave.version);
    // ... migration logic
    return oldSave.player;
  }
}
```

---

## Flux de données

### Diagramme de séquence : Nouvelle journée

```
User          UI          Game       Events      Player      Storage
 |             |           |           |           |           |
 |-- click -->|           |           |           |           |
 |            |--startDay->|          |           |           |
 |            |           |--getRandom->|         |           |
 |            |           |<-event---|           |           |
 |            |<-display--|           |           |           |
 |            |           |           |           |           |
 |--choice-->|           |           |           |           |
 |            |--select-->|           |           |           |
 |            |           |--applyEffects-------->|           |
 |            |           |           |           |--save---->|
 |            |<-update---|           |           |           |
```

---

## Gestion d'erreurs

### Module errorHandler (dans utils.js)

```javascript
const errorHandler = {
  handle(message, error) {
    console.error(message, error);

    // Log en mode debug
    if (config.DEBUG) {
      this.logToDebugPanel(message, error);
    }

    // Afficher message utilisateur
    ui.showNotification(i18n.t('messages.error'), 'error');
  },

  critical(message, error) {
    console.error('CRITICAL:', message, error);

    // Afficher écran d'erreur
    ui.showCriticalError(message);

    // Tenter de sauvegarder avant crash
    try {
      if (game.player) {
        storage.save(game.player);
      }
    } catch (e) {
      // Silent fail
    }
  }
};
```

---

## Performance et optimisation

### Lazy loading

- Modules chargés à la demande (audio, achievements)
- Images lazy-loaded avec `loading="lazy"`
- Service worker cache stratégique (app shell puis contenu)

### Debouncing/Throttling

```javascript
// utils.js
export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Usage: auto-save debounced
const debouncedSave = debounce(() => storage.save(game.player), 2000);
```

### Memory management

- Limiter historique stocké (max 100 jours)
- Vider pool d'événements régulièrement
- Utiliser event delegation pour listeners dynamiques

---

## Sécurité et validation

### Validation des données

```javascript
function validateEventData(event) {
  const schema = {
    id: 'string',
    text: 'object|string',
    choices: 'array'
  };

  for (const [key, type] of Object.entries(schema)) {
    if (!validateType(event[key], type)) {
      throw new ValidationError(`Invalid ${key} in event ${event.id}`);
    }
  }
}
```

### Sanitization

```javascript
// Éviter XSS si contenu utilisateur (journal)
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

---

## Extensibilité

### Système de plugins (futur)

```javascript
class PluginManager {
  constructor() {
    this.plugins = [];
  }

  register(plugin) {
    if (plugin.init) plugin.init(game);
    this.plugins.push(plugin);
  }

  emit(hook, data) {
    this.plugins.forEach(plugin => {
      if (plugin[hook]) plugin[hook](data);
    });
  }
}

// Example plugin
const achievementSoundPlugin = {
  onAchievementUnlock(achievement) {
    audio.play('achievement.mp3');
  }
};
```

---

## Documentation du code

### Standards JSDoc

Tous les modules publics doivent être documentés :

```javascript
/**
 * Applique les effets d'un choix sur les statistiques du joueur
 * @param {Object} effects - Objet {stat: delta} des modifications
 * @returns {void}
 * @example
 * player.applyEffects({ energie: -10, mental: +5 });
 */
applyEffects(effects) { ... }
```

---

**Cette architecture évolutive permet à InnerQuest de rester simple tout en étant prêt pour des améliorations futures.**
