# 🚀 Déploiement InnerQuest sur GitHub Pages

Guide complet pour héberger InnerQuest gratuitement sur GitHub Pages.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Méthode 1: Déploiement Manuel (Simple)](#méthode-1-déploiement-manuel-simple)
3. [Méthode 2: Déploiement Automatique avec GitHub Actions (Recommandé)](#méthode-2-déploiement-automatique-avec-github-actions-recommandé)
4. [Configuration du Projet](#configuration-du-projet)
5. [Vérification et Test](#vérification-et-test)
6. [Domaine Personnalisé (Optionnel)](#domaine-personnalisé-optionnel)
7. [Troubleshooting](#troubleshooting)

---

## Prérequis

- ✅ Projet InnerQuest complet (déjà fait !)
- ✅ Repository GitHub (Sojeremy/innerquest)
- ✅ Git installé localement
- ✅ Accès push au repository

---

## Méthode 1: Déploiement Manuel (Simple)

### Étape 1: Fusionner votre branche de développement

```bash
# Retourner sur la branche principale
git checkout main

# Fusionner votre branche de développement
git merge claude/new-project-setup-011CUfBbUGYiiVJt318YikdM

# Pousser sur main
git push origin main
```

### Étape 2: Activer GitHub Pages

1. Allez sur votre repository GitHub : `https://github.com/Sojeremy/innerquest`
2. Cliquez sur **Settings** (⚙️)
3. Dans le menu latéral, cliquez sur **Pages**
4. Sous **Source**, sélectionnez :
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Cliquez sur **Save**

### Étape 3: Attendre le déploiement

GitHub Pages va automatiquement :
- Builder votre site
- Le déployer (2-3 minutes)
- Vous donner une URL : `https://sojeremy.github.io/innerquest/`

✅ **C'est tout ! Votre site est en ligne !**

---

## Méthode 2: Déploiement Automatique avec GitHub Actions (Recommandé)

Cette méthode déploie automatiquement à chaque push sur `main`.

### Étape 1: Créer le workflow GitHub Actions

Créez le fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Étape 2: Activer GitHub Pages avec GitHub Actions

1. Allez sur **Settings** → **Pages**
2. Sous **Source**, sélectionnez :
   - **Source**: `GitHub Actions`
3. Pas besoin de sauvegarder, c'est automatique !

### Étape 3: Pousser et déployer

```bash
# Ajouter le workflow
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deployment workflow"
git push origin main
```

Le déploiement se lance automatiquement ! 🎉

---

## Configuration du Projet

### Ajustement des Chemins (Important !)

GitHub Pages utilise un sous-chemin `/innerquest/`. Il faut ajuster quelques fichiers :

#### 1. Mettre à jour `manifest.json`

```json
{
  "name": "InnerQuest - Ton voyage intérieur",
  "short_name": "InnerQuest",
  "start_url": "/innerquest/",
  "scope": "/innerquest/",
  "display": "standalone",
  "theme_color": "#457B9D",
  "background_color": "#F1FAEE",
  "icons": [
    {
      "src": "/innerquest/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/innerquest/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 2. Mettre à jour `service-worker.js`

Ajouter une constante pour le base path au début du fichier :

```javascript
const BASE_PATH = '/innerquest';
const CACHE_NAME = 'innerquest-v1.0.0';
const STATIC_CACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/css/base.css`,
  `${BASE_PATH}/css/layout.css`,
  `${BASE_PATH}/css/ui.css`,
  `${BASE_PATH}/css/animations.css`,
  `${BASE_PATH}/css/themes.css`,
  `${BASE_PATH}/js/config.js`,
  `${BASE_PATH}/js/utils.js`,
  `${BASE_PATH}/js/player.js`,
  `${BASE_PATH}/js/storage.js`,
  `${BASE_PATH}/js/events.js`,
  `${BASE_PATH}/js/game.js`,
  `${BASE_PATH}/js/i18n.js`,
  `${BASE_PATH}/js/ui.js`,
  `${BASE_PATH}/js/main.js`,
  `${BASE_PATH}/data/events.json`,
  `${BASE_PATH}/data/quests.json`,
  `${BASE_PATH}/data/achievements.json`,
  `${BASE_PATH}/data/tips.json`,
  `${BASE_PATH}/locales/fr.json`,
  `${BASE_PATH}/locales/en.json`
];
```

#### 3. Créer un fichier de configuration dynamique

Créez `js/config-paths.js` :

```javascript
// Configuration des chemins selon l'environnement
const isGitHubPages = window.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/innerquest' : '';

export const paths = {
  base: BASE_PATH,
  data: `${BASE_PATH}/data`,
  locales: `${BASE_PATH}/locales`,
  assets: `${BASE_PATH}/assets`
};
```

#### 4. Mettre à jour l'enregistrement du Service Worker dans `js/main.js`

```javascript
// Dans la méthode registerServiceWorker()
registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swPath = window.location.pathname.includes('/innerquest/')
        ? '/innerquest/service-worker.js'
        : '/service-worker.js';

      navigator.serviceWorker.register(swPath)
        .then(registration => {
          logger.log('[ServiceWorker] Registered:', registration);
        })
        .catch(error => {
          logger.log('[ServiceWorker] Registration failed:', error);
        });
    });
  }
}
```

---

## Alternative: Configuration avec une Variable d'Environnement

Pour éviter de hardcoder `/innerquest/`, créez un fichier `config.js` à la racine :

```javascript
// config.js - À charger en premier dans index.html
window.APP_CONFIG = {
  basePath: '/innerquest', // Changez en '' pour local
  version: '1.0.0',
  isProduction: window.location.hostname.includes('github.io')
};
```

Puis dans `index.html`, ajoutez avant les autres scripts :

```html
<script src="config.js"></script>
```

---

## Vérification et Test

### 1. Vérifier le déploiement

Allez dans votre repository GitHub :
- **Actions** tab → Vous verrez le workflow en cours
- Attendez le ✅ vert (2-3 minutes)

### 2. Accéder à votre site

```
https://sojeremy.github.io/innerquest/
```

### 3. Tests à effectuer

- [ ] La page charge correctement
- [ ] Les styles CSS s'appliquent
- [ ] Les événements s'affichent
- [ ] Les choix fonctionnent
- [ ] Les stats se mettent à jour
- [ ] La sauvegarde fonctionne (localStorage)
- [ ] Le service worker s'installe (vérifier dans DevTools → Application)
- [ ] Le mode offline fonctionne (après 1er chargement)

### 4. Vérifier dans la Console (F12)

```javascript
// Vérifier que les ressources se chargent
console.log('Base path:', window.location.pathname);

// Vérifier le service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

---

## Domaine Personnalisé (Optionnel)

Si vous avez un domaine personnalisé (ex: `innerquest.com`) :

### Étape 1: Configurer DNS

Chez votre registrar de domaine, ajoutez :

**Pour un apex domain (innerquest.com):**
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

**Pour un subdomain (www.innerquest.com):**
```
Type: CNAME
Name: www
Value: sojeremy.github.io
```

### Étape 2: Configurer GitHub Pages

1. **Settings** → **Pages**
2. **Custom domain**: Entrez `innerquest.com` ou `www.innerquest.com`
3. Cochez **Enforce HTTPS**
4. GitHub créera automatiquement un fichier `CNAME`

### Étape 3: Mettre à jour les chemins

Si vous utilisez un domaine custom, vous pouvez retirer `/innerquest/` des chemins !

Dans `manifest.json` et `service-worker.js`, changez :
```javascript
const BASE_PATH = ''; // Plus besoin du sous-chemin !
```

---

## Troubleshooting

### Problème: Page 404

**Cause**: Les chemins ne sont pas corrects.

**Solution**:
```bash
# Vérifier que vous êtes sur la bonne branche
git branch -a

# Vérifier que index.html est à la racine
ls -la index.html

# Vérifier les paramètres GitHub Pages
# Settings → Pages → Source doit pointer vers main / (root)
```

### Problème: CSS/JS ne se chargent pas

**Cause**: Chemins relatifs incorrects.

**Solution**: Dans `index.html`, assurez-vous que les chemins sont relatifs :

```html
<!-- ✅ Bon (relatif) -->
<link rel="stylesheet" href="css/base.css">
<script type="module" src="js/main.js"></script>

<!-- ❌ Mauvais (absolu sans base path) -->
<link rel="stylesheet" href="/css/base.css">
```

### Problème: Service Worker ne s'installe pas

**Cause**: Chemin du service worker incorrect.

**Solution**: Le service worker doit être à la racine et enregistré avec le bon chemin :

```javascript
// Pour GitHub Pages
navigator.serviceWorker.register('/innerquest/service-worker.js');

// Pour domaine custom
navigator.serviceWorker.register('/service-worker.js');
```

### Problème: Déploiement échoue dans GitHub Actions

**Cause**: Permissions insuffisantes.

**Solution**:
1. **Settings** → **Actions** → **General**
2. Scroll vers **Workflow permissions**
3. Sélectionnez **Read and write permissions**
4. Sauvegardez

---

## Optimisations Post-Déploiement

### 1. Créer les Icônes PWA

Avant le déploiement final, créez vos icônes :

```bash
# Créer le dossier
mkdir -p assets/icons

# Vous devrez créer les icônes avec un outil comme:
# - Photoshop/GIMP
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator

# Tailles nécessaires:
# - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
```

### 2. Ajouter un Favicon

```html
<!-- Dans index.html, dans le <head> -->
<link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/icons/apple-touch-icon.png">
```

### 3. Ajouter Google Analytics (Optionnel)

Si vous voulez suivre les visites :

```html
<!-- Dans index.html, avant </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 4. Ajouter robots.txt

Créez `robots.txt` à la racine :

```
User-agent: *
Allow: /

Sitemap: https://sojeremy.github.io/innerquest/sitemap.xml
```

### 5. Ajouter sitemap.xml

Créez `sitemap.xml` à la racine :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sojeremy.github.io/innerquest/</loc>
    <lastmod>2025-10-31</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## Checklist Finale de Déploiement

Avant de déployer en production :

- [ ] Tous les tests passent (voir TEST-PLAN.md)
- [ ] Icônes PWA créées et placées dans `/assets/icons/`
- [ ] Favicon ajouté
- [ ] Chemins ajustés pour GitHub Pages (/innerquest/)
- [ ] Service Worker configuré correctement
- [ ] Manifest.json mis à jour
- [ ] robots.txt et sitemap.xml ajoutés
- [ ] GitHub Pages activé dans Settings
- [ ] Workflow GitHub Actions créé (méthode 2)
- [ ] Test du site déployé effectué
- [ ] Mode offline testé
- [ ] Installation PWA testée

---

## Commandes Utiles

```bash
# Voir le status du déploiement
git log --oneline -5

# Forcer un redéploiement
git commit --allow-empty -m "Trigger deployment"
git push origin main

# Voir les logs GitHub Actions
# Allez sur GitHub → Actions → Cliquez sur le workflow

# Tester localement avec le même chemin que GitHub Pages
python3 -m http.server 8080 --directory .
# Puis accédez à http://localhost:8080/innerquest/
```

---

## Ressources Supplémentaires

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 🎉 Félicitations !

Votre jeu InnerQuest est maintenant en ligne et accessible au monde entier ! 🌍

**URL de votre jeu**: `https://sojeremy.github.io/innerquest/`

Partagez-le avec vos amis, famille, et la communauté ! 🚀✨

---

**Dernière mise à jour**: 31 octobre 2025
**Version**: 1.0.0
