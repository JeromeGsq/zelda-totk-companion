import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { search } from './search'
import Effect from './Effect'
import Ingredients from './Ingredients'

const KEY = 'totk-favoris'

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) ?? [])
  } catch {
    return new Set()
  }
}

const MAP_URL = 'https://www.gamertw.com/fr/zelda/totk/map'
const VIEWS = [
  { id: 'recettes', label: 'Recettes', icon: '🍲' },
  { id: 'carte', label: 'Carte interactive', icon: '🗺️' },
]

// La vue vit dans le hash (#carte) : le bouton retour d'Android fonctionne
const viewFromHash = () => (location.hash === '#carte' ? 'carte' : 'recettes')

export default function App() {
  const [view, setView] = useState(viewFromHash)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(view === 'carte') // l'iframe ne se charge qu'à la première ouverture
  const [query, setQuery] = useState('')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [favs, setFavs] = useState(loadFavs)
  const input = useRef()
  const deferred = useDeferredValue(query)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...favs]))
    } catch {}
  }, [favs])

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (view === 'carte') setMapLoaded(true)
    setMenuOpen(false)
  }, [view])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // "/" pour focus la recherche
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && view === 'recettes' && document.activeElement !== input.current) {
        e.preventDefault()
        input.current.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  const results = useMemo(() => {
    const r = search(deferred)
    return onlyFavs ? r.filter((x) => favs.has(x.id)) : r
  }, [deferred, onlyFavs, favs])

  const toggle = (id) =>
    setFavs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const current = VIEWS.find((v) => v.id === view)

  return (
    <>
      <header className="top">
        <button className="burger" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" aria-expanded={menuOpen}>
          <span /><span /><span />
        </button>
        <h1>{current.label} <small>TOTK Companion</small></h1>
      </header>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <nav className={'drawer' + (menuOpen ? ' open' : '')} aria-label="Menu" aria-hidden={!menuOpen} inert={!menuOpen}>
        {VIEWS.map((v) => (
          <a key={v.id} href={v.id === 'recettes' ? '#' : '#' + v.id} aria-current={v.id === view ? 'page' : undefined}
             onClick={() => v.id === view && setMenuOpen(false)}>
            <span aria-hidden="true">{v.icon}</span> {v.label}
          </a>
        ))}
      </nav>

      <main hidden={view !== 'recettes'}>

      <div className="bar">
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, ingrédient, effet, n°…  ( / )"
          aria-label="Rechercher une recette"
          autoFocus
        />
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={!onlyFavs} onClick={() => setOnlyFavs(false)}>Toutes</button>
          <button role="tab" aria-selected={onlyFavs} onClick={() => setOnlyFavs(true)}>★ Favoris ({favs.size})</button>
        </div>
      </div>

      <p className="count">{results.length} recette{results.length > 1 ? 's' : ''}</p>

      <ul className="list">
        {results.map((r) => (
          <li key={r.id} className="card">
            {r.img && <img src={r.img} alt="" width="64" height="64" loading="lazy" />}
            <div className="body">
              <h2><span className="num">#{r.id}</span> {r.name}</h2>
              <Effect text={r.effect} />
              <Ingredients items={r.items} />
              {r.notes.map((n, i) => <p key={i} className="note">{n}</p>)}
            </div>
            <button
              className={'star' + (favs.has(r.id) ? ' on' : '')}
              onClick={() => toggle(r.id)}
              aria-pressed={favs.has(r.id)}
              aria-label={favs.has(r.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {favs.has(r.id) ? '★' : '☆'}
            </button>
          </li>
        ))}
      </ul>

      <p className="legend">
        ♥ sous un ingrédient = cœurs qu'il ajoute une fois cuisiné (valeur des données du jeu, le total du plat est la somme) ·
        + = plus avec certaines variantes · pointillés = au choix dans la catégorie (icône d'exemple) ·
        ×? = non chiffré dans la source. Sel, beurre et autres condiments n'affichent rien, mais peuvent ajouter
        des cœurs : le total est alors sous-estimé.
      </p>

      {!results.length && (
        <p className="empty">{onlyFavs && !query ? 'Aucun favori pour l’instant : cliquez sur ☆.' : 'Aucun résultat.'}</p>
      )}
      </main>

      {mapLoaded && (
        <section className="map" hidden={view !== 'carte'}>
          <iframe src={MAP_URL} title="Carte interactive de Tears of the Kingdom" referrerPolicy="no-referrer" />
          <a className="map-open" href={MAP_URL} target="_blank" rel="noreferrer">Ouvrir dans un onglet ↗</a>
        </section>
      )}
    </>
  )
}
