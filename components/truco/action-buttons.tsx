'use client'

import { type EnvidoCall, type GameState, type Player } from '@/lib/truco/engine'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  state: GameState
  player?: Player
  compact?: boolean
  onEnvido: (call: EnvidoCall) => void
  onTruco: () => void
  onRespond: (accept: boolean) => void
  onMazo: () => void
}

export function ActionButtons({
  state,
  player = 'player',
  compact = false,
  onEnvido,
  onTruco,
  onRespond,
  onMazo,
}: ActionButtonsProps) {
  const isPlayerTurn = state.turn === player && state.phase === 'playing'
  const pendingForPlayer =
    (state.trucoPending && state.trucoPending.by !== player) ||
    (state.envidoPending && state.envidoPending.by !== player)

  if (pendingForPlayer) {
    const label = state.trucoPending
      ? ['Truco', 'Truco', 'Retruco', 'Vale Cuatro'][state.trucoPending.level - 1]
      : 'Envido'

    return (
      <div className={`${panelClass(compact)} border-amber-300/35`}>
        <p className="mb-2 text-center text-xs font-bold text-amber-200 sm:text-sm">
          Tu rival canta <span className="uppercase">{label}</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onRespond(true)} className="h-10 bg-emerald-500 font-bold text-emerald-950 hover:bg-emerald-400">
            Quiero
          </Button>
          <Button onClick={() => onRespond(false)} variant="outline" className="h-10 border-rose-400/40 bg-transparent font-bold text-rose-200 hover:bg-rose-500/10">
            No quiero
          </Button>
        </div>
      </div>
    )
  }

  const canEnvido = isPlayerTurn && state.currentTrick === 0 && !state.envidoResolved && state.trucoLevel === 0 && !state.envidoPending
  const canTruco = isPlayerTurn && state.trucoLevel < 3 && state.trucoOwner !== player && !state.trucoPending
  const trucoLabel = ['Truco', 'Retruco', 'Vale Cuatro'][state.trucoLevel] ?? 'Vale Cuatro'

  return (
    <div className={panelClass(compact)}>
      {!compact && <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Acciones</h3>}
      <div className={compact ? 'grid grid-cols-5 gap-2' : 'space-y-3'}>
        <div className={compact ? 'col-span-3' : ''}>
          {!compact && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Envido</p>}
          <div className="grid grid-cols-3 gap-2">
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('envido')}>Envido</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('real-envido')}>Real</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('falta-envido')}>Falta</ActionBtn>
          </div>
        </div>
        <div className={compact ? 'col-span-2' : ''}>
          {!compact && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Truco</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!canTruco}
              onClick={onTruco}
              className="h-10 bg-amber-400 px-2 text-xs font-bold text-amber-950 hover:bg-amber-300 disabled:opacity-30 sm:text-sm"
            >
              {trucoLabel}
            </Button>
            <Button
              disabled={state.phase !== 'playing'}
              onClick={onMazo}
              variant="outline"
              className="h-10 border-rose-400/40 bg-transparent px-2 text-xs font-bold text-rose-200 hover:bg-rose-500/10 disabled:opacity-30 sm:text-sm"
            >
              Mazo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function panelClass(compact: boolean) {
  return compact
    ? 'rounded-2xl border border-amber-300/25 bg-[#06140e]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl'
    : 'rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-4'
}

function ActionBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      variant="outline"
      className="h-10 border-emerald-300/30 bg-transparent px-2 text-[11px] font-bold text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-30 sm:text-xs"
    >
      {children}
    </Button>
  )
}
