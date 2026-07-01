// Runtime rendering guard for Golden Bear Lucky Ways.
// Keeps every reel symbol contained inside each tile. No atlas art is cropped.
const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage
const originalFillText = CanvasRenderingContext2D.prototype.fillText
const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText

const ATLAS_CONFIGS = [
  { match: /golden-bear-symbols\.webp(?:$|\?)/, cols: 3, rows: 2, padRatio: 0.14 },
  { match: /lbb-role-symbols\.webp(?:$|\?)/, cols: 5, rows: 3, padRatio: 0.1 },
  { match: /lbb-role-variants\.webp(?:$|\?)/, cols: 5, rows: 3, padRatio: 0.1 },
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

  // Padding intentionally scales the resource inside the tile instead of cropping it.
  const pad = Math.max(2, Math.min(dw, dh) * config.padRatio)
  const availW = Math.max(1, dw - pad * 2)
  const availH = Math.max(1, dh - pad * 2)
  const scale = Math.min(availW / cellW, availH / cellH)
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

function withReducedReelLetterSize(ctx, text, draw) {
  const label = String(text)
  if (!/^(A|K|Q|J|10)$/.test(label) || !/Georgia/i.test(ctx.font)) return draw()

  const previousFont = ctx.font
  ctx.font = previousFont.replace(/(\d+(?:\.\d+)?)px/, (_, size) => `${Math.max(18, Number(size) * 0.78)}px`)
  try {
    return draw()
  } finally {
    ctx.font = previousFont
  }
}

CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text, ...args) {
  return withReducedReelLetterSize(this, text, () => originalFillText.call(this, text, ...args))
}

CanvasRenderingContext2D.prototype.strokeText = function patchedStrokeText(text, ...args) {
  return withReducedReelLetterSize(this, text, () => originalStrokeText.call(this, text, ...args))
}
