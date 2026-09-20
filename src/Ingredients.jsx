// Valeur de soin cuisinée (en cœurs) : hp est en demi-cœurs une fois cuisiné, le plat vaut la somme / 2
const fmt = (hp) => {
  const h = hp / 2
  const whole = Math.floor(h)
  return (whole || !(h % 1) ? whole : '') + (h % 1 ? '½' : '')
}

// Ingrédients d'une recette : icône du matériau + quantité ; pointillés = catégorie au choix
function tooltip(a) {
  if (!a.mat) return a.label
  if (!a.hp) return a.generic ? `${a.label} (ex. ${a.mat})` : a.mat
  const range = a.hpMax > a.hp || a.hpMin < a.hp ? `, de ${fmt(a.hpMin)} à ${fmt(a.hpMax)} selon l'ingrédient` : ''
  return `${a.generic ? `${a.label} (ex. ${a.mat}) — ` : `${a.mat} — `}${fmt(a.hp)} ♥ une fois cuisiné${range}`
}

export default function Ingredients({ items }) {
  return (
    <ul className="items">
      {items.map((it, i) => (
        <li key={i} className="item">
          {it.n > 1 && <b className="qty">{it.n}×</b>}
          {it.alts.map((a, j) => (
            <span key={j} className="alt">
              {j > 0 && <i className="or">ou</i>}
              <span className={'mat' + (a.generic ? ' generic' : '')} title={tooltip(a)}>
                {a.icon && <img src={a.icon} alt="" width="40" height="40" loading="lazy" />}
                <span>{a.label}</span>
                {a.hp > 0 && (
                  <span className="hp">♥ {fmt(a.hp)}{a.hpMax > a.hp && '+'}</span>
                )}
              </span>
            </span>
          ))}
        </li>
      ))}
    </ul>
  )
}
