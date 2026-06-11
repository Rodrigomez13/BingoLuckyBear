'use client'

import { useState, useEffect } from 'react'
import { ParticipationForm } from '@/components/participate/participation-form'
import { BingoCardDisplay } from '@/components/participate/bingo-card-display'
import { NoActiveRaffle } from '@/components/participate/no-active-raffle'
import { BearLogo } from '@/components/bear-logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LiveDrawCard } from '@/components/live/live-draw-card'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, Clock, Eye, Hash, MessageCircle, Radio, Trophy } from 'lucide-react'
import { CONTACT_LINKS } from '@/lib/contact'
import { SiteHeader } from '@/components/site-header'
import { getWinningLines } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  bundle_offers?: string[] | null
  draw_date?: string | null
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
  payment_account?: {
    holder?: string | null
    alias?: string | null
    cbu?: string | null
    bank?: string | null
    concept?: string | null
    note?: string | null
  } | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
}

export default function ParticipatePage() {
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null)
  const [existingCards, setExistingCards] = useState<BingoCard[]>([])
  const [salesClosed, setSalesClosed] = useState(false)
  const [salesClosedReason, setSalesClosedReason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState<string>('')
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get or create session token from localStorage
    let token = localStorage.getItem('bingo_session_token')
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem('bingo_session_token', token)
    }
    setSessionToken(token)

    fetchActiveRaffle(token)
    const interval = window.setInterval(() => fetchActiveRaffle(token), 5000)

    return () => window.clearInterval(interval)
  }, [])

  const fetchActiveRaffle = async (token: string) => {
    try {
      // Fetch active raffle
      const raffleRes = await fetch('/api/raffles/active')
      const raffleData = await raffleRes.json()

      if (raffleData.raffle) {
        setActiveRaffle(raffleData.raffle)
        setSalesClosed(Boolean(raffleData.salesClosed))
        setSalesClosedReason(raffleData.salesClosedReason ?? null)

        // Check if user already has a card for this raffle
        const cardRes = await fetch(
          `/api/cards/my-card?session_token=${token}&raffle_id=${raffleData.raffle.id}`
        )
        const cardData = await cardRes.json()

        setExistingCards(cardData.cards ?? (cardData.card ? [cardData.card] : []))
      } else {
        setActiveRaffle(null)
        setSalesClosed(false)
        setSalesClosedReason(null)
        setExistingCards([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardsCreated = (cards: BingoCard[]) => {
    setExistingCards((current) => [...current, ...cards])
    setExpandedCardIds((current) => {
      const next = new Set(current)
      for (const card of cards) {
        next.add(card.id)
      }
      return next
    })
  }

  const toggleCard = (cardId: string) => {
    setExpandedCardIds((current) => {
      const next = new Set(current)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <BearLogo size={80} className="mx-auto mb-4 animate-bounce" />
          <p className="text-amber-200 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lbb-page-shell relative min-h-screen text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="participar" kicker="Participar" compact />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {activeRaffle && (
          <div className="mx-auto max-w-5xl">
            <LiveDrawCard initialRaffle={activeRaffle} compact />
          </div>
        )}
        <div className={activeRaffle ? 'mt-8' : ''}>
        {!activeRaffle ? (
          <NoActiveRaffle />
        ) : existingCards.length > 0 ? (
          <div className="space-y-8">
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-4 text-center text-emerald-100">
              Tenes {existingCards.length} carton{existingCards.length !== 1 ? 'es' : ''} para este sorteo. Si sale ganador, te avisamos por WhatsApp con el premio y el monto.
              {CONTACT_LINKS.whatsappGroupUrl && (
                <div className="mt-4">
                  <Button asChild className="bg-[#25d366] font-bold text-zinc-950 hover:bg-[#30e17b]">
                    <Link href={CONTACT_LINKS.whatsappGroupUrl} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Unirme al grupo del sorteo
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {existingCards.map((card) => (
                <BingoCardListItem
                  key={card.id}
                  card={card}
                  raffleName={activeRaffle.name}
                  drawnNumbers={activeRaffle.drawn_numbers ?? []}
                  expanded={expandedCardIds.has(card.id)}
                  onToggle={() => toggleCard(card.id)}
                />
              ))}
            </div>
            {salesClosed ? (
              <SalesClosedNotice reason={salesClosedReason} raffle={activeRaffle} />
            ) : (
              <ParticipationForm
                raffle={activeRaffle}
                sessionToken={sessionToken}
                onCardsCreated={handleCardsCreated}
                title="Comprar Mas Cartones"
              />
            )}
          </div>
        ) : salesClosed ? (
          <SalesClosedNotice reason={salesClosedReason} raffle={activeRaffle} />
        ) : (
          <div className="mx-auto max-w-4xl">
            <ParticipationForm 
              raffle={activeRaffle} 
              sessionToken={sessionToken}
              onCardsCreated={handleCardsCreated}
            />
          </div>
        )}
        </div>
      </main>
    </div>
  )
}

function BingoCardListItem({
  card,
  raffleName,
  drawnNumbers,
  expanded,
  onToggle,
}: {
  card: BingoCard
  raffleName: string
  drawnNumbers: number[]
  expanded: boolean
  onToggle: () => void
}) {
  const formattedDate = new Date(card.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const winningLines = getWinningLines(card.bingo_numbers, drawnNumbers)
  const isWinner = winningLines.length > 0

  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/20 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-400/15 px-3 py-1 text-sm font-bold text-amber-200">
                <Hash className="mr-1 h-3.5 w-3.5" />
                {card.card_number}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isWinner ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/[0.06] text-zinc-300'}`}>
                {isWinner ? 'Ganador' : 'Participando'}
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-sm text-zinc-300 sm:grid-cols-2">
              <p className="min-w-0 truncate">
                <span className="font-semibold text-white">{card.full_name}</span>
              </p>
              <p className="text-zinc-400 sm:text-right">{formattedDate}</p>
            </div>
            {isWinner && (
              <p className="mt-2 text-xs font-semibold text-emerald-200">
                {winningLines.join(', ')}
              </p>
            )}
          </div>

          <Button
            onClick={onToggle}
            variant="outline"
            className="h-11 w-full border-amber-400/40 bg-transparent font-semibold text-amber-200 hover:bg-amber-400/10 sm:w-auto"
          >
            <Eye className="mr-2 h-4 w-4" />
            {expanded ? 'Ocultar' : 'Ver Carton'}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-zinc-800 p-2 sm:p-4">
            <BingoCardDisplay
              card={card}
              raffleName={raffleName}
              drawnNumbers={drawnNumbers}
              compact
              dense
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SalesClosedNotice({ reason, raffle }: { reason: string | null; raffle: Raffle }) {
  const contentByReason = {
    cutoff: {
      icon: <Clock className="h-10 w-10 text-amber-300" />,
      title: 'Venta de cartones cerrada',
      copy: 'La compra se cierra una hora antes del inicio para que todos los cartones entren al sorteo correctamente.',
    },
    running: {
      icon: <Radio className="h-10 w-10 text-red-300" />,
      title: 'El sorteo ya esta en vivo',
      copy: 'Las bolillas ya estan saliendo. Podes seguir el sorteo en vivo y revisar los resultados cuando termine.',
    },
    closed: {
      icon: <Trophy className="h-10 w-10 text-emerald-300" />,
      title: 'Sorteo cerrado',
      copy: 'Este sorteo ya finalizo. Los ganadores, premios y numeros cantados quedan disponibles como referencia publica.',
    },
    missing_date: {
      icon: <Clock className="h-10 w-10 text-amber-300" />,
      title: 'Fecha pendiente',
      copy: 'Este sorteo todavia no tiene horario confirmado. La compra se habilita cuando la fecha queda definida.',
    },
  }
  const content = contentByReason[reason as keyof typeof contentByReason] ?? contentByReason.closed

  return (
    <Card className="mx-auto max-w-3xl border-amber-400/25 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/20">
      <CardContent className="p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
          {content.icon}
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-200">{raffle.name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
          {content.copy}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
            <Link href="/en-vivo">Ver sorteo</Link>
          </Button>
          <Button asChild variant="outline" className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10">
            <Link href="/ganadores">Ver ganadores</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
