'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  type EnvidoCall,
  type GameState,
  type Player,
  callEnvido,
  callTruco,
  createGame,
  goToMazo,
  nextRound,
  playCard,
  respondEnvido,
  respondTruco,
} from '@/lib/truco/engine'
import { botAct } from '@/lib/truco/bot'
import {
  type OnlineAction,
  type OnlineMessage,
  type OnlineRole,
  createTrucoRealtimeClient,
  trucoRoomChannelName,
} from '@/lib/truco/online'
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

type GameMode = 'bot' | 'online'
type OnlineStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'offline'

export function GameTable({
  target,
  onExit,
  mode = 'bot',
  roomCode,
  onlineRole = 'player',
}: {
  target: 15 | 30
  onExit: () => void
  mode?: GameMode
  roomCode?: string
  onlineRole?: OnlineRole
}) {
  const [state, setState] = useState<GameState>(() => createGame(target))
  const [botPhrase, setBotPhrase] = useState<string | null>(null)
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef<GameState>(state)
  const clientId = useMemo(() => Math.random().toString(36).slice(2, 10), [])

  const isOnline = mode === 'online' && Boolean(roomCode)
  const actor: Player = isOnline ? onlineRole : 'player'
  const rival = otherPlayer(actor)
  const isHost = !isOnline || actor === 'player'
  const rivalLabel = mode === 'bot' ? 'Oso' : 'Rival'
  const waitingForHost = isOnline && actor === 'opponent' && onlineStatus !== 'connected'

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [])

  const broadcastState = useCallback(
    (nextState: GameState) => {
      if (!isOnline || !roomCode || !channelRef.current) return
      const payload: OnlineMessage = { type: 'state', state: nextState, target, clientId }
      void channelRef.current.send({ type: 'broadcast', event: 'truco', payload })
    },
    [clientId, isOnline, roomCode, target],
  )

  useEffect(() => {
    if (!isOnline || !roomCode) return

    const client = createTrucoRealtimeClient()
    if (!client) {
      setOnlineStatus('offline')
      return
    }

    setOnlineStatus('connecting')
    const channel = client.channel(trucoRoomChannelName(roomCode), {
      config: { broadcast: { self: false } },
    })
    channelRef.current = channel

    channel.on('broadcast', { event: 'truco' }, ({ payload }) => {
      const message = payload as OnlineMessage
      if (!message || message.clientId === clientId) return

      if (message.type === 'join' && isHost) {
        setOnlineStatus('connected')
        const statePayload: OnlineMessage = { type: 'state', state: stateRef.current, target, clientId }
        void channel.send({ type: 'broadcast', event: 'truco', payload: statePayload })
        return
      }

      if (message.type === 'state' && !isHost) {
        setState(message.state)
        setOnlineStatus('connected')
        return
      }

      if (message.type === 'action' && isHost) {
        setOnlineStatus('connected')
        setState((prev) => applyOnlineAction(prev, message.actor, message.action, target))
      }
    })

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
      setOnlineStatus(isHost ? 'waiting' : 'connecting')
      const joinPayload: OnlineMessage = { type: 'join', role: actor, clientId }
      void channel.send({ type: 'broadcast', event: 'truco', payload: joinPayload })
      if (isHost) broadcastState(stateRef.current)
    })

    return () => {
      channel.unsubscribe()
      if (channelRef.current === channel) channelRef.current = null
    }
  }, [actor, broadcastState, clientId, isHost, isOnline, roomCode, target])

  useEffect(() => {
    if (!isOnline || !isHost) return
    broadcastState(state)
  }, [broadcastState, isHost, isOnline, state])

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
          const clearPhrase = setTimeout(() => setBotPhrase(null), 2200)
          timers.current.push(clearPhrase)
        }
        return nextState
      })
    }, 900)
    timers.current.push(t)
    return () => clearTimeout(t)
  }, [mode, state])

  const commitAction = useCallback(
    (action: OnlineAction) => {
      if (isOnline && !isHost) {
        if (!channelRef.current) return
        const payload: OnlineMessage = { type: 'action', actor, action, clientId }
        void channelRef.current.send({ type: 'broadcast', event: 'truco', payload })
        return
      }
      setState((prev) => applyOnlineAction(prev, actor, action, target))
    },
    [actor, clientId, isHost, isOnline, target],
  )

  const playerTurn = !waitingForHost && state.turn === actor && state.phase === 'playing' && !state.trucoPending && !state.envidoPending

  const handlePlay = (cardId: string) => {
    if (!playerTurn) return
    commitAction({ type: 'play-card', cardId })
  }

  const handleEnvido = (call: EnvidoCall) => commitAction({ type: 'call-envido', call })
  const handleTruco = () => commitAction({ type: 'call-truco' })
  const handleMazo = () => commitAction({ type: 'go-maze' })
  const handleRespond = (accept: boolean) => commitAction({ type: 'respond', accept })
  const handleNextRound = () => commitAction({ type: 'next-round' })
  const handleRestart = () => {
    setBotPhrase(null)
    commitAction({ type: 'restart' })
  }

  const turnLabel = state.trucoPending || state.envidoPending
    ? 'Esperando respuesta'
    : state.turn === actor
      ? 'Tu turno'
      : mode === 'bot'
        ? 'Turno del oso'
        : 'Turno del rival'

  const statusLabel = getOnlineStatusLabel(onlineStatus, isHost, roomCode)
  const resultText = formatResultForPerspective(state.lastResult, mode, actor)

  return (
    <div className="relative mx-auto max-w-6xl px-3 pb-40 sm:px-4 lg:pb-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button onClick={onExit} variant="outline" size="sm" className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Salir
        </Button>
        <div className="flex min-w-0 flex-col items-center gap-1">
          <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 sm:px-4">
            <span className={`h-2 w-2 rounded-full ${state.turn === actor ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="truncate text-xs font-bold text-amber-100 sm:text-sm">{turnLabel}</span>
          </div>
          {isOnline && <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/45">{statusLabel}</span>}
        </div>
        <Button onClick={handleRestart} variant="outline" size="sm" className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5">
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reiniciar
        </Button>
      </div>

      {waitingForHost && (
        <div className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-center text-sm font-semibold text-amber-100">
          Buscando la mesa {roomCode}. Asegurate de que el anfitrión tenga la partida abierta.
        </div>
      )}

      <div className="mb-4 lg:hidden">
        <ScoreBoard scores={state.scores} target={state.targetScore} perspective={actor} rivalLabel={rivalLabel} compact />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative overflow-hidden rounded-[2rem] border-4 border-amber-900/40 bg-gradient-to-b from-[#0d3325] to-[#072018] p-3 shadow-2xl shadow-black/50 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-amber-300/15" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:22px_22px]" />

          <div className="relative flex flex-col items-center gap-4 sm:gap-5">
            <OpponentHand count={state.hands[rival].length} name={rivalLabel} />

            {botPhrase && mode === 'bot' && (
              <div className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-1.5 text-sm font-semibold text-sky-100">
                {botPhrase}
              </div>
            )}

            <div className="my-1 w-full rounded-2xl border border-amber-300/10 bg-black/20 py-3">
              <PlayedCards played={state.played} currentTrick={state.currentTrick} perspective={actor} rivalLabel={rivalLabel} />
            </div>

            <PlayerHand cards={state.hands[actor]} canPlay={playerTurn} onPlay={handlePlay} />
          </div>
        </div>

        <aside className="hidden flex-col gap-4 lg:flex">
          <ScoreBoard scores={state.scores} target={state.targetScore} perspective={actor} rivalLabel={rivalLabel} />
          <ActionButtons
            state={state}
            player={actor}
            onEnvido={handleEnvido}
            onTruco={handleTruco}
            onRespond={handleRespond}
            onMazo={handleMazo}
          />
        </aside>
      </div>

      <div className="fixed inset-x-2 bottom-3 z-[70] lg:hidden">
        <ActionButtons
          state={state}
          player={actor}
          compact
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
          <div className="flex justify-center gap-3">
            {state.phase === 'game-over' ? (
              <Button onClick={handleRestart} className="bg-amber-300 font-bold text-amber-950 hover:bg-amber-200">
                Jugar de nuevo
              </Button>
            ) : (
              <Button onClick={handleNextRound} className="bg-amber-300 font-bold text-amber-950 hover:bg-amber-200">
                Siguiente mano
              </Button>
            )}
            <Button onClick={onExit} variant="outline" className="border-white/15 bg-transparent text-emerald-100">
              Salir al menú
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function applyOnlineAction(state: GameState, actor: Player, action: OnlineAction, target: 15 | 30): GameState {
  switch (action.type) {
    case 'play-card':
      return playCard(state, actor, action.cardId)
    case 'call-envido':
      return callEnvido(state, actor, action.call)
    case 'call-truco':
      return callTruco(state, actor)
    case 'respond':
      if (state.trucoPending && state.trucoPending.by !== actor) return respondTruco(state, actor, action.accept)
      if (state.envidoPending && state.envidoPending.by !== actor) return respondEnvido(state, actor, action.accept)
      return state
    case 'go-maze':
      return goToMazo(state, actor)
    case 'next-round':
      return nextRound(state)
    case 'restart':
      return createGame(target)
    default:
      return state
  }
}

function otherPlayer(player: Player): Player {
  return player === 'player' ? 'opponent' : 'player'
}

function getOnlineStatusLabel(status: OnlineStatus, isHost: boolean, roomCode?: string) {
  if (status === 'offline') return 'Online no configurado'
  if (status === 'connecting') return `Conectando mesa ${roomCode}`
  if (status === 'waiting') return isHost ? `Mesa ${roomCode}: esperando rival` : `Entrando a mesa ${roomCode}`
  if (status === 'connected') return `Mesa ${roomCode}: conectada`
  return `Mesa ${roomCode}`
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
