export interface WinnerWhatsAppPayload {
  to: string
  fullName: string
  raffleName: string
  prizeLabel: string
  amount: string
  cardNumber: string
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, '')
}

export function buildWinnerMessage(payload: WinnerWhatsAppPayload) {
  return [
    `Hola ${payload.fullName}.`,
    `Tu carton ${payload.cardNumber} gano el ${payload.prizeLabel} de ${payload.raffleName}.`,
    `Premio: ${payload.amount || 'monto a confirmar'}.`,
    'Lucky Bingo Bear ya tiene tus datos de cobro para coordinar el pago.',
  ].join('\n')
}

export function buildWinnerWhatsAppUrl(payload: WinnerWhatsAppPayload) {
  const to = normalizePhoneNumber(payload.to)
  const message = encodeURIComponent(buildWinnerMessage(payload))

  return to ? `https://wa.me/${to}?text=${message}` : `https://wa.me/?text=${message}`
}

export async function sendWinnerWhatsApp(payload: WinnerWhatsAppPayload) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const templateName = process.env.WHATSAPP_WINNER_TEMPLATE_NAME
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'es_AR'

  if (!accessToken || !phoneNumberId) {
    return { sent: false, reason: 'missing_config' }
  }

  const to = normalizePhoneNumber(payload.to)

  if (to.length < 8) {
    return { sent: false, reason: 'invalid_phone' }
  }

  const body = templateName
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: payload.fullName },
                { type: 'text', text: payload.cardNumber },
                { type: 'text', text: payload.prizeLabel },
                { type: 'text', text: payload.amount || 'monto a confirmar' },
                { type: 'text', text: payload.raffleName },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: buildWinnerMessage(payload),
        },
      }

  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      sent: false,
      reason: 'provider_error',
      error: data?.error?.message ?? `WhatsApp respondio ${response.status}`,
    }
  }

  return { sent: true, providerMessageId: data?.messages?.[0]?.id as string | undefined }
}
