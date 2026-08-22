import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/roles'
import { formatReceiptOcrError } from '@/lib/receipt-ocr'
import { parseReceiptWithServerOcr } from '@/lib/receipt-server-ocr'
import { validateParsedReceipt } from '@/lib/receipt-validation'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_TEST_FILE_BYTES = 12 * 1024 * 1024

function splitDestinations(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function POST(request: Request) {
  const { serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Adjuntá un comprobante para probar el OCR' }, { status: 400 })
    }

    if (file.size > MAX_TEST_FILE_BYTES) {
      return NextResponse.json({ error: 'El archivo supera 12 MB. Probá con una captura recortada o PDF liviano.' }, { status: 413 })
    }

    const expectedAmount = String(formData.get('amount') ?? '').trim() || null
    const expectedOperationNumber = String(formData.get('operation') ?? '').trim() || null
    const expectedSenderDocument = String(formData.get('document') ?? '').trim() || null
    let expectedDestinationAccounts = splitDestinations(formData.get('destinations'))

    if (expectedDestinationAccounts.length === 0) {
      const { data: accounts } = await serviceClient
        .from('payment_accounts')
        .select('alias, cbu, is_default')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4)

      expectedDestinationAccounts = (accounts ?? [])
        .flatMap((account) => [account.alias, account.cbu])
        .filter((value): value is string => Boolean(value))
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const parsed = await parseReceiptWithServerOcr({
      bytes,
      contentType: file.type || 'application/octet-stream',
      filename: file.name || 'comprobante',
      expectedAmount,
      expectedOperationNumber,
      expectedDestinationAccounts,
    })
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
