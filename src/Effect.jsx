import { parseEffect } from './effects'

const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

const Svg = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
)

// Cœur rempli à `fill` (0–1) : un cœur vide + un cœur plein rogné
const Heart = ({ fill = 1 }) => (
  <span className="heart">
    <Svg className="heart-bg" />
    <Svg className="heart-fg" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
  </span>
)

function Hearts({ hearts }) {
  if (hearts.all) return <span className="hearts" title="Tous les cœurs"><Heart /><b>Tous</b></span>
  if (hearts.variable)
    return <span className="hearts" title="Dépend du nombre d'ingrédients"><Heart /><b>×?</b></span>

  const { value, plus } = hearts
  const title = `${value}${plus ? '+' : ''} cœur${value > 1 ? 's' : ''}`
  if (value > 5) return <span className="hearts" title={title}><Heart /><b>×{value}{plus && '+'}</b></span>

  const full = Math.floor(value)
  const rest = value - full
  return (
    <span className="hearts" title={title}>
      {Array.from({ length: full }, (_, i) => <Heart key={i} />)}
      {rest > 0 && <Heart fill={rest} />}
      {plus && <b>+</b>}
    </span>
  )
}

export default function Effect({ text }) {
  const { hearts, chips } = parseEffect(text)
  if (!hearts && !chips.length) return null
  return (
    <div className="effect" aria-label={text}>
      {hearts && <Hearts hearts={hearts} />}
      {chips.map((c) => (
        <span key={c.key} className={'chip chip-' + c.key} title={text}>
          <span aria-hidden="true">{c.icon}</span> {c.label}
        </span>
      ))}
    </div>
  )
}
