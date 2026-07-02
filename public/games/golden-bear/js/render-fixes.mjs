// Runtime rendering guard for Golden Bear Lucky Ways.
// Normalizes every reel symbol inside a common visual box.
// The tile/card keeps one size; only the artwork inside is contained and centered.
const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage
const originalFillText = CanvasRenderingContext2D.prototype.fillText
const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText

const UNIFORM_SYMBOL_BOX = 0.74
const TEXT_SYMBOL_SCALE = 0.64

const ATLAS_CONFIGS = [
  { match: /golden-bear-symbols\.webp(?:$|\?)/, cols: 3, rows: 2, boxScale: UNIFORM_SYMBOL_BOX },
  { match: /lbb-role-symbols\.webp(?:$|\?)/, cols: 5, rows: 3, boxScale: UNIFORM_SYMBOL_BOX },
  { match: /lbb-role-variants\.webp(?:$|\?)/, cols: 5, rows: 3, boxScale: UNIFORM_SYMBOL_BOX },
]

function getAtlasConfig(source) {
  return ATLAS_CONFIGS.find(config => config.match.test(source))
}

function fitAtlasCell(ctx, image, args, config) {
  const [sx, sy, sw, sh, dx, dy, dw, dh] = args.map(Number)
  if (![sx, sy, sw, sh, dx, dy, dw, dh].every(Number.isFinite) || dw <= 0 || dh <= 0) return null

  const cellW = image.naturalWidth / config.cols
  const cellH = image.naturalHeight / config.rows
  const col = Math.max(0, Math.min(config.cols - 1, Math.floor((sx + sw / 2) / cellW)))
  const row = Math.max(0, Math.min(config.rows - 1, Math.floor((sy + sh / 2) / cellH)))
  const fullSx = col * cellW
  const fullSy = row * cellH

  // Use the same centered content box for animals, WILD, BONUS and atlas symbols.
  // This prevents one symbol family from looking larger than another.
  const box = Math.max(1, Math.min(dw, dh) * config.boxScale)
  const scale = Math.min(box / cellW, box / cellH)
  const outW = cellW * scale
  const outH = cellH * scale
  const outX = dx + (dw - outW) / 2
  const outY = dy + (dh - outH) / 2

  return originalDrawImage.call(ctx, image, fullSx, fullSy, cellW, cellH, outX, outY, outW, outH)
}

CanvasRenderingContext2D.prototype.drawImage = function patchedDrawImage(image, ...args) {
  try {
    const source = image?.currentSrc || image?.src || ''
    const config = args.length === 8 && image?.naturalWidth && image?.naturalHeight ? getAtlasConfig(source) : null
    if (config) {
      const fitted = fitAtlasCell(this, image, args, config)
      if (fitted !== null) return fitted
    }
  } catch {}

  return originalDrawImage.call(this, image, ...args)
}

function withNormalizedReelTextSize(ctx, text, draw) {
  const label = String(text)
  if (!/^(A|K|Q|J|10)$/.test(label) || !/Georgia/i.test(ctx.font)) return draw()

  const previousFont = ctx.font
  ctx.font = previousFont.replace(/(\d+(?:\.\d+)?)px/, (_, size) => `${Math.max(18, Number(size) * TEXT_SYMBOL_SCALE)}px`)
  try {
    return draw()
  } finally {
    ctx.font = previousFont
  }
}

CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text, ...args) {
  return withNormalizedReelTextSize(this, text, () => originalFillText.call(this, text, ...args))
}

CanvasRenderingContext2D.prototype.strokeText = function patchedStrokeText(text, ...args) {
  return withNormalizedReelTextSize(this, text, () => originalStrokeText.call(this, text, ...args))
}
