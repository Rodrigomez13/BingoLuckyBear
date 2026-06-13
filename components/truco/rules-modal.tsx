'use client'

import { BookOpen, Crown, Flame, Medal, Scale, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const CARD_ORDER = [
  '1 de espada',
  '1 de basto',
  '7 de espada',
  '7 de oro',
  '3',
  '2',
  '1 falso',
  '12',
  '11',
  '10',
  '7 falso',
  '6',
  '5',
  '4',
]

const ENVIDO_VALUES = [
  ['Envido', '2 puntos si se quiere. 1 si no se quiere.'],
  ['Real Envido', '3 puntos si se quiere. 1 si no se quiere.'],
  ['Falta Envido', 'Lo necesario para llegar al objetivo. 1 si no se quiere.'],
  ['Empate de tantos', 'Gana quien es mano.'],
]

export function RulesModal({ compact = false }: { compact?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${compact ? 'h-9 px-2' : 'h-9 px-3'} border-white/15 bg-transparent text-emerald-100 hover:bg-white/5`}
        >
          <BookOpen className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Reglas</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88svh] overflow-y-auto border-amber-300/30 bg-[#06140e] text-emerald-50 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl font-black text-amber-300">Reglas rápidas del Truco</DialogTitle>
          <DialogDescription className="text-emerald-100/70">
            Resumen práctico para jugar en Lucky Bingo Bear. Las variantes regionales pueden cambiar algunos detalles finos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <RuleCard icon={<Crown className="h-5 w-5" />} title="Valor de las cartas">
            <ol className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-emerald-100/75 sm:text-sm">
              {CARD_ORDER.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="w-5 rounded bg-amber-300/15 text-center font-mono text-[10px] text-amber-200">{index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </RuleCard>

          <RuleCard icon={<Sparkles className="h-5 w-5" />} title="Envido">
            <div className="space-y-2 text-xs text-emerald-100/75 sm:text-sm">
              <p>Se canta en la primera baza, antes de que quede cerrada. Si hay Truco pendiente y todavía corresponde, el tanto se juega primero.</p>
              {ENVIDO_VALUES.map(([name, desc]) => (
                <p key={name}>
                  <span className="font-bold text-amber-200">{name}:</span> {desc}
                </p>
              ))}
            </div>
          </RuleCard>

          <RuleCard icon={<Flame className="h-5 w-5" />} title="Flor">
            <div className="space-y-2 text-xs text-emerald-100/75 sm:text-sm">
              <p>Hay Flor cuando tus tres cartas son del mismo palo.</p>
              <p>Vale 3 puntos. Si ambos tienen Flor, gana la Flor de mayor valor. Si empatan, gana la mano.</p>
              <p>Cuando hay Flor, se anula el Envido de esa mano.</p>
            </div>
          </RuleCard>

          <RuleCard icon={<Medal className="h-5 w-5" />} title="Truco">
            <div className="space-y-2 text-xs text-emerald-100/75 sm:text-sm">
              <p><span className="font-bold text-amber-200">Truco:</span> 2 puntos querido. 1 si no se quiere.</p>
              <p><span className="font-bold text-amber-200">Retruco:</span> 3 puntos querido. El anterior dueño no puede subirse solo.</p>
              <p><span className="font-bold text-amber-200">Vale Cuatro:</span> 4 puntos querido.</p>
            </div>
          </RuleCard>

          <RuleCard icon={<Scale className="h-5 w-5" />} title="Pardas y desempates">
            <div className="space-y-2 text-xs text-emerald-100/75 sm:text-sm">
              <p>Si una baza empata, se llama parda.</p>
              <p>Si ganás primera, perdés segunda y la tercera es parda, gana quien ganó la primera.</p>
              <p>Si primera y segunda son pardas, decide la tercera. Si las tres son pardas, gana la mano.</p>
            </div>
          </RuleCard>

          <RuleCard icon={<BookOpen className="h-5 w-5" />} title="Consejo de juego">
            <div className="space-y-2 text-xs text-emerald-100/75 sm:text-sm">
              <p>En la primera baza conviene cuidar los tantos: Envido y Flor se resuelven antes de que el Truco defina la mano.</p>
              <p>El historial de bazas muestra quién viene ganando para entender rápido si una parda te favorece o no.</p>
            </div>
          </RuleCard>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RuleCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/20 p-4 text-left shadow-lg shadow-black/20">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}
