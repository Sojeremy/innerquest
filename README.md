# InnerQuest

Jeu narratif et introspectif (HTML/CSS/JS pur) qui fusionne **simulation de vie** et **développement personnel**.  
Objectif : offrir une expérience ludique qui aide à mieux se connaître, trouver de l’équilibre et progresser au quotidien.

## 🚀 Démarrer

- Ouvrir `index.html` dans ton navigateur (double-clic)  
- OU lancer un petit serveur local :
  - Python 3 : `python3 -m http.server 8080` puis ouvrir <http://localhost:8080>

## 🗂️ Structure

- `assets/` médias (images, audio, polices, sprites)
- `css/` styles (base, layout, ui, animations, thèmes)
- `data/` JSON (événements, quêtes, stats, tips, succès)
- `js/` modules JS (game loop, player, events, ui, storage…)
- `docs/` documentation produit & technique (cadrage, backlog, roadmap, design…)

## 🧠 Concept & mécaniques

- Besoins : énergie, mental, émotionnel, spiritualité  
- Cycle jour/nuit, événements aléatoires, choix à conséquences  
- Quêtes de transformation, journal intérieur, sauvegarde locale

## 🛠️ Tech

- 100 % statique (hébergeable **GitHub Pages**)  
- HTML/CSS/JS pur, `localStorage`, JSON data, Canvas (optionnel), PWA (optionnel)

## 🧭 Docs clés

Voir `/docs/` :

- `note-de-cadrage.md`, `cahier-des-charges.md`, `roadmap.md`, `product-backlog.md`
- `design.md`, `narrative.md`, `mechanics.md`, `architecture-technique.md`, `data-model.md`, `style-guide.md`, `changelog.md`

## 📦 Déploiement (GitHub Pages)

1. `git init && git add . && git commit -m "feat: init InnerQuest"`
2. Créer un repo sur GitHub et associer :  
   `git remote add origin <URL_DU_REPO>`
3. Pousser :  
   `git branch -M main && git push -u origin main`
4. Sur GitHub → **Settings → Pages** → Source : **Deploy from a branch** → `main` / `/ (root)`

## 🗺️ Roadmap (extrait)

- v0.1 : HUD + événements basiques
- v0.2 : Choix à conséquences + sauvegarde
- v0.3 : Quêtes + ambiance sonore
- v1.0 : PWA + optimisation mobile
