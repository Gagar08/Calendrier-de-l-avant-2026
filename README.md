# Calendrier de l’Avent 2026

Un calendrier de l’Avent statique, en français, destiné à être partagé avec un petit cercle de proches. Il fonctionne dans un navigateur moderne et peut être hébergé sur GitHub Pages, Netlify ou tout autre hébergement de fichiers statiques.

## Structure

```text
index.html       Structure de la page et commandes
style.css        Thème pixel art, mise en page et animations
script.js        Navigation, dates, ouverture des cases, modale et musique
contenu.json     Contenu des 24 jours
images/fond/     Fond de page utilisé par le CSS
images/gift/     Images des cadeaux fermé, animé et ouvert
images/cadre/    Cadre de la fenêtre du cadeau
images/buttons/  Boutons graphiques, dont celui pour fermer la fenêtre
sons/            Morceaux audio utilisés par le lecteur
```

Les dossiers `images/cases/` et `images/decor/` ne sont pas nécessaires au fonctionnement actuel. Le contenu peut toutefois référencer des images, par exemple `images/cases/04.webp`.

## Fonctionnement

- Le calendrier présente **une case à la fois** et s’ouvre sur le numéro correspondant au jour du mois (limité aux cases 1 à 24). Les flèches, les touches ← et →, ou un balayage horizontal sur écran tactile permettent de changer de case.
- Une case est déverrouillée à partir de son jour en décembre de l’année courante. Le paramètre `?date=AAAA-MM-JJ` permet de simuler une date, par exemple `?date=2026-12-07`.
- Cliquer sur une case déverrouillée joue l’animation du cadeau, enregistre son ouverture dans le stockage local du navigateur, puis affiche son contenu.
- Les ouvertures sont conservées dans `localStorage` sous la clé `calendrier-avent-ouvert-2026`. Elles sont propres au navigateur et à l’appareil utilisés.
- La musique utilise les fichiers du dossier `sons/`. La lecture automatique peut être bloquée par le navigateur jusqu’à une interaction. Le bouton ♫ permet de lancer ou mettre en pause la lecture; les morceaux s’enchaînent.
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

`jour` doit être un nombre de 1 à 24. `titre`, `texte`, `image` et `lien` sont facultatifs. Le script affiche le titre, le texte, l’image et le lien fournis, quel que soit le champ `type` : celui-ci sert surtout à décrire le contenu dans les données. Les images doivent être accessibles par un chemin relatif au site; un visuel de remplacement s’affiche si une image ne peut pas être chargée. Les liens s’ouvrent dans un nouvel onglet.

Remplacez les URL `example.com` et les textes de démonstration avant publication si vous souhaitez des contenus personnels.

## Personnaliser les visuels et les couleurs

Les images des cadeaux sont configurées au début de `script.js` :

- `images/gift/gift-close.png`
- `images/gift/gift-animation.gif`
- `images/gift/gift-open.png`

Le fond de page est défini dans `style.css` sous `images/fond/fond-noel.png`. Le cadre `images/cadre/cadre1.png` sert de fond à la fenêtre contenant le cadeau du jour; son image est étirée pour s’adapter au contenu. Remplacez les fichiers en conservant ces chemins, ou modifiez les chemins dans les fichiers concernés. Les couleurs et polices du thème sont réglées par les variables CSS au début de `style.css`. Les polices de titre et de texte sont chargées depuis Google Fonts; une police monospace de remplacement est prévue.

Les pistes musicales sont listées dans `MUSIC_TRACKS` au début de `script.js`. Remplacez les chemins pour utiliser d’autres fichiers audio.

## Lancer en local

Le chargement de `contenu.json` passe par `fetch`, donc ouvrez le site depuis un serveur HTTP local plutôt que directement en `file://`.

Depuis le dossier du projet :

```bash
python -m http.server 8000
```

Puis ouvrez <http://localhost:8000/>. Pour tester une date, utilisez par exemple <http://localhost:8000/?date=2026-12-07>.

Pour recommencer le test d’ouverture, effacez la clé `calendrier-avent-ouvert-2026` dans le stockage local du navigateur.

## Déployer

Le dossier du projet peut être publié tel quel sur un hébergement statique. Pour GitHub Pages, poussez le dépôt puis sélectionnez la branche et le dossier à publier dans les paramètres Pages. Sur Netlify, publiez le dossier du site. Assurez-vous que `index.html`, `contenu.json`, les images et les fichiers audio sont inclus.

## Limites actuelles

- Les cases s’ouvrent selon la date locale de l’utilisateur; le paramètre `date` sert au test et ne sécurise pas le contenu contre une personne qui modifie l’URL ou le code.
- La mémorisation est locale au navigateur : elle n’est pas partagée entre appareils.
- Le déverrouillage utilise l’année de la date courante, tandis que la clé de stockage reste nommée pour 2026.
