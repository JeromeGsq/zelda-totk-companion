import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]))

// Génère dist/sw.js : précache de tous les fichiers du build (le site marche alors hors ligne)
const serviceWorker = () => ({
  name: 'service-worker',
  apply: 'build',
  closeBundle() {
    const dist = 'dist'
    const files = walk(dist).map((f) => relative(dist, f)).filter((f) => f !== 'sw.js')
    const hash = createHash('sha1')
    for (const f of files) hash.update(f).update(readFileSync(join(dist, f)))
    const urls = ['./', ...files.map((f) => './' + f)]
    const sw = readFileSync('sw.template.js', 'utf8')
      .replace('__VERSION__', hash.digest('hex').slice(0, 10))
      .replace('__FILES__', JSON.stringify(urls))
    writeFileSync(join(dist, 'sw.js'), sw)
  },
})

// base './' : le dist fonctionne quel que soit le nom du repo GitHub Pages
export default defineConfig({ base: './', plugins: [react(), serviceWorker()] })
