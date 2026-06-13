'use client'

import { type LogEntry } from '@/lib/truco/engine'
import { ScrollArea } from '@/components/ui/scroll-area'

const QUICK_PHRASES = [
  '¡Quiero retruco!',
  'Son buenas',
  'Andá a saber',
  '¡Truco!',
  'Por las dudas...',
  '¡Vamos todavía!',
]

export function ChatPanel({
  log,
  messages,
  onSend,
}: {
  log: LogEntry[]
  messages: { id: string; by: string; text: string }[]
  onSend: (text: string) => void
}) {
  const combined = [
    ...log.map((l) => ({ ...l, kind: 'log' as const })),
    ...messages.map((m) => ({ ...m, kind: 'chat' as const })),
  ]

  return (
    <div className="flex h-full flex-col rounded-2xl border border-amber-300/20 bg-[#06140e]/80 p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Cantos y chat</h3>
      <ScrollArea className="lbb-scrollbar mb-3 h-44 pr-2">
        <ul className="space-y-1.5">
          {log.map((entry) => (
            <li key={entry.id} className="text-xs leading-relaxed">
              <span
                className={`font-semibold ${
                  entry.by === 'system'
                    ? 'text-emerald-300/70'
                    : entry.by === 'player'
                      ? 'text-amber-200'
                      : 'text-sky-200'
                }`}
              >
                {entry.by === 'system' ? '·' : entry.by === 'player' ? 'Vos:' : 'Oso:'}
              </span>{' '}
              <span className="text-emerald-50/80">{entry.text}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            onClick={() => onSend(phrase)}
            className="rounded-full border border-emerald-300/25 bg-emerald-400/5 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-400/15"
          >
            {phrase}
          </button>
        ))}
      </div>
    </div>
  )
}
