# Plan de Test MVP - InnerQuest

**Date**: 31 octobre 2025
**Version**: 1.0.0
**Status**: Prêt pour test

---

## 🎯 Objectifs du Test

Valider le fonctionnement complet du MVP d'InnerQuest avec :
- ✅ Cycle de jeu complet (événement → choix → stats → journal → prochain jour)
- ✅ Système de sauvegarde/chargement
- ✅ Internationalisation (FR/EN)
- ✅ Accessibilité (WCAG 2.1 Level AA)
- ✅ PWA (fonctionnement offline)
- ✅ Thèmes et paramètres

---

## 🚀 Prérequis

### Démarrer le serveur local
```bash
cd /home/user/innerquest
python3 -m http.server 8080
```

### Ouvrir l'application
Navigateur web : `http://localhost:8080/index.html`

### Navigateurs recommandés pour les tests
- ✅ Chrome/Edge (meilleur support PWA)
- ✅ Firefox (bon support accessibilité)
- ✅ Safari (test iOS/macOS)

---

## 📋 Checklist de Test

### 1. Premier Chargement ✓

**Attendu:**
- [ ] Écran de chargement s'affiche brièvement
- [ ] Transition vers l'écran d'accueil
- [ ] Titre "InnerQuest" visible
- [ ] Bouton "Nouvelle partie" disponible
- [ ] Bouton "Continuer" NON visible (pas de sauvegarde)
- [ ] Bouton "Paramètres" visible

**Console du navigateur (F12):**
```
[i18n] Locale chargée: fr
[InnerQuest] Initialisation terminée
[ServiceWorker] Installing...
[ServiceWorker] Caching app shell
```

---

### 2. Nouvelle Partie ✓

**Actions:**
1. Cliquer sur "Nouvelle partie"

**Attendu:**
- [ ] Transition vers l'écran de jeu
- [ ] Header visible avec :
  - "Jour 1"
  - Phase indicator (devrait être vide ou montrer phase actuelle)
  - Bouton menu (☰)
- [ ] 4 barres de stats à 50% :
  - Énergie (orange)
  - Mental (bleu)
  - Émotionnel (rouge)
  - Spiritualité (violet)
- [ ] Équilibre global : 50%
- [ ] Texte d'événement affiché (fade in animation)
- [ ] 2-4 boutons de choix visibles

**Console:**
```
[Game] Nouvelle partie créée
[Game] Jour 1 démarré
[EventSystem] Événement chargé: awakening_001
```

---

### 3. Cycle de Jeu ✓

**Actions:**
1. Lire l'événement narratif
2. Choisir une option (cliquer sur un bouton de choix)

**Attendu:**
- [ ] Animation de transition sur le choix
- [ ] Barres de stats s'animent (augmentent/diminuent selon les effets)
- [ ] Couleur des barres change selon le niveau :
  - Vert : > 70%
  - Jaune : 30-70%
  - Rouge : < 30%
- [ ] Équilibre global se recalcule
- [ ] Modal "Journal" s'ouvre avec :
  - "Comment te sens-tu aujourd'hui ?"
  - Zone de texte pour écrire
  - Boutons "Passer" et "Confirmer"

**Console:**
```
[Game] Choix sélectionné: 0
[Player] Effets appliqués: {energie: +5, mental: -2, ...}
[UI] Stats mises à jour
[Storage] Partie sauvegardée
```

---

### 4. Journal ✓

**Test A - Écrire dans le journal:**
1. Écrire quelques phrases dans le journal
2. Cliquer "Confirmer"

**Attendu:**
- [ ] Modal se ferme
- [ ] Notification "Journal sauvegardé" apparaît (toast)
- [ ] Transition vers le jour suivant
- [ ] "Jour 2" affiché
- [ ] Nouvel événement chargé

**Test B - Passer le journal:**
1. Cliquer "Passer" sans écrire

**Attendu:**
- [ ] Modal se ferme immédiatement
- [ ] Passage au jour suivant sans notification

---

### 5. Menu & Navigation ✓

**Actions:**
1. Cliquer sur le bouton menu (☰) en haut à droite

**Attendu:**
- [ ] Modal menu s'ouvre avec overlay
- [ ] Boutons visibles :
  - Reprendre
  - Sauvegarder
  - Exporter sauvegarde
  - Importer sauvegarde
  - Paramètres
  - Nouveau jeu
- [ ] Cliquer sur overlay ferme le modal
- [ ] Cliquer sur X ferme le modal

---

### 6. Sauvegarde/Chargement ✓

**Test A - Sauvegarde manuelle:**
1. Ouvrir le menu
2. Cliquer "Sauvegarder"

**Attendu:**
- [ ] Notification "Partie sauvegardée"
- [ ] Menu se ferme

**Test B - Auto-save:**
1. Jouer normalement
2. Attendre 30 secondes sans action

**Attendu (Console):**
```
[Game] Auto-save...
[Storage] Partie sauvegardée
```

