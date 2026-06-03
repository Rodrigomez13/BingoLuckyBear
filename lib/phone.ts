function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatPhoneInput(value?: string | null) {
  const trimmed = (value ?? '').trim()
  const digits = onlyDigits(trimmed)

  if (!digits) return ''

  if (digits.startsWith('549') && digits.length >= 12) {
    const area = digits.slice(3, digits.length - 8)
    const number = digits.slice(-8)
    return `+54 9 ${area} ${number.slice(0, 4)}-${number.slice(4)}`
  }

  if (digits.startsWith('54') && digits.length >= 11) {
    const area = digits.slice(2, digits.length - 8)
    const number = digits.slice(-8)
    return `+54 ${area} ${number.slice(0, 4)}-${number.slice(4)}`
  }

  if (digits.length >= 10) {
    const areaLength = digits.length === 10 ? 2 : digits.length - 8
    const area = digits.slice(0, areaLength)
    const number = digits.slice(areaLength)
    return `${area} ${number.slice(0, 4)}-${number.slice(4, 8)}${number.length > 8 ? ` ${number.slice(8)}` : ''}`.trim()
  }

  if (digits.length > 4) {
    return `${digits.slice(0, -4)}-${digits.slice(-4)}`
  }

  return digits
}

export function normalizePhoneNumber(value?: string | null) {
  return formatPhoneInput(value)
}

export function isReasonablePhone(value?: string | null) {
  const digits = onlyDigits(value ?? '')
  return digits.length >= 8 && digits.length <= 15
}
