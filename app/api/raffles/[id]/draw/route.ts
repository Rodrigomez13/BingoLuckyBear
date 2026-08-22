import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { drawNextNumber } from '@/lib/bingo'
import { closeRaffle, notifyDrawWinners } from '@/lib/raffle-lifecycle'

type DrawAction = 'start' | 'draw' | 'reset' | 'finish'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action as DrawAction

    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .eq('admin_id', user.id)
      .single()

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 })
    }

    if (action === 'start') {
      const countdownSeconds = Number(body.countdown_seconds)

      if (!Number.isFinite(countdownSeconds) || countdownSeconds < 10) {
        return NextResponse.json(
          { error: 'La cuenta regresiva debe ser de al menos 10 segundos' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('raffles')
        .update({
          countdown_seconds: Math.floor(countdownSeconds),
          draw_started_at: new Date().toISOString(),
          draw_status: 'running',
          drawn_numbers: [],
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ raffle: data })
    }

    if (action === 'draw') {
      const countdownSeconds = Math.max(0, Number(raffle.countdown_seconds ?? 0))
      const startedAt = raffle.draw_started_at ? new Date(raffle.draw_started_at).getTime() : Date.now()
      const countdownEndsAt = startedAt + countdownSeconds * 1000

      if (countdownSeconds > 0 && Date.now() < countdownEndsAt) {
        return NextResponse.json(
          { error: 'La cuenta regresiva todavia esta activa' },
          { status: 409 }
        )
      }

      const drawnNumbers = Array.isArray(raffle.drawn_numbers) ? raffle.drawn_numbers : []
      const nextNumber = drawNextNumber(drawnNumbers)

      if (!nextNumber) {
        return NextResponse.json({ error: 'Ya salieron todos los numeros' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('raffles')
        .update({
          draw_status: 'running',
          drawn_numbers: [...drawnNumbers, nextNumber],
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const updatedRaffle = await notifyDrawWinners(supabase, data, drawnNumbers, data.drawn_numbers ?? [])
      return NextResponse.json({ raffle: updatedRaffle, number: nextNumber })
    }

    if (action === 'reset') {
      const { error: notificationDeleteError } = await supabase
        .from('winner_notifications')
        .delete()
        .eq('raffle_id', id)

      if (notificationDeleteError && notificationDeleteError.code !== '42P01') {
        console.error('Winner notification cleanup error:', notificationDeleteError)
      }

      const { data, error } = await supabase
        .from('raffles')
        .update({
          countdown_seconds: null,
          draw_started_at: null,
          draw_status: 'idle',
          drawn_numbers: [],
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ raffle: data })
    }

    if (action === 'finish') {
      const data = await closeRaffle(supabase, id)
      return NextResponse.json({ raffle: data })
    }

    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
  } catch (error) {
    console.error('Error updating draw:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor. Revisa si aplicaste la migracion de sorteo.' },
      { status: 500 }
    )
  }
}
