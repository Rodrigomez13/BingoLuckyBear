'use client'

import { type GameState, type EnvidoCall } from '@/lib/truco/engine'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  state: GameState
  onEnvido: (call: EnvidoCall) => void
  onTruco: () => void
  onRespond: (accept: boolean) => void
  onMazo: () => void
}

export function ActionButtons({ state, onEnvido, onTruco, onRespond, onMazo }: ActionButtonsProps) {
  const isPlayerTurn = state.turn === 'player' && state.phase === 'playing'
  const pendingForPlayer =
    (state.trucoPending && state.trucoPending.by !== 'player') ||
    (state.envidoPending && state.envidoPending.by !== 'player')

  // Pending call awaiting player response.
  if (pendingForPlayer) {
    const label = state.trucoPending
      ? ['Truco', 'Truco', 'Retruco', 'Vale Cuatro'][state.trucoPending.level - 1]
      : 'Envido'
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-[#06140e]/80 p-4">
        <p className="mb-3 text-center text-sm font-bold text-amber-200">
          El oso canta <span className="uppercase">{label}</span>
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => onRespond(true)} className="bg-emerald-500 font-bold text-emerald-950 hover:bg-emerald-400">
            Quiero
          </Button>
          <Button onClick={() => onRespond(false)} variant="outline" className="border-rose-400/40 bg-transparent font-bold text-rose-200 hover:bg-rose-500/10">
            No quiero
          </Button>
        </div>
      </div>
    )
  }

  const canEnvido = isPlayerTurn && state.currentTrick === 0 && !state.envidoResolved && state.trucoLevel === 0 && !state.envidoPending
  const canTruco = isPlayerTurn && state.trucoLevel < 3 && state.trucoOwner !== 'player' && !state.trucoPending
  const trucoLabel = ['Truco', 'Retruco', 'Vale Cuatro'][state.trucoLevel] ?? 'Vale Cuatro'

  return (
    <div className="rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Acciones</h3>
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Envido</p>
          <div className="grid grid-cols-3 gap-2">
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('envido')}>Envido</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('real-envido')}>Real</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('falta-envido')}>Falta</ActionBtn>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Truco</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!canTruco}
              onClick={onTruco}
              className="bg-amber-400 font-bold text-amber-950 hover:bg-amber-300 disabled:opacity-30"
            >
              {trucoLabel}
            </Button>
            <Button
              disabled={state.phase !== 'playing'}
              onClick={onMazo}
              variant="outline"
              className="border-rose-400/40 bg-transparent font-bold text-rose-200 hover:bg-rose-500/10 disabled:opacity-30"
            >
              Ir al mazo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
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
      className="border-emerald-300/30 bg-transparent text-xs font-bold text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-30"
    >
      {children}
    </Button>
  )
}
