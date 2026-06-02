import { type NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { coerceParsedReceiptData, validateParsedReceipt, type PaymentStatus } from '@/lib/receipt-validation'

interface PaymentAccountRecord {
  alias?: string | null
  cbu?: string | null
}

interface RaffleRecord {
  id: string
  admin_id: string
  amount?: string | null
  payment_account_id?: string | null
}

interface BingoCardRecord {
  id: string
  raffle_id: string
  payment_receipt_url: string
  payment_reference?: string | null
}

const OPENAI_RECEIPT_MODEL = process.env.OPENAI_RECEIPT_MODEL || 'gpt-4o-mini'

async function ensureAdminOwnsCard(cardId: string, userId: string) {
  const supabase = await createServiceClient()
  const { data: card, error: cardError } = await supabase
    .from('bingo_cards')
    .select('id, raffle_id, payment_receipt_url, payment_reference')
    .eq('id', cardId)
    .single<BingoCardRecord>()

  if (cardError || !card) {
    return { error: NextResponse.json({ error: 'Carton no encontrado' }, { status: 404 }) }
  }

  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('id, admin_id, amount, payment_account_id')
    .eq('id', card.raffle_id)
    .single<RaffleRecord>()

  if (raffleError || !raffle || raffle.admin_id !== userId) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  let paymentAccount: PaymentAccountRecord | null = null

  if (raffle.payment_account_id) {
    const { data } = await supabase
      .from('payment_accounts')
      .select('alias, cbu')
      .eq('id', raffle.payment_account_id)
      .maybeSingle<PaymentAccountRecord>()
    paymentAccount = data ?? null
  }

  return { supabase, card, raffle, paymentAccount }
}

async function getAuthenticatedUser() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return user
}

