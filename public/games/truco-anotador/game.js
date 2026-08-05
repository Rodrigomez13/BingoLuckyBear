(() => {
  "use strict";

  const SUITS = ["oro", "copa", "espada", "basto"];
  const SUIT_LABEL = { oro: "oros", copa: "copas", espada: "espadas", basto: "bastos" };
  const ROW = { oro: 0, copa: 1, espada: 2, basto: 3 };
  const TRUCO_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const SPRITE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const GAME_KEY = "truco-play-v2";

  const $ = id => document.getElementById(id);
  const ui = {
    cpuHand: $("cpuHand"), playerHand: $("playerHand"), trickArea: $("trickArea"),
    message: $("gameMessage"), badge: $("turnBadge"), deal: $("dealBtn"),
    callBar: $("callBar"), pending: $("pendingCall"), pendingTitle: $("pendingTitle"),
    pendingText: $("pendingText"), pendingActions: $("pendingActions"), cpuSeat: $("cpuSeat"),
    difficulty: $("difficulty"), restart: $("restartHand"), handNumber: $("handNumber"),
    handValue: $("handValue"), trickScore: $("trickScore"), callsState: $("callsState")
  };

  let game = loadGame();
  let pendingResolver = null;

  function freshGame() {
    return {
      active: false, dealer: 1, mano: 0, turn: 0, hands: [[], []],
      played: [[], []], tricks: [], trickCards: [], handStake: 1,
      trucoLevel: 0, lastTrucoCaller: null, envidoDone: false, florDone: false,
      cardsPlayed: 0, handNumber: 0, log: [], waiting: false,
      sidePoints: [0, 0], sideEvents: [], deferredCpuTruco: false
    };
  }

  function loadGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(GAME_KEY));
      if (!saved || !Array.isArray(saved.hands) || !Array.isArray(saved.tricks)) return freshGame();
      return { ...freshGame(), ...saved, waiting: false };
    } catch { return freshGame(); }
  }

  function saveGame() {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  }

  function scoreState() {
    return window.trucoScore ? window.trucoScore.getState() : { names: ["Nosotros", "Ellos"], scores: [0, 0], target: 30, flor: true };
  }

  function buildDeck() {
    return SUITS.flatMap(suit => TRUCO_NUMBERS.map(number => ({ suit, number, id: `${number}-${suit}` })));
  }

  function shuffle(cards) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  function power(card) {
    if (card.number === 1 && card.suit === "espada") return 14;
    if (card.number === 1 && card.suit === "basto") return 13;
    if (card.number === 7 && card.suit === "espada") return 12;
    if (card.number === 7 && card.suit === "oro") return 11;
    if (card.number === 3) return 10;
    if (card.number === 2) return 9;
    if (card.number === 1) return 8;
    if (card.number === 12) return 7;
    if (card.number === 11) return 6;
    if (card.number === 10) return 5;
    if (card.number === 7) return 4;
    if (card.number === 6) return 3;
    if (card.number === 5) return 2;
    return 1;
  }

  function envidoValue(hand) {
    let best = Math.max(...hand.map(c => c.number >= 10 ? 0 : c.number));
    SUITS.forEach(suit => {
      const values = hand.filter(c => c.suit === suit).map(c => c.number >= 10 ? 0 : c.number).sort((a, b) => b - a);
      if (values.length >= 2) best = Math.max(best, 20 + values[0] + values[1]);
    });
    return best;
  }

  function hasFlor(hand) {
    return hand.length === 3 && hand.every(c => c.suit === hand[0].suit);
  }

  function florValue(hand) {
    return envidoValue(hand);
  }

  function cardName(card) { return `${card.number} de ${SUIT_LABEL[card.suit]}`; }

  function cardElement(card, hidden = false, extra = "") {
    const el = document.createElement(hidden ? "div" : "button");
    el.className = `table-card${hidden ? " back" : ""}${extra ? ` ${extra}` : ""}`;
    if (!hidden) {
      el.style.setProperty("--col", SPRITE_NUMBERS.indexOf(card.number));
      el.style.setProperty("--row", ROW[card.suit]);
      el.title = cardName(card);
      el.setAttribute("aria-label", cardName(card));
    }
    return el;
  }

  function startHand() {
    if (scoreState().scores.some(s => s >= scoreState().target)) {
      say("La partida terminó. Iniciá una nueva partida desde el marcador.");
      return;
    }
    const nextDealer = game.handNumber ? 1 - game.dealer : (Math.random() < .5 ? 0 : 1);
    game = freshGame();
    game.active = true;
    game.dealer = nextDealer;
    game.mano = 1 - nextDealer;
    game.turn = game.mano;
    game.handNumber = Number(localStorage.getItem("truco-hand-number") || 0) + 1;
    localStorage.setItem("truco-hand-number", game.handNumber);
    const deck = shuffle(buildDeck());
    for (let i = 0; i < 3; i++) {
      game.hands[game.mano].push(deck.pop());
      game.hands[game.dealer].push(deck.pop());
    }
    ui.deal.hidden = true;
    say(game.mano === 0 ? "Sos mano. Elegí una carta o cantá." : "La CPU es mano.");
    render();
    if (game.turn === 1) setTimeout(cpuTurn, 700);
  }

  function playCard(player, cardId) {
    if (!game.active || game.waiting || game.turn !== player) return;
    const index = game.hands[player].findIndex(c => c.id === cardId);
    if (index < 0) return;
    const [card] = game.hands[player].splice(index, 1);
    game.played[player].push(card);
    game.trickCards.push({ player, card });
    game.cardsPlayed++;
    if (player === game.dealer) game.envidoDone = true;
    if (navigator.vibrate) navigator.vibrate(20);
    game.turn = 1 - player;
    say(`${player === 0 ? "Jugaste" : "La CPU jugó"} ${cardName(card)}.`);
    render();
    if (game.trickCards.length === 2) {
      game.waiting = true;
      setTimeout(resolveTrick, 650);
    } else if (game.turn === 1) {
      setTimeout(cpuTurn, 650);
    }
  }

  function resolveTrick() {
    const a = game.trickCards[0], b = game.trickCards[1];
    const pa = power(a.card), pb = power(b.card);
    const winner = pa === pb ? -1 : (pa > pb ? a.player : b.player);
    game.tricks.push(winner);
    game.trickCards = [];
    game.waiting = false;
    if (winner === -1) say("Parda. La ventaja queda con quien venía ganando.");
    else say(`${winner === 0 ? scoreState().names[0] : "La CPU"} ganó la baza.`);
    const handWinner = determineHandWinner();
    if (handWinner !== null) {
      setTimeout(() => finishHand(handWinner, game.handStake, "la mano"), 700);
      return;
    }
    game.turn = winner === -1 ? firstPlayerNextTrick() : winner;
    render();
    if (game.turn === 1) setTimeout(cpuTurn, 750);
  }

  function firstPlayerNextTrick() {
    const decisive = game.tricks.find(w => w !== -1);
    return decisive === undefined ? game.mano : decisive;
  }

  function determineHandWinner() {
    const t = game.tricks;
    if (t.length < 2) return null;
    if (t[0] === -1 && t[1] === -1) return game.mano;
    if (t[0] === -1 && t[1] !== -1) return t[1];
    if (t[0] !== -1 && t[1] === -1) return t[0];
    if (t[0] === t[1]) return t[0];
    if (t.length < 3) return null;
    if (t[2] === -1) return t[0];
    return t[2];
  }

  function finishHand(winner, points, reason) {
    if (!game.active) return;
    game.active = false;
    const envidoWasOpen = !game.envidoDone && game.trucoLevel === 0 && game.played[game.dealer].length === 0;
    if (reason === "irse al mazo" && envidoWasOpen) queueSide(winner, 1, "Envido no jugado");
    for (let player = 0; player < 2; player++) {
      if (game.sidePoints[player] > 0) window.trucoScore.addPoints(player, game.sidePoints[player], game.sideEvents.filter(e => e.player === player).some(e => e.label === "Flor") ? "Flor" : "Juego");
    }
    if (!scoreState().scores.some(s => s >= scoreState().target)) window.trucoScore.addPoints(winner, points, "Juego");
    const extras = game.sidePoints[0] + game.sidePoints[1];
    say(`${winner === 0 ? scoreState().names[0] : scoreState().names[1]} gana ${points} ${points === 1 ? "tanto" : "tantos"} por ${reason}${extras ? `; también se anotaron ${extras} del envido/flor` : ""}.`);
    ui.deal.textContent = scoreState().scores.some(s => s >= scoreState().target) ? "Partida terminada" : "Siguiente mano";
    ui.deal.hidden = false;
    render();
  }

  function queueSide(player, points, label) {
    game.sidePoints[player] += points;
    game.sideEvents.push({ player, points, label });
  }

  function cpuTurn() {
    if (!game.active || game.waiting || game.turn !== 1) return;
    if (canCpuInitiateEnvido() && !game.florDone && scoreState().flor && hasFlor(game.hands[1])) {
      cpuCallFlor();
      return;
    }
    const level = ui.difficulty.value;
    const callChance = level === "easy" ? .12 : level === "hard" ? .36 : .24;
    if (canCpuInitiateEnvido() && Math.random() < callChance) {
      cpuCallEnvido(envidoValue(game.hands[1]) >= 29 ? "real" : "envido");
      return;
    }
    if (canCpuCallTruco() && cpuHandStrength() + Math.random() * 4 > 11) {
      cpuCallTruco();
      return;
    }
    const cards = [...game.hands[1]].sort((a, b) => power(a) - power(b));
    let choice = cards[0];
    if (game.trickCards.length === 1) {
      const target = power(game.trickCards[0].card);
      const winners = cards.filter(c => power(c) > target);
      choice = winners[0] || (level === "easy" && Math.random() < .45 ? cards[cards.length - 1] : cards[0]);
    } else if (game.tricks.length >= 1 && game.tricks[0] === 0) {
      choice = level === "easy" ? cards[Math.floor(Math.random() * cards.length)] : cards[cards.length - 1];
    } else if (level === "hard" && cards.length > 1) {
      choice = cards[Math.max(0, cards.length - 2)];
    }
    playCard(1, choice.id);
  }

  function cpuHandStrength() {
    const base = game.hands[1].reduce((sum, c) => sum + Math.max(0, power(c) - 5), 0);
    return base + (ui.difficulty.value === "hard" ? 2 : ui.difficulty.value === "easy" ? -2 : 0);
  }

  function callEnvido(kind) {
    if (!canCallEnvido() || game.waiting) return;
    const flor0 = hasFlor(game.hands[0]), flor1 = hasFlor(game.hands[1]);
    if (flor0 || flor1) {
      resolveFlor(flor0, flor1);
      return;
    }
    game.waiting = true;
    const value = envidoValue(game.hands[1]);
    const points = envidoPoints(kind);
    const accept = value >= (kind === "falta" ? 27 : 24) || Math.random() < .25;
    say(`Cantaste ${callLabel(kind)}.`);
    setTimeout(() => {
      game.waiting = false;
      if (!accept) {
        game.envidoDone = true;
        queueSide(0, 1, "Envido no querido");
        say(`La CPU dice “no quiero”. Se anotará 1 tanto al cerrar la mano.`);
      } else {
        const counter = kind === "envido" && value >= 28 && Math.random() < .55 ? "real" : kind !== "falta" && value >= 31 && Math.random() < .35 ? "falta" : null;
        if (counter) {
          game.waiting = true;
          showPending(callLabel(counter), `La CPU sube a ${callLabel(counter)}. La apuesta total será de ${combinedEnvidoStake([kind, counter])} tantos.`, [
            ["Quiero", "accept", () => resolvePlayerFacingCounter([kind, counter], true)],
            ...(counter !== "falta" ? [["Falta envido", "main", () => resolvePlayerFacingCounter([kind, counter, "falta"], true)]] : []),
            ["No quiero", "decline", () => resolvePlayerFacingCounter([kind, counter], false)]
          ]);
          render(); return;
        }
        game.envidoDone = true;
        const yours = envidoValue(game.hands[0]);
        const theirs = value;
        const winner = yours > theirs || (yours === theirs && game.mano === 0) ? 0 : 1;
        queueSide(winner, points, "Envido");
        say(`${yours} son buenas. La CPU tiene ${theirs}. ${scoreState().names[winner]} se anota ${points} al cerrar la mano.`);
      }
      render(); resumeAfterSideCall();
    }, 650);
  }

  function cpuCallEnvido(kind) {
    game.waiting = true;
    const raises = kind === "envido"
      ? [["Envido", "main", () => playerRaisesCpuEnvido([kind, "envido"])], ["Real envido", "main", () => playerRaisesCpuEnvido([kind, "real"])], ["Falta envido", "main", () => playerRaisesCpuEnvido([kind, "falta"])]]
      : kind === "real" ? [["Falta envido", "main", () => playerRaisesCpuEnvido([kind, "falta"])]] : [];
    showPending(callLabel(kind), `La CPU canta ${callLabel(kind)}. Tu envido es ${envidoValue(game.hands[0])}.`, [
      ["Quiero", "accept", () => resolveCpuEnvido(kind, true)],
      ...raises,
      ["No quiero", "decline", () => resolveCpuEnvido(kind, false)]
    ]);
  }

  function combinedEnvidoStake(sequence) {
    if (sequence.includes("falta")) return envidoPoints("falta");
    return sequence.reduce((sum, kind) => sum + envidoPoints(kind), 0);
  }

  function refusedEnvidoStake(sequence) {
    if (sequence.length === 1) return 1;
    return combinedEnvidoStake(sequence.slice(0, -1));
  }

  function settleEnvido(sequence, prefix = "") {
    const yours = envidoValue(game.hands[0]), theirs = envidoValue(game.hands[1]);
    const winner = yours > theirs || (yours === theirs && game.mano === 0) ? 0 : 1;
    const points = combinedEnvidoStake(sequence);
    queueSide(winner, points, "Envido");
    say(`${prefix}Vos: ${yours}. CPU: ${theirs}. ${scoreState().names[winner]} se anotará ${points} al cerrar la mano.`);
  }

  function resolvePlayerFacingCounter(sequence, accepted) {
    closePending(); game.waiting = false; game.envidoDone = true;
    if (accepted) settleEnvido(sequence);
    else {
      const points = refusedEnvidoStake(sequence);
      queueSide(1, points, "Envido no querido");
      say(`No quisiste la subida. La CPU se anotará ${points} al cerrar la mano.`);
    }
    render(); resumeAfterSideCall();
  }

  function playerRaisesCpuEnvido(sequence) {
    closePending();
    const cpuValue = envidoValue(game.hands[1]);
    const accepts = cpuValue + Math.random() * 7 >= 25 + sequence.length;
    game.waiting = false; game.envidoDone = true;
    if (accepts) settleEnvido(sequence, "La CPU quiere. ");
    else {
      const points = refusedEnvidoStake(sequence);
      queueSide(0, points, "Envido no querido");
      say(`La CPU no quiere la subida. Te anotarás ${points} al cerrar la mano.`);
    }
    render(); resumeAfterSideCall();
  }

  function resolveCpuEnvido(kind, accepted) {
    closePending(); game.waiting = false; game.envidoDone = true;
    if (!accepted) {
      queueSide(1, 1, "Envido no querido");
      say("No quisiste. La CPU se anotará 1 tanto al cerrar la mano."); render(); resumeAfterSideCall(); return;
    }
    const yours = envidoValue(game.hands[0]), theirs = envidoValue(game.hands[1]);
    const winner = yours > theirs || (yours === theirs && game.mano === 0) ? 0 : 1;
    const points = envidoPoints(kind);
    queueSide(winner, points, "Envido");
    say(`Vos: ${yours}. CPU: ${theirs}. ${scoreState().names[winner]} se anotará ${points} al cerrar la mano.`);
    render(); resumeAfterSideCall();
  }

  function resumeAfterSideCall() {
    if (game.waiting) return;
    if (game.deferredCpuTruco) {
      game.deferredCpuTruco = false;
      setTimeout(cpuCallTruco, 600);
    } else if (game.turn === 1 && game.active && !game.waiting) setTimeout(cpuTurn, 650);
  }

  function resolveFlor(flor0, flor1, initiator = 0) {
    game.florDone = true; game.envidoDone = true;
    if (flor0 && flor1) {
      if (initiator === 0 && florValue(game.hands[1]) >= 28 && Math.random() < .55) {
        game.waiting = true;
        showPending("Contra flor", "La CPU responde con contra flor. La apuesta vale 6 tantos.", [
          ["Quiero", "accept", () => resolveFlorCounter(6, true, 1)],
          ["Contra flor al resto", "main", () => resolveFlorCounter(florRestPoints(), true, 0)],
          ["No quiero", "decline", () => resolveFlorCounter(4, false, 1)]
        ]);
      } else settleFlor(3);
    } else {
      const winner = flor0 ? 0 : 1;
      queueSide(winner, 3, "Flor");
      say(`${winner === 0 ? "Tenés" : "La CPU tiene"} flor y se anotará 3 tantos al cerrar la mano.`);
    }
    render(); if (game.deferredCpuTruco && !game.waiting) resumeAfterSideCall();
  }

  function florRestPoints() {
    const state = scoreState();
    return Math.max(1, state.target - Math.max(...state.scores));
  }

  function settleFlor(points) {
    const v0 = florValue(game.hands[0]), v1 = florValue(game.hands[1]);
    const winner = v0 > v1 || (v0 === v1 && game.mano === 0) ? 0 : 1;
    queueSide(winner, points, "Flor");
    say(`Flor contra flor: ${v0} a ${v1}. ${scoreState().names[winner]} se anotará ${points} al cerrar la mano.`);
  }

  function resolveFlorCounter(points, accepted, winnerIfRefused) {
    closePending(); game.waiting = false;
    if (accepted) settleFlor(points);
    else {
      queueSide(winnerIfRefused, points, "Flor");
      say(`${scoreState().names[winnerIfRefused]} se anotará ${points} por la contra flor no querida.`);
    }
    render(); if (game.deferredCpuTruco) resumeAfterSideCall(); else if (game.turn === 1) setTimeout(cpuTurn, 650);
  }

  function cpuCallFlor() {
    game.waiting = true;
    const yours = hasFlor(game.hands[0]);
    const actions = yours ? [
      ["Cantar mi flor", "accept", () => { closePending(); game.waiting = false; resolveFlor(true, true, 1); if (game.turn === 1 && !game.waiting) setTimeout(cpuTurn, 650); }],
      ["Contra flor", "main", () => resolveCpuFlorRaise(6)],
      ["Contra flor al resto", "main", () => resolveCpuFlorRaise(florRestPoints())]
    ] : [["Continuar", "accept", () => {
        closePending(); game.waiting = false; resolveFlor(false, true, 1);
        if (game.turn === 1) setTimeout(cpuTurn, 650);
      }]];
    showPending("Flor", yours ? `La CPU canta flor. Vos también tenés flor de ${florValue(game.hands[0])}.` : "La CPU canta flor.", actions);
  }

  function resolveCpuFlorRaise(points) {
    closePending(); game.waiting = false; game.florDone = true; game.envidoDone = true;
    const accepts = florValue(game.hands[1]) + Math.random() * 6 >= 27;
    if (accepts) settleFlor(points);
    else {
      const refused = points === 6 ? 4 : 6;
      queueSide(0, refused, "Flor");
      say(`La CPU no quiere. Te anotarás ${refused} por la flor no querida.`);
    }
    render(); if (game.turn === 1) setTimeout(cpuTurn, 650);
  }

  function envidoPoints(kind) {
    if (kind === "envido") return 2;
    if (kind === "real") return 3;
    const s = scoreState();
    const leader = Math.max(...s.scores);
    return Math.max(1, s.target - leader);
  }

  function callLabel(kind) { return kind === "real" ? "real envido" : kind === "falta" ? "falta envido" : "envido"; }
  function envidoWindowOpen() {
    return game.active && !game.envidoDone && game.trucoLevel === 0 && game.played[game.dealer].length === 0;
  }
  function canCallEnvido() { return envidoWindowOpen() && game.played[0].length === 0; }
  function canCpuInitiateEnvido() { return envidoWindowOpen() && game.played[1].length === 0; }

  function callTruco() {
    if (!canPlayerCallTruco() || game.waiting) return;
    const next = game.trucoLevel + 1;
    const strength = cpuHandStrength();
    const accept = strength + Math.random() * 8 >= 7 + next * 2;
    game.waiting = true;
    say(`Cantaste ${trucoLabel(next)}.`);
    setTimeout(() => {
      game.waiting = false;
      if (!accept) {
        finishHand(0, game.handStake, `${trucoLabel(next)} no querido`);
      } else {
        game.trucoLevel = next; game.handStake = next + 1; game.lastTrucoCaller = 0; game.envidoDone = true;
        say(`La CPU quiere el ${trucoLabel(next)}. La mano vale ${game.handStake}.`);
        render();
        if (game.turn === 1) setTimeout(cpuTurn, 650);
      }
    }, 650);
  }

  function cpuCallTruco() {
    const next = game.trucoLevel + 1;
    game.waiting = true;
    showPending(trucoLabel(next), `La CPU canta ${trucoLabel(next)}. La mano pasaría a valer ${next + 1} tantos.`, [
      ["Quiero", "accept", () => respondCpuTruco(next, true)],
      ...(next === 1 && canCallEnvido() ? [["Envido está primero", "main", () => deferCpuTrucoForEnvido()]] : []),
      ...(next < 3 ? [[next === 1 ? "Retruco" : "Vale cuatro", "main", () => respondCpuTruco(next, true, true)]] : []),
      ["No quiero", "decline", () => respondCpuTruco(next, false)]
    ]);
  }

  function deferCpuTrucoForEnvido() {
    closePending(); game.waiting = false; game.deferredCpuTruco = true;
    callEnvido("envido");
  }

  function respondCpuTruco(level, accepted, raised = false) {
    closePending(); game.waiting = false;
    if (!accepted) { finishHand(1, game.handStake, `${trucoLabel(level)} no querido`); return; }
    game.trucoLevel = level; game.handStake = level + 1; game.lastTrucoCaller = 1; game.envidoDone = true;
    if (raised && level < 3) {
      const raisedLevel = level + 1;
      const cpuAccepts = cpuHandStrength() + Math.random() * 6 > 8 + raisedLevel;
      if (!cpuAccepts) { finishHand(0, game.handStake, `${trucoLabel(raisedLevel)} no querido`); return; }
      game.trucoLevel = raisedLevel; game.handStake = raisedLevel + 1; game.lastTrucoCaller = 0;
      say(`La CPU quiere el ${trucoLabel(raisedLevel)}. La mano vale ${game.handStake}.`);
    } else say(`Quisiste el ${trucoLabel(level)}. La mano vale ${game.handStake}.`);
    render(); if (game.turn === 1) setTimeout(cpuTurn, 650);
  }

  function trucoLabel(level) { return level === 1 ? "truco" : level === 2 ? "retruco" : "vale cuatro"; }
  function canPlayerCallTruco() { return game.active && game.trucoLevel < 3 && (game.trucoLevel === 0 || game.lastTrucoCaller === 1); }
  function canCpuCallTruco() { return game.active && game.trucoLevel < 3 && (game.trucoLevel === 0 || game.lastTrucoCaller === 0); }

  function showPending(title, text, actions) {
    ui.pendingTitle.textContent = `¡${title}!`;
    ui.pendingText.textContent = text;
    ui.pendingActions.innerHTML = "";
    actions.forEach(([label, cls, handler]) => {
      const button = document.createElement("button");
      button.className = `call-btn ${cls}`; button.textContent = label; button.addEventListener("click", handler);
      ui.pendingActions.appendChild(button);
    });
    ui.pending.hidden = false;
  }

  function closePending() { ui.pending.hidden = true; ui.pendingActions.innerHTML = ""; pendingResolver = null; }
  function say(text) {
    ui.message.textContent = text;
    ui.message.classList.remove("pulse");
    void ui.message.offsetWidth;
    ui.message.classList.add("pulse");
  }

  function render() {
    const state = scoreState();
    ui.cpuSeat.textContent = `${state.names[1]} · CPU`;
    ui.badge.textContent = !game.active ? (game.handNumber ? "Mano finalizada" : "Esperando reparto") : game.turn === 0 ? "Tu turno" : "Turno CPU";
    ui.handNumber.textContent = game.handNumber ? `#${game.handNumber} · ${game.mano === 0 ? "sos mano" : "CPU mano"}` : "—";
    ui.handValue.textContent = `${game.handStake} ${game.handStake === 1 ? "tanto" : "tantos"}`;
    const won0 = game.tricks.filter(w => w === 0).length, won1 = game.tricks.filter(w => w === 1).length;
    ui.trickScore.textContent = `${won0} · ${won1}`;
    ui.callsState.textContent = game.trucoLevel ? trucoLabel(game.trucoLevel) : game.sideEvents.length ? game.sideEvents.map(e => e.label).join(" · ") : game.envidoDone ? "Envido cerrado" : "Libres";
    ui.difficulty.disabled = game.active;
    ui.restart.disabled = !game.active;
    ui.cpuHand.innerHTML = "";
    game.hands[1].forEach(card => ui.cpuHand.appendChild(cardElement(card, game.active)));
    ui.playerHand.innerHTML = "";
    game.hands[0].forEach(card => {
      const button = cardElement(card);
      button.disabled = !game.active || game.turn !== 0 || game.waiting;
      button.addEventListener("click", () => playCard(0, card.id));
      ui.playerHand.appendChild(button);
    });
    ui.trickArea.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement("div"); slot.className = "trick-slot";
      const mark = document.createElement("span"); mark.className = "round-mark"; mark.textContent = `${i + 1}ª BAZA`; slot.appendChild(mark);
      [0, 1].forEach(player => {
        const card = game.played[player][i];
        if (card) slot.appendChild(cardElement(card, false, player === 0 ? "human-play" : "cpu-play"));
      });
      ui.trickArea.appendChild(slot);
    }
    const calls = [...ui.callBar.querySelectorAll("[data-call]")];
    calls.forEach(btn => {
      const type = btn.dataset.call;
      if (["envido", "real", "falta"].includes(type)) btn.disabled = !canCallEnvido() || game.waiting;
      if (type === "flor") btn.disabled = !canCallEnvido() || !state.flor || !hasFlor(game.hands[0]) || game.waiting;
      if (type === "truco") {
        btn.disabled = !canPlayerCallTruco() || game.waiting;
        btn.textContent = game.trucoLevel === 0 ? "¡Truco!" : game.trucoLevel === 1 ? "¡Retruco!" : "¡Vale cuatro!";
      }
      if (type === "fold") btn.disabled = !game.active || game.waiting;
    });
    ui.deal.hidden = game.active;
    if (!game.active) ui.deal.textContent = game.handNumber ? "Siguiente mano" : "Repartir cartas";
    saveGame();
  }

  ui.deal.addEventListener("click", startHand);
  ui.difficulty.value = localStorage.getItem("truco-difficulty") || "normal";
  ui.difficulty.addEventListener("change", () => localStorage.setItem("truco-difficulty", ui.difficulty.value));
  ui.restart.addEventListener("click", () => {
    if (!game.active || !confirm("¿Reiniciar esta mano? No se sumarán tantos.")) return;
    const previousDealer = game.dealer;
    const previousNumber = game.handNumber;
    game = freshGame(); game.dealer = 1 - previousDealer; game.handNumber = previousNumber;
    startHand();
  });
  ui.callBar.addEventListener("click", event => {
    const button = event.target.closest("[data-call]"); if (!button || button.disabled) return;
    const call = button.dataset.call;
    if (["envido", "real", "falta"].includes(call)) callEnvido(call);
    else if (call === "flor") resolveFlor(hasFlor(game.hands[0]), hasFlor(game.hands[1]), 0);
    else if (call === "truco") callTruco();
    else if (call === "fold") finishHand(1, game.handStake, "irse al mazo");
  });

  document.addEventListener("visibilitychange", () => { if (!document.hidden && game.active) render(); });
  window.addEventListener("truco-layout-change", () => requestAnimationFrame(render));
  document.addEventListener("keydown", event => {
    if (event.repeat || event.target.matches("input,select,textarea")) return;
    const key = event.key.toLowerCase();
    if (["1", "2", "3"].includes(key)) {
      const card = ui.playerHand.querySelectorAll("button:not(:disabled)")[Number(key) - 1];
      if (card) card.click();
    } else if (key === "e") ui.callBar.querySelector('[data-call="envido"]:not(:disabled)')?.click();
    else if (key === "t") ui.callBar.querySelector('[data-call="truco"]:not(:disabled)')?.click();
    else if (key === "m") ui.callBar.querySelector('[data-call="fold"]:not(:disabled)')?.click();
  });
  window.addEventListener("truco-new-match", () => {
    game = freshGame(); localStorage.removeItem(GAME_KEY); say("Nueva partida. Repartí las cartas para comenzar."); render();
  });
  window.addEventListener("truco-score-ready", render);
  render();
  if (game.active && game.trickCards.length === 2) {
    game.waiting = true; setTimeout(resolveTrick, 500);
  } else if (game.active && game.turn === 1 && !game.waiting) setTimeout(cpuTurn, 700);
})();
