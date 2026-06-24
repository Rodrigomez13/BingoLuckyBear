export function collectElements() {
  const byId = id => document.getElementById(id)
  return {
    loader: byId('loader'), machine: byId('machine'), ways: byId('ways'), mult: byId('multiplier'),
    balance: byId('balance'), balanceSide: byId('balanceSide'), bet: byId('bet'), lastWin: byId('lastWin'), lastWinSide: byId('lastWinSide'),
    free: byId('freeSpins'), featureState: byId('featureState'), ticker: byId('ticker'), spin: byId('spinBtn'), auto: byId('autoBtn'), turbo: byId('turboBtn'),
    down: byId('betDown'), up: byId('betUp'), sound: byId('soundBtn'), settings: byId('settingsBtn'), historyBtn: byId('historyBtn'), info: byId('infoBtn'), full: byId('fullBtn'),
    winLayer: byId('winLayer'), winType: byId('winType'), winAmount: byId('winAmount'), cascade: byId('cascadeCallout'),
    infoModal: byId('infoModal'), historyModal: byId('historyModal'), settingsModal: byId('settingsModal'), historyModalBody: byId('historyModalBody'),
    bonusModal: byId('bonusModal'), bonusClose: byId('bonusClose'), payGrid: byId('payGrid'), history: byId('historyList'), historyClear: byId('historyClear'),
    lineDetails: byId('lineDetails'), lineTotal: byId('lineTotal'), lineDetailCard: byId('lineDetailCard'), payTransition: byId('payTransition'), payTransitionText: byId('payTransitionText'),
    masterVolume: byId('masterVolume'), effectsVolume: byId('effectsVolume'), musicVolume: byId('musicVolume'), masterValue: byId('masterValue'), effectsValue: byId('effectsValue'), musicValue: byId('musicValue'),
  }
}

export function createUi({ elements, money, playSound, getTurbo }) {
  let history = []

  function showPayTransition(label, amount) {
    if (!elements.payTransition) return
    elements.payTransitionText.textContent = `${label} · $ ${money(amount)}`
    elements.payTransition.classList.remove('show')
    void elements.payTransition.offsetWidth
    elements.payTransition.classList.add('show')
    setTimeout(() => elements.payTransition.classList.remove('show'), getTurbo() ? 520 : 900)
  }

  function renderPayDetail(cascade, details, amount, multiplier) {
    if (!elements.lineDetails) return
    elements.lineTotal.textContent = `$ ${money(amount || 0)}`
    elements.lineDetails.innerHTML = details?.length
      ? details.map(detail => `<div class="detail-row"><b>${detail.symbol} · ${detail.reels} reels · multiplicador ×${multiplier}</b><span>$ ${money(detail.value)}</span></div>`).join('')
      : '<div class="detail-row"><b>Sin pagos</b><span>$ 0</span></div>'
    elements.lineDetails.classList.remove('flash')
    void elements.lineDetails.offsetWidth
    elements.lineDetails.classList.add('flash')
    if (amount > 0) {
      showPayTransition(`Cascada ${cascade}`, amount)
      playSound('detail', 0.55)
    }
  }

  function pushHistory(kind, label, amount, detail = '') {
    if (!elements.history) return
    history.unshift({ kind, label, amount, detail, time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })
    history = history.slice(0, 18)
    elements.history.innerHTML = history.map(item => `<div class="history-row ${item.kind}"><b>${item.label}<br><small>${item.time}${item.detail ? ` · ${item.detail}` : ''}</small></b><span>$ ${money(item.amount)}</span></div>`).join('')
    playSound('history', 0.25)
  }

  function clearHistory() {
    history = []
    elements.history.innerHTML = '<div class="history-row loss"><b>Historial limpio</b><span>$ 0</span></div>'
  }

  return { showPayTransition, renderPayDetail, pushHistory, clearHistory }
}
