const ticker = document.getElementById('ticker')
const mutedMessages = [
  'Saldo sincronizado. Presioná GIRAR para comenzar.',
  'Saldo sincronizado. Presiona GIRAR para comenzar.',
  'Presioná GIRAR o la barra espaciadora para comenzar.',
]

function cleanTicker() {
  if (!ticker) return
  const text = ticker.textContent?.trim() || ''
  if (mutedMessages.includes(text)) ticker.textContent = ''
}

cleanTicker()
if (ticker) {
  new MutationObserver(cleanTicker).observe(ticker, { childList: true, characterData: true, subtree: true })
}
