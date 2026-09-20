// Extrait les recettes de assets_raw.txt vers src/recipes.json et télécharge les icônes dans public/img
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { basename } from 'node:path'

const html = readFileSync('assets_raw.txt', 'utf8')
const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
const text = (s) => decode(s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

const items = html.split('<div class="w-list-items__item">').slice(1)
const recipes = items.map((chunk) => {
  const img = chunk.match(/<img src="([^"]+)"/)?.[1]
  const title = text(chunk.match(/w-list-items__subtitle">([\s\S]*?)<\/div>/)[1])
  const [, num, name] = title.match(/^(\d+)\s*-\s*(.+)$/)
  const paras = [...chunk.matchAll(/<p class="article__paragraph">([\s\S]*?)<\/p>/g)].map((m) => text(m[1]))
  const strip = (re) => paras.find((p) => re.test(p))?.replace(/^[^:]*:\s*/, '') ?? ''
  const effect = strip(/^Effet/i)
  const ingredients = strip(/^Ingr/i)
  const notes = paras
    .filter((p) => !/^(Effet|Ingr)/i.test(p) && !/^Rédactrice sur MGG/.test(p))
    .map((p) => p.replace(/^\[(.*)\]$/, '$1'))
  return { id: +num, name, effect, ingredients, notes, img, _paras: paras }
})

const odd = recipes.filter((r) => !r.effect || !r.ingredients || r._paras.length !== 2)
console.log('recettes:', recipes.length, '| anomalies:', odd.length)
odd.forEach((r) => console.log(r.id, r.name, JSON.stringify(r._paras)))

mkdirSync('public/img', { recursive: true })
const out = recipes.map(({ _paras, img, ...r }) => ({ ...r, img: img ? 'img/' + basename(img) : null, _src: img }))
for (const r of out) {
  const dest = 'public/' + r.img
  if (!existsSync(dest)) {
    const res = await fetch(r._src)
    if (!res.ok) { console.log('échec image', r.id, res.status); r.img = null; continue }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
  }
}
mkdirSync('src', { recursive: true })
writeFileSync('src/recipes.json', JSON.stringify(out.map(({ _src, ...r }) => r), null, 1))
