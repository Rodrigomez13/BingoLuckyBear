import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const MIN_FILE_SIZE = 10 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS_BY_TYPE: Record<(typeof ALLOWED_TYPES)[number], string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}
const MIN_IMAGE_WIDTH = 480
const MIN_IMAGE_HEIGHT = 480

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

function getFileExtension(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension && extension !== filename.toLowerCase() ? extension : ''
}

function readUInt16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) + bytes[offset + 1]
}

function readUInt32BE(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

function getImageDimensions(bytes: Uint8Array, type: string) {
  if (type === 'image/png' && bytes.length >= 24) {
    return { width: readUInt32BE(bytes, 16), height: readUInt32BE(bytes, 20) }
  }

  if (type === 'image/webp' && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16))

    if (chunk === 'VP8X' && bytes.length >= 30) {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
      return { width, height }
    }

    if (chunk === 'VP8 ' && bytes.length >= 30) {
      return {
        width: bytes[26] + ((bytes[27] & 0x3f) << 8),
        height: bytes[28] + ((bytes[29] & 0x3f) << 8),
      }
    }

    if (chunk === 'VP8L' && bytes.length >= 25) {
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
  }

  if (type === 'image/jpeg') {
    let offset = 2

    while (offset < bytes.length - 9) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }

      const marker = bytes[offset + 1]
      const length = readUInt16BE(bytes, offset + 2)

      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: readUInt16BE(bytes, offset + 5),
          width: readUInt16BE(bytes, offset + 7),
        }
      }

      offset += 2 + length
    }
  }

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
    const purpose = String(formData.get('purpose') ?? 'receipt')
    const isWinnerPhoto = purpose === 'winner-photo'

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    if (isWinnerPhoto && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten fotos JPG, PNG o WebP' }, { status: 400 })
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

    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json({ error: 'El comprobante parece estar vacio o incompleto' }, { status: 400 })
    }

    const extension = getFileExtension(file.name)
    const allowedExtensions = ALLOWED_EXTENSIONS_BY_TYPE[file.type as (typeof ALLOWED_TYPES)[number]]

    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'La extension del comprobante no coincide con el tipo de archivo permitido' },
        { status: 400 }
      )
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

    if (detectedType.startsWith('image/')) {
      const dimensions = getImageDimensions(bytes, detectedType)

      if (!dimensions) {
        return NextResponse.json(
          { error: 'No se pudieron validar las dimensiones de la imagen del comprobante' },
          { status: 400 }
        )
      }

      if (dimensions.width < MIN_IMAGE_WIDTH || dimensions.height < MIN_IMAGE_HEIGHT) {
        return NextResponse.json(
          { error: `La imagen del comprobante debe medir al menos ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px` },
          { status: 400 }
        )
      }
    }

    const timestamp = Date.now()
    const filename = `${isWinnerPhoto ? 'winner-photos' : 'receipts'}/${timestamp}-${sanitizeFilename(file.name)}`

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
