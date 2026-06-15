import { get } from '@vercel/blob'

export async function getPrivateReceiptFile(pathname: string) {
  const result = await get(pathname, { access: 'private' })
  if (!result) throw new Error('No se encontró el comprobante')

  const body = result.stream as unknown as BodyInit
  const bytes = Buffer.from(await new Response(body).arrayBuffer())

  return {
    contentType: result.blob.contentType || (pathname.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    filename: pathname.split('/').pop() || 'comprobante',
    bytes,
  }
}
