# Internationalisation (i18n) – InnerQuest

## Vision
Préparer InnerQuest pour une audience internationale tout en commençant avec le français comme langue principale.

## Architecture i18n

### Structure des fichiers de langue

```
/locales
  ├── fr.json          (Français - défaut)
  ├── en.json          (Anglais)
  ├── es.json          (Espagnol)
  ├── de.json          (Allemand)
  └── ...
```

### Format des fichiers de traduction

```json
{
  "meta": {
    "language": "fr",
    "languageName": "Français",
    "version": "1.0.0"
  },
  "ui": {
    "title": "InnerQuest",
    "newGame": "Nouvelle partie",
    "continue": "Continuer",
    "settings": "Paramètres",
    "save": "Sauvegarder",
    "load": "Charger",
    "export": "Exporter",
    "import": "Importer"
  },
  "stats": {
    "energy": "Énergie",
    "mental": "Mental",
    "emotional": "Émotionnel",
    "spiritual": "Spiritualité",
    "balance": "Équilibre global",
    "day": "Jour {day}"
  },
  "game": {
    "dayStart": "Jour {day} - {phase}",
    "dayEnd": "Fin de journée",
    "journalPrompt": "Comment te sens-tu aujourd'hui ?",
    "nextDay": "Jour suivant",
    "chooseAction": "Que fais-tu ?"
  },
  "phases": {
    "awakening": "Le Réveil intérieur",
    "chaos": "Le Chaos émotionnel",
    "quest": "La Quête de sens",
    "harmony": "L'Harmonie retrouvée"
  },
  "settings": {
    "language": "Langue",
    "theme": "Thème",
    "fontSize": "Taille du texte",
    "animations": "Animations",
    "audio": "Audio",
    "accessibility": "Accessibilité",
    "highContrast": "Contraste élevé",
    "reduceMotion": "Réduire les animations"
  },
  "messages": {
    "gameSaved": "Partie sauvegardée",
    "gameLoaded": "Partie chargée",
    "exportSuccess": "Sauvegarde exportée avec succès",
    "importSuccess": "Sauvegarde importée avec succès",
    "error": "Une erreur est survenue",
    "confirm": "Confirmer",
    "cancel": "Annuler"
  }
}
```

---

## Système de traduction

### Module i18n.js

```javascript
// js/i18n.js
class I18n {
  constructor() {
    this.currentLocale = 'fr';
    this.translations = {};
    this.fallbackLocale = 'fr';
  }

  async init(locale = 'fr') {
    this.currentLocale = locale;
    await this.loadTranslations(locale);

    // Charger fallback si différent
    if (locale !== this.fallbackLocale) {
      await this.loadTranslations(this.fallbackLocale);
    }

    this.updateHTMLLang();
  }

  async loadTranslations(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      const data = await response.json();
      this.translations[locale] = data;
    } catch (error) {
      console.error(`Failed to load locale: ${locale}`, error);
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];

    // Parcourir les clés imbriquées
    for (const k of keys) {
      value = value?.[k];
    }

    // Fallback si traduction non trouvée
    if (!value && this.currentLocale !== this.fallbackLocale) {
      value = this.translations[this.fallbackLocale];
      for (const k of keys) {
        value = value?.[k];
      }
    }

    // Si toujours pas trouvée, retourner la clé
    if (!value) {
      console.warn(`Translation missing: ${key}`);
      return key;
    }

    // Remplacer les paramètres {key}
    return this.interpolate(value, params);
  }

  interpolate(str, params) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  async setLocale(locale) {
    if (!this.translations[locale]) {
      await this.loadTranslations(locale);
    }
    this.currentLocale = locale;
    this.updateHTMLLang();
    this.updateUI();
  }

  updateHTMLLang() {
    document.documentElement.lang = this.currentLocale;
  }

  updateUI() {
    // Émettre événement pour que l'UI se mette à jour
    window.dispatchEvent(new CustomEvent('localeChanged', {
      detail: { locale: this.currentLocale }
    }));
  }

  getAvailableLocales() {
    return Object.keys(this.translations);
  }

  getCurrentLocale() {
    return this.currentLocale;
  }
}

// Instance globale
const i18n = new I18n();
export default i18n;
```

---

## Utilisation dans le code

### Dans JavaScript

```javascript
import i18n from './i18n.js';

// Simple
const title = i18n.t('ui.title'); // "InnerQuest"

// Avec paramètres
const dayLabel = i18n.t('stats.day', { day: 5 }); // "Jour 5"

// Imbriqué
const awakening = i18n.t('phases.awakening'); // "Le Réveil intérieur"
```

