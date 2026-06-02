import { BINGO_TOTAL_BALLS, drawNextNumber, getPrizeAmounts, getPrizeAwards } from '@/lib/bingo'
import { sendWinnerWhatsApp } from '@/lib/whatsapp'

const PURCHASE_CLOSE_MS = 30 * 60 * 1000 // 30 minutos antes del inicio del sorteo
const DEFAULT_AUTO_DRAW_INTERVAL_SECONDS = 6

interface QueryResult<T = unknown> {
  data: T | null
  error: { code?: string; message?: string } | null
}

interface QueryBuilder<T = unknown> extends PromiseLike<QueryResult<T>> {
  select: (columns?: string, options?: unknown) => QueryBuilder<T>
  insert: (values: unknown) => QueryBuilder<T>
  update: (values: unknown) => QueryBuilder<T>
  delete: () => QueryBuilder<T>
  eq: (column: string, value: unknown) => QueryBuilder<T>
  single: <T = unknown>() => Promise<QueryResult<T>>
}

interface SupabaseLike {
  from: (table: string) => unknown
}

interface RaffleForLifecycle {
  id: string
  name: string
  is_active?: boolean | null
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  draw_date?: string | null
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
}

interface CardForNotification {
  id: string
  card_number: string
  full_name: string
  phone: string
  bingo_numbers?: number[][] | null
}

interface NotificationRecord {
  id: string
}

function table(supabase: SupabaseLike, name: string) {
  return supabase.from(name) as QueryBuilder
}

function getAutoDrawIntervalSeconds() {
  const configured = Number(process.env.RAFFLE_AUTO_DRAW_INTERVAL_SECONDS)

  if (!Number.isFinite(configured)) {
    return DEFAULT_AUTO_DRAW_INTERVAL_SECONDS
  }

  return Math.max(3, Math.min(60, Math.round(configured)))
}

export function getPurchaseAvailability(raffle: Pick<RaffleForLifecycle, 'draw_date' | 'draw_status'>) {
  if (raffle.draw_status === 'finished') {
    return { canPurchase: false, reason: 'closed' as const }
  }

  if (!raffle.draw_date) {
    return { canPurchase: false, reason: 'missing_date' as const }
  }

  const drawTime = new Date(raffle.draw_date).getTime()

  if (!Number.isFinite(drawTime)) {
    return { canPurchase: false, reason: 'missing_date' as const }
  }

  if (raffle.draw_status === 'running') {
    return { canPurchase: false, reason: Date.now() < drawTime ? 'cutoff' as const : 'running' as const }
  }

  if (drawTime - Date.now() <= PURCHASE_CLOSE_MS) {
    return { canPurchase: false, reason: 'cutoff' as const }
  }

  return { canPurchase: true, reason: null }
}

async function notifyNewWinnerAwards(
  supabase: SupabaseLike,
  raffle: RaffleForLifecycle,
  previousDrawnNumbers: number[],
  updatedDrawnNumbers: number[]
) {
  try {
    const { data: cards, error: cardsError } = await table(supabase, 'bingo_cards')
      .select('id, card_number, full_name, phone, bingo_numbers')
      .eq('raffle_id', raffle.id)

    if (cardsError) {
      throw cardsError
    }

    const raffleCards = (cards ?? []) as CardForNotification[]
    const prizeAmounts = getPrizeAmounts(raffle.prize, raffle.additional_prizes)
    const previousAwards = getPrizeAwards(raffleCards, previousDrawnNumbers, prizeAmounts)
    const updatedAwards = getPrizeAwards(raffleCards, updatedDrawnNumbers, prizeAmounts)
    const previousKeys = new Set(
      previousAwards.flatMap((award) =>
        award.winners.map((winner) => `${award.prizeNumber}:${winner.id}`)
      )
    )

    for (const award of updatedAwards) {
      for (const winner of award.winners as CardForNotification[]) {
        const notificationKey = `${award.prizeNumber}:${winner.id}`

        if (previousKeys.has(notificationKey)) {
          continue
        }

        const { data: notification, error: insertError } = await table(supabase, 'winner_notifications')
          .insert({
            raffle_id: raffle.id,
            card_id: winner.id,
            prize_number: award.prizeNumber,
            row_index: award.rowIndex,
            amount: award.amount,
            phone: winner.phone,
            status: 'pending',
          })
          .select('id')
          .single<NotificationRecord>()

        if (insertError) {
          if (insertError.code !== '23505') {
            console.error('Winner notification insert error:', insertError)
          }
          continue
        }

        if (!notification) {
          continue
        }

        const result = await sendWinnerWhatsApp({
          to: winner.phone,
          fullName: winner.full_name,
          raffleName: raffle.name,
          prizeLabel: award.label,
          amount: award.amount,
          cardNumber: winner.card_number,
        })
        const status = result.sent ? 'sent' : result.reason === 'missing_config' ? 'pending' : 'failed'

        await table(supabase, 'winner_notifications')
          .update({
            status,
            provider_message_id: result.providerMessageId ?? null,
            error_message: result.sent
              ? null
              : result.reason === 'missing_config'
                ? 'Envio manual pendiente'
                : result.error ?? result.reason ?? 'No se pudo enviar WhatsApp',
            sent_at: result.sent ? new Date().toISOString() : null,
          })
          .eq('id', notification.id)
      }
    }
  } catch (error) {
    console.error('Winner notification error:', error)
  }
}

