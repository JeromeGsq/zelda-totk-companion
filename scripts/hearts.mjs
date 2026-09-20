// Ajoute à chaque ingrédient de recipes.json la valeur de soin du matériau (`hp`, champ HitPointRecover
// de kiranico, en demi-cœurs une fois cuisiné : cœurs du plat = somme des hp / 2).
// Pour les catégories « au choix », ajoute aussi la fourchette (`hpMin`/`hpMax`) des matériaux de la catégorie.
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://zelda.kiranico.com/fr/totk/data/materials'
const html = await (await fetch(BASE, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
const codes = [...html.matchAll(/materials\/(\w+)"/g)].map((m) => m[1]).filter((c, i, a) => a.indexOf(c) === i)

const hp = new Map()
for (let i = 0; i < codes.length; i += 25)
  await Promise.all(codes.slice(i, i + 25).map(async (code) => {
    const page = await (await fetch(`${BASE}/${code}`, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
    const m = page.replace(/<[^>]+>/g, '').match(/&quot;HitPointRecover&quot;:\s*(\d+)/)
    hp.set(code, m ? +m[1] : 0) // champ absent = ne soigne pas
  }))
console.log('matériaux lus:', hp.size)

// catégories dont les codes forment un groupe propre
const groups = [
  [/champi/i, /^Item_Mushroom/],
  [/fruit/i, /^Item_Fruit_/],
  [/poisson/i, /^Item_FishGet/],
]
const range = (re) => {
  const v = [...hp].filter(([c]) => re.test(c)).map(([, h]) => h)
  return [Math.min(...v), Math.max(...v)]
}

const recipes = JSON.parse(readFileSync('src/recipes.json', 'utf8'))
for (const r of recipes)
  for (const it of r.items)
    for (const a of it.alts) {
      if (!a.icon) continue
      a.hp = hp.get(a.icon.match(/mat\/(\w+)\.webp/)[1])
      const g = a.generic && groups.find(([label]) => label.test(a.label))
      if (g) [a.hpMin, a.hpMax] = range(g[1])
    }
writeFileSync('src/recipes.json', JSON.stringify(recipes, null, 1))
