# Guide de tests – InnerQuest

## Philosophie de test

InnerQuest étant un projet vanilla JS sans framework, nous adoptons une approche pragmatique :
- **Tests unitaires** pour la logique métier critique
- **Tests d'intégration** pour les flux de jeu
- **Tests manuels** pour l'expérience utilisateur
- **Tests d'accessibilité** automatisés et manuels

---

## Structure des tests

```
/tests
  ├── unit/
  │   ├── player.test.js
  │   ├── events.test.js
  │   ├── storage.test.js
  │   └── utils.test.js
  ├── integration/
  │   ├── game-loop.test.js
  │   ├── save-load.test.js
  │   └── ui-interaction.test.js
  ├── e2e/
  │   └── full-game-flow.test.js
  ├── fixtures/
  │   ├── mock-events.json
  │   └── mock-player.json
  └── test-runner.html
```

---

## Framework de test : Minimal Test Suite

Pour rester dans l'esprit "vanilla", nous utilisons une suite de test minimaliste.

### test-framework.js

```javascript
// tests/test-framework.js
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  describe(suiteName, callback) {
    console.group(suiteName);
    callback();
    console.groupEnd();
  }

  it(testName, callback) {
    try {
      callback();
      this.passed++;
      console.log(`✅ ${testName}`);
    } catch (error) {
      this.failed++;
      console.error(`❌ ${testName}`);
      console.error(error);
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toEqual: (expected) => {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
          throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, got ${actual}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} > ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} < ${expected}`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      },
      toThrow: () => {
        try {
          actual();
          throw new Error('Expected function to throw');
        } catch (e) {
          // Expected
        }
      }
    };
  }

  summary() {
    console.log('\n--- Test Summary ---');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`Total: ${this.passed + this.failed}`);
  }
}

const test = new TestRunner();
export default test;
```

---

## Tests unitaires

### Exemple : player.test.js

```javascript
import test from '../test-framework.js';
import { Player } from '../../js/player.js';

test.describe('Player module', () => {

  test.it('should initialize with default stats', () => {
    const player = new Player();
    test.expect(player.stats.energie).toBe(50);
    test.expect(player.stats.mental).toBe(50);
    test.expect(player.stats.emotionnel).toBe(50);
    test.expect(player.stats.spiritualite).toBe(50);
  });

  test.it('should calculate global balance correctly', () => {
    const player = new Player();
    player.stats = {
      energie: 60,
      mental: 70,
      emotionnel: 80,
      spiritualite: 90
    };
    test.expect(player.getGlobalBalance()).toBe(75);
  });

  test.it('should clamp stats between 0 and 100', () => {
    const player = new Player();
    player.updateStat('energie', 150);
    test.expect(player.stats.energie).toBe(100);

    player.updateStat('mental', -50);
    test.expect(player.stats.mental).toBe(0);
  });

  test.it('should apply effects correctly', () => {
    const player = new Player();
    const effects = {
      energie: -10,
      mental: +15
    };
    player.applyEffects(effects);
    test.expect(player.stats.energie).toBe(40);
    test.expect(player.stats.mental).toBe(65);
  });

  test.it('should track day count', () => {
    const player = new Player();
    test.expect(player.day).toBe(1);
    player.nextDay();
    test.expect(player.day).toBe(2);
  });

});
```

### Exemple : utils.test.js

```javascript
import test from '../test-framework.js';
import { clamp, randomInt, shuffleArray } from '../../js/utils.js';

test.describe('Utils module', () => {

  test.it('clamp should limit value to range', () => {
    test.expect(clamp(150, 0, 100)).toBe(100);
    test.expect(clamp(-10, 0, 100)).toBe(0);
    test.expect(clamp(50, 0, 100)).toBe(50);
  });

  test.it('randomInt should return value in range', () => {
    for (let i = 0; i < 100; i++) {
      const value = randomInt(1, 10);
      test.expect(value).toBeGreaterThan(0);
      test.expect(value).toBeLessThan(11);
    }
  });

  test.it('shuffleArray should not modify original', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(copy);
    test.expect(original).toEqual([1, 2, 3, 4, 5]);
  });

});
```

---

## Tests d'intégration

### Exemple : game-loop.test.js

```javascript
import test from '../test-framework.js';
import { Game } from '../../js/game.js';
import { Player } from '../../js/player.js';

test.describe('Game loop integration', () => {

  test.it('should trigger event on new day', async () => {
    const game = new Game();
    const player = new Player();

    game.init(player);
    const event = await game.nextDay();

    test.expect(event).toBeTruthy();
    test.expect(event.id).toBeTruthy();
    test.expect(event.text).toBeTruthy();
    test.expect(event.choices.length).toBeGreaterThan(0);
  });

  test.it('should apply choice effects to player', () => {
    const game = new Game();
    const player = new Player();

    const mockEvent = {
      id: 'test_event',
      choices: [
        {
          label: 'Choix A',
          effects: { energie: -10, mental: +5 }
        }
      ]
    };

    const initialEnergy = player.stats.energie;
    const initialMental = player.stats.mental;

    game.selectChoice(player, mockEvent.choices[0]);

    test.expect(player.stats.energie).toBe(initialEnergy - 10);
    test.expect(player.stats.mental).toBe(initialMental + 5);
  });

});
```

### Exemple : save-load.test.js

```javascript
import test from '../test-framework.js';
import { Storage } from '../../js/storage.js';
import { Player } from '../../js/player.js';

