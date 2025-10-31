# Guide de contribution – InnerQuest

Merci de votre intérêt pour contribuer à InnerQuest ! Ce guide vous aidera à participer au projet.

---

## Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Standards de code](#standards-de-code)
4. [Processus de contribution](#processus-de-contribution)
5. [Types de contributions](#types-de-contributions)
6. [Configuration de l'environnement](#configuration-de-lenvironnement)
7. [Ressources](#ressources)

---

## Code de conduite

### Nos engagements

InnerQuest est un projet bienveillant et inclusif. Nous nous engageons à :
- Respecter toutes les personnes, quels que soient leur origine, genre, orientation, religion, compétences
- Accepter les critiques constructives avec ouverture
- Favoriser un environnement d'apprentissage et de collaboration
- Prioriser le bien-être de la communauté

### Comportements inacceptables

- Harcèlement, insultes, discrimination
- Trolling, spam, commentaires dégradants
- Publication d'informations privées sans consentement
- Toute conduite non professionnelle ou malveillante

---

## Comment contribuer

### Vous pouvez aider de plusieurs façons :

1. **Signaler des bugs** via [Issues](https://github.com/votre-repo/innerquest/issues)
2. **Proposer des fonctionnalités** ou améliorations
3. **Améliorer la documentation** (corrections, clarifications, traductions)
4. **Écrire du contenu narratif** (événements, quêtes, citations)
5. **Contribuer au code** (corrections, nouvelles features)
6. **Tester et donner du feedback** sur les nouvelles versions
7. **Traduire le jeu** dans d'autres langues

---

## Standards de code

### Principes généraux

- **Simplicité** : Vanilla JS, pas de dépendances inutiles
- **Lisibilité** : Code clair > code "clever"
- **Modularité** : Séparation des responsabilités
- **Documentation** : Commenter le "pourquoi", pas le "quoi"

### JavaScript

#### Style

```javascript
// ✅ Bon
function calculateBalance(stats) {
  const { energie, mental, emotionnel, spiritualite } = stats;
  return (energie + mental + emotionnel + spiritualite) / 4;
}

// ❌ Mauvais
function calc(s){return (s.e+s.m+s.em+s.sp)/4}
```

#### Conventions de nommage

```javascript
// Variables/fonctions : camelCase
const playerStats = {};
function updateStats() {}

// Classes : PascalCase
class Player {}
class GameEngine {}

// Constantes : UPPER_SNAKE_CASE
const MAX_STAT_VALUE = 100;
const DEFAULT_LANGUAGE = 'fr';

// Privé (convention) : _prefixe
const _internalCache = {};
function _privateHelper() {}
```

#### Commentaires JSDoc

```javascript
/**
 * Applique les effets d'un choix sur les stats du joueur
 * @param {Object} effects - Objet des modifications {stat: delta}
 * @param {Object} stats - Stats actuelles du joueur
 * @returns {Object} Nouvelles stats après application
 */
function applyEffects(effects, stats) {
  // Implementation
}
```

#### ES6+ features autorisées

- `const`/`let` (jamais `var`)
- Arrow functions `() => {}`
- Destructuring `const { a, b } = obj`
- Template literals `` `Jour ${day}` ``
- Spread operator `...array`
- Modules ES6 `import/export`
- Optional chaining `obj?.prop`
- Nullish coalescing `value ?? default`

### HTML

```html
<!-- Sémantique et accessible -->
<section aria-labelledby="stats-heading">
  <h2 id="stats-heading" class="sr-only">Vos statistiques</h2>
  <!-- Contenu -->
</section>

<!-- Attributs data pour i18n -->
<button data-i18n="ui.save" class="btn btn-primary">
  Sauvegarder
</button>

<!-- ARIA approprié -->
<div role="progressbar"
     aria-valuenow="75"
     aria-valuemin="0"
     aria-valuemax="100">
  <div class="bar-fill" style="width: 75%"></div>
</div>
```

### CSS

```css
/* BEM-like naming */
.stat-bar { }
.stat-bar__fill { }
.stat-bar--low { }

/* Variables CSS pour thèmes */
:root {
  --color-bg: #FDFCF7;
  --color-primary: #457B9D;
}

/* Mobile-first */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}
```

### JSON

```json
{
  "id": "event_01",
  "text": {
    "fr": "Texte en français",
    "en": "Text in English"
  },
  "choices": [
    {
      "label": { "fr": "Choix", "en": "Choice" },
      "effects": { "energie": -10 }
    }
  ]
}
```

---

## Processus de contribution

### 1. Fork et clone

```bash
# Fork via GitHub UI, puis :
git clone https://github.com/VOTRE-USERNAME/innerquest.git
cd innerquest
```

### 2. Créer une branche

```bash
# Nommage : type/description-courte
git checkout -b feature/add-meditation-events
git checkout -b fix/stat-calculation-bug
git checkout -b docs/improve-readme
```

Types de branches :
- `feature/` : nouvelle fonctionnalité
- `fix/` : correction de bug
- `docs/` : documentation
- `content/` : événements, quêtes, narratif
- `refactor/` : refactoring sans changement fonctionnel
- `test/` : ajout de tests

### 3. Développer

```bash
# Commits fréquents et atomiques
git add .
git commit -m "feat: add meditation event category"
git commit -m "fix: clamp stats to 0-100 range"
git commit -m "docs: clarify event structure in data-model.md"
```

### 4. Tester

```bash
# Ouvrir dans navigateur
open index.html

# Vérifier tests (si applicable)
open tests/test-runner.html

# Vérifier accessibilité (axe DevTools)
```

### 5. Push et Pull Request

```bash
git push origin feature/add-meditation-events
```

Puis créer une PR sur GitHub avec :
- **Titre clair** : "Add meditation event category"
- **Description** : Expliquer quoi/pourquoi/comment
- **Screenshots** si changements UI
- **Checklist** :
  - [ ] Code testé manuellement
  - [ ] Documentation mise à jour si nécessaire
  - [ ] Respect des standards de code
  - [ ] Pas de régression sur fonctionnalités existantes

### 6. Review et merge

- Attendre review d'un mainteneur
- Répondre aux commentaires
- Effectuer corrections si demandées
- Une fois approuvé → merge !

---

## Types de contributions

### 🐛 Signaler un bug

**Template Issue** :

```markdown
**Description**
Que se passe-t-il ? Quel est le comportement attendu ?

**Reproduction**
1. Aller à...
2. Cliquer sur...
3. Constater...

**Environnement**
- Navigateur : Chrome 110 / Firefox 108 / Safari 16
- OS : Windows 11 / macOS 13 / Ubuntu 22.04
- Mobile/Desktop

**Screenshots**
Si applicable

**Logs console**
```

### ✨ Proposer une fonctionnalité

**Template Issue** :

```markdown
**Problème / Besoin**
Quel problème cette feature résout-elle ?

**Solution proposée**
Description de votre idée

**Alternatives considérées**
Autres approches possibles ?

**Contexte additionnel**
Mockups, exemples, références...
```

### 📝 Contribuer du contenu narratif

**Processus** :

1. Lire `/docs/narrative.md` et `/docs/data-model.md`
2. Créer événements/quêtes dans `/data/*.json`
3. Respecter la structure JSON
4. Écrire un texte immersif, bienveillant, introspectif
5. Équilibrer les effets (ne pas déséquilibrer le jeu)
6. Soumettre PR avec description du thème/ton

**Critères de qualité** :

- Texte sans fautes, fluide
- Ton aligné avec l'esprit InnerQuest (calme, introspectif, positif)
- Choix avec conséquences logiques
- Effets équilibrés (total delta proche de 0 ou léger positif)
- Diversité des thèmes (travail, relations, santé, sens, créativité)

### 🌍 Traduire le jeu

1. Copier `/locales/fr.json` vers `/locales/XX.json` (XX = code langue)
2. Traduire toutes les clés
3. Tester avec `i18n.setLocale('XX')`
4. Soumettre PR

**Ressources** :
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

---

## Configuration de l'environnement

### Prérequis

- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Éditeur de code (VS Code recommandé)
- Git
- Serveur local (Python, Node http-server, VS Code Live Server...)

### Setup recommandé VS Code

**Extensions** :

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- [axe Accessibility Linter](https://marketplace.visualstudio.com/items?itemName=deque-systems.vscode-axe-linter)

**settings.json** :

```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.eol": "\n",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Lancer le projet

```bash
# Méthode 1 : Python
python3 -m http.server 8080
# Ouvrir http://localhost:8080

# Méthode 2 : Node
npx http-server -p 8080

# Méthode 3 : VS Code Live Server
# Clic droit sur index.html > Open with Live Server
```

---

## Checklist avant PR

- [ ] Code fonctionne sans erreur console
- [ ] Tests manuels effectués
- [ ] Documentation mise à jour si nécessaire
- [ ] Commentaires JSDoc si nouvelles fonctions publiques
- [ ] Commits clairs et atomiques
- [ ] Respect des standards de code
- [ ] Pas de fichiers inutiles (node_modules, .DS_Store...)
- [ ] Accessibilité vérifiée (navigation clavier, screen reader)
- [ ] Responsive testé (mobile + desktop)
- [ ] Compatibilité navigateurs (Chrome, Firefox, Safari minimum)

---

## Communication

### Où discuter ?

- **Issues GitHub** : Bugs, features, questions
- **Pull Requests** : Discussions sur code spécifique
- **Discussions GitHub** (si activé) : Questions générales, idées, entraide

### Ton et langage

- Soyez respectueux et bienveillant
- Posez des questions si quelque chose n'est pas clair
- Acceptez le feedback avec ouverture
- Français ou anglais acceptés

---

## Reconnaissance des contributeurs

Tous les contributeurs seront mentionnés dans :
- Section "Contributors" du README
- Fichier CONTRIBUTORS.md
- Changelog pour contributions majeures

---

## Ressources

### Documentation projet

- [README.md](../README.md) - Vue d'ensemble
- [docs/](../docs/) - Documentation complète
- [CHANGELOG.md](../docs/changelog.md) - Historique des versions

### Références externes

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/) - Best practices web
- [A11y Project](https://www.a11yproject.com/) - Accessibilité
- [Conventional Commits](https://www.conventionalcommits.org/) - Format commits

---

## Questions ?

Si vous avez des questions non couvertes par ce guide :

1. Cherchez dans les [Issues existantes](https://github.com/votre-repo/innerquest/issues)
2. Consultez la [documentation](../docs/)
3. Ouvrez une nouvelle Issue avec le label `question`

---

**Merci de contribuer à InnerQuest ! Ensemble, créons une expérience de jeu introspective et accessible à tous.** 🌟
