import { type NextRequest, NextResponse } from 'next/server'

/**
 * Verifica si la API key de OpenAI es válida
 * Usado para diagnosticar problemas con el parseo de comprobantes
 */
export async function GET(_request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_RECEIPT_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    return NextResponse.json(
      {
        valid: false,
        error: 'OPENAI_API_KEY no está configurada',
        message: 'Debes configurar la variable de entorno OPENAI_API_KEY',
      },
      { status: 400 }
    )
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: 'Responde solo OK para verificar esta API key.',
        max_output_tokens: 16,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const isQuotaError = response.status === 429
      const isAuthError = response.status === 401 || response.status === 403

      return NextResponse.json(
        {
          valid: false,
          error: data?.error?.message || 'API key inválida',
          message: isQuotaError
            ? 'La API key esta configurada, pero el proyecto no tiene cuota o billing disponible.'
            : isAuthError
              ? 'La API key de OpenAI no es valida o no tiene permisos.'
              : 'OpenAI rechazo la solicitud de verificacion.',
          status_code: response.status,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      valid: true,
      configured: true,
      model,
      message: 'API key válida y configurada correctamente',
    })
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Error verificando API key',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo conectar con OpenAI. Verifica tu conexión a internet.',
      },
      { status: 500 }
    )
  }
}