### Dans HTML (data attributes)

```html
<button data-i18n="ui.newGame">Nouvelle partie</button>
<h1 data-i18n="ui.title">InnerQuest</h1>
<label data-i18n="stats.energy">Énergie</label>
```

Puis initialiser :

```javascript
function translateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n.t(key);
  });
}

// Appeler lors du changement de langue
window.addEventListener('localeChanged', translateDOM);
```

---

## Contenu narratif multilingue

### Structure events.json avec i18n

```json
{
  "id": "event_01",
  "text": {
    "fr": "Tu sens un poids invisible sur tes épaules...",
    "en": "You feel an invisible weight on your shoulders...",
    "es": "Sientes un peso invisible sobre tus hombros..."
  },
  "choices": [
    {
      "label": {
        "fr": "Te reposer",
        "en": "Rest",
        "es": "Descansar"
      },
      "effects": { "energie": +10 }
    },
    {
      "label": {
        "fr": "Ignorer ce sentiment",
        "en": "Ignore this feeling",
        "es": "Ignorar este sentimiento"
      },
      "effects": { "mental": -5 }
    }
  ]
}
```

### Helper pour récupérer texte localisé

```javascript
function getLocalizedText(textObj) {
  const locale = i18n.getCurrentLocale();
  return textObj[locale] || textObj[i18n.fallbackLocale] || textObj.fr;
}

// Utilisation
const eventText = getLocalizedText(event.text);
```

---

## Détection automatique de la langue

### Préférence du navigateur

```javascript
function detectUserLocale() {
  // Priorités :
  // 1. Sauvegarde utilisateur (localStorage)
  const saved = localStorage.getItem('preferredLocale');
  if (saved) return saved;

  // 2. Langue du navigateur
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0]; // 'fr-FR' → 'fr'

  // 3. Vérifier si supportée
  const supportedLocales = ['fr', 'en', 'es', 'de'];
  if (supportedLocales.includes(langCode)) {
    return langCode;
  }

  // 4. Fallback
  return 'fr';
}

// Initialisation
const userLocale = detectUserLocale();
await i18n.init(userLocale);
```

---

## Adaptation culturelle

### Dates et nombres

```javascript
function formatDate(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatNumber(number, locale) {
  return new Intl.NumberFormat(locale).format(number);
}
```

### Direction du texte (RTL)

Pour langues comme l'arabe/hébreu (futur) :

```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .choices {
  flex-direction: row-reverse;
}
```

```javascript
const rtlLanguages = ['ar', 'he'];
if (rtlLanguages.includes(locale)) {
  document.documentElement.dir = 'rtl';
} else {
  document.documentElement.dir = 'ltr';
}
```

---

## Checklist i18n

### Code
- [ ] Aucun texte hardcodé en français dans le code
- [ ] Toutes les chaînes UI dans fichiers de traduction
- [ ] Système de fallback fonctionnel
- [ ] Interpolation des variables ({key})
- [ ] Support pluriels (si nécessaire)
- [ ] Dates/nombres formatés selon locale

### Contenu
- [ ] Tous les événements traduits
- [ ] Toutes les quêtes traduites
- [ ] Tips/citations traduites
- [ ] Messages d'erreur traduits

### UI
- [ ] Sélecteur de langue dans paramètres
- [ ] Langue sauvegardée dans localStorage
- [ ] Mise à jour dynamique sans rechargement
- [ ] Attribut lang sur <html> correct

### Tests
- [ ] Tester chaque langue supportée
- [ ] Vérifier longueur des textes (débordements)
- [ ] Tester changement de langue en cours de jeu
- [ ] Vérifier caractères spéciaux (accents, ñ, ü, etc.)

---

## Feuille de route i18n

### Phase 1 (v0.1-0.3)
- Infrastructure i18n en place
- Français complet
- Anglais partiel (UI uniquement)

### Phase 2 (v0.4-0.6)
- Anglais complet (tous événements/quêtes)
- Espagnol (UI + événements principaux)

### Phase 3 (v1.0+)
- Espagnol complet
- Allemand
- Autres langues selon demande communauté

---

## Ressources

- [i18next](https://www.i18next.com/) (alternative si besoin d'une lib)
- [FormatJS](https://formatjs.io/) (pluriels, dates complexes)
- [Crowdin](https://crowdin.com/) (plateforme traduction collaborative)
- [Locize](https://locize.com/) (gestion traductions)

---

**Objectif** : Rendre InnerQuest accessible à un public international avec une approche scalable et maintenable.
