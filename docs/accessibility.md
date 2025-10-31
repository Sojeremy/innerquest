# Accessibilité – InnerQuest

## Vision

InnerQuest doit être accessible à tous, quels que soient les capacités, l'équipement ou le contexte d'utilisation.

## Principes WCAG 2.1 (Niveau AA minimum)

### 1. Perceptible

#### Contraste des couleurs

- **Ratio minimum** : 4.5:1 pour le texte normal
- **Ratio minimum** : 3:1 pour le texte large (18pt+)
- **Validation** : Tester avec outils (WebAIM Contrast Checker)

#### Alternatives textuelles

- Images décoratives : `alt=""` (vide)
- Images informatives : descriptions concises
- Icônes : labels ARIA ou texte masqué visuellement

#### Contenu multimédia

- Audio ambiant : contrôle lecture/pause accessible
- Musique de fond : réglage volume + option désactivation
- Pas de lecture automatique (ou facilement arrêtable)

### 2. Utilisable

#### Navigation au clavier

- **Tab** : parcourir tous les éléments interactifs
- **Enter/Space** : activer boutons et choix
- **Escape** : fermer modales
- **Focus visible** : outline claire (min 2px) ou style personnalisé

#### Ordre de focus logique

```
1. Menu principal / Paramètres
2. Barres de stats (informatives, tabbable pour screen readers)
3. Zone narrative (contenu principal)
4. Boutons de choix (ordre logique : haut → bas)
5. Footer (sauvegarde, journal)
```

#### Pas de piège au clavier

- Modales : focus piégé dans la modale jusqu'à fermeture
- Mécanisme de sortie toujours disponible (ESC, bouton fermer)

### 3. Compréhensible

#### Langue et lisibilité

- Attribut `lang="fr"` sur `<html>`
- Police sans-serif lisible (16px minimum)
- Hauteur de ligne : 1.5 minimum
- Paragraphes courts, structure claire

#### Navigation prévisible

- Ordre de tab cohérent
- Boutons/liens avec labels explicites
- Pas de changement de contexte sans prévenir

#### Aide à la saisie (si formulaires futurs)

- Labels clairs pour champs
- Messages d'erreur descriptifs
- Instructions avant le champ

### 4. Robuste

#### Compatibilité assistive

- HTML sémantique (section, nav, main, article)
- ARIA landmarks appropriés
- Rôles ARIA explicites si nécessaire

#### Support navigateurs/assistive tech

- Tester avec NVDA (Windows), JAWS, VoiceOver (macOS/iOS)
- Vérifier compatibilité Chrome, Firefox, Safari, Edge

---

## Fonctionnalités d'accessibilité spécifiques

### Mode de contraste élevé

- Option dans paramètres
- Variables CSS adaptées (contrast-high.css)
- Texte blanc sur fond noir + couleurs vives

### Taille de police ajustable

- Petit (14px) / Moyen (16px) / Grand (18px) / Très grand (20px)
- Stockage préférence dans localStorage
- Application dynamique via classe body

### Réduction des animations

- Détection `prefers-reduced-motion`
- Option manuelle dans paramètres
- Désactiver transitions complexes, garder fonctionnalité

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Lecteur d'écran friendly

#### Structure sémantique

```html
<header role="banner">
  <nav role="navigation" aria-label="Menu principal">
    <!-- Navigation -->
  </nav>
</header>

<main role="main" id="content">
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading" class="sr-only">Vos statistiques</h2>
    <!-- Barres de stats -->
  </section>

  <article aria-labelledby="event-heading">
    <h2 id="event-heading" class="sr-only">Événement du jour</h2>
    <p id="event-text"><!-- Texte événement --></p>
  </article>

  <section aria-labelledby="choices-heading">
    <h2 id="choices-heading" class="sr-only">Vos choix</h2>
    <!-- Boutons choix -->
  </section>
</main>
```

#### Live regions pour changements dynamiques

```html
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-message">
  <!-- Messages de notification pour screen readers -->
</div>
```

#### Barres de progression accessibles

```html
<div role="progressbar"
     aria-valuenow="75"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Énergie">
  <div class="bar-fill" style="width: 75%"></div>
</div>
```

---

## Checklist d'accessibilité

### HTML/Structure

- [ ] Doctype HTML5 déclaré
- [ ] Langue déclarée (`<html lang="fr">`)
- [ ] Titre de page descriptif (`<title>`)
- [ ] Structure de titres logique (h1 → h2 → h3)
- [ ] Landmarks ARIA ou éléments sémantiques
- [ ] Skip link (Aller au contenu principal)

### Navigation

- [ ] Tous les éléments interactifs accessibles au clavier
- [ ] Ordre de tab logique
- [ ] Focus visible sur tous les éléments
- [ ] Pas de piège au clavier

### Visuels

- [ ] Contraste suffisant (texte/fond)
- [ ] Textes redimensionnables jusqu'à 200%
- [ ] Pas d'information uniquement par la couleur
- [ ] Images avec alternatives textuelles

### Interactivité

- [ ] Labels sur tous les contrôles
- [ ] États des boutons annoncés (actif, désactivé)
- [ ] Messages d'erreur clairs et liés au contrôle
- [ ] Changements dynamiques annoncés (aria-live)

### Multimédia

- [ ] Contrôles audio/vidéo accessibles
- [ ] Pas de lecture automatique ou facilement arrêtable
- [ ] Alternative textuelle pour contenu audio seul

### Responsive/Mobile

- [ ] Cibles tactiles ≥ 44x44px
- [ ] Zoom autorisé (pas de user-scalable=no)
- [ ] Orientation portrait/paysage supportée

---

## Outils de test

### Automatisés

- **axe DevTools** (extension navigateur)
- **WAVE** (WebAIM)
- **Lighthouse** (Chrome DevTools)
- **Pa11y** (CLI)

### Manuels

- **Keyboard navigation** : tester avec Tab, Enter, Esc
- **Screen readers** : NVDA (gratuit), JAWS, VoiceOver
- **Zoom** : tester jusqu'à 200% (Ctrl/Cmd + +)
- **Contraste** : WebAIM Contrast Checker

### Checklist externe

- [WebAIM WCAG Checklist](https://webaim.org/standards/wcag/checklist)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/fr/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Style Guide](https://a11y-style-guide.com/)

---

## Classe utilitaire : Screen Reader Only

```css
/* Masquer visuellement mais garder accessible aux lecteurs d'écran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Visible au focus (skip links) */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

**Objectif** : InnerQuest doit être un exemple d'accessibilité dans les jeux narratifs web.
