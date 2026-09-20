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

export default function App() {
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

  // "/" pour focus la recherche
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== input.current) {
        e.preventDefault()
        input.current.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  return (
    <main>
      <h1>Recettes Zelda <small>Tears of the Kingdom</small></h1>

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
  )
}
