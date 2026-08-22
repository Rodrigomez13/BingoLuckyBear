const DEFAULT_CONFIG = {
  bonusBuyEnabled: true,
  bonusBuyPrice: 100,
  bonusBuySpins: 6,
  bonusBuyLabel: 'Comprar Bonus',
  bonusBuyDescription: 'Giros gratis del Oso Dorado',
}

const money = value => Math.max(0, Math.round(Number(value) || 0)).toLocaleString('es-AR')
const $ = id => document.getElementById(id)
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

let config = DEFAULT_CONFIG
let pendingBonusBuy = false
const originalFetch = window.fetch.bind(window)

async function loadConfig() {
  try {
    const response = await originalFetch('/api/games/golden-bear/config', { cache: 'no-store' })
    if (!response.ok) throw new Error('Config no disponible')
    config = { ...DEFAULT_CONFIG, ...(await response.json()) }
  } catch {
    config = DEFAULT_CONFIG
  }
}

function updateBonusButton() {
  const button = $('buyBonusBtn')
  const hint = $('bonusBuyHint')
  if (!button) return
  button.disabled = !config.bonusBuyEnabled
  button.innerHTML = `${config.bonusBuyLabel || 'Comprar Bonus'}<small>$ ${money(config.bonusBuyPrice)} · ${money(config.bonusBuySpins)} FS</small>`
  if (hint) hint.textContent = config.bonusBuyDescription || 'Activá giros gratis por un valor fijo.'
}

function currentBet() {
  return Number(($('bet')?.textContent || '').replace(/\D/g, '')) || 0
}

async function alignBetToBonusPrice() {
  const target = Number(config.bonusBuyPrice)
  const up = $('betUp')
  const down = $('betDown')
  if (!up || !down || !target) return false

  for (let guard = 0; guard < 14; guard++) {
    const current = currentBet()
    if (current === target) return true
    ;(current < target ? up : down).click()
    await wait(30)
  }
  return currentBet() === target
}

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url
  if (pendingBonusBuy && typeof url === 'string' && url.includes('/api/games/golden-bear/spin')) {
    pendingBonusBuy = false
    let body = {}
    try { body = JSON.parse(String(init.body || '{}')) } catch {}
    return originalFetch('/api/games/golden-bear/bonus', {
      ...init,
      body: JSON.stringify({ ...body, stake: Number(config.bonusBuyPrice), mode: 'bonus_buy' }),
    })
  }
  return originalFetch(input, init)
}

async function buyBonus() {
  const ticker = $('ticker')
  const spin = $('spinBtn')
  if (!config.bonusBuyEnabled || !spin || spin.disabled) return
  if (ticker) ticker.textContent = `Preparando bonus · $ ${money(config.bonusBuyPrice)} por ${money(config.bonusBuySpins)} giros gratis...`

  const aligned = await alignBetToBonusPrice()
  if (!aligned) {
    if (ticker) ticker.textContent = 'El bonus no está disponible con la configuración actual.'
    return
  }

  pendingBonusBuy = true
  spin.click()
}

loadConfig().then(() => {
  updateBonusButton()
  const button = $('buyBonusBtn')
  if (button) button.addEventListener('click', buyBonus)
})
