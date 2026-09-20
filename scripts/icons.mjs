// Génère les icônes PWA (cœur rouge sur fond sombre) sans dépendance : rasterisation + encodeur PNG
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

const BG = [0x1b, 0x1a, 0x17], HEART = [0xe5, 0x48, 0x4d]
// courbe du cœur : (x²+y²-1)³ - x²y³ <= 0 ; le cœur occupe ~55 % de l'icône (zone sûre des icônes « maskable »)
const inHeart = (px, py, size) => {
  const x = ((px / size) - 0.5) * 2 / 0.55 * 1.15
  const y = -(((py / size) - 0.5) * 2 / 0.55 * 1.15) + 0.1
  return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0
}
const render = (size) => {
  const buf = Buffer.alloc(size * size * 4)
  const n = 3
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let hit = 0
      for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) hit += inHeart(x + (sx + 0.5) / n, y + (sy + 0.5) / n, size)
      const t = hit / (n * n)
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) buf[i + c] = Math.round(BG[c] * (1 - t) + HEART[c] * t)
      buf[i + 3] = 255
    }
  return buf
}
for (const size of [192, 512]) writeFileSync(`public/icon-${size}.png`, png(size, render(size)))