**Test C - Rechargement:**
1. Fermer l'onglet du navigateur
2. Rouvrir `http://localhost:8080/index.html`

**Attendu:**
- [ ] Écran d'accueil s'affiche
- [ ] Bouton "Continuer" maintenant visible
- [ ] Info de sauvegarde affichée : "Jour X - Équilibre: Y%"
- [ ] Cliquer "Continuer" restaure la partie exactement où on était

---

### 7. Export/Import ✓

**Test Export:**
1. Menu → "Exporter sauvegarde"

**Attendu:**
- [ ] Fichier `innerquest_save_YYYY-MM-DD.json` téléchargé
- [ ] Notification "Sauvegarde exportée avec succès"

**Test Import:**
1. Menu → "Importer sauvegarde"
2. Sélectionner le fichier JSON exporté

**Attendu:**
- [ ] Notification "Sauvegarde importée avec succès"
- [ ] Partie restaurée à partir du fichier

---

### 8. Paramètres ✓

**Actions:**
1. Ouvrir "Paramètres" (depuis menu ou écran d'accueil)

**Attendu:**
- [ ] Modal paramètres avec sections :
  - Thème : Clair / Sombre
  - Taille du texte : Petit / Moyen / Grand / Très grand
  - Animations : checkbox
  - Contraste élevé : checkbox
  - Réduire les animations : checkbox

**Test Thème Sombre:**
1. Changer "Thème" → "Sombre"

**Attendu:**
- [ ] Fond passe au sombre (#1F2937)
- [ ] Texte devient clair (#F9FAFB)
- [ ] Changement immédiat et fluide

**Test Taille du texte:**
1. Changer "Taille du texte" → "Grand"

**Attendu:**
- [ ] Tout le texte augmente de taille
- [ ] Layout reste cohérent

**Test Réduire animations:**
1. Cocher "Réduire les animations"

**Attendu:**
- [ ] Animations deviennent quasi-instantanées
- [ ] Transitions très rapides

---

### 9. Footer & Modals Additionnels ✓

**Actions:**
1. Cliquer sur l'icône "Journal" (📖) dans le footer

**Attendu:**
- [ ] Modal affichant l'historique du journal
- [ ] Liste des entrées par jour
- [ ] Si vide : "Ton journal est vide pour le moment"

**Actions:**
2. Cliquer sur l'icône "Quêtes" (📜) dans le footer

**Attendu:**
- [ ] Modal des quêtes (même si pas encore de quêtes actives)

**Actions:**
3. Cliquer sur l'icône "Succès" (🏆) dans le footer

**Attendu:**
- [ ] Modal des succès (liste des succès débloqués/verrouillés)

---

### 10. Accessibilité (Clavier) ✓

**Actions:**
1. Recharger la page
2. Appuyer sur `Tab` plusieurs fois

**Attendu:**
- [ ] Focus visible avec outline bleu clair
- [ ] Navigation logique : boutons → paramètres
- [ ] Appuyer `Enter` active le bouton focalisé
- [ ] Appuyer `Escape` ferme les modals

**Test Skip Link:**
1. Recharger et appuyer `Tab` une fois

**Attendu:**
- [ ] "Aller au contenu principal" apparaît en haut
- [ ] Appuyer `Enter` fait défiler jusqu'au contenu

---

### 11. Screen Reader ✓

**Outil recommandé:**
- Windows : NVDA (gratuit) ou JAWS
- macOS : VoiceOver (intégré)
- Linux : Orca

**Test:**
1. Activer le screen reader
2. Naviguer dans l'application

**Attendu:**
- [ ] Stats annoncées : "Énergie 50 sur 100"
- [ ] Boutons annoncés avec labels clairs
- [ ] Changements d'état annoncés (jour, stats)
- [ ] Modals annoncés avec titres

---

### 12. PWA Installation ✓

**Chrome/Edge:**
1. Ouvrir l'application
2. Chercher icône "Installer" dans la barre d'adresse
3. Cliquer "Installer"

**Attendu:**
- [ ] Fenêtre d'installation apparaît
- [ ] Application s'installe comme app native
- [ ] Icône apparaît sur le bureau/menu
- [ ] Ouvrir depuis l'icône : app en mode standalone (sans barre d'adresse)

---

### 13. Mode Offline ✓

**Actions:**
1. Jouer quelques tours (pour que le cache se remplisse)
2. Ouvrir DevTools (F12) → Network
3. Cocher "Offline"
4. Recharger la page

**Attendu:**
- [ ] Application charge depuis le cache
- [ ] Toutes les ressources disponibles
- [ ] Jeu continue de fonctionner normalement
- [ ] Sauvegarde fonctionne (localStorage)

**Console:**
```
[ServiceWorker] Cache hit: /index.html
[ServiceWorker] Cache hit: /js/main.js
[ServiceWorker] Cache hit: /css/base.css
```

---

### 14. Progression de Phase ✓

**Actions:**
1. Jouer plusieurs jours (15-20 jours)
2. Observer les changements

**Attendu:**
- [ ] Phase change après environ 15 jours
- [ ] Nouveaux types d'événements apparaissent
- [ ] Couleur primaire peut changer subtilement (thèmes par phase)
- [ ] Texte de phase affiché

**Phases:**
- Phase 0 (J1-15) : Le Réveil intérieur
- Phase 1 (J16-30) : Le Chaos émotionnel
- Phase 2 (J31-45) : La Quête de sens
- Phase 3 (J46+) : L'Harmonie retrouvée

---

### 15. Responsive Design ✓

**Actions:**
1. Redimensionner la fenêtre du navigateur
2. Tester en mode mobile (DevTools → Device Toolbar)

**Attendu:**
- [ ] Layout s'adapte aux petits écrans
- [ ] Texte reste lisible
- [ ] Boutons restent cliquables
- [ ] Pas de scroll horizontal
- [ ] Modal prend toute la hauteur sur mobile

**Breakpoints:**
- Mobile : < 768px
- Tablet : 768px - 1024px
- Desktop : > 1024px

---

## 🐛 Bugs à Surveiller

### Critiques (bloquants)
- [ ] Impossible de faire un choix (boutons ne répondent pas)
- [ ] Stats ne se mettent pas à jour
- [ ] Sauvegarde ne fonctionne pas
- [ ] JavaScript errors bloquant le jeu

### Majeurs (fonctionnalité cassée)
- [ ] Modal ne se ferme pas
- [ ] Animations saccadées
- [ ] Service Worker ne cache pas les ressources
- [ ] Thème ne change pas

### Mineurs (cosmétiques)
- [ ] Couleurs de stats incorrectes
- [ ] Texte mal aligné
- [ ] Animations trop rapides/lentes
- [ ] Contraste insuffisant

---

## 📊 Métriques de Performance

**Ouvrir DevTools → Lighthouse:**
1. Désactiver le mode offline
2. Run Lighthouse audit

**Objectifs:**
- Performance : > 90
- Accessibility : > 95
- Best Practices : > 90
- SEO : > 90
- PWA : Checkmark ✅

---

## ✅ Validation Finale

**Le MVP est validé si:**
- [ ] ✅ Cycle de jeu complet fonctionne (événement → choix → stats → journal → next day)
- [ ] ✅ Sauvegarde/chargement/export/import fonctionnent
- [ ] ✅ Auto-save fonctionne toutes les 30s
- [ ] ✅ PWA installable et fonctionne offline
- [ ] ✅ Thèmes (clair/sombre) fonctionnent
- [ ] ✅ Accessibilité clavier complète
- [ ] ✅ Pas d'erreurs critiques en console
- [ ] ✅ Responsive sur mobile/tablet/desktop
- [ ] ✅ Performance Lighthouse > 90

---

## 🔧 Commandes de Debug

### Console du navigateur (F12)
```javascript
// Voir l'état du joueur
console.log(JSON.parse(localStorage.getItem('innerquest_save')))

// Forcer une sauvegarde
app.game.storage.save(app.game.player)

// Changer de jour manuellement
app.game.player.day = 20
app.ui.updateDay(20)

// Forcer un changement de phase
app.game.player.phase = 1
document.body.setAttribute('data-phase', '1')

// Voir les événements disponibles
app.game.events.events

// Activer le mode debug
localStorage.setItem('innerquest_debug', 'true')
location.reload()
```

---

## 📝 Rapport de Test

**Template de rapport:**

```
# Test Report - InnerQuest MVP

**Date**: _____
**Testeur**: _____
**Navigateur**: _____ (version)
**OS**: _____

## Tests Réussis
- [ ] Premier chargement
- [ ] Nouvelle partie
- [ ] Cycle de jeu
- [ ] Journal
- [ ] Menu & Navigation
- [ ] Sauvegarde/Chargement
- [ ] Export/Import
- [ ] Paramètres
- [ ] Accessibilité
- [ ] PWA
- [ ] Offline
- [ ] Responsive

## Bugs Trouvés
1. [Critique/Majeur/Mineur] Description du bug
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...
   - Console errors: ...

## Observations
- Performance: ...
- UX: ...
- Suggestions: ...

## Score Lighthouse
- Performance: ___
- Accessibility: ___
- Best Practices: ___
- PWA: ___

## Conclusion
[ ] ✅ MVP VALIDÉ - Prêt pour la production
[ ] ⚠️ MVP PARTIELLEMENT VALIDÉ - Bugs mineurs à corriger
[ ] ❌ MVP NON VALIDÉ - Bugs critiques à corriger
```

---

## 🎉 Prochaines Étapes Après Validation

Une fois le MVP validé :
1. Créer les assets graphiques (icônes, screenshots)
2. Ajouter plus d'événements et de contenu narratif
3. Implémenter le système de quêtes complet
4. Ajouter les langues supplémentaires (EN, ES, DE)
5. Implémenter le système audio (musique, effets sonores)
6. Optimiser les performances
7. Déployer sur un hébergement web
8. Soumettre aux app stores (PWA)

---

**Bon test ! 🚀**
