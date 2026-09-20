// Génère les icônes PWA (Triforce dorée sur fond sombre) sans dépendance : rasterisation + encodeur PNG
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
const png = (size, rgba) => {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const BG = [0x1b, 0x1a, 0x17], GOLD = [0xe8, 0xc2, 0x5a]
// Triforce : grand triangle équilatéral (côté 56 % de l'icône, dans la zone sûre « maskable »),
// trois triangles pleins, le triangle central inversé reste vide
const A = [0.5, 0.2575], B = [0.22, 0.7425], C = [0.78, 0.7425]
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
const AB = mid(A, B), AC = mid(A, C), BC = mid(B, C)
const TRIANGLES = [[A, AB, AC], [AB, B, BC], [AC, BC, C]]
const inTriangle = (x, y, [p, q, r]) => {
  const side = (a, b) => (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
  const d = [side(p, q), side(q, r), side(r, p)]
  return d.every((v) => v >= 0) || d.every((v) => v <= 0)
}
const inShape = (px, py, size) => TRIANGLES.some((t) => inTriangle(px / size, py / size, t))
const render = (size) => {
  const buf = Buffer.alloc(size * size * 4)
  const n = 3
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let hit = 0
      for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) hit += inShape(x + (sx + 0.5) / n, y + (sy + 0.5) / n, size)
      const t = hit / (n * n)
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) buf[i + c] = Math.round(BG[c] * (1 - t) + GOLD[c] * t)
      buf[i + 3] = 255
    }
  return buf
}
for (const size of [192, 512]) writeFileSync(`public/icon-${size}.png`, png(size, render(size)))
