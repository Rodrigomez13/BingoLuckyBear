'use client'

import { useState, useEffect } from 'react'
import { ParticipationForm } from '@/components/participate/participation-form'
import { BingoCardDisplay } from '@/components/participate/bingo-card-display'
import { NoActiveRaffle } from '@/components/participate/no-active-raffle'
import { BearLogo } from '@/components/bear-logo'
import { SiteHeader } from '@/components/site-header'
import { LiveDrawCard } from '@/components/live/live-draw-card'

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

        // Check if user already has a card for this raffle
        const cardRes = await fetch(
          `/api/cards/my-card?session_token=${token}&raffle_id=${raffleData.raffle.id}`
        )
        const cardData = await cardRes.json()

        setExistingCards(cardData.cards ?? (cardData.card ? [cardData.card] : []))
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
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
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
              Tenes {existingCards.length} carton{existingCards.length !== 1 ? 'es' : ''} para este sorteo. Cada uno participa de forma individual.
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
            <ParticipationForm
              raffle={activeRaffle}
              sessionToken={sessionToken}
              onCardsCreated={handleCardsCreated}
              title="Comprar Mas Cartones"
            />
          </div>
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
