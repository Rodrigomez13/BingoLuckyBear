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
import { Clock, Radio, Trophy } from 'lucide-react'

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-400/20 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <BearLogo size={38} />
              <span className="text-lg font-semibold tracking-tight text-white">
                Lucky Bingo Bear
              </span>
            </Link>
            <Button asChild variant="outline" className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
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
            </div>
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {existingCards.map((card) => (
                <BingoCardDisplay
                  key={card.id}
                  card={card}
                  raffleName={activeRaffle.name}
                  drawnNumbers={activeRaffle.drawn_numbers ?? []}
                  compact
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
