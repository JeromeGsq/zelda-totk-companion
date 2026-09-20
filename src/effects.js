// Transforme le texte libre d'un effet en données affichables (cœurs + pastilles)

const CHIPS = [
  ['heat', /chaleur/, '🔥', 'Anti-chaleur'],
  ['cold', /froid/, '❄️', 'Anti-froid'],
  ['miasma', /miasme/, '☠️', 'Anti-miasme'],
  ['electric', /électricité/, '⚡', 'Anti-électricité'],
  ['attack', /attaque|dégâts/, '⚔️', 'Attaque'],
  ['defense', /défense/, '🛡️', 'Défense'],
  ['speed', /vitesse/, '💨', 'Vitesse'],
  ['stealth', /discrétion/, '🥷', 'Discrétion'],
  ['grip', /adhérence/, '🧗', 'Adhérence'],
  ['light', /bioluminescence/, '💡', 'Lumière'],
  ['ingredient', /selon (?:l'|les )?ingrédient/, '✨', 'Selon ingrédient'],
]
const TIMED = new Set(['heat', 'miasma', 'defense'])

export function parseEffect(text) {
  const t = text.toLowerCase()
  const chips = []
  let hearts = null

  if (/tous vos c(?:œ|oe)urs/.test(t)) {
    hearts = { all: true }
  } else {
    const m = t.match(/(\d+\/\d+|\d+)(\+)?\s*(?:d'un |de )?c(?:œ|oe)urs?(.*)/)
    if (m) {
      const [a, b] = m[1].split('/')
      let value = b ? +a / +b : +a
      const extra = m[3].match(/^s?\s*(?:rouges?\s*)?(?:et\s+)?(demi|1\/2|1\/4)/)
      if (extra) value += extra[1] === '1/4' ? 0.25 : 0.5
      hearts = { value, plus: !!m[2] }
    } else if (/c(?:œ|oe)urs?/.test(t)) {
      hearts = { variable: true } // dépend du nombre d'ingrédients
    }
  }

  const duration = t.match(/(\d+)\s*min(?:ute)?s?(?:\s*(\d+))?/)
  const time = duration ? ` ${duration[1]} min${duration[2] ? ' ' + duration[2] : ''}` : ''

  for (const [key, re, icon, label] of CHIPS) {
    if (re.test(t)) chips.push({ key, icon, label: label + (TIMED.has(key) ? time : '') })
  }

  if (/endurance/.test(t)) {
    const label = /moitié/.test(t) ? '½ jauge' : /supplémentaire|jaune/.test(t) ? '+1 jauge' : 'Endurance'
    chips.push({ key: 'stamina', icon: '🟢', label })
  }
  if (/c(?:œ|oe)urs jaunes/.test(t)) chips.push({ key: 'yellow', icon: '💛', label: 'Cœurs jaunes' })

  return { hearts, chips }
}
