# Calendrier de l'avent virtuel

Ce projet est un calendrier de l’avent statique, pensé pour un petit cercle de proches, facile à héberger gratuitement sur GitHub Pages ou Netlify.

## Structure du projet

```text
Calendrier-de-l-avant-2026/
├── index.html
├── style.css
├── script.js
├── contenu.json
├── README.md
├── .gitignore
├── fonts/
│   └── (polices pixel locales, à ajouter localement)
├── images/
│   ├── cases/
│   │   └── (visuels par jour, 01.webp à 24.webp si tu en ajoutes)
│   └── decor/
│       └── (fonds, cadres, icônes)
├── sons/
│   └── (optionnel)
└── ...
```

## Fonctionnement

- Grille de 24 cases, dans un ordre fixe mélangé.
- Une case est déverrouillée seulement si la date du jour est supérieure ou égale au jour de la case.
- Les cases déjà ouvertes sont enregistrées dans `localStorage`.
- Le paramètre `?date=AAAA-MM-JJ` permet de forcer une date pour tester le site.
- L’utilisation de la date locale de l’utilisateur est respectée.

## Modifier le contenu

Le fichier `contenu.json` contient un tableau d’objets, un par jour.

Exemple :

```json
[
  {
    "jour": 1,
    "type": "texte",
    "titre": "Message du premier jour",
    "texte": "Bienvenue dans le calendrier !",
    "image": "",
    "lien": ""
  }
]
```

Les champs possibles sont :
- `jour` : obligatoire, de 1 à 24
- `type` : `texte`, `image`, ou `lien`
- `titre` : titre affiché dans la modale
- `texte` : texte principal
- `image` : chemin vers une image
- `lien` : URL externe

Tu peux compléter ou remplacer les 24 entrées d’exemple par tes propres messages, souvenirs, blagues, citations, défis, etc.

## Ajouter des assets

### Images
- Mets les images dans `images/cases/` avec le nommage `01.webp`, `02.webp`, etc.
- Les visuels décoratifs vont dans `images/decor/`.
- Si le fichier d’une case n’existe pas, le site affiche un visuel de secours au lieu d’échouer.

### Polices
- Place les fichiers de police dans le dossier `fonts/`.
- Les variables CSS dans `style.css` permettent de changer rapidement la police et les couleurs.

### Sons
- Tu peux ajouter des fichiers audio dans `sons/` plus tard, sans toucher à la structure principale du site.

## Tester le site localement

Le site étant statique, il est conseillé de le lancer via un petit serveur local.

### Avec Python

```bash
python -m http.server 8000
```

Puis ouvrez :

```text
http://localhost:8000/
```

### Avec un outil visuel
- Ouvre le dossier dans VS Code
- Utilise une extension de prévisualisation locale ou un serveur statique

### Tester une date précise

Ajoute un paramètre de requête dans l’URL :

```text
http://localhost:8000/?date=2026-12-07
```

Cela force la date utilisée par le calendrier pour vérifier les cases verrouillées et ouvertes.

## Héberger gratuitement

### GitHub Pages

1. Pousse le projet sur GitHub.
2. Ouvre les paramètres du dépôt.
3. Allez dans "Pages".
4. Sélectionne la branche principale.
5. Publie le site.

Le site sera accessible via une URL du type :

```text
https://nom-utilisateur.github.io/nom-du-repo/
```

### Netlify

1. Crée un compte Netlify.
2. Glisse le dossier du projet dans l’interface.
3. Valide le déploiement.
4. Le site est ensuite accessible en ligne.

## Personnalisation du design

Les variables de couleur et de police sont définies en haut du fichier `style.css` :

```css
:root {
  --couleur-fond: #1e1225;
  --couleur-case: #f5d76c;
  --couleur-texte: #fff8e7;
  --police-titre: "Press Start 2P", "Silkscreen", monospace;
}
```

Tu peux donc changer facilement le thème du calendrier sans casser le code.

## Notes

- Le site fonctionne sans framework ni backend.
- Il est pensé pour rester simple à modifier.
- Tous les assets sont séparés dans des dossiers dédiés pour faciliter l’évolution progressive du projet.

Si tu veux, je peux ensuite te proposer :
- un thème plus chic,
- un thème plus enfantin,
- ou des messages déjà personnalisés pour ta famille ou tes amis.
