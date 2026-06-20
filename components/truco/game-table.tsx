'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock, Hash, Maximize2, Minimize2, RotateCcw, Tally5 } from 'lucide-react'
import {
  type EnvidoCall,
  type GameState,
  type Player,
  callEnvido,
  callFlor,
  callTruco,
  createGame,
  getActivePlayer,
  goToMazo,
  nextRound,
  playCard,
  respondEnvido,
  respondTruco,
  TURN_TIME_LIMIT_MS,
} from '@/lib/truco/engine'
import { botAct } from '@/lib/truco/bot'
import { type OnlineAction, type OnlineRole } from '@/lib/truco/online'
import { CARD_SPRITE_SRC } from '@/lib/truco/cards'
import {
  fetchAuthoritativeRoom,
  leaveAuthoritativeRoom,
  sendAuthoritativeAction,
  type AuthoritativeRoomView,
} from '@/lib/truco/server-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlayerHand } from './player-hand'
import { OpponentHand } from './opponent-hand'
import { PlayedCards } from './played-cards'
import { ScoreBoard } from './score-board'
import { ActionButtons } from './action-buttons'
import { RulesModal } from './rules-modal'
import { PlayerMatchPreview } from './player-match-preview'
import { GameHistoryPanel } from './game-history-panel'
import { normalizeTrucoRules, type TrucoRules, type TrucoScoreStyle } from '@/lib/truco/rules'
import { dispatchLbbSound } from '@/components/audio/lbb-sound-effects'

type GameMode = 'bot' | 'online'
type OnlineStatus = 'idle' | 'syncing' | 'waiting' | 'connected' | 'offline'

