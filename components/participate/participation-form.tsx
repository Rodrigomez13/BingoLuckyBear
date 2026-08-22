'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Gift,
  Image as ImageIcon,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
  User,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const STEPS = [
  { id: 1, label: 'Cartones', icon: Ticket },
  { id: 2, label: 'Tus datos', icon: User },
  { id: 3, label: 'Pago', icon: CreditCard },
] as const

export function ParticipationForm({
  raffle,
  sessionToken,
  onCardsCreated,
  title = 'Solicitar mi carton',
}: ParticipationFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    full_name: '',
    dni: '',
    address: '',
    phone: '',
    email: '',
    payment_method: '',
    payment_reference: '',
    quantity: '1',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const prizeAmounts = getPrizeAmounts(raffle.prize, raffle.additional_prizes)
  const firstPrize = prizeAmounts[0]
  const cardAmount = formatMoneyAmount(raffle.amount, 'Ver datos de pago')
  const quantity = Number(formData.quantity) || 1

  const estimatedTotal = useMemo(() => {
    const numeric = Number(String(raffle.amount ?? '').replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(numeric) || numeric <= 0) return null
    return numeric * quantity
  }, [raffle.amount, quantity])

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const setQuantity = (next: number) => {
    const clamped = Math.min(10, Math.max(1, next))
    setFormData((current) => ({ ...current, quantity: String(clamped) }))
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

  const validateStep = (target: number) => {
    if (target === 1) {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return 'La cantidad de cartones debe ser entre 1 y 10'
      }
    }
    if (target === 2) {
      if (!formData.full_name || !formData.dni || !formData.address || !formData.phone || !formData.email) {
        return 'Completa todos tus datos para continuar'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return 'Ingresa un correo electronico valido'
      }
    }
    return null
  }

  const goNext = () => {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep((current) => Math.min(STEPS.length, current + 1))
    scrollToTop()
  }

  const goBack = () => {
    setError(null)
    setStep((current) => Math.max(1, current - 1))
    scrollToTop()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.full_name || !formData.dni || !formData.address || !formData.phone || !formData.email) {
        throw new Error('Todos los campos son obligatorios')
      }
      if (!formData.payment_method || !formData.payment_reference) {
        throw new Error('Indica el metodo de pago y el numero de operacion')
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        throw new Error('La cantidad de cartones debe ser entre 1 y 10')
      }
      if (!file) {
        throw new Error('Debes subir el comprobante de pago')
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFormData })

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        throw new Error(uploadData.error || 'Error al subir el comprobante')
      }

      const { pathname } = await uploadRes.json()

      const cardRes = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div ref={topRef} className="space-y-6 scroll-mt-24">
      {/* Compact raffle summary */}
      <div className="overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-zinc-950 shadow-xl shadow-amber-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">{raffle.name}</p>
            {firstPrize && (
              <p className="mt-1 break-words text-3xl font-bold tracking-tight md:text-4xl">{firstPrize}</p>
            )}
            <p className="mt-1 text-sm font-semibold opacity-90">Premio mayor en juego</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="rounded-lg bg-zinc-950/15 px-3 py-1.5 text-sm font-bold">{cardAmount} / carton</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <CalendarDays className="h-3.5 w-3.5" />
              {raffle.draw_date ? new Date(raffle.draw_date).toLocaleDateString('es-AR') : 'Fecha a confirmar'}
            </span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} />

      <Card className="border-zinc-800 bg-zinc-950/85 text-zinc-100 shadow-xl backdrop-blur-sm">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1 - Quantity */}
            {step === 1 && (
              <div className="space-y-5">
                <StepHeading
                  icon={<Ticket className="h-5 w-5" />}
                  title="Elegi cuantos cartones queres"
                  description="Cada carton tiene numeros distintos y participa de forma individual. Mas cartones, mas chances."
                />

                <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <Label className="text-sm font-semibold text-zinc-300">Cantidad de cartones</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                      className="h-12 w-12 rounded-full border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40"
                      aria-label="Quitar un carton"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="w-16 text-center text-4xl font-bold tabular-nums text-white">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= 10}
                      className="h-12 w-12 rounded-full border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40"
                      aria-label="Agregar un carton"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">Hasta 10 cartones por jugador</p>

                  {estimatedTotal !== null && (
                    <div className="mt-2 flex w-full items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
                      <span className="text-sm font-medium text-emerald-100">Total estimado</span>
                      <span className="text-xl font-bold text-white">{formatMoneyAmount(String(estimatedTotal))}</span>
                    </div>
                  )}
                </div>

                {!!raffle.bundle_offers?.length && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-emerald-100">
                      <WalletCards className="h-4 w-4" />
                      Promos por cantidad
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {raffle.bundle_offers.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-md border border-emerald-300/20 bg-black/20 px-3 py-2 text-sm font-semibold text-white"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prizeAmounts.length > 0 && (
                  <div className="rounded-xl border border-amber-400/20 bg-zinc-950/75 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-amber-200">
                      <Gift className="h-4 w-4" />
                      Todos los premios
                    </p>
                    <div className="grid auto-rows-fr gap-2 sm:grid-cols-3">
                      {[1, 2, 3].map((prizeNumber) => (
                        <div
                          key={prizeNumber}
                          className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white"
                        >
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
              </div>
            )}

            {/* STEP 2 - Personal data */}
            {step === 2 && (
              <div className="space-y-5">
                <StepHeading
                  icon={<User className="h-5 w-5" />}
                  title="Tus datos"
                  description="Los usamos para identificar tu carton y contactarte si ganas."
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nombre completo" htmlFor="full_name">
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Juan Perez"
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                    />
                  </Field>
                  <Field label="DNI" htmlFor="dni">
                    <Input
                      id="dni"
                      name="dni"
                      value={formData.dni}
                      onChange={handleInputChange}
                      placeholder="12345678"
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                    />
                  </Field>
                </div>

                <Field label="Direccion" htmlFor="address">
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Av. Principal 123, Ciudad"
                    className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Telefono" htmlFor="phone">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+54 11 1234-5678"
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                    />
                  </Field>
                  <Field label="Correo electronico" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                      className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 3 - Payment */}
            {step === 3 && (
              <div className="space-y-5">
                <StepHeading
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Confirma tu pago"
                  description={`Transferi el total por ${quantity} carton${quantity > 1 ? 'es' : ''} y carga el comprobante.`}
                />

                <PaymentInstructions amount={raffle.amount} />

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <h3 className="font-bold text-white">Datos del pago</h3>
                      <p className="text-sm text-zinc-300">
                        Nos ayudan a validar el comprobante y evitar registros duplicados.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Metodo de pago" htmlFor="payment_method">
                      <select
                        id="payment_method"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={(event) => setFormData({ ...formData, payment_method: event.target.value })}
                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
                      >
                        <option value="">Selecciona una opcion</option>
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Numero de operacion" htmlFor="payment_reference">
                      <Input
                        id="payment_reference"
                        name="payment_reference"
                        value={formData.payment_reference}
                        onChange={handleInputChange}
                        placeholder="Ej: 1234567890"
                        minLength={4}
                        className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
                      />
                    </Field>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="receipt" className="font-medium text-zinc-300">
                    Comprobante de transferencia
                  </Label>
                  <p className="mb-2 text-sm text-zinc-400">
                    Sube una captura o PDF. Debe verse fecha, importe, destino y numero de operacion.
                  </p>
                  <div
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                      preview
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-amber-400/40 bg-white/[0.03] hover:border-amber-300'
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
                          <img src={preview} alt="Vista previa" className="mx-auto max-h-48 rounded-lg shadow-md" />
                        )}
                        <p className="text-sm font-medium text-emerald-300">Comprobante cargado correctamente</p>
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
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15">
                          <ImageIcon className="h-6 w-6 text-amber-300" />
                        </div>
                        <p className="text-amber-100">Haz clic para subir tu comprobante</p>
                        <p className="text-xs text-zinc-500">JPG, PNG, WebP o PDF hasta 8MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                  <p className="mb-2 font-semibold text-white">Resumen</p>
                  <div className="flex justify-between text-zinc-300">
                    <span>Sorteo</span>
                    <span className="font-medium text-white">{raffle.name}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Cartones</span>
                    <span className="font-medium text-white">{quantity}</span>
                  </div>
                  {estimatedTotal !== null && (
                    <div className="mt-1 flex justify-between border-t border-white/10 pt-2 text-zinc-300">
                      <span>Total estimado</span>
                      <span className="font-bold text-white">{formatMoneyAmount(String(estimatedTotal))}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atras
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}

              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white hover:from-amber-600 hover:to-orange-600 sm:w-auto"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-auto whitespace-normal bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-center text-base font-bold leading-tight text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl sm:w-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generando tus cartones...
                    </span>
                  ) : firstPrize ? (
                    `Participar por ${firstPrize}`
                  ) : quantity > 1 ? (
                    'Obtener mis cartones'
                  ) : (
                    'Obtener mi carton'
                  )}
                </Button>
              )}
            </div>

            {step === STEPS.length && (
              <p className="text-center text-xs text-zinc-500">
                Al enviar este formulario, aceptas que tus datos sean utilizados unicamente para el registro del sorteo.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="sr-only">{title}</p>
    </div>
  )
}

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progreso de la solicitud">
      {STEPS.map((stepItem, index) => {
        const Icon = stepItem.icon
        const isDone = currentStep > stepItem.id
        const isCurrent = currentStep === stepItem.id

        return (
          <li key={stepItem.id} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-400 text-zinc-950'
                    : isDone
                      ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span
                className={`truncate text-center text-xs font-semibold sm:text-left sm:text-sm ${
                  isCurrent ? 'text-white' : isDone ? 'text-emerald-200' : 'text-zinc-500'
                }`}
              >
                {stepItem.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={`hidden h-0.5 flex-1 rounded sm:block ${isDone ? 'bg-emerald-400/60' : 'bg-zinc-800'}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-zinc-950">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">{description}</p>
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="font-medium text-zinc-300">
        {label} <span className="text-amber-300">*</span>
      </Label>
      {children}
    </div>
  )
}