async function blobToBase64(pathname: string) {
  const result = await get(pathname, { access: 'private' })

  if (!result) {
    throw new Error('No se encontro el comprobante')
  }

  const body = result.stream as unknown as BodyInit
  const bytes = Buffer.from(await new Response(body).arrayBuffer())

  return {
    contentType: result.blob.contentType || (pathname.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    filename: pathname.split('/').pop() || 'comprobante',
    base64: bytes.toString('base64'),
  }
}

function extractOutputText(response: unknown) {
  const record = response as { output_text?: string; output?: unknown[] }
  if (typeof record.output_text === 'string') return record.output_text

  for (const item of record.output ?? []) {
    const content = (item as { content?: unknown[] }).content ?? []
    for (const part of content) {
      const text = (part as { text?: string }).text
      if (typeof text === 'string') return text
    }
  }

  return ''
}

async function parseReceiptWithOpenAI({
  base64,
  contentType,
  filename,
  expectedAmount,
  expectedOperationNumber,
  expectedDestinationAccount,
}: {
  base64: string
  contentType: string
  filename: string
  expectedAmount?: string | null
  expectedOperationNumber?: string | null
  expectedDestinationAccount?: string | null
}) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return { configured: false as const }
  }

  const isPdf = contentType === 'application/pdf'
  
  // Construir el content array con imagen/documento y texto
  const content: Array<{ type: string; [key: string]: unknown }> = [
    {
      type: 'text',
      text: [
        'Extrae datos de este comprobante de transferencia argentino.',
        'Devuelve solo JSON valido con las claves del schema.',
        `Monto esperado del carton: ${expectedAmount || 'desconocido'}.`,
        `Numero de operacion informado por el comprador: ${expectedOperationNumber || 'desconocido'}.`,
        `Cuenta destino esperada: ${expectedDestinationAccount || 'desconocida'}.`,
      ].join('\n'),
    },
  ]

  if (isPdf) {
    // Para PDFs usar document type
    content.push({
      type: 'document',
      document: {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      },
    })
  } else {
    // Para imágenes usar image_url type
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${contentType};base64,${base64}`,
        detail: 'high',
      },
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_RECEIPT_MODEL,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'receipt_parse',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              amount: { type: ['number', 'null'] },
              operationNumber: { type: ['string', 'null'] },
              destinationAccount: { type: ['string', 'null'] },
              date: { type: ['string', 'null'], description: 'Fecha ISO si es visible o null.' },
              rawText: { type: ['string', 'null'] },
              confidence: { type: ['number', 'null'], minimum: 0, maximum: 1 },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['amount', 'operationNumber', 'destinationAccount', 'date', 'rawText', 'confidence', 'warnings'],
          },
        },
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI no pudo procesar el comprobante'
    throw new Error(message)
  }

  // Extraer el contenido JSON de la respuesta
  const choice = (data.choices?.[0] as { message?: { content?: string } })
  const content_text = choice?.message?.content
  
  if (!content_text) {
    throw new Error('OpenAI no devolvio una respuesta valida')
  }

  return { configured: true as const, parsed: coerceParsedReceiptData(JSON.parse(content_text)) }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const access = await ensureAdminOwnsCard(id, user.id)
  if (access.error) return access.error

  const body = await request.json()
  const paymentStatus = String(body.payment_status ?? '').trim() as PaymentStatus

  if (!['pending', 'approved', 'rejected'].includes(paymentStatus)) {
    return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
  }

  const receiptAmount = body.receipt_amount === '' || body.receipt_amount === null || body.receipt_amount === undefined
    ? null
    : Number(body.receipt_amount)

  if (receiptAmount !== null && !Number.isFinite(receiptAmount)) {
    return NextResponse.json({ error: 'Monto invalido' }, { status: 400 })
  }

  const { data, error } = await access.supabase
    .from('bingo_cards')
    .update({
      payment_status: paymentStatus,
      receipt_amount: receiptAmount,
      receipt_operation_number: String(body.receipt_operation_number ?? '').trim() || null,
      receipt_destination_account: String(body.receipt_destination_account ?? '').trim() || null,
      receipt_date: String(body.receipt_date ?? '').trim() || null,
      receipt_validation_notes: String(body.receipt_validation_notes ?? '').trim() || null,
      payment_reviewed_at: new Date().toISOString(),
      payment_reviewed_by: user.id,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ card: data })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const access = await ensureAdminOwnsCard(id, user.id)
  if (access.error) return access.error

  const expectedDestinationAccount = access.paymentAccount?.alias || access.paymentAccount?.cbu || null

  try {
    const file = await blobToBase64(access.card.payment_receipt_url)
    const result = await parseReceiptWithOpenAI({
      ...file,
      expectedAmount: access.raffle.amount,
      expectedOperationNumber: access.card.payment_reference,
      expectedDestinationAccount,
    })

    if (!result.configured) {
      const { data, error } = await access.supabase
        .from('bingo_cards')
        .update({
          receipt_parse_status: 'not_configured',
          receipt_parse_error: 'Falta configurar OPENAI_API_KEY para parsear comprobantes automaticamente.',
          receipt_parsed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return NextResponse.json({ card: data, configured: false })
    }

    const validation = validateParsedReceipt(result.parsed, {
      expectedAmount: access.raffle.amount,
      expectedOperationNumber: access.card.payment_reference,
      expectedDestinationAccount,
    })

    const { data, error } = await access.supabase
      .from('bingo_cards')
      .update({
        payment_status: validation.suggestedStatus,
        receipt_amount: result.parsed.amount,
        receipt_operation_number: result.parsed.operationNumber,
        receipt_destination_account: result.parsed.destinationAccount,
        receipt_date: result.parsed.date,
        receipt_raw_text: result.parsed.rawText,
        receipt_parse_status: 'parsed',
        receipt_parse_error: null,
        receipt_validation_notes: validation.warnings.join('\n') || null,
        receipt_parsed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ card: data, configured: true, validation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo parsear el comprobante'
    const { data } = await access.supabase
      .from('bingo_cards')
      .update({
        receipt_parse_status: 'failed',
        receipt_parse_error: message,
        receipt_parsed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    return NextResponse.json({ error: message, card: data }, { status: 500 })
  }
}
