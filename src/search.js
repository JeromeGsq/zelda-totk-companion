import recipes from './recipes.json'

// minuscules, sans accents, œ → oe, ponctuation → espace
export const normalize = (s) =>
  s.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

// Index calculé une seule fois
const index = recipes.map((r) => ({
  recipe: r,
  id: String(r.id),
  name: normalize(r.name),
  ingredients: normalize(r.ingredients),
  rest: normalize(r.effect + ' ' + r.notes.join(' ')),
}))

// Score d'un token pour une entrée (0 = pas de match)
function scoreToken(e, t) {
  if (e.id === t) return 100
  if (e.name.startsWith(t)) return 50
  if (e.name.includes(' ' + t)) return 40
  if (e.name.includes(t)) return 30
  if (e.ingredients.includes(t)) return 20
  if (e.rest.includes(t)) return 10
  return 0
}

// Tous les mots doivent matcher (ET), résultats triés par pertinence puis par numéro.
// "#12" ou "12" retrouvent la recette numéro 12.
export function search(query) {
  const tokens = normalize(query).split(' ').filter(Boolean)
  if (!tokens.length) return recipes
  const hits = []
  for (const e of index) {
    let total = 0
    for (const t of tokens) {
      const s = scoreToken(e, t)
      if (!s) { total = 0; break }
      total += s
    }
    if (total) hits.push([total, e.recipe])
  }
  return hits.sort((a, b) => b[0] - a[0] || a[1].id - b[1].id).map((h) => h[1])
}
