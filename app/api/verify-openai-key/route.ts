import { type NextRequest, NextResponse } from 'next/server'

/**
 * Verifica si la API key de OpenAI es válida
 * Usado para diagnosticar problemas con el parseo de comprobantes
 */
export async function GET(_request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

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
    // Hacer una llamada simple a OpenAI para verificar la validez de la API key
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          valid: false,
          error: data?.error?.message || 'API key inválida',
          message: 'La API key de OpenAI no es válida o está expirada',
          status_code: response.status,
        },
        { status: 401 }
      )
    }

    // Verificar que tenemos acceso a los modelos de visión
    const models = data.data || []
    const hasVisionModel = models.some((model: { id: string }) =>
      ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-vision'].some(
        (visionModel) => model.id.includes(visionModel)
      )
    )

    return NextResponse.json({
      valid: true,
      configured: true,
      message: 'API key válida y configurada correctamente',
      hasVisionModel,
      availableModels: models
        .filter((m: { id: string }) => m.id.includes('gpt-4'))
        .map((m: { id: string }) => m.id)
        .slice(0, 10), // Mostrar solo los primeros 10 modelos GPT-4
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
