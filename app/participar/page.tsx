'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/site-url'
import { AccountPurchaseForm } from '@/components/participate/account-purchase-form'
import { BingoCardDisplay } from '@/components/participate/bingo-card-display'
import { NoActiveRaffle } from '@/components/participate/no-active-raffle'
import { BearLogo } from '@/components/bear-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LiveDrawCard } from '@/components/live/live-draw-card'
import { ChevronDown, Clock, Eye, Hash, Loader2, Mail, MessageCircle, Radio, Trophy, UserCircle2 } from 'lucide-react'
import { CONTACT_LINKS } from '@/lib/contact'
import { GameShell } from '@/components/lobby/game-shell'
import { getWinningLines } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  card_price?: number | null
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
  payment_status?: 'pending' | 'approved' | 'rejected' | null
  raffle?: { id: string } | null
}

interface CustomerProfile {
  full_name?: string | null
  dni?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  payout_account_kind?: string | null
  payout_account?: string | null
  payout_holder_name?: string | null
}

function isProfileComplete(profile: CustomerProfile | null) {
  return Boolean(
    profile?.full_name &&
    profile?.dni &&
    profile?.address &&
    profile?.phone &&
    profile?.email &&
    profile?.payout_account_kind &&
    profile?.payout_account &&
    profile?.payout_holder_name
  )
}

