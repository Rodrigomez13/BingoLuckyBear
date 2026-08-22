"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { envidoPoints } from '@/lib/truco/cards'
import type { Difficulty } from '@/lib/truco/ai'
import {
  canCallEnvido,
  canCallTruco,
  initialHandOf,
  TRUCO_LABELS,
} from '@/lib/truco/engine'
import { useTruco } from '@/lib/truco/use-truco'
import { PlayingCard } from './playing-card'
import { Scoreboard } from './scoreboard'

function BazaSlots({
  cards,
  align,
}: {
  cards: (import('@/lib/truco/cards').Card | undefined)[]
  align: "top" | "bottom"
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => {
        const card = cards[i]
        return (
          <div
            key={i}
            className={cn(
              "flex h-24 w-16 items-center justify-center rounded-lg border border-dashed border-border/40",
              card && "border-none",
            )}
          >
            {card && (
              <div className="animate-card-drop">
                <PlayingCard card={card} size="md" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function TrucoTable({ difficulty }: { difficulty: Difficulty }) {
  const { state, play, truco, envido, respondTo, fold, next, reset } = useTruco(difficulty)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [state.log])

  const humanEnvido = envidoPoints(initialHandOf(state, "human"))
  const isHumanTurn = state.turn === "human"
  const botThinking =
    (state.phase === "playing" || state.phase === "await-response") && state.turn === "bot"

  const showEnvido = canCallEnvido(state)
  const showTruco = canCallTruco(state)
  const responding = state.phase === "await-response" && isHumanTurn && state.pending

  const pending = state.pending
  const envidoRaises: { label: string; call: "real_envido" | "falta_envido" }[] = []
  if (pending?.kind === "envido") {
    if (!pending.chain.includes("real_envido") && !pending.chain.includes("falta_envido"))
      envidoRaises.push({ label: "Real Envido", call: "real_envido" })
    if (!pending.chain.includes("falta_envido")) envidoRaises.push({ label: "Falta Envido", call: "falta_envido" })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Table */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,#15412b,#0a2417)] p-4 sm:p-6">
        {/* Opponent */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-primary/40">
              <Image src="/images/bear-mascot.png" alt="El Oso" fill className="object-cover object-top" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">El Oso</p>
              <p className="text-xs text-muted-foreground">
                {state.mano === "bot" ? "Es mano" : "Pie"} · {difficulty}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {state.hands.bot.map((_, i) => (
              <PlayingCard key={i} faceDown size="sm" />
            ))}
            {state.hands.bot.length === 0 && <div className="h-16" />}
          </div>
        </div>

        {/* Center: played cards + announcement */}
        <div className="my-5 flex flex-col items-center gap-3">
          <BazaSlots cards={state.played.bot} align="top" />
          <div className="flex min-h-[2.5rem] items-center justify-center">
            {state.lastAnnounce ? (
              <div
                key={state.log.length}
                className={cn(
                  "animate-canto rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg",
                  state.lastAnnounce.tone === "envido" && "bg-accent text-accent-foreground",
                  state.lastAnnounce.tone === "truco" && "bg-primary text-primary-foreground",
                  state.lastAnnounce.tone === "info" && "bg-secondary text-secondary-foreground",
                )}
              >
                {state.lastAnnounce.text}
              </div>
            ) : (
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Mesa</span>
            )}
          </div>
          <BazaSlots cards={state.played.human} align="bottom" />
        </div>

        {/* Player hand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-end gap-3">
            {state.hands.human.map((card) => (
              <PlayingCard
                key={card.id}
                card={card}
                size="lg"
                onClick={() => play(card.id)}
                disabled={!(state.phase === "playing" && isHumanTurn)}
              />
            ))}
            {state.hands.human.length === 0 && <div className="h-28" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Tu envido: <span className="font-semibold text-foreground">{humanEnvido}</span>
          </p>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-4">
        <Scoreboard human={state.scores.human} bot={state.scores.bot} />

        {/* Actions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide">Acciones</h3>

          {state.phase === "game-over" && (
            <div className="space-y-3">
              <p className="text-sm">
                {state.winner === "human" ? "¡Ganaste la partida!" : "Ganó el oso esta vez."}
              </p>
              <Button className="w-full" onClick={() => reset("human")}>
                Jugar de nuevo
              </Button>
            </div>
          )}

          {state.phase === "hand-over" && (
            <Button className="w-full" onClick={next}>
              Siguiente mano
            </Button>
          )}

          {responding && pending?.kind === "envido" && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => respondTo("quiero")}>Quiero</Button>
              <Button variant="outline" onClick={() => respondTo("no_quiero")}>
                No quiero
              </Button>
              {envidoRaises.map((r) => (
                <Button key={r.call} variant="secondary" onClick={() => respondTo({ raise: r.call })}>
                  {r.label}
                </Button>
              ))}
            </div>
          )}

          {responding && pending?.kind === "truco" && (
            <div className="flex flex-col gap-2">
              <Button onClick={() => respondTo("quiero")}>Quiero</Button>
              <Button variant="outline" onClick={() => respondTo("no_quiero")}>
                No quiero
              </Button>
              {pending.level < 3 && (
                <Button variant="secondary" onClick={() => respondTo({ raiseTruco: true })}>
                  Quiero {TRUCO_LABELS[(pending.level + 1) as 1 | 2 | 3]}
                </Button>
              )}
            </div>
          )}

          {state.phase === "playing" && isHumanTurn && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Es tu turno. Jugá una carta o cantá.</p>
              <div className="flex flex-wrap gap-2">
                {showEnvido && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => envido("envido")}>
                      Envido
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => envido("real_envido")}>
                      Real Envido
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => envido("falta_envido")}>
                      Falta Envido
                    </Button>
                  </>
                )}
                {showTruco && (
                  <Button size="sm" onClick={truco}>
                    {TRUCO_LABELS[(state.trucoLevel + 1) as 1 | 2 | 3]}
                  </Button>
                )}
              </div>
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={fold}>
                Irse al mazo
              </Button>
            </div>
          )}

          {botThinking && <p className="text-sm text-muted-foreground">El oso está pensando…</p>}
        </div>

        {/* Log */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide">Relato</h3>
          <div ref={logRef} className="max-h-40 space-y-1 overflow-y-auto pr-1 text-xs">
            {state.log.map((l) => (
              <p
                key={l.id}
                className={cn(
                  l.by === "system" && "text-muted-foreground",
                  l.by === "human" && "text-primary",
                  l.by === "bot" && "text-accent",
                )}
              >
                {l.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