test.describe('Save/Load system', () => {

  test.it('should save and load player state', () => {
    const storage = new Storage();
    const player = new Player();

    player.stats.energie = 75;
    player.day = 5;

    storage.save(player);
    const loaded = storage.load();

    test.expect(loaded.stats.energie).toBe(75);
    test.expect(loaded.day).toBe(5);
  });

  test.it('should handle corrupted save gracefully', () => {
    const storage = new Storage();
    localStorage.setItem('innerquest_save', 'invalid json');

    const loaded = storage.load();
    test.expect(loaded).toBe(null);
  });

  test.it('should export and import save', () => {
    const storage = new Storage();
    const player = new Player();
    player.stats.energie = 80;

    const exported = storage.exportSave(player);
    test.expect(exported).toBeTruthy();

    const imported = storage.importSave(exported);
    test.expect(imported.stats.energie).toBe(80);
  });

});
```

---

## Tests End-to-End (manuels ou Playwright)

### Checklist E2E

- [ ] **Nouveau jeu** : Lance le jeu, affiche HUD et premier événement
- [ ] **Choix** : Cliquer sur choix applique effets et passe au jour suivant
- [ ] **Barres de stats** : Visuellement correctes après chaque choix
- [ ] **Sauvegarde auto** : Rafraîchir page → partie reprend où elle s'est arrêtée
- [ ] **Journal** : Entrées de journal enregistrées par jour
- [ ] **Quêtes** : Progression détectée et récompense appliquée
- [ ] **Achievements** : Débloqué au bon moment
- [ ] **Paramètres** : Changement thème/langue/taille police fonctionne
- [ ] **Export/Import** : Sauvegardes exportées/importées correctement
- [ ] **Mobile** : Interface responsive, cibles tactiles suffisantes

---

## Tests d'accessibilité

### Automatisés (axe-core)

```html
<!-- tests/accessibility.test.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Tests - InnerQuest</title>
  <script src="https://cdn.jsdelivr.net/npm/axe-core@latest/axe.min.js"></script>
</head>
<body>
  <div id="app">
    <!-- Charger UI InnerQuest ici -->
  </div>

  <script>
    axe.run(document, {
      rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'aria-roles': { enabled: true }
      }
    }).then(results => {
      if (results.violations.length === 0) {
        console.log('✅ No accessibility violations found');
      } else {
        console.error('❌ Accessibility violations:', results.violations);
      }
    });
  </script>
</body>
</html>
```

### Manuels (checklist)

- [ ] Navigation au clavier (Tab, Enter, Esc)
- [ ] Focus visible sur tous éléments interactifs
- [ ] Screen reader (NVDA/VoiceOver) annonce correctement
- [ ] Contraste couleurs > 4.5:1
- [ ] Zoom 200% : contenu lisible, pas de débordement
- [ ] Reduced motion : animations désactivées

---

## Tests de performance

### Lighthouse (Chrome DevTools)

Cibles :
- **Performance** : > 90
- **Accessibility** : > 95
- **Best Practices** : > 90
- **SEO** : > 90

### Métriques clés

- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3s
- **TBT** (Total Blocking Time) : < 200ms

### Script de test perf

```javascript
// tests/performance.test.js
console.time('App initialization');
await initApp();
console.timeEnd('App initialization');

console.time('Event loading');
const events = await loadEvents();
console.timeEnd('Event loading');

console.time('UI render');
renderUI();
console.timeEnd('UI render');
```

---

## Lancer les tests

### En local

```bash
# Ouvrir dans navigateur
open tests/test-runner.html

# OU serveur local
python3 -m http.server 8080
# Puis naviguer vers http://localhost:8080/tests/test-runner.html
```

### test-runner.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>InnerQuest Test Runner</title>
  <style>
    body { font-family: monospace; padding: 2rem; }
    .passed { color: green; }
    .failed { color: red; }
  </style>
</head>
<body>
  <h1>InnerQuest Test Suite</h1>
  <div id="results"></div>

  <script type="module">
    import test from './test-framework.js';

    // Importer tous les tests
    import './unit/player.test.js';
    import './unit/utils.test.js';
    import './unit/storage.test.js';
    import './integration/game-loop.test.js';
    import './integration/save-load.test.js';

    // Afficher résumé
    test.summary();
  </script>
</body>
</html>
```

---

## CI/CD (GitHub Actions - futur)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Playwright
        run: npm install -D @playwright/test
      - name: Run tests
        run: npx playwright test
      - name: Run Lighthouse
        run: npm run lighthouse-ci
```

---

## Bonnes pratiques

1. **Tester ce qui compte** : Logique métier > UI superficielle
2. **Tests isolés** : Chaque test indépendant (pas d'état partagé)
3. **Mocks/Fixtures** : Données de test stables et reproductibles
4. **Tests lisibles** : Noms descriptifs, structure AAA (Arrange, Act, Assert)
5. **Couverture raisonnable** : Viser 70-80% sur logique critique, pas 100%

---

## Ressources

- [Playwright](https://playwright.dev/) - E2E testing
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - Performance
- [Testing Best Practices](https://testingjavascript.com/)

---

**Objectif** : InnerQuest testé et fiable, avec une suite de tests maintenable et pragmatique.
