"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/lib/truco/ai'
import { TrucoTable } from './truco-table'
import { RulesDialog } from './rules-dialog'

const LEVELS: { id: Difficulty; label: string; hint: string }[] = [
  { id: "facil", label: "Fácil", hint: "El oso arriesga poco" },
  { id: "normal", label: "Normal", hint: "Juego equilibrado" },
  { id: "dificil", label: "Difícil", hint: "El oso no perdona" },
]

export function GamePlay() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal")
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-primary">Mesa 1v1</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Truco contra el Oso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Partida a 15 puntos. Cantá Envido y Truco, y llevate la mano.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Juego gratuito contra IA. Tu partida se guarda sólo en este dispositivo.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRulesOpen(true)} className="w-fit gap-2 bg-transparent">
          <BookOpen className="h-4 w-4" />
          Reglas
        </Button>
      </div>

      {/* Difficulty selector */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Dificultad</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir dificultad">
          {LEVELS.map((lvl) => {
            const active = difficulty === lvl.id
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setDifficulty(lvl.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-4 py-2 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                <span className="block text-sm font-semibold">{lvl.label}</span>
                <span className="block text-xs opacity-80">{lvl.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      <TrucoTable difficulty={difficulty} />

      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </section>
  )
}
