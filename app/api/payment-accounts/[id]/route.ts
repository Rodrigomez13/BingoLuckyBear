import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function cleanOptional(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

async function getUserId() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return user?.id ?? null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const holder = String(body.holder ?? '').trim()
    const alias = cleanOptional(body.alias)
    const cbu = cleanOptional(body.cbu)
    const bank = cleanOptional(body.bank)
    const concept = cleanOptional(body.concept)
    const note = cleanOptional(body.note)
    const isDefault = Boolean(body.is_default)

    if (!name || !holder || (!alias && !cbu)) {
      return NextResponse.json(
        { error: 'Carga nombre, titular y al menos Alias o CBU/CVU' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    if (isDefault) {
      await supabase.from('payment_accounts').update({ is_default: false }).eq('admin_id', userId)
    }

    const { data, error } = await supabase
      .from('payment_accounts')
      .update({
        name,
        holder,
        alias,
        cbu,
        bank,
        concept,
        note,
        is_default: isDefault,
      })
      .eq('id', id)
      .eq('admin_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ account: data })
  } catch (error) {
    console.error('Error updating payment account:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const isMissingSchema = /payment_accounts|schema cache|relation|column/i.test(message)
    return NextResponse.json(
      {
        error: isMissingSchema
          ? 'Falta aplicar supabase-payment-accounts-migration.sql en Supabase'
          : 'No se pudo actualizar la cuenta de cobro',
        detail: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServiceClient()
    const { error } = await supabase
      .from('payment_accounts')
      .delete()
      .eq('id', id)
      .eq('admin_id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment account:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    const isMissingSchema = /payment_accounts|schema cache|relation|column/i.test(message)
    return NextResponse.json(
      {
        error: isMissingSchema
          ? 'Falta aplicar supabase-payment-accounts-migration.sql en Supabase'
          : 'No se pudo eliminar la cuenta de cobro',
        detail: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    )
  }
}
