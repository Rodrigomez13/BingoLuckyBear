import { parsePhoneNumberFromString } from 'libphonenumber-js/core'
import metadata from 'libphonenumber-js/metadata.min.json'

function parsePhone(value?: string | null) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  const input = !trimmed.startsWith('+') && digits.startsWith('54') ? `+${digits}` : trimmed
  const parsed = parsePhoneNumberFromString(input, 'AR', metadata)
  if (!parsed) return null

  // Keep explicitly international non-Argentine numbers intact.
  if (parsed.country && parsed.country !== 'AR') return parsed

  const nationalNumber = String(parsed.nationalNumber).replace(/^9(?=\d{10}$)/, '')
  return parsePhoneNumberFromString(`+549${nationalNumber}`, metadata)
}

function formatWithHyphen(value: string) {
  return value.replace(/ (\d{4})$/, '-$1')
}

export function formatPhoneInput(value?: string | null) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return ''

  const parsed = parsePhone(trimmed)
  return parsed ? formatWithHyphen(parsed.formatInternational()) : trimmed
}

export function normalizePhoneNumber(value?: string | null) {
  return formatPhoneInput(value)
}

export function isReasonablePhone(value?: string | null) {
  const parsed = parsePhone(value)
  return Boolean(parsed?.isPossible())
}

export function phoneNumberForWhatsApp(value?: string | null) {
  return parsePhone(value)?.number.replace(/^\+/, '') ?? ''
}
