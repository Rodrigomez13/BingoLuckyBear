// Runtime rendering guard for Golden Bear Lucky Ways.
// Keeps atlas art contained inside each tile so character faces and props do not get cut off.
const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage

CanvasRenderingContext2D.prototype.drawImage = function patchedDrawImage(image, ...args) {
  try {
    const source = image?.currentSrc || image?.src || ''
    if (args.length === 8 && /golden-bear-symbols\.webp(?:$|\?)/.test(source) && image?.naturalWidth && image?.naturalHeight) {
      const [sx, sy, sw, sh, dx, dy, dw, dh] = args.map(Number)
      if ([sx, sy, sw, sh, dx, dy, dw, dh].every(Number.isFinite) && dw > 0 && dh > 0) {
        const atlasCols = 3
        const atlasRows = 2
        const cellW = image.naturalWidth / atlasCols
        const cellH = image.naturalHeight / atlasRows
        const col = Math.max(0, Math.min(atlasCols - 1, Math.floor((sx + sw / 2) / cellW)))
        const row = Math.max(0, Math.min(atlasRows - 1, Math.floor((sy + sh / 2) / cellH)))
        const fullSx = col * cellW
        const fullSy = row * cellH
        const pad = Math.max(1, Math.min(dw, dh) * 0.045)
        const availW = Math.max(1, dw - pad * 2)
        const availH = Math.max(1, dh - pad * 2)
        const scale = Math.min(availW / cellW, availH / cellH)
        const outW = cellW * scale
        const outH = cellH * scale
        const outX = dx + (dw - outW) / 2
        const outY = dy + (dh - outH) / 2
        return originalDrawImage.call(this, image, fullSx, fullSy, cellW, cellH, outX, outY, outW, outH)
      }
    }
  } catch {}

  return originalDrawImage.call(this, image, ...args)
}
