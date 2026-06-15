import assert from 'node:assert/strict'
import { parseReceiptText } from '../lib/receipt-ocr'
import { validateParsedReceipt } from '../lib/receipt-validation'

const fixtures = [
  {
    name: 'Mercado Pago',
    text: [
      'Transferencia realizada',
      'Enviaste $ 12.500,00',
      'De: JUAN PEREZ',
      'DNI 32.456.789',
      'Para: lucky.bear.mp',
      'Numero de operacion 9876543210',
      '15/06/2026 18:42',
    ].join('\n'),
    amount: 12_500,
    operation: '9876543210',
    destination: 'lucky.bear.mp',
    dni: '32456789',
  },
  {
    name: 'Banco con CUIL y CBU',
    text: [
      'COMPROBANTE DE TRANSFERENCIA',
      'Importe ARS 8.000,00',
      'Ordenante MARIA LOPEZ CUIT 27-30111222-3',
      'CBU destino 0000003100001234567890',
      'Referencia COELSA A9B7C6D5E4',
      '14-06-2026 10:05',
    ].join('\n'),
    amount: 8_000,
    operation: 'A9B7C6D5E4',
    destination: '0000003100001234567890',
    dni: '30111222',
  },
]

for (const fixture of fixtures) {
  const parsed = parseReceiptText(fixture.text, {
    expectedAmount: fixture.amount,
    expectedOperationNumber: fixture.operation,
    expectedDestinationAccounts: [fixture.destination],
  }, { confidence: 0.9 })
  const validation = validateParsedReceipt(parsed, {
    expectedAmount: fixture.amount,
    expectedOperationNumber: fixture.operation,
    expectedDestinationAccounts: [fixture.destination],
    expectedSenderDocument: fixture.dni,
    submittedAt: '2026-06-15T23:00:00.000Z',
  })

  assert.equal(parsed.amount, fixture.amount, `${fixture.name}: monto`)
  assert.equal(parsed.operationNumber, fixture.operation, `${fixture.name}: operacion`)
  assert.equal(parsed.destinationAccount, fixture.destination, `${fixture.name}: destino`)
  assert.equal(validation.senderDocumentMatches, true, `${fixture.name}: documento`)
  assert.equal(validation.reviewRecommendation, 'ready_for_review', `${fixture.name}: recomendacion`)
}

const mismatch = parseReceiptText([
  'Transferencia realizada',
  'Monto $ 4.500',
  'DNI 11.111.111',
  'Alias destino.otro',
  'Operacion 123ABC789',
  '15/06/2026',
].join('\n'), {
  expectedAmount: 5_000,
  expectedOperationNumber: 'EXPECTED-999',
  expectedDestinationAccounts: ['lucky.bear.mp'],
}, { confidence: 0.9 })
const mismatchValidation = validateParsedReceipt(mismatch, {
  expectedAmount: 5_000,
  expectedOperationNumber: 'EXPECTED-999',
  expectedDestinationAccounts: ['lucky.bear.mp'],
  expectedSenderDocument: '22222222',
  submittedAt: '2026-06-15T23:00:00.000Z',
})

assert.equal(mismatchValidation.reviewRecommendation, 'mismatch')
assert.ok(mismatchValidation.warnings.length >= 3)

console.log(`OCR parser: ${fixtures.length + 1} escenarios verificados`)