async function shouldCloseRaffle(supabase: SupabaseLike, raffle: RaffleForLifecycle, drawnNumbers: number[]) {
  if (drawnNumbers.length >= BINGO_TOTAL_BALLS) {
    return true
  }

  const { data: cards, error } = await table(supabase, 'bingo_cards')
    .select('id, card_number, full_name, bingo_numbers')
    .eq('raffle_id', raffle.id)

  if (error) {
    throw error
  }

  const awards = getPrizeAwards(
    (cards ?? []) as CardForNotification[],
    drawnNumbers,
    getPrizeAmounts(raffle.prize, raffle.additional_prizes)
  )

  return awards.length >= 4
}

export async function closeRaffle(supabase: SupabaseLike, raffleId: string) {
  const { data, error } = await table(supabase, 'raffles')
    .update({
      draw_status: 'finished',
      is_active: false,
    })
    .eq('id', raffleId)
    .select()
    .single<RaffleForLifecycle>()

  if (error || !data) {
    throw error
  }

  return data
}

export async function syncRaffleLifecycle(supabase: SupabaseLike, raffle: RaffleForLifecycle) {
  let current = raffle
  let drawnNumbers = Array.isArray(current.drawn_numbers) ? current.drawn_numbers : []
  const status = current.draw_status ?? 'idle'
  const drawTime = current.draw_date ? new Date(current.draw_date).getTime() : NaN

  if (status === 'idle' && Number.isFinite(drawTime) && drawTime - Date.now() <= PURCHASE_CLOSE_MS) {
    const countdownSeconds = Math.max(0, Math.floor((drawTime - Math.min(Date.now(), drawTime)) / 1000))
    const startedAt = countdownSeconds > 0
      ? new Date(drawTime - countdownSeconds * 1000).toISOString()
      : new Date(drawTime).toISOString()
    const { data, error } = await table(supabase, 'raffles')
      .update({
        draw_status: 'running',
        draw_started_at: startedAt,
        countdown_seconds: countdownSeconds,
        drawn_numbers: [],
      })
      .eq('id', current.id)
      .select()
      .single<RaffleForLifecycle>()

    if (error || !data) {
      throw error
    }

    current = data
    drawnNumbers = []
  }

  if (current.draw_status !== 'running') {
    return current
  }

  const startedAt = current.draw_started_at ? new Date(current.draw_started_at).getTime() : Date.now()
  const countdownSeconds = Math.max(0, Number(current.countdown_seconds ?? 0))
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000) - countdownSeconds)
  const targetDrawCount = Math.min(BINGO_TOTAL_BALLS, Math.floor(elapsedSeconds / getAutoDrawIntervalSeconds()))

  while (drawnNumbers.length < targetDrawCount) {
    const previousDrawnNumbers = drawnNumbers
    const nextNumber = drawNextNumber(drawnNumbers)

    if (!nextNumber) {
      break
    }

    drawnNumbers = [...drawnNumbers, nextNumber]

    const { data, error } = await table(supabase, 'raffles')
      .update({
        draw_status: 'running',
        drawn_numbers: drawnNumbers,
      })
      .eq('id', current.id)
      .select()
      .single<RaffleForLifecycle>()

    if (error || !data) {
      throw error
    }

    current = data
    await notifyNewWinnerAwards(supabase, current, previousDrawnNumbers, drawnNumbers)

    if (await shouldCloseRaffle(supabase, current, drawnNumbers)) {
      current = await closeRaffle(supabase, current.id)
      break
    }
  }

  return current
}

export async function notifyDrawWinners(
  supabase: SupabaseLike,
  raffle: RaffleForLifecycle,
  previousDrawnNumbers: number[],
  updatedDrawnNumbers: number[]
) {
  await notifyNewWinnerAwards(supabase, raffle, previousDrawnNumbers, updatedDrawnNumbers)

  if (await shouldCloseRaffle(supabase, raffle, updatedDrawnNumbers)) {
    return closeRaffle(supabase, raffle.id)
  }

  return raffle
}
