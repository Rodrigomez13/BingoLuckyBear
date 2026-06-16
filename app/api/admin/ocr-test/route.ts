import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { formatReceiptOcrError, parseReceiptText } from '@/lib/receipt-ocr'
import { parseReceiptWithFreeOcr } from '@/lib/receipt-ocr-fast'
import { type ParsedReceiptData, validateParsedReceipt } from '@/lib/receipt-validation'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_TEST_FILE_BYTES = 12 * 1024 * 1024

function splitDestinations(value: unknown) {
  return String(value ?? '')
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function POST(request: Request) {
  const { serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const contentType = request.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  try {
    let expectedAmount: string | null = null
    let expectedOperationNumber: string | null = null
    let expectedSenderDocument: string | null = null
    let expectedDestinationAccounts: string[] = []
    let parsed: ParsedReceiptData

    if (isJson) {
      // Texto ya extraído por el OCR del navegador (imágenes).
      const body = await request.json().catch(() => ({}))
      const ocrText = String(body.text ?? '').trim()

      if (ocrText.length < 5) {
        return NextResponse.json({
          error: 'El OCR del navegador no extrajo texto. Probá con una captura más nítida, recta y completa, o usá revisión manual.',
        }, { status: 400 })
      }

      expectedAmount = String(body.amount ?? '').trim() || null
      expectedOperationNumber = String(body.operation ?? '').trim() || null
      expectedSenderDocument = String(body.document ?? '').trim() || null
      expectedDestinationAccounts = splitDestinations(body.destinations)

      if (expectedDestinationAccounts.length === 0) {
        expectedDestinationAccounts = await loadDefaultDestinations(serviceClient)
      }

      const confidence = Number(body.confidence)
      parsed = parseReceiptText(
        ocrText,
        { expectedAmount, expectedOperationNumber, expectedDestinationAccounts },
        { confidence: Number.isFinite(confidence) ? confidence : null, source: 'image_ocr' },
      )
    } else {
      // Subida de archivo (PDF u otros): se lee texto nativo en el servidor.
      const formData = await request.formData()
      const file = formData.get('file')

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Adjuntá un comprobante para probar el OCR' }, { status: 400 })
      }
      if (file.size > MAX_TEST_FILE_BYTES) {
        return NextResponse.json({ error: 'El archivo supera 12 MB. Probá con una captura recortada o PDF liviano.' }, { status: 413 })
      }

      expectedAmount = String(formData.get('amount') ?? '').trim() || null
      expectedOperationNumber = String(formData.get('operation') ?? '').trim() || null
      expectedSenderDocument = String(formData.get('document') ?? '').trim() || null
      expectedDestinationAccounts = splitDestinations(formData.get('destinations'))

      if (expectedDestinationAccounts.length === 0) {
        expectedDestinationAccounts = await loadDefaultDestinations(serviceClient)
      }

      const bytes = Buffer.from(await file.arrayBuffer())
      parsed = await parseReceiptWithFreeOcr({
        bytes,
        contentType: file.type || 'application/octet-stream',
        filename: file.name || 'comprobante',
        expectedAmount,
        expectedOperationNumber,
        expectedDestinationAccounts,
      })
    }

    const validation = validateParsedReceipt(parsed, {
      expectedAmount,
      expectedOperationNumber,
      expectedDestinationAccounts,
      expectedSenderDocument,
      submittedAt: new Date().toISOString(),
      maxAgeDays: 30,
    })

    return NextResponse.json({
      ok: true,
      parsed,
      validation,
      expectedDestinationAccounts,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: formatReceiptOcrError(err),
    }, { status: 500 })
  }
}

async function loadDefaultDestinations(serviceClient: NonNullable<Awaited<ReturnType<typeof requireAdminApi>>['serviceClient']>) {
  const { data: accounts } = await serviceClient
    .from('payment_accounts')
    .select('alias, cbu, is_default')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  return (accounts ?? [])
    .flatMap((account) => [account.alias, account.cbu])
    .filter((value): value is string => Boolean(value))
}
