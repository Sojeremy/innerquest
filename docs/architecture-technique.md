# Architecture technique – InnerQuest

## Arborescence

(js, data, css…)

## Modules

- main.js → Point d’entrée
- game.js → Boucle principale
- player.js → Données joueur
- events.js → Récupération JSON
- ui.js → Affichage dynamique
- storage.js → Sauvegarde

## Flux

1. main.js → init()
2. game.js → nextDay()
3. events.js → getRandomEvent()
4. ui.js → displayEvent()
