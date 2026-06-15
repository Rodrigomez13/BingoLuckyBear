'use client'

import {
  type EnvidoCall,
  type GameState,
  type Player,
  canCallEnvido,
  canCallFlor,
  canCallTruco,
  canRaiseEnvido,
  canRaiseTruco,
  nextTrucoRaiseLabel,
} from '@/lib/truco/engine'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  state: GameState
  player?: Player
  compact?: boolean
  onFlor: () => void
  onEnvido: (call: EnvidoCall) => void
  onTruco: () => void
  onRespond: (accept: boolean) => void
  onMazo: () => void
}

export function ActionButtons({
  state,
  player = 'player',
  compact = false,
  onFlor,
  onEnvido,
  onTruco,
  onRespond,
  onMazo,
}: ActionButtonsProps) {
  const isPlayerTurn = state.turn === player && state.phase === 'playing'
  const pendingEnvidoForPlayer = Boolean(state.envidoPending && state.envidoPending.by !== player)
  const pendingTrucoForPlayer = Boolean(state.trucoPending && state.trucoPending.by !== player)
  const canEnvido = canCallEnvido(state, player)
  const canFlor = canCallFlor(state, player)

  if (pendingEnvidoForPlayer) {
    const raiseOptions: { call: EnvidoCall; label: string }[] = [
      { call: 'envido', label: 'Envido' },
      { call: 'real-envido', label: 'Real' },
      { call: 'falta-envido', label: 'Falta' },
    ].filter((option) => canRaiseEnvido(state, player, option.call))
    const pendingLabel = formatEnvidoSequence(state.envidoPending?.calls ?? [])

    return (
      <div className={`${panelClass(compact)} border-emerald-300/35`}>
        <p className="mb-1.5 text-center text-[11px] font-bold text-emerald-100 sm:mb-2 sm:text-sm">
          Tu rival canta <span className="uppercase">{pendingLabel}</span>
        </p>
        {raiseOptions.length > 0 && (
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            {raiseOptions.map((option) => (
              <ActionBtn key={option.call} onClick={() => onEnvido(option.call)}>
                {option.label}
              </ActionBtn>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onRespond(true)} className={mainButtonClass('green')}>
            Quiero
          </Button>
          <Button onClick={() => onRespond(false)} variant="outline" className={mainButtonClass('red')}>
            No quiero
          </Button>
        </div>
      </div>
    )
  }

  if (pendingTrucoForPlayer) {
    const label = ['Truco', 'Truco', 'Retruco', 'Vale Cuatro'][state.trucoPending!.level - 1]
    const raiseLabel = canRaiseTruco(state, player) ? nextTrucoRaiseLabel(state) : null

    return (
      <div className={`${panelClass(compact)} border-amber-300/35`}>
        <p className="mb-1.5 text-center text-[11px] font-bold text-amber-200 sm:mb-2 sm:text-sm">
          Tu rival canta <span className="uppercase">{label}</span>
        </p>
        {(canEnvido || canFlor) && (
          <div className="mb-2 rounded-xl border border-emerald-300/15 bg-emerald-400/5 p-1.5">
            <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-100/55">
              El tanto está primero
            </p>
            {canFlor && (
              <Button onClick={onFlor} className="mb-1.5 h-8 w-full bg-amber-300 px-2 text-[11px] font-black text-amber-950 hover:bg-amber-200 sm:h-9 sm:text-xs">
                Flor
              </Button>
            )}
            {canEnvido && (
              <div className="grid grid-cols-3 gap-1.5">
                <ActionBtn onClick={() => onEnvido('envido')}>Envido</ActionBtn>
                <ActionBtn onClick={() => onEnvido('real-envido')}>Real</ActionBtn>
                <ActionBtn onClick={() => onEnvido('falta-envido')}>Falta</ActionBtn>
              </div>
            )}
          </div>
        )}
        <div className={raiseLabel ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'}>
          <Button onClick={() => onRespond(true)} className={mainButtonClass('green')}>
            Quiero
          </Button>
          {raiseLabel && (
            <Button onClick={onTruco} className={mainButtonClass('amber')}>
              {compact ? shortTrucoLabel(raiseLabel) : raiseLabel}
            </Button>
          )}
          <Button onClick={() => onRespond(false)} variant="outline" className={mainButtonClass('red')}>
            No quiero
          </Button>
        </div>
      </div>
    )
  }

  const canTruco = isPlayerTurn && canCallTruco(state, player)
  const trucoLabel = ['Truco', 'Retruco', 'Vale Cuatro'][state.trucoLevel] ?? 'Vale Cuatro'

  return (
    <div className={panelClass(compact)}>
      {!compact && <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Acciones</h3>}
      {canFlor && (
        <Button onClick={onFlor} className="mb-2 h-9 w-full bg-amber-300 text-xs font-black text-amber-950 hover:bg-amber-200 sm:h-10 sm:text-sm">
          Flor
        </Button>
      )}
      <div className={compact ? 'grid grid-cols-5 gap-1.5' : 'space-y-3'}>
        <div className={compact ? 'col-span-3' : ''}>
          {!compact && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Envido</p>}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('envido')}>Envido</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('real-envido')}>Real</ActionBtn>
            <ActionBtn disabled={!canEnvido} onClick={() => onEnvido('falta-envido')}>Falta</ActionBtn>
          </div>
        </div>
        <div className={compact ? 'col-span-2' : ''}>
          {!compact && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Truco</p>}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <Button
              disabled={!canTruco}
              onClick={onTruco}
              className="h-9 bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950 hover:bg-amber-300 disabled:opacity-30 sm:h-10 sm:px-2 sm:text-sm"
            >
              {compact ? shortTrucoLabel(trucoLabel) : trucoLabel}
            </Button>
            <Button
              disabled={state.phase !== 'playing'}
              onClick={onMazo}
              variant="outline"
              className="h-9 border-rose-400/40 bg-transparent px-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/10 disabled:opacity-30 sm:h-10 sm:px-2 sm:text-sm"
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
    ? 'rounded-2xl border border-amber-300/25 bg-[#06140e]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-3'
    : 'rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-4'
}

function mainButtonClass(kind: 'green' | 'red' | 'amber') {
  if (kind === 'green') return 'h-9 bg-emerald-500 text-xs font-bold text-emerald-950 hover:bg-emerald-400 sm:h-10 sm:text-sm'
  if (kind === 'amber') return 'h-9 bg-amber-400 px-1 text-xs font-bold text-amber-950 hover:bg-amber-300 sm:h-10 sm:text-sm'
  return 'h-9 border-rose-400/40 bg-transparent text-xs font-bold text-rose-200 hover:bg-rose-500/10 sm:h-10 sm:text-sm'
}

function shortTrucoLabel(label: string) {
  if (label === 'Vale Cuatro') return 'Vale 4'
  return label
}

function formatEnvidoSequence(calls: EnvidoCall[]) {
  if (calls.length === 0) return 'Envido'
  return calls.map((call) => {
    if (call === 'real-envido') return 'Real'
    if (call === 'falta-envido') return 'Falta'
    return 'Envido'
  }).join(' + ')
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
      className="h-9 border-emerald-300/30 bg-transparent px-1.5 text-[10px] font-bold text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-30 sm:h-10 sm:px-2 sm:text-xs"
    >
      {children}
    </Button>
  )
}
