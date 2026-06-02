'use client'

import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { CalendarDays, FileText, Gift, Image as ImageIcon, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BearLogo } from '@/components/bear-logo'
import { PaymentInstructions } from '@/components/participate/payment-instructions'
import { PAYMENT_METHODS } from '@/lib/payment'
import { formatMoneyAmount, getPrizeAmounts } from '@/lib/bingo'

const MAX_RECEIPT_SIZE = 8 * 1024 * 1024
const MIN_RECEIPT_SIZE = 10 * 1024
const MIN_RECEIPT_DIMENSION = 480
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ALLOWED_EXTENSIONS_BY_TYPE: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
}

interface Raffle {
  id: string
  name: string
  description: string | null
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  bundle_offers?: string[] | null
  draw_date?: string | null
  payment_account?: {
    holder?: string | null
    alias?: string | null
    cbu?: string | null
    bank?: string | null
    concept?: string | null
    note?: string | null
  } | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
}

interface ParticipationFormProps {
  raffle: Raffle
  sessionToken: string
  onCardsCreated: (cards: BingoCard[]) => void
  title?: string
}

export function ParticipationForm({ raffle, sessionToken, onCardsCreated, title = 'Solicitar Mi Carton' }: ParticipationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    dni: '',
    address: '',
    phone: '',
    email: '',
    payment_method: '',
    payment_reference: '',
    payout_account_kind: '',
    payout_account: '',
    payout_holder_name: '',
    quantity: '1',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prizeAmounts = getPrizeAmounts(raffle.prize, raffle.additional_prizes)
  const firstPrize = prizeAmounts[0]
  const cardAmount = formatMoneyAmount(raffle.amount, 'Ver datos de pago')

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateReceiptFile = async (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() ?? ''

    if (!ALLOWED_RECEIPT_TYPES.includes(selectedFile.type)) {
      throw new Error('Solo se permiten comprobantes JPG, PNG, WebP o PDF')
    }

    if (!ALLOWED_EXTENSIONS_BY_TYPE[selectedFile.type]?.includes(extension)) {
      throw new Error('La extension del archivo no coincide con el tipo de comprobante')
    }

    if (selectedFile.size > MAX_RECEIPT_SIZE) {
      throw new Error('El archivo no debe superar 8MB')
    }

    if (selectedFile.size < MIN_RECEIPT_SIZE) {
      throw new Error('El comprobante parece estar vacio o incompleto')
    }

    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile)

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error('No se pudo leer la imagen del comprobante'))
          img.src = objectUrl
        })

        if (image.naturalWidth < MIN_RECEIPT_DIMENSION || image.naturalHeight < MIN_RECEIPT_DIMENSION) {
          throw new Error(`La imagen debe medir al menos ${MIN_RECEIPT_DIMENSION}x${MIN_RECEIPT_DIMENSION}px`)
        }
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      try {
        await validateReceiptFile(selectedFile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'El comprobante no es valido')
        e.target.value = ''
        return
      }

      if (preview) {
        URL.revokeObjectURL(preview)
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setPreviewType(selectedFile.type === 'application/pdf' ? 'pdf' : 'image')
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate all fields
      if (!formData.full_name || !formData.dni || !formData.address || !formData.phone || !formData.email) {
        throw new Error('Todos los campos son obligatorios')
      }
      if (!formData.payment_method || !formData.payment_reference) {
        throw new Error('Indica el metodo de pago y el numero de operacion')
      }
      if (!formData.payout_account_kind || !formData.payout_account || !formData.payout_holder_name) {
        throw new Error('Indica los datos de la cuenta donde queres recibir el premio')
      }
      const quantity = Number(formData.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        throw new Error('La cantidad de cartones debe ser entre 1 y 10')
      }
      if (!file) {
        throw new Error('Debes subir el comprobante de pago')
      }

      // Upload file first
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        throw new Error(uploadData.error || 'Error al subir el comprobante')
      }

      const { pathname } = await uploadRes.json()

      // Create the card
      const cardRes = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffle_id: raffle.id,
          ...formData,
          quantity,
          payment_receipt_url: pathname,
          session_token: sessionToken,
        }),
      })

      const cardData = await cardRes.json()

      if (!cardRes.ok) {
        if (cardRes.status === 409) {
          // User already has a card
          throw new Error('Ya tienes un carton para este sorteo')
        }
        throw new Error(cardData.error || 'Error al crear el carton')
      }

      const createdCards = cardData.cards?.length
        ? cardData.cards
        : [
            {
              id: cardData.card_id,
              card_number: cardData.card_number,
              full_name: formData.full_name,
              created_at: new Date().toISOString(),
              bingo_numbers: cardData.bingo_numbers,
            },
          ]

      onCardsCreated(createdCards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Raffle Info Header */}
      <div className="text-center">
        <BearLogo size={68} className="mx-auto mb-4" />
        <h1 
          className="mb-2 text-2xl font-semibold tracking-tight text-white md:text-3xl"
        >
          {raffle.name}
        </h1>
        {raffle.description && (
          <p className="text-zinc-300 max-w-lg mx-auto">{raffle.description}</p>
        )}
      </div>

      {firstPrize && (
        <div className="rounded-lg border border-amber-300/35 bg-gradient-to-r from-amber-300 to-orange-500 p-5 text-center text-zinc-950 shadow-xl shadow-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide">Primer premio</p>
          <p className="mt-1 break-words text-3xl font-bold tracking-tight md:text-4xl">
            {firstPrize}
          </p>
          <p className="mt-2 text-sm font-semibold">El premio mayor se juega al final.</p>
        </div>
      )}

      <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
        <RaffleDetail icon={<Gift className="h-5 w-5" />} label="Premios" value={prizeAmounts.length === 3 ? '3 premios por fila' : 'A confirmar'} />
        <RaffleDetail icon={<WalletCards className="h-5 w-5" />} label="Monto" value={cardAmount} />
        <RaffleDetail
          icon={<CalendarDays className="h-5 w-5" />}
          label="Fecha"
          value={raffle.draw_date ? new Date(raffle.draw_date).toLocaleString('es-ES') : 'A confirmar'}
        />
      </div>

      {prizeAmounts.length > 0 && (
        <div className="rounded-lg border border-amber-400/20 bg-zinc-950/75 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-amber-200">
            <Gift className="h-4 w-4" />
            Todos los premios
          </p>
          <div className="grid auto-rows-fr gap-2 sm:grid-cols-3">
            {[1, 2, 3].map((prizeNumber) => (
              <div key={prizeNumber} className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white">
                <span className="block text-xs uppercase text-amber-200">Premio {prizeNumber}</span>
                {prizeAmounts[prizeNumber - 1] ?? 'A confirmar'}
                <span className="mt-1 block text-xs text-zinc-400">Fila {prizeNumber}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase text-zinc-400">
            Orden del sorteo: premio 3, premio 2 y premio 1 al final.
          </p>
        </div>
      )}

      {!!raffle.bundle_offers?.length && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-emerald-100">
            <WalletCards className="h-4 w-4" />
            Promos por cantidad
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {raffle.bundle_offers.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-md border border-emerald-300/20 bg-black/20 px-3 py-2 text-sm font-semibold text-white">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <PaymentInstructions amount={raffle.amount} account={raffle.payment_account} />

      {/* Form */}
      <Card className="border-zinc-800 bg-zinc-950/85 text-zinc-100 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center border-b border-zinc-800">
          <CardTitle className="text-xl font-semibold tracking-tight text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Completa todos los campos para obtener tu carton de bingo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-zinc-300 font-medium">
                  Nombre Completo *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Juan Perez"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni" className="text-zinc-300 font-medium">
                  DNI *
                </Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-300 font-medium">
                Direccion *
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Av. Principal 123, Ciudad"
                required
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-300 font-medium">
                  Numero de Telefono *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+54 11 1234-5678"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 font-medium">
                  Correo Electronico *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
              <div className="mb-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <h3 className="font-bold text-white">Datos del pago</h3>
                  <p className="text-sm text-zinc-300">
                    Estos datos ayudan a validar el comprobante y evitar registros duplicados.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-zinc-300 font-medium">
                    Metodo de pago *
                  </Label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={(event) => setFormData({ ...formData, payment_method: event.target.value })}
                    required
                    className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">Selecciona una opcion</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_reference" className="text-zinc-300 font-medium">
                    Numero de operacion *
                  </Label>
                  <Input
                    id="payment_reference"
                    name="payment_reference"
                    value={formData.payment_reference}
                    onChange={handleInputChange}
                    placeholder="Ej: 1234567890"
                    required
                    minLength={4}
                    className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-sky-300/25 bg-sky-400/10 p-4">
              <div className="mb-4 flex items-start gap-3">
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" />
                <div>
                  <h3 className="font-bold text-white">Cuenta para cobrar premios</h3>
                  <p className="text-sm text-zinc-300">
                    Si tu carton gana, usamos estos datos para avisarte por WhatsApp y coordinar el pago.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="payout_account_kind" className="text-zinc-300 font-medium">
                    Tipo de cuenta *
                  </Label>
                  <select
                    id="payout_account_kind"
                    name="payout_account_kind"
                    value={formData.payout_account_kind}
                    onChange={(event) => setFormData({ ...formData, payout_account_kind: event.target.value })}
                    required
                    className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">Selecciona</option>
                    <option value="Alias">Alias</option>
                    <option value="CBU">CBU</option>
                    <option value="CVU">CVU</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout_account" className="text-zinc-300 font-medium">
                    Alias / CBU / CVU *
                  </Label>
                  <Input
                    id="payout_account"
                    name="payout_account"
                    value={formData.payout_account}
                    onChange={handleInputChange}
                    placeholder="Ej: lucky.bear.mp"
                    required
                    minLength={5}
                    className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payout_holder_name" className="text-zinc-300 font-medium">
                    Titular de la cuenta *
                  </Label>
                  <Input
                    id="payout_holder_name"
                    name="payout_holder_name"
                    value={formData.payout_holder_name}
                    onChange={handleInputChange}
                    placeholder="Nombre del titular"
                    required
                    minLength={3}
                    className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="mb-4 flex items-start gap-3">
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-white">Cantidad de cartones</h3>
                  <p className="text-sm text-zinc-300">
                    Cada carton se genera con numeros distintos y participa individualmente.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-zinc-300 font-medium">
                    Cartones *
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-emerald-100">
                  Si hay promo por cantidad, transferi el monto correspondiente y adjunta el comprobante de esa compra.
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt" className="text-zinc-300 font-medium">
                Comprobante de Transferencia *
              </Label>
              <p className="text-sm text-zinc-400 mb-2">
                Sube una captura o PDF del comprobante. Debe verse fecha, importe, destino y numero de operacion.
              </p>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  preview ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 hover:border-amber-300 bg-white/[0.03]'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="receipt"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {preview ? (
                  <div className="space-y-3">
                    {previewType === 'pdf' ? (
                      <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-emerald-400/30 bg-zinc-950/70 p-4 text-left">
                        <FileText className="h-8 w-8 shrink-0 text-emerald-300" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{file?.name}</p>
                          <p className="text-xs text-zinc-400">PDF listo para subir</p>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={preview} 
                        alt="Vista previa" 
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                      />
                    )}
                    <p className="text-sm text-emerald-300 font-medium">
                      Comprobante cargado correctamente
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (preview) {
                          URL.revokeObjectURL(preview)
                        }
                        setFile(null)
                        setPreview(null)
                        setPreviewType(null)
                      }}
                      className="border-red-400/40 bg-transparent text-red-300 hover:bg-red-500/10"
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-amber-400/15 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-amber-300" />
                    </div>
                    <p className="text-amber-100">
                      Haz clic para subir tu comprobante
                    </p>
                    <p className="text-xs text-zinc-500">
                      JPG, PNG, WebP o PDF hasta 8MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-auto w-full whitespace-normal bg-gradient-to-r from-amber-500 to-orange-500 py-5 text-center text-lg font-bold leading-tight text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-500/40"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando tus cartones...
                </span>
              ) : (
                firstPrize ? `Participar por ${firstPrize}` : Number(formData.quantity) > 1 ? 'Obtener Mis Cartones' : 'Obtener Mi Carton'
              )}
            </Button>

            <p className="text-xs text-center text-zinc-500">
              Al enviar este formulario, aceptas que tus datos sean utilizados 
              unicamente para el registro del sorteo.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function RaffleDetail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border border-white/10 bg-zinc-950/75 p-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-amber-400/15 text-amber-200">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase text-amber-200">{label}</p>
      <p className="mt-1 min-w-0 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
