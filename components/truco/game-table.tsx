'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import {
  type GameState,
  type EnvidoCall,
  createGame,
  playCard,
  callTruco,
  callEnvido,
  respondTruco,
  respondEnvido,
  goToMazo,
  nextRound,
} from '@/lib/truco/engine'
import { botAct } from '@/lib/truco/bot'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PlayerHand } from './player-hand'
import { OpponentHand } from './opponent-hand'
import { PlayedCards } from './played-cards'
import { ScoreBoard } from './score-board'
import { ActionButtons } from './action-buttons'
import { ChatPanel } from './chat-panel'

interface ChatMessage {
  id: string
  by: string
  text: string
}

export function GameTable({ target, onExit }: { target: 15 | 30; onExit: () => void }) {
  const [state, setState] = useState<GameState>(() => createGame(target))
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [botPhrase, setBotPhrase] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timers.current.push(t)
  }, [])

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
    }
  }, [])

  // Drive the bot whenever it is the opponent's responsibility to act.
  useEffect(() => {
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
          setMessages((m) => [...m.slice(-20), { id: Math.random().toString(36).slice(2), by: 'opponent', text: phrase }])
          setTimeout(() => setBotPhrase(null), 2200)
        }
        return nextState
      })
    }, 900)
    timers.current.push(t)
    return () => clearTimeout(t)
  }, [state])

  const playerTurn = state.turn === 'player' && state.phase === 'playing' && !state.trucoPending && !state.envidoPending

  const handlePlay = (cardId: string) => {
    if (!playerTurn) return
    setState((prev) => playCard(prev, 'player', cardId))
  }

  const handleEnvido = (call: EnvidoCall) => setState((prev) => callEnvido(prev, 'player', call))
  const handleTruco = () => setState((prev) => callTruco(prev, 'player'))
  const handleMazo = () => setState((prev) => goToMazo(prev, 'player'))

  const handleRespond = (accept: boolean) => {
    setState((prev) => {
      if (prev.trucoPending && prev.trucoPending.by !== 'player') return respondTruco(prev, 'player', accept)
      if (prev.envidoPending && prev.envidoPending.by !== 'player') return respondEnvido(prev, 'player', accept)
      return prev
    })
  }

  const handleSendChat = (text: string) => {
    setMessages((m) => [...m.slice(-20), { id: Math.random().toString(36).slice(2), by: 'player', text }])
  }

  const handleNextRound = () => setState((prev) => nextRound(prev))
  const handleRestart = () => {
    setState(createGame(target))
    setMessages([])
  }

  const turnLabel = state.trucoPending || state.envidoPending
    ? 'Esperando respuesta'
    : state.turn === 'player'
      ? 'Tu turno'
      : 'Turno del oso'

  return (
    <div className="relative mx-auto max-w-6xl px-3 pb-10 sm:px-4">
      <div className="mb-4 flex items-center justify-between">
        <Button onClick={onExit} variant="outline" size="sm" className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Salir
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5">
          <span className={`h-2 w-2 rounded-full ${state.turn === 'player' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-sm font-bold text-amber-100">{turnLabel}</span>
        </div>
        <Button onClick={handleRestart} variant="outline" size="sm" className="border-white/15 bg-transparent text-emerald-100 hover:bg-white/5">
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reiniciar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Table */}
        <div className="relative overflow-hidden rounded-[2rem] border-4 border-amber-900/40 bg-gradient-to-b from-[#0d3325] to-[#072018] p-5 shadow-2xl shadow-black/50 sm:p-8">
          {/* Felt texture & ornaments */}
          <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-amber-300/15" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:22px_22px]" />

          <div className="relative flex flex-col items-center gap-5">
            <OpponentHand count={state.hands.opponent.length} />

            {botPhrase && (
              <div className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-1.5 text-sm font-semibold text-sky-100">
                {botPhrase}
              </div>
            )}

            <div className="my-1 w-full rounded-2xl border border-amber-300/10 bg-black/20 py-3">
              <PlayedCards played={state.played} currentTrick={state.currentTrick} />
            </div>

            <PlayerHand cards={state.hands.player} canPlay={playerTurn} onPlay={handlePlay} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <ScoreBoard scores={state.scores} target={state.targetScore} />
          <ActionButtons
            state={state}
            onEnvido={handleEnvido}
            onTruco={handleTruco}
            onRespond={handleRespond}
            onMazo={handleMazo}
          />
          <ChatPanel log={state.log} messages={messages} onSend={handleSendChat} />
        </div>
      </div>

      {/* Round / game result modal */}
      <Dialog open={state.phase === 'round-over' || state.phase === 'game-over'}>
        <DialogContent className="border-amber-300/30 bg-[#06140e] text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-center font-mono text-2xl font-black text-amber-300">
              {state.phase === 'game-over' ? 'Fin de la partida' : 'Fin de la mano'}
            </DialogTitle>
            <DialogDescription className="text-center text-base text-emerald-100/80">
              {state.lastResult}
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 flex items-center justify-center gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">Vos</p>
              <p className="font-mono text-4xl font-black text-emerald-300">{state.scores.player}</p>
            </div>
            <span className="text-2xl text-amber-300/50">-</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/50">Oso</p>
              <p className="font-mono text-4xl font-black text-amber-300">{state.scores.opponent}</p>
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
