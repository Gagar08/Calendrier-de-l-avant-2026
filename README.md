# Calendrier de l’Avent 2026

Un calendrier de l’Avent statique, en français, destiné à être partagé avec un petit cercle de proches. Il fonctionne dans un navigateur moderne et peut être hébergé sur GitHub Pages, Netlify ou tout autre hébergement de fichiers statiques.

## Structure

```text
index.html       Structure de la page et commandes
style.css        Thème pixel art, mise en page et animations
script.js        Navigation, dates, ouverture des cases, modales et musique
contenu.json     Contenu des 24 jours
jeux.html        Mini-jeux accessibles depuis les jours de type « lien »
jeux.css         Styles de la page des jeux
jeux.js          Logique du memory, du jeu de réflexes et du quiz
images/fond/     Fond de page utilisé par le CSS
images/gift/     Images des cadeaux fermé, animé et ouvert
images/cadre/    Cadre de la fenêtre du cadeau
images/buttons/  Boutons graphiques, dont celui pour fermer la fenêtre
images/mini-jeux/ Sprites pixel art utilisés par les mini-jeux
sons/music/      Morceaux audio utilisés par le lecteur
sons/foley/      Effets sonores de navigation et d’ouverture des cadeaux
```

Les dossiers `images/cases/` et `images/decor/` ne sont pas nécessaires au fonctionnement actuel. Le contenu peut toutefois référencer des images, par exemple `images/cases/04.webp`.

## Fonctionnement

- Le calendrier présente **une case à la fois** et s’ouvre sur le numéro correspondant au jour du mois (limité aux cases 1 à 24). Les flèches, les touches ← et →, ou un balayage horizontal sur écran tactile permettent de changer de case.
- Le titre, le bouton musical et la case sont placés en proportion du fond : ils gardent la même position par rapport au décor quand l’image se redimensionne selon l’écran.
- Une case est déverrouillée à partir de son jour en décembre de l’année courante. Le paramètre `?date=AAAA-MM-JJ` permet de simuler une date, par exemple `?date=2026-12-07`.
- Le mode développeur donne accès à toutes les cases avec `?dev=1`, par exemple `/?dev=1` ou `/?date=2026-12-07&dev=1`. Il affiche aussi le bouton de réinitialisation.
- Cliquer sur une case déverrouillée joue l’animation du cadeau, enregistre son ouverture dans le stockage local du navigateur, puis affiche son contenu.
- Les ouvertures sont conservées dans `localStorage` sous la clé `calendrier-avent-ouvert-2026`. Elles sont propres au navigateur et à l’appareil utilisés.
- La musique ne démarre qu’après un clic sur le bouton musical. Les fichiers de `sons/music/` passent dans un ordre aléatoire, sans répétition avant que tous les morceaux aient joué. Le bouton permet aussi de mettre la lecture en pause ou de la reprendre. Les effets de `sons/foley/` accompagnent le changement de case et l’ouverture d’un cadeau.
- Échap ferme la fenêtre de contenu. Cliquer en dehors de celle-ci la ferme également.

## Personnaliser le contenu

Modifiez `contenu.json`, qui contient un tableau d’objets avec une entrée par jour. Exemple :

```json
[
  {
    "jour": 1,
    "type": "texte",
    "titre": "Un petit mot",
    "texte": "Bienvenue dans le calendrier !",
    "image": "",
    "lien": ""
  }
]
```

`jour` doit être un nombre de 1 à 24. `titre`, `texte`, `image` et `lien` sont facultatifs. Le script affiche le titre, le texte, l’image et le lien fournis, quel que soit le champ `type`. Chaque jour de type `lien` ouvre son propre jeu dans `jeux.html` : memory (jour 2), réflexes (jour 6), quiz (jour 10), suite lumineuse (jour 14), tri des cadeaux (jour 18) ou mot mystère (jour 22). Il n’y a pas de menu de sélection; le numéro du jour détermine le jeu affiché. Les mini-jeux s’ouvrent dans une fenêtre plein écran au-dessus du calendrier, qui reste actif pendant la partie. Le bouton « Retour au calendrier » ou Échap ferme le jeu. Les URL externes s’ouvrent dans un nouvel onglet. Les images doivent être accessibles par un chemin relatif au site; un visuel de remplacement s’affiche si une image ne peut pas être chargée.

Les textes d’exemple peuvent être remplacés avant publication par des contenus personnels.

## Personnaliser les visuels et les couleurs

Les images des cadeaux sont configurées au début de `script.js` :

- `images/gift/gift-close.png`
- `images/gift/gift-animation.gif`
- `images/gift/gift-open.png`

Le fond de page est défini dans `style.css` sous `images/fond/fond-noel.png`. Le cadre `images/cadre/cadre1.png` sert de fond à la fenêtre contenant le cadeau du jour; son image est étirée pour s’adapter au contenu. Remplacez les fichiers en conservant ces chemins, ou modifiez les chemins dans les fichiers concernés. Les couleurs et polices du thème sont réglées par les variables CSS au début de `style.css`. Les polices de titre et de texte sont chargées depuis Google Fonts; une police monospace de remplacement est prévue.

Les pistes musicales et effets sonores sont listés au début de `script.js`. Remplacez leurs chemins pour utiliser d’autres fichiers audio.

## Lancer en local

Le chargement de `contenu.json` passe par `fetch`, donc ouvrez le site depuis un serveur HTTP local plutôt que directement en `file://`.

Depuis le dossier du projet :

```bash
python -m http.server 8000
```

Puis ouvrez <http://localhost:8000/>. Pour tester une date, utilisez par exemple <http://localhost:8000/?date=2026-12-07>.

Sur `localhost`, le bouton **Réinitialiser les cadeaux** apparaît en bas de la scène. Il efface les ouvertures mémorisées sur ce navigateur après confirmation. Il n’est pas affiché sur le site publié. Pour recommencer le test d’ouverture manuellement, effacez la clé `calendrier-avent-ouvert-2026` dans le stockage local du navigateur.

## Déployer

Le dossier du projet peut être publié tel quel sur un hébergement statique. Pour GitHub Pages, poussez le dépôt puis sélectionnez la branche et le dossier à publier dans les paramètres Pages. Sur Netlify, publiez le dossier du site. Assurez-vous que `index.html`, `contenu.json`, les images et les fichiers audio sont inclus.

## Limites actuelles

- Les cases s’ouvrent selon la date locale de l’utilisateur; le paramètre `date` sert au test et ne sécurise pas le contenu contre une personne qui modifie l’URL ou le code.
- La mémorisation est locale au navigateur : elle n’est pas partagée entre appareils.
- Le déverrouillage utilise l’année de la date courante, tandis que la clé de stockage reste nommée pour 2026.
