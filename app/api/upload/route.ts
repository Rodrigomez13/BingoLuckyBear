import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

function getDetectedFileType(bytes: Uint8Array) {
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte)

  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith([0x89, 0x50, 0x4e, 0x47])) return 'image/png'
  if (
    startsWith([0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return 'application/pdf'

  return null
}

function sanitizeFilename(filename: string) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Solo se permiten comprobantes JPG, PNG, WebP o PDF' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo no debe superar 8MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const detectedType = getDetectedFileType(bytes)

    if (!detectedType || detectedType !== file.type) {
      return NextResponse.json(
        { error: 'El archivo no coincide con un comprobante valido JPG, PNG, WebP o PDF' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const filename = `receipts/${timestamp}-${sanitizeFilename(file.name)}`

    const blob = await put(filename, arrayBuffer, {
      access: 'private',
      contentType: detectedType,
    })

    return NextResponse.json({ pathname: blob.pathname, contentType: detectedType })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}
