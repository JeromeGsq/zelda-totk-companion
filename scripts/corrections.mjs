// Corrections de la source (article millenium.org) recoupées avec les données du jeu et des sources anglaises.
// À lancer en dernier, après parse / ingredients / hearts.
import { readFileSync, writeFileSync } from 'node:fs'

const recipes = JSON.parse(readFileSync('src/recipes.json', 'utf8'))
const fix = {
  // Pomme (2) + rayon de miel (8) = 10 demi-cœurs = 5 cœurs cuisinés ; l'article annonçait 4, les sources anglaises ~5
  118: (r) => (r.effect = r.effect.replace('restaure 4 cœurs', 'restaure 5 cœurs')),
}
for (const [id, f] of Object.entries(fix)) f(recipes.find((r) => r.id === +id))
writeFileSync('src/recipes.json', JSON.stringify(recipes, null, 1))