export function GameTable({
  target,
  rules,
  onExit,
  mode = 'bot',
  roomCode,
  onlineRole = 'player',
  onlineSecret,
}: {
  target: 15 | 30
  rules: TrucoRules
  onExit: () => void
  mode?: GameMode
  roomCode?: string
  onlineRole?: OnlineRole
  onlineSecret?: string
}) {
  const [state, setState] = useState<GameState>(() => createGame(target, rules))
  const [botPhrase, setBotPhrase] = useState<string | null>(null)
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [exitBusy, setExitBusy] = useState(false)
  const [roomView, setRoomView] = useState<AuthoritativeRoomView | null>(null)
  const [availableBalance, setAvailableBalance] = useState<number | null>(null)
  // Personal, visual-only score notation. Initialized from the table rule but
  // can be switched at any time during play without affecting the rival.
  const [scoreStyle, setScoreStyle] = useState<TrucoScoreStyle>(() => normalizeTrucoRules(rules).scoreStyle)
  // Ticking clock used to render the per-turn countdown in online tables.
  const [now, setNow] = useState(() => Date.now())

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const gameShellRef = useRef<HTMLDivElement | null>(null)
  const spriteWarmedRef = useRef(false)
  const lastVersionRef = useRef<number | null>(null)
  const timeoutFiredVersionRef = useRef<number | null>(null)
  const turnSoundRef = useRef<string | null>(null)
  const spokenBotLogIdsRef = useRef<Set<string>>(new Set())
  const botSoundReadyRef = useRef(false)

  const isOnline = mode === 'online' && Boolean(roomCode && onlineSecret)
  const actor: Player = isOnline ? onlineRole : 'player'
  const rival = otherPlayer(actor)
  const rivalLabel = mode === 'bot'
    ? 'Oso'
    : actor === 'player'
      ? roomView?.players.opponent?.name ?? 'Rival'
      : roomView?.players.player.name ?? 'Rival'
  const waitingForRival = isOnline && onlineStatus === 'waiting'
  const activeRules = normalizeTrucoRules(state.rules ?? rules)

  // Per-turn countdown (online tables only). The clock only runs once the game
  // has actually started (status "connected"/playing), never while a table is
  // still waiting for a rival.
  const timerActive =
    isOnline && onlineStatus === 'connected' && state.phase === 'playing' && typeof state.turnStartedAt === 'number'
  const activePlayer = getActivePlayer(state)
  const localIsActive = activePlayer === actor
  const turnDeadline = (state.turnStartedAt ?? 0) + TURN_TIME_LIMIT_MS
  const secondsLeft = timerActive ? Math.max(0, Math.ceil((turnDeadline - now) / 1000)) : null

  useEffect(() => {
    if (state.phase !== 'playing') return
    const token = `${activePlayer}-${state.turnStartedAt ?? state.played.length}-${state.envidoPending ? 'envido' : ''}-${state.trucoPending ? 'truco' : ''}`
    if (turnSoundRef.current === token) return
    turnSoundRef.current = token

    if (activePlayer === actor && !state.envidoPending && !state.trucoPending && !actionBusy) {
      dispatchLbbSound('truco.turn')
    }
  }, [actionBusy, activePlayer, actor, state.envidoPending, state.phase, state.played.length, state.trucoPending, state.turnStartedAt])

  useEffect(() => {
    if (mode !== 'bot') return

    if (!botSoundReadyRef.current) {
      state.log.forEach((entry) => spokenBotLogIdsRef.current.add(entry.id))
      botSoundReadyRef.current = true
      return
    }

    const newEntries = state.log.filter((entry) => !spokenBotLogIdsRef.current.has(entry.id))
    newEntries.forEach((entry) => spokenBotLogIdsRef.current.add(entry.id))

    let delay = 0
    for (const entry of newEntries) {
      if (entry.by === 'opponent') {
        const sound = getBotLogSound(entry.text)
        if (sound) {
          const timer = setTimeout(() => dispatchLbbSound(sound, 'male'), delay)
          timers.current.push(timer)
          delay += sound === 'truco.play-card' ? 250 : 900
        }
      }

      if (entry.by === 'system') {
        const envido = getBotEnvidoResult(entry.text)
        if (envido) {
          delay = Math.max(delay, 900)
          const numberTimer = setTimeout(
            () => dispatchLbbSound(`truco.envido-value.${envido.value}`, 'male'),
            delay,
          )
          timers.current.push(numberTimer)
          delay += 1100

          if (envido.playerWon) {
            const goodTimer = setTimeout(() => dispatchLbbSound('truco.son-buenas', 'male'), delay)
            timers.current.push(goodTimer)
            delay += 900
          }
        }
      }
    }
  }, [mode, state.log])
  const loadBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/wallet', { cache: 'no-store' })
      const data = await response.json()
      setAvailableBalance(data.wallet ? Number(data.wallet.total_balance ?? data.wallet.general_balance ?? 0) : null)
    } catch {
      setAvailableBalance(null)
    }
  }, [])

  useEffect(() => {
    void loadBalance()
  }, [loadBalance, state.phase])

  const updateOnlineStatus = useCallback((status?: string) => {
    if (status === 'waiting') setOnlineStatus('waiting')
    else if (status === 'playing' || status === 'finished') setOnlineStatus('connected')
    else if (status === 'abandoned') setOnlineStatus('offline')
    else setOnlineStatus('connected')
  }, [])

  useEffect(() => {
    if (!isOnline || !roomCode || !onlineSecret) return

    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const loadRoom = async () => {
      try {
        const result = await fetchAuthoritativeRoom(roomCode, onlineSecret)
        if (cancelled) return

        if (!result.ok || !result.room) {
          setOnlineStatus('offline')
          if (result.error) setBotPhrase(result.error)
          return
        }

        updateOnlineStatus(result.room.status)
        setRoomView(result.room)
        if (lastVersionRef.current !== result.room.version) {
          lastVersionRef.current = result.room.version
          setState(result.room.state)
        }
      } catch {
        if (!cancelled) setOnlineStatus('offline')
      }
    }

    setOnlineStatus('syncing')
    void loadRoom()
    interval = setInterval(loadRoom, 1200)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [isOnline, onlineSecret, roomCode, updateOnlineStatus])

  useEffect(() => {
    if (spriteWarmedRef.current) return
    spriteWarmedRef.current = true
    const img = new window.Image()
    img.decoding = 'async'
    img.src = CARD_SPRITE_SRC
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === gameShellRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const activeTimers = timers.current
    return () => activeTimers.forEach(clearTimeout)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (isFullscreen) {
        setIsFullscreen(false)
      } else if (gameShellRef.current?.requestFullscreen) {
        await gameShellRef.current.requestFullscreen()
      } else {
        setIsFullscreen(true)
      }
    } catch {
      setIsFullscreen((value) => !value)
    }
  }

  useEffect(() => {
    if (mode !== 'bot') return

    const needsBot =
      state.phase === 'playing' &&
      ((state.turn === 'opponent' && !state.trucoPending && !state.envidoPending) ||
        (state.trucoPending && state.trucoPending.by === 'player') ||
        (state.envidoPending && state.envidoPending.by === 'player'))

    if (!needsBot) return

    const t = setTimeout(() => {
      setState((prev) => {
        const { state: nextState, phrase } = botAct(prev)
        if (phrase) {
          setBotPhrase(phrase)
          const clearPhrase = setTimeout(() => setBotPhrase(null), 1800)
          timers.current.push(clearPhrase)
        }
        return nextState
      })
    }, 650)
    timers.current.push(t)
    return () => clearTimeout(t)
  }, [mode, state])

  const commitAction = useCallback(
    async (action: OnlineAction) => {
      if (isOnline) {
        if (!roomCode || !onlineSecret || actionBusy) return
        setActionBusy(true)
        setBotPhrase(null)
        try {
          const result = await sendAuthoritativeAction({ roomCode, actor, secret: onlineSecret, action })
          if (!result.ok || !result.room) {
            setBotPhrase(result.error ?? 'No se pudo aplicar la acción')
            return
          }
          lastVersionRef.current = result.room.version
          updateOnlineStatus(result.room.status)
          setRoomView(result.room)
          setState(result.room.state)
        } catch (error) {
          setBotPhrase(error instanceof Error ? error.message : 'Error de conexión')
        } finally {
          setActionBusy(false)
        }
        return
      }

      setState((prev) => applyLocalAction(prev, actor, action, target, rules))
    },
    [actionBusy, actor, isOnline, onlineSecret, roomCode, rules, target, updateOnlineStatus],
  )

  const canInteractOnline = !isOnline || onlineStatus === 'connected'
  const playerTurn = canInteractOnline && !actionBusy && !waitingForRival && state.turn === actor && state.phase === 'playing' && !state.trucoPending && !state.envidoPending

  const handlePlay = (cardId: string) => {
    if (!playerTurn) return
    void commitAction({ type: 'play-card', cardId })
  }

  const handleFlor = () => void commitAction({ type: 'call-flor' })
  const handleEnvido = (call: EnvidoCall) => void commitAction({ type: 'call-envido', call })
  const handleTruco = () => void commitAction({ type: 'call-truco' })
  const handleMazo = () => void commitAction({ type: 'go-maze' })
  const handleRespond = (accept: boolean) => void commitAction({ type: 'respond', accept })
  const handleRestart = () => {
    if (isOnline) return
    setBotPhrase(null)
    void commitAction({ type: 'restart' })
  }

  // Tick the countdown clock twice a second while an online turn is live.
  useEffect(() => {
    if (!timerActive) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [timerActive, state.turnStartedAt])

  // Claim a timeout once the 30s window elapses. The player on the clock folds
  // immediately at 0s; the waiting rival can claim ~3s later as a fallback in
  // case the other client is closed. The server re-validates the deadline.
  useEffect(() => {
    if (!timerActive || actionBusy) return
    const version = lastVersionRef.current
    if (version === null || timeoutFiredVersionRef.current === version) return
    const overdueBy = now - turnDeadline
    const threshold = localIsActive ? 0 : 3000
    if (overdueBy >= threshold) {
      timeoutFiredVersionRef.current = version
      void commitAction({ type: 'timeout' })
    }
  }, [timerActive, actionBusy, now, turnDeadline, localIsActive, commitAction])

  // When a round finishes, briefly show who won and advance automatically.
  // The player no longer needs to press "Siguiente mano". In online mode only
  // the host drives the advance; the guest receives the new hand via polling.
  useEffect(() => {
    if (state.phase !== 'round-over') return
    if (isOnline && (actor !== 'player' || onlineStatus !== 'connected' || actionBusy)) return
    const t = setTimeout(() => {
      void commitAction({ type: 'next-round' })
    }, 1800)
    return () => clearTimeout(t)
  }, [state.phase, isOnline, actor, onlineStatus, actionBusy, commitAction])

  const handleExit = async () => {
    if (!isOnline || !roomCode || !onlineSecret) {
      onExit()
      return
    }

    if (
      onlineStatus === 'connected' &&
      state.phase !== 'game-over' &&
      !window.confirm('Salir ahora cuenta como abandono. El rival ganará la partida y el pozo. ¿Querés continuar?')
    ) {
      return
    }

    setExitBusy(true)
    setBotPhrase(null)
    try {
      const result = await leaveAuthoritativeRoom({ roomCode, actor, secret: onlineSecret })
      if (!result.ok) {
        setBotPhrase(result.error ?? 'No se pudo cerrar la mesa correctamente.')
        return
      }
      onExit()
    } catch (error) {
      setBotPhrase(error instanceof Error ? error.message : 'No se pudo cerrar la mesa correctamente.')
    } finally {
      setExitBusy(false)
    }
  }

  const turnLabel = actionBusy
    ? 'Validando jugada'
    : state.trucoPending || state.envidoPending
      ? 'Responder canto'
      : state.turn === actor
        ? 'Tu turno'
        : mode === 'bot'
          ? 'Turno del oso'
          : 'Turno rival'

  const statusLabel = getOnlineStatusLabel(onlineStatus, isOnline)
  const resultText = formatResultForPerspective(state.lastResult, mode, actor)

  const shellClass = isFullscreen
    ? 'fixed inset-0 z-[90] mx-0 flex h-[100svh] max-w-none flex-col overflow-hidden bg-[#020805] px-2 pb-20 pt-2 text-emerald-50 sm:px-4 lg:pb-4'
    : 'relative mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-7xl flex-col px-2 pb-28 text-emerald-50 sm:px-4 lg:pb-10'

  const tableHeightClass = isFullscreen
    ? 'h-[calc(100svh-11rem)] min-h-[300px]'
    : 'h-[calc(100svh-18rem)] min-h-[300px]'

  return (
    <div ref={gameShellRef} className={shellClass}>
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4">
        <Button disabled={exitBusy} onClick={() => void handleExit()} variant="outline" size="sm" className="h-9 border-white/15 bg-transparent px-2 text-emerald-100 hover:bg-white/5 sm:px-3">
          <ArrowLeft className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">{exitBusy ? 'Saliendo' : 'Salir'}</span>
        </Button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
          <div className="flex max-w-full items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 sm:px-4 sm:py-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${state.turn === actor ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="truncate text-xs font-bold text-amber-100 sm:text-sm">{turnLabel}</span>
            {secondsLeft !== null && (
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-black tabular-nums sm:text-sm ${
                  secondsLeft <= 10 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-200'
                }`}
                aria-label={localIsActive ? 'Tu tiempo restante' : `Tiempo restante de ${rivalLabel}`}
              >
                <Clock className="h-3 w-3" />
                {secondsLeft}s
              </span>
            )}
          </div>
          {secondsLeft !== null && (
            <span className="max-w-full truncate text-[9px] font-semibold uppercase tracking-wider text-emerald-100/45 sm:text-[10px]">
              {localIsActive ? 'Tenés 30s para jugar' : `Turno de ${rivalLabel}`}
            </span>
          )}
          {isOnline && <span className="max-w-full truncate text-[9px] font-semibold uppercase tracking-wider text-emerald-100/45 sm:text-[10px]">{statusLabel}</span>}
        </div>
        <div className="flex gap-1.5">
          <Button
            onClick={() => setScoreStyle((value) => (value === 'numeric' ? 'traditional' : 'numeric'))}
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-transparent px-2 text-emerald-100 hover:bg-white/5 sm:px-3"
            aria-label={scoreStyle === 'numeric' ? 'Cambiar a anotación tradicional' : 'Cambiar a anotación numérica'}
            title={scoreStyle === 'numeric' ? 'Anotación numérica' : 'Anotación tradicional'}
          >
            {scoreStyle === 'numeric' ? <Hash className="h-4 w-4" /> : <Tally5 className="h-4 w-4" />}
            <span className="hidden sm:ml-1.5 sm:inline">{scoreStyle === 'numeric' ? 'Números' : 'Palitos'}</span>
          </Button>
          <RulesModal compact />
          <Button onClick={toggleFullscreen} variant="outline" size="sm" className="h-9 border-white/15 bg-transparent px-2 text-emerald-100 hover:bg-white/5 sm:px-3" aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {!isOnline && (
            <Button onClick={handleRestart} variant="outline" size="sm" className="h-9 border-white/15 bg-transparent px-2 text-emerald-100 hover:bg-white/5 sm:px-3">
              <RotateCcw className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Reiniciar</span>
            </Button>
          )}
        </div>
      </div>

      {waitingForRival && (
        <div className="mb-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-center text-xs font-semibold text-amber-100 sm:mb-4 sm:text-sm">
          Esperando rival. Si la mesa es privada, compartí el enlace o código por privado.
        </div>
      )}

      {botPhrase && (
        <div className="mb-2 rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-center text-xs font-semibold text-sky-100 sm:mb-4 sm:text-sm">
          {botPhrase}
        </div>
      )}

      <PlayerMatchPreview
        roomView={roomView}
        scores={state.scores}
        target={state.targetScore}
        perspective={actor}
        rivalLabel={rivalLabel}
        statusLabel={statusLabel}
        isOnline={isOnline}
        availableBalance={availableBalance}
        florEnabled={activeRules.florEnabled}
      />

      <div className="mb-2 lg:hidden">
        <ScoreBoard
          scores={state.scores}
          target={state.targetScore}
          perspective={actor}
          rivalLabel={rivalLabel}
          trickWinners={state.trickWinners}
          hand={state.hand}
          compact
          scoreStyle={scoreStyle}
        />
      </div>

      <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`relative overflow-hidden rounded-[1.5rem] border-2 border-amber-900/40 bg-gradient-to-b from-[#0d3325] to-[#072018] p-2 shadow-2xl shadow-black/50 sm:rounded-[2rem] sm:border-4 sm:p-6 lg:h-auto lg:p-8 ${tableHeightClass}`}>
          <div className="pointer-events-none absolute inset-2 rounded-[1.15rem] border border-amber-300/15 sm:inset-3 sm:rounded-[1.5rem]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:22px_22px]" />

          <div className="relative flex h-full flex-col items-center justify-between gap-1 sm:gap-3">
            <OpponentHand count={state.hands[rival].length} name={rivalLabel} />

            <div className="w-full rounded-xl border border-amber-300/10 bg-black/20 py-0.5 sm:rounded-2xl sm:py-1.5">
              <PlayedCards played={state.played} currentTrick={state.currentTrick} perspective={actor} rivalLabel={rivalLabel} />
            </div>

            <PlayerHand cards={state.hands[actor]} canPlay={playerTurn} onPlay={handlePlay} />
          </div>
        </div>

        <aside className="hidden flex-col gap-4 overflow-hidden lg:flex">
          <ScoreBoard
            scores={state.scores}
            target={state.targetScore}
            perspective={actor}
            rivalLabel={rivalLabel}
            trickWinners={state.trickWinners}
            hand={state.hand}
            scoreStyle={scoreStyle}
          />
          <ActionButtons
            state={state}
            player={actor}
            onFlor={handleFlor}
            onEnvido={handleEnvido}
            onTruco={handleTruco}
            onRespond={handleRespond}
            onMazo={handleMazo}
          />
          <GameHistoryPanel log={state.log} perspective={actor} rivalLabel={rivalLabel} />
        </aside>
      </div>

      <div className="mt-2 lg:hidden">
        <GameHistoryPanel log={state.log} perspective={actor} rivalLabel={rivalLabel} compact />
      </div>

      <div className="fixed inset-x-2 bottom-2 z-[70] lg:hidden">
        <ActionButtons
          state={state}
          player={actor}
          compact
          onFlor={handleFlor}
          onEnvido={handleEnvido}
          onTruco={handleTruco}
          onRespond={handleRespond}
          onMazo={handleMazo}
        />
      </div>

      <Dialog open={state.phase === 'round-over' || state.phase === 'game-over'}>
        <DialogContent className="border-amber-300/30 bg-[#06140e] text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-center font-mono text-2xl font-black text-amber-300">
              {state.phase === 'game-over' ? 'Fin de la partida' : 'Fin de la mano'}
            </DialogTitle>
            <DialogDescription className="text-center text-base text-emerald-100/80">
              {resultText}
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">Vos</p>
              <p className="font-mono text-4xl font-black text-emerald-300">{state.scores[actor]}</p>
            </div>
            <span className="text-2xl text-amber-300/50">-</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">{rivalLabel}</p>
              <p className="font-mono text-4xl font-black text-amber-300">{state.scores[rival]}</p>
            </div>
          </div>
          {state.phase === 'game-over' ? (
            <div className="flex justify-center gap-3">
              <Button onClick={handleRestart} className="bg-amber-300 font-bold text-amber-950 hover:bg-amber-200">
                Jugar de nuevo
              </Button>
              <Button disabled={exitBusy} onClick={() => void handleExit()} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
                Salir al menú
              </Button>
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase tracking-widest text-emerald-100/50">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
              Siguiente mano
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function applyLocalAction(state: GameState, actor: Player, action: OnlineAction, target: 15 | 30, rules: TrucoRules): GameState {
  switch (action.type) {
    case 'play-card':
      return playCard(state, actor, action.cardId)
    case 'call-flor':
      return callFlor(state, actor)
    case 'call-envido':
      return callEnvido(state, actor, action.call)
    case 'call-truco':
      return callTruco(state, actor)
    case 'respond':
      if (state.envidoPending && state.envidoPending.by !== actor) return respondEnvido(state, actor, action.accept)
      if (state.trucoPending && state.trucoPending.by !== actor) return respondTruco(state, actor, action.accept)
      return state
    case 'go-maze':
      return goToMazo(state, actor)
    case 'next-round':
      return nextRound(state)
    case 'restart':
      return createGame(target, normalizeTrucoRules(state.rules ?? rules))
    default:
      return state
  }
}

function getBotLogSound(text: string): string | null {
  const normalized = text.trim().toLocaleLowerCase('es-AR')

  if (normalized.includes('no quiero')) return 'truco.no-quiero'
  if (normalized === 'quiero') return 'truco.quiero'
  if (normalized.includes('mazo')) return 'truco.mazo'
  if (normalized.includes('falta envido')) return 'truco.falta-envido'
  if (normalized.includes('real envido')) return 'truco.real-envido'
  if (normalized.includes('envido')) return 'truco.envido'
  if (normalized.includes('vale cuatro')) return 'truco.vale-cuatro'
  if (normalized.includes('retruco')) return 'truco.retruco'
  if (normalized === 'truco') return 'truco.truco'
  if (normalized === 'flor') return 'truco.flor'
  if (normalized.startsWith('juega ')) return 'truco.play-card'

  return null
}

function getBotEnvidoResult(text: string): { value: number; playerWon: boolean } | null {
  const match = text.match(/Envido: vos (\d+) - oso (\d+)\./i)
  if (!match) return null

  const value = Number(match[2])
  if (value < 20 || value > 33) return null

  return {
    value,
    playerWon: /Ganaste/i.test(text),
  }
}
function otherPlayer(player: Player): Player {
  return player === 'player' ? 'opponent' : 'player'
}

function getOnlineStatusLabel(status: OnlineStatus, isOnline: boolean) {
  if (!isOnline) return 'Partida local contra bot'
  if (status === 'offline') return 'Mesa sin conexión'
  if (status === 'syncing') return 'Sincronizando mesa'
  if (status === 'waiting') return 'Mesa privada esperando rival'
  if (status === 'connected') return 'Mesa conectada y validada'
  return 'Mesa online'
}

function formatResultForPerspective(text: string | null, mode: GameMode, perspective: Player) {
  if (!text) return ''
  if (mode === 'bot') return text
  if (perspective === 'player') return text.replaceAll('oso', 'rival').replaceAll('Oso', 'Rival').replaceAll('EL OSO', 'EL RIVAL')

  if (text.includes('EL OSO GANA LA PARTIDA')) return 'GANASTE LA PARTIDA'
  if (text.includes('GANASTE LA PARTIDA')) return 'GANA EL RIVAL'

  return text
    .replace('Ganaste', 'Ganó el rival')
    .replace('Gano el oso', 'Ganaste')
    .replace('Gana la mano vos', 'Gana la mano el rival')
    .replace('Gana la mano el oso', 'Ganás la mano vos')
    .replace('El oso se fue', 'Tu rival se fue')
    .replaceAll('oso', 'rival')
}