export default function ParticipatePage() {
  const supabase = useMemo(() => createClient(), [])
  const [activeRaffle, setActiveRaffle] = useState<Raffle | null>(null)
  const [existingCards, setExistingCards] = useState<BingoCard[]>([])
  const [salesClosed, setSalesClosed] = useState(false)
  const [salesClosedReason, setSalesClosedReason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState<string>('')
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginMessage, setLoginMessage] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isSendingLink, setIsSendingLink] = useState(false)

  useEffect(() => {
    let token = localStorage.getItem('bingo_session_token')
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem('bingo_session_token', token)
    }
    setSessionToken(token)

    loadPage(token)
    const interval = window.setInterval(() => loadPage(token), 5000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPage = async (token: string) => {
    try {
      const [raffleRes, profileRes, cardsRes] = await Promise.all([
        fetch('/api/raffles/active', { cache: 'no-store' }),
        fetch('/api/customer/profile', { cache: 'no-store' }),
        fetch('/api/customer/cards', { cache: 'no-store' }),
      ])
      const raffleData = await raffleRes.json()
      const profileData = await profileRes.json()
      const cardsData = await cardsRes.json()

      setUserEmail(profileData.user?.email ?? null)
      setLoginEmail(profileData.user?.email ?? loginEmail)
      setProfile(profileData.profile ?? null)

      if (raffleData.raffle) {
        setActiveRaffle(raffleData.raffle)
        setSalesClosed(Boolean(raffleData.salesClosed))
        setSalesClosedReason(raffleData.salesClosedReason ?? null)

        const accountCards = (cardsData.cards ?? []).filter((card: BingoCard) => card.raffle?.id === raffleData.raffle.id)
        if (accountCards.length > 0) {
          setExistingCards(accountCards)
        } else if (token) {
          const cardRes = await fetch(`/api/cards/my-card?session_token=${token}&raffle_id=${raffleData.raffle.id}`)
          const cardData = await cardRes.json()
          setExistingCards(cardData.cards ?? (cardData.card ? [cardData.card] : []))
        }
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

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSendingLink(true)
    setLoginError(null)
    setLoginMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: {
          emailRedirectTo: getAuthCallbackUrl('/participar', window.location.origin),
          shouldCreateUser: true,
        },
      })

      if (error) throw error
      setLoginMessage('Te enviamos un enlace de acceso. Abrilo desde tu correo para continuar la compra.')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo enviar el enlace de acceso')
    } finally {
      setIsSendingLink(false)
    }
  }

  const handleCardsCreated = (cards: BingoCard[]) => {
    setExistingCards((current) => [...current, ...cards])
    setExpandedCardIds((current) => {
      const next = new Set(current)
      for (const card of cards) next.add(card.id)
      return next
    })
  }

  const toggleCard = (cardId: string) => {
    setExpandedCardIds((current) => {
      const next = new Set(current)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
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

  const approvedCards = existingCards.filter((card) => card.payment_status === 'approved')
  const pendingCards = existingCards.filter((card) => (card.payment_status ?? 'pending') === 'pending')
  const rejectedCards = existingCards.filter((card) => card.payment_status === 'rejected')
  const profileComplete = isProfileComplete(profile)

  return (
    <GameShell
      active="bingo"
      eyebrow="Lobby de Bingo"
      title={activeRaffle ? activeRaffle.name : 'Sorteos Lucky Bear'}
      subtitle={activeRaffle ? 'Comprá cartones, seguí el estado y guardá tus números.' : 'La cartelera se mantiene lista para el próximo sorteo.'}
      aside={<BingoLobbyAside raffle={activeRaffle} cardsCount={existingCards.length} approved={approvedCards.length} pending={pendingCards.length} rejected={rejectedCards.length} />}
    >
      <main className="relative z-10 mx-auto w-full">
        {activeRaffle && (
          <section className="rounded-lg border border-amber-300/15 bg-black/25 p-3 sm:p-4">
            <LiveDrawCard initialRaffle={activeRaffle} compact />
          </section>
        )}
        <div className={activeRaffle ? 'mt-5' : ''}>
          {!activeRaffle ? (
            <NoActiveRaffle />
          ) : salesClosed ? (
            <SalesClosedNotice reason={salesClosedReason} raffle={activeRaffle} />
          ) : !userEmail ? (
            <LoginRequiredCard email={loginEmail} setEmail={setLoginEmail} isSending={isSendingLink} message={loginMessage} error={loginError} onSubmit={sendMagicLink} />
          ) : !profileComplete ? (
            <CompleteProfileCard />
          ) : (
            <div className="space-y-8">
              {existingCards.length > 0 && (
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-4 text-center text-emerald-100">
                  <p className="font-semibold">Tenes {existingCards.length} carton{existingCards.length !== 1 ? 'es' : ''} registrado{existingCards.length !== 1 ? 's' : ''} para este sorteo.</p>
                  <p className="mt-2 text-sm text-emerald-50/90">Participan oficialmente: {approvedCards.length}. Pendientes de aprobacion: {pendingCards.length}. Rechazados: {rejectedCards.length}.</p>
                  {pendingCards.length > 0 && <p className="mx-auto mt-2 max-w-2xl text-sm text-amber-100">Los cartones pendientes no entran al sorteo hasta que el comprobante quede aprobado.</p>}
                  {CONTACT_LINKS.whatsappGroupUrl && <div className="mt-4"><Button asChild className="bg-[#25d366] font-bold text-zinc-950 hover:bg-[#30e17b]"><Link href={CONTACT_LINKS.whatsappGroupUrl} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Unirme al grupo del sorteo</Link></Button></div>}
                </div>
              )}

              {existingCards.length > 0 && (
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
              )}

              <AccountPurchaseForm raffle={activeRaffle} sessionToken={sessionToken} onCardsCreated={handleCardsCreated} />
            </div>
          )}
        </div>
      </main>
    </GameShell>
  )
}

function BingoLobbyAside({
  raffle,
  cardsCount,
  approved,
  pending,
  rejected,
}: {
  raffle: Raffle | null
  cardsCount: number
  approved: number
  pending: number
  rejected: number
}) {
  return (
    <>
      <section className="rounded-lg border border-amber-300/15 bg-black/25 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-300 text-zinc-950">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Sorteo</p>
            <h2 className="font-mono text-xl font-black text-white">{raffle?.name ?? 'Próximo sorteo'}</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SideMetric label="Cartones" value={String(cardsCount)} />
          <SideMetric label="Aprobados" value={String(approved)} />
          <SideMetric label="Pendientes" value={String(pending)} />
          <SideMetric label="Rechazados" value={String(rejected)} />
        </div>
        <p className="mt-4 text-sm leading-5 text-emerald-50/65">
          Los cartones aprobados participan oficialmente. Los pendientes se activan cuando el pago queda validado.
        </p>
      </section>

      <section className="rounded-lg border border-amber-300/15 bg-black/25 p-4">
        <p className="font-mono text-xl font-black text-amber-200">Cómo participar</p>
        <div className="mt-3 space-y-3">
          {['Elegí la cantidad de cartones', 'Pagá con saldo o comprobante', 'Guardá tus números para el sorteo'].map((step, index) => (
            <div key={step} className="flex gap-3 rounded-md bg-white/[0.035] p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 font-mono text-sm font-black text-zinc-950">{index + 1}</span>
              <p className="text-sm font-semibold leading-5 text-emerald-50/80">{step}</p>
            </div>
          ))}
        </div>
        {CONTACT_LINKS.whatsappGroupUrl && (
          <Button asChild className="mt-4 h-11 w-full bg-[#25d366] font-black text-zinc-950 hover:bg-[#30e17b]">
            <Link href={CONTACT_LINKS.whatsappGroupUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Unirme al grupo
            </Link>
          </Button>
        )}
      </section>
    </>
  )
}

function SideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-center">
      <p className="font-mono text-xl font-black text-white">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-wide text-emerald-50/45">{label}</p>
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
  const isApproved = card.payment_status === 'approved'
  const winningLines = isApproved ? getWinningLines(card.bingo_numbers, drawnNumbers) : []
  const isWinner = winningLines.length > 0
  const statusLabel = isApproved ? 'Aprobado' : card.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente'

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
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isWinner ? 'bg-emerald-500/15 text-emerald-200' : isApproved ? 'bg-emerald-500/10 text-emerald-100' : card.payment_status === 'rejected' ? 'bg-red-500/10 text-red-100' : 'bg-amber-400/10 text-amber-100'}`}>
                {isWinner ? 'Ganador' : statusLabel}
              </span>
            </div>
            <div className="mt-3 grid gap-1 text-sm text-zinc-300 sm:grid-cols-2">
              <p className="min-w-0 truncate"><span className="font-semibold text-white">{card.full_name}</span></p>
              <p className="text-zinc-400 sm:text-right">{formattedDate}</p>
            </div>
            {winningLines.length > 0 && <p className="mt-2 text-xs font-semibold text-emerald-200">{winningLines.join(', ')}</p>}
          </div>

          <Button onClick={onToggle} variant="outline" className="h-11 w-full border-amber-400/40 bg-transparent font-semibold text-amber-200 hover:bg-amber-400/10 sm:w-auto">
            <Eye className="mr-2 h-4 w-4" />
            {expanded ? 'Ocultar' : 'Ver Carton'}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-zinc-800 p-2 sm:p-4">
            <BingoCardDisplay card={card} raffleName={raffleName} drawnNumbers={drawnNumbers} compact />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoginRequiredCard({ email, setEmail, isSending, message, error, onSubmit }: { email: string; setEmail: (value: string) => void; isSending: boolean; message: string | null; error: string | null; onSubmit: (event: React.FormEvent) => void }) {
  return (
    <Card className="mx-auto max-w-xl border-white/10 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-zinc-950"><Mail className="h-7 w-7" /></div>
        <CardTitle className="text-2xl text-white">Ingresar para comprar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-center text-sm leading-6 text-zinc-300">Para comprar cartones primero ingresa con tu correo. No necesitas contraseña y tus datos quedan guardados para proximas compras.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu-correo@ejemplo.com" required className="border-zinc-700 bg-zinc-900 text-white" />
          <Button type="submit" disabled={isSending} className="h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enviarme acceso</Button>
        </form>
        {message && <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      </CardContent>
    </Card>
  )
}

function CompleteProfileCard() {
  return (
    <Card className="mx-auto max-w-xl border-amber-400/25 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/20">
      <CardContent className="p-6 text-center sm:p-8">
        <UserCircle2 className="mx-auto mb-4 h-12 w-12 text-amber-300" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Completa tu perfil</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-300">Antes de comprar cartones necesitamos tus datos de jugador y cuenta de cobro. Esto evita pedirte los datos en cada compra.</p>
        <Button asChild className="mt-6 rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200"><Link href="/mi-cuenta">Completar Mi cuenta</Link></Button>
      </CardContent>
    </Card>
  )
}

function SalesClosedNotice({ reason, raffle }: { reason: string | null; raffle: Raffle }) {
  const contentByReason = {
    cutoff: { icon: <Clock className="h-10 w-10 text-amber-300" />, title: 'Venta de cartones cerrada', copy: 'La compra se cierra 30 minutos antes del inicio para que todos los cartones aprobados entren al sorteo correctamente.' },
    running: { icon: <Radio className="h-10 w-10 text-red-300" />, title: 'El sorteo ya esta en vivo', copy: 'Las bolillas ya estan saliendo. Podes seguir el sorteo en vivo y revisar los resultados cuando termine.' },
    closed: { icon: <Trophy className="h-10 w-10 text-emerald-300" />, title: 'Sorteo cerrado', copy: 'Este sorteo ya finalizo. Los ganadores, premios y numeros cantados quedan disponibles como referencia publica.' },
    missing_date: { icon: <Clock className="h-10 w-10 text-amber-300" />, title: 'Fecha pendiente', copy: 'Este sorteo todavia no tiene horario confirmado. La compra se habilita cuando la fecha queda definida.' },
  }
  const content = contentByReason[reason as keyof typeof contentByReason] ?? contentByReason.closed

  return (
    <Card className="mx-auto max-w-3xl border-amber-400/25 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/20">
      <CardContent className="p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">{content.icon}</div>
        <p className="text-sm font-bold uppercase tracking-wide text-amber-200">{raffle.name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{content.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-300">{content.copy}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300"><Link href="/en-vivo">Ver sorteo</Link></Button><Button asChild variant="outline" className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10"><Link href="/ganadores">Ver ganadores</Link></Button></div>
      </CardContent>
    </Card>
  )
}
