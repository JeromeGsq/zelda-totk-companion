// Associe chaque ingrédient de src/recipes.json à un matériau de kiranico.com (icône incluse).
// Écrit `items` dans recipes.json et télécharge les icônes utilisées dans public/mat.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'

const URL_MATERIALS = 'https://zelda.kiranico.com/fr/totk/data/materials'
const decode = (s) => s.replace(/&#0?39;/g, "'").replace(/&amp;/g, '&')
const sing = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)
const norm = (s) =>
  s.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').map(sing).join(' ')

// --- matériaux
const html = await (await fetch(URL_MATERIALS, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
const materials = [...html.matchAll(/<img class="h-24 w-24 rounded-md" src="([^"]+)" alt="([^"]*)">[\s\S]*?materials\/(\w+)"/g)]
  .map(([, src, alt, code]) => ({ name: decode(alt), code, src }))
const byName = new Map(materials.map((m) => [m.name, m]))
console.log('matériaux:', materials.length)

// --- phrases reconnues : [phrase, matériau, générique ?]
const alias = (phrases, target) => phrases.map((p) => [p, target, false])
const category = (phrases, target) => phrases.map((p) => [p, target, true])
const rules = [
  ...materials.map((m) => [m.name, m.name, false]),
  ...alias(['pomme doree'], "Pomme d'or"),
  ...alias(['banane'], 'Bananes lame'),
  ...alias(['melon'], 'Melon glagla'),
  ...alias(['huile'], "Bouteille d'huile"),
  ...alias(['lait', 'lait frais'], 'Bouteille de lait frais'),
  ...alias(['riz'], 'Boisseau de riz'),
  ...alias(['ble'], 'Boisseau de blé'),
  ...alias(['miel', 'miel enduro'], 'Rayon de miel enduro'),
  ...alias(['oeuf', 'oeuf de volatile'], 'Œuf de volatile'),
  ...alias(['flacon d epices goron'], 'Flacon d’épices gorons'.replace('’', "'")),
  ...alias(['fruit du lotus', 'fruit de lotus'], 'Fruit de lotus tempo'),
  ...alias(['citrouille', 'citrouille protecto', 'citrouille d elimith'], 'Citrouille armo'),
  ...alias(['carotte enduro'], 'Carotte vigueur'),
  ...alias(['carotte'], 'Carotte tempo'),
  ...alias(['scarabee robusto', 'petit animal protecto'], 'Scarabée armo'),
  ...alias(['petit animal max'], 'Lézard max'),
  ...alias(['arowana'], 'Arowana ancien'),
  ...alias(['grappe de tomate'], "Grappe de tomates d'Hyrule"),
  ...alias(['volaille', 'volaille entiere'], 'Viande de volaille'),
  ...alias(['volaille fine'], 'Viande de volaille fine'),
  ...alias(['viande fine'], 'Venaison fine'),
  ...alias(['viande divine'], 'Venaison divine'),
  ...alias(['fruit a coque'], 'Gland'),
  ...category(['champi'], "Champi d'Hyrule"),
  ...category(['fruit'], 'Pomme'),
  ...category(['legume'], 'Carotte tempo'),
  ...category(['herbe', 'fleur', 'herbe fleur'], "Herbes d'Hyrule"),
  ...category(['poisson'], "Perche d'Hyrule"),
  ...category(['viande'], 'Venaison'),
  ...category(['crabe'], 'Crabe lame'),
  ...category(['perche'], "Perche d'Hyrule"),
  ...category(['truite'], 'Truite glagla'),
  ...category(['carpe'], 'Carpe tricolore'),
  ...category(['daurade'], 'Daurade lame'),
  ...category(['ressource de n importe quel autre monstre'], 'Croc de Bokoblin'),
].map(([p, target, generic]) => {
  if (!byName.has(target)) throw new Error('matériau inconnu : ' + target)
  return { phrase: norm(p), mat: byName.get(target), generic }
}).sort((a, b) => b.phrase.length - a.phrase.length)

const resolve = (label) => {
  const n = ' ' + norm(label.replace(/\(.*?\)/g, '')) + ' '
  const hit = rules.find((r) => n.includes(' ' + r.phrase + ' '))
  return hit ? { mat: hit.mat, generic: hit.generic } : null
}
const clean = (s) => s.replace(/\s+à (mettre sur le feu|sortir en température froide)$/i, '').replace(/\s+/g, ' ').trim()
const cap = (s) => s[0].toUpperCase() + s.slice(1)

// --- recettes
const recipes = JSON.parse(readFileSync('src/recipes.json', 'utf8'))
const used = new Map()
const unmatched = new Set()
for (const r of recipes) {
  r.items = r.ingredients.split(/\s*\+\s*/).filter(Boolean).map((piece) => {
    const [, x, count, rest] = piece.match(/^(x)?(\d+)?\s*(.+)$/i)
    const label = clean(rest)
    const parts = label.split(/\s+ou\s+(?:\d+\s+)?/i)
    const resolved = parts.map((p) => ({ label: cap(p), ...resolve(p) }))
    const alts = parts.length > 1 && resolved.every((a) => a.mat) ? resolved : [{ label: cap(label), ...resolve(label) }]
    return {
      n: count ? +count : 1,
      alts: alts.map((a) => {
        if (!a.mat) { unmatched.add(a.label); return { label: a.label } }
        used.set(a.mat.code, a.mat)
        return { label: a.label, mat: a.mat.name, icon: `mat/${a.mat.code}.webp`, ...(a.generic && { generic: true }) }
      }),
    }
  })
}
console.log('non reconnus:', [...unmatched])

mkdirSync('public/mat', { recursive: true })
for (const m of used.values()) {
  const dest = `public/mat/${m.code}.webp`
  if (existsSync(dest)) continue
  const res = await fetch(m.src)
  if (!res.ok) throw new Error(`icône ${m.code} : ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}
writeFileSync('src/recipes.json', JSON.stringify(recipes, null, 1))
console.log('icônes:', used.size)
