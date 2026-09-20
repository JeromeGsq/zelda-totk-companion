# Recettes Zelda TotK

Recherche et favoris (localStorage) pour les 228 recettes de Zelda: Tears of the Kingdom.
Effets en icônes, ingrédients avec icône et valeur de soin.

Site : https://jeromegsq.github.io/zelda-totk-companion/

## Développement

    npm install
    npm run dev       # serveur local
    npm run build     # génère dist/

## Données

`src/recipes.json` est généré, dans l'ordre, par :

    node scripts/parse.mjs        # recettes + icônes, depuis assets_raw.txt (article millenium.org)
    node scripts/ingredients.mjs  # ingrédients → matériaux + icônes (zelda.kiranico.com)
    node scripts/hearts.mjs       # valeur de soin des matériaux (HitPointRecover)
    node scripts/corrections.mjs  # corrections de la source

Cœurs d'un plat cuisiné = somme des `hp` des ingrédients / 2 (vérifié sur les recettes à chiffre fixe de l'article).
Sel, beurre et condiments peuvent ajouter des cœurs non comptés.

## PWA

Manifeste (`public/manifest.webmanifest`), icônes (`node scripts/icons.mjs`) et service worker : `vite build` génère
`dist/sw.js`, qui précache tout le site (marche hors ligne). Sur Firefox Android : menu ⋮ → Installer.

## Déploiement

Le contenu de `dist/` est publié sur la branche `gh-pages`.

Recettes et noms : © millenium.org. Icônes : kiranico.com. Jeu : © Nintendo.
