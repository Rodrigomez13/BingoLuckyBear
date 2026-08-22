import { readFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { parseReceiptWithFreeOcr } from '../lib/receipt-ocr-fast'
import { validateParsedReceipt } from '../lib/receipt-validation'

type Options = {
  file?: string
  amount?: string
  operation?: string
  destinations: string[]
  document?: string
  submittedAt?: string
}

const contentTypes: Record<string, string> = {
  '.bmp': 'image/bmp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.webp': 'image/webp',
}

function usage() {
  console.log([
    'Uso:',
    '  pnpm ocr:check -- --file ./comprobante.jpg --amount 3000 --operation 12345 --destination lucky.bear.mp --document 12345678',
    '',
    'Opciones:',
    '  --file <ruta>          Imagen o PDF local del comprobante.',
    '  --amount <monto>       Monto esperado.',
    '  --operation <numero>   Numero de operacion esperado.',
    '  --destination <cuenta> Alias/CBU/CVU esperado. Se puede repetir.',
    '  --document <dni>       DNI/CUIT/CUIL esperado del emisor.',
  ].join('\n'))
}

function parseArgs(argv: string[]) {
  const options: Options = { destinations: [] }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    }

    if (!next || next.startsWith('--')) throw new Error(`Falta valor para ${arg}`)

    if (arg === '--file') options.file = next
    else if (arg === '--amount') options.amount = next
    else if (arg === '--operation') options.operation = next
    else if (arg === '--destination') options.destinations.push(next)
    else if (arg === '--document') options.document = next
    else if (arg === '--submitted-at') options.submittedAt = next
    else throw new Error(`Opcion desconocida: ${arg}`)

    index += 1
  }

  if (!options.file) throw new Error('Indicá un archivo con --file')
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const filePath = resolve(options.file!)
  const extension = extname(filePath).toLowerCase()
  const contentType = contentTypes[extension]

  if (!contentType) {
    throw new Error(`Formato no soportado: ${extension || 'sin extension'}`)
  }

  const bytes = await readFile(filePath)
  const parsed = await parseReceiptWithFreeOcr({
    bytes,
    contentType,
    filename: basename(filePath),
    expectedAmount: options.amount,
    expectedOperationNumber: options.operation,
    expectedDestinationAccounts: options.destinations,
  })
  const validation = validateParsedReceipt(parsed, {
    expectedAmount: options.amount,
    expectedOperationNumber: options.operation,
    expectedDestinationAccounts: options.destinations,
    expectedSenderDocument: options.document,
    submittedAt: options.submittedAt ?? new Date().toISOString(),
  })

  console.log(JSON.stringify({ parsed, validation }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
