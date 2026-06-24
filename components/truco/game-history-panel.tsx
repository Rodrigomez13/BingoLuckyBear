'use client'

import type { GameState, Player } from '@/lib/truco/engine'
import { ScrollArea } from '@/components/ui/scroll-area'

export function GameHistoryPanel({
  log,
  perspective = 'player',
  rivalLabel = 'Rival',
  compact = false,
}: {
  log: GameState['log']
  perspective?: Player
  rivalLabel?: string
  compact?: boolean
}) {
  const visibleLog = log.slice(-24).reverse()

  return (
    <div className={`rounded-2xl border border-amber-300/20 bg-[#06140e]/80 ${compact ? 'hidden p-2 sm:block' : 'p-4'} shadow-xl shadow-black/30`}>
      <div className={`${compact ? 'mb-1.5' : 'mb-3'} flex items-center justify-between gap-2`}>
        <h3 className={`${compact ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.2em] text-amber-300`}>Historial</h3>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-100/45">
          real time
        </span>
      </div>
      <ScrollArea className={`${compact ? 'h-20' : 'h-56'} lbb-scrollbar pr-2`}>
        {visibleLog.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-3 text-xs text-emerald-100/45">
            Los cantos, puntos y jugadas aparecerán acá.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {visibleLog.map((entry, index) => (
              <li key={entry.id} className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 text-xs leading-relaxed">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className={`font-black ${entry.by === 'system' ? 'text-emerald-300/75' : entry.by === perspective ? 'text-amber-200' : 'text-sky-200'}`}>
                    {entry.by === 'system' ? 'Sistema' : entry.by === perspective ? 'Vos' : rivalLabel}
                  </span>
                  <span className="font-mono text-[9px] text-emerald-100/30">#{visibleLog.length - index}</span>
                </div>
                <p className="text-emerald-50/78">{formatLogText(entry.text, perspective, rivalLabel)}</p>
              </li>
            ))}
          </ol>
        )}
      </ScrollArea>
    </div>
  )
}

function formatLogText(text: string, perspective: Player, rivalLabel: string) {
  if (perspective === 'player') return text.replaceAll('el oso', rivalLabel.toLowerCase()).replaceAll('oso', rivalLabel.toLowerCase())
  return text
    .replaceAll('vos', 'rival')
    .replaceAll('Jugas', 'Juega el rival')
    .replaceAll('Ganaste', 'Ganó el rival')
    .replaceAll('el oso', 'vos')
    .replaceAll('oso', 'vos')
}
