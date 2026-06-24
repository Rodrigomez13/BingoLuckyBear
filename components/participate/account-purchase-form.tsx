'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Banknote, FileText, Image as ImageIcon, Loader2, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentInstructions } from '@/components/participate/payment-instructions'
import { PurchaseConfirmation } from '@/components/participate/purchase-confirmation'
import { PAYMENT_METHODS } from '@/lib/payment'
import { readReceiptTextInBrowser, type BrowserReceiptOcrResult } from '@/lib/receipt-browser-ocr'
import { formatMoneyAmount, getPrizeAmounts, getPrizeSchedule } from '@/lib/bingo'
import { formatArgentinaDateTime } from '@/lib/date'
import { formatAccountBalance } from '@/lib/economy/format'

const MAX_RECEIPT_SIZE = 8 * 1024 * 1024
const MIN_RECEIPT_SIZE = 10 * 1024
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

interface Raffle {
  id: string
  name: string
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  card_price?: number | null
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
  payment_status?: 'pending' | 'approved' | 'rejected' | null
}

export function AccountPurchaseForm({
  raffle,
  sessionToken,
  onCardsCreated,
}: {
  raffle: Raffle
  sessionToken: string
  onCardsCreated: (cards: BingoCard[]) => void
}) {
  const [quantity, setQuantity] = useState('1')
  const [paymentSource, setPaymentSource] = useState<'receipt' | 'balance'>('receipt')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  const [confirmedCards, setConfirmedCards] = useState<BingoCard[]>([])
  const [receiptUrl, setReceiptUrl] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [wallet, setWallet] = useState({ total_balance: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prizeAmounts = getPrizeAmounts(raffle.prize, raffle.additional_prizes)
  const prizeSchedule = getPrizeSchedule(prizeAmounts)
  const jackpotPrize = prizeSchedule.find((target) => target.prizeNumber === 4)
  const cardPrice = Number(raffle.card_price ?? 0)
  const parsedQuantity = Math.max(1, Number(quantity) || 1)
  const totalAmount = cardPrice * parsedQuantity
  const maxAffordableCards = cardPrice > 0 ? Math.min(10, Math.floor(wallet.total_balance / cardPrice)) : 0
  const cardAmount = cardPrice > 0
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cardPrice)
    : formatMoneyAmount(raffle.amount, 'Precio pendiente')

  useEffect(() => {
    fetch('/api/customer/wallet', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (data.wallet) setWallet(data.wallet)
      })
      .catch(() => undefined)
  }, [])

  const validateReceiptFile = (selectedFile: File) => {
    if (!ALLOWED_RECEIPT_TYPES.includes(selectedFile.type)) {
      throw new Error('Solo se permiten comprobantes JPG, PNG, WebP o PDF')
    }

    if (selectedFile.size > MAX_RECEIPT_SIZE) {
      throw new Error('El archivo no debe superar 8MB')
    }

    if (selectedFile.size < MIN_RECEIPT_SIZE) {
      throw new Error('El comprobante parece estar vacio o incompleto')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      validateReceiptFile(selectedFile)
      if (preview) URL.revokeObjectURL(preview)
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setPreviewType(selectedFile.type === 'application/pdf' ? 'pdf' : 'image')
      setOcrStatus(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'El comprobante no es valido')
      event.target.value = ''
    }
  }

  const submitPurchase = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const parsedQuantity = Number(quantity)
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 10) {
        throw new Error('La cantidad debe ser entre 1 y 10 cartones')
      }

      if (cardPrice <= 0) {
        throw new Error('Este sorteo todavía no tiene un precio numérico configurado')
      }

      if (paymentSource === 'receipt') {
        if (!paymentMethod || !paymentReference.trim()) {
          throw new Error('Indica método de pago y número de operación')
        }
        if (!file) throw new Error('Debes subir el comprobante de pago')
      } else {
        if (wallet.total_balance < totalAmount) throw new Error('No tenés saldo suficiente para esta compra')
      }

      if (!acceptedLegal) {
        throw new Error('Debes aceptar Terminos y Politica de Privacidad para continuar')
      }

      let uploadedPath = ''
      let receiptOcr: BrowserReceiptOcrResult | null = null
      if (paymentSource === 'receipt' && file) {
        setOcrStatus('Leyendo comprobante en tu navegador...')
        receiptOcr = await readReceiptTextInBrowser(file, (progress) => {
          const percent = Math.round(progress.progress * 100)
          setOcrStatus(percent > 0 ? `Leyendo comprobante ${percent}%` : 'Preparando OCR del comprobante')
        }).catch((ocrError) => {
          console.warn('[v0] Browser receipt OCR failed:', ocrError)
          setOcrStatus('No se pudo leer en el navegador; se revisará automáticamente al recibirlo.')
          return null
        })

        const uploadForm = new FormData()
        uploadForm.append('file', file)
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || 'No se pudo subir el comprobante')
        uploadedPath = uploadData.pathname
      }

      const purchaseResponse = await fetch('/api/customer/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_id: raffle.id,
          quantity: parsedQuantity,
          payment_source: paymentSource === 'receipt' ? 'receipt' : 'wallet',
          wallet_kind: paymentSource === 'receipt' ? null : 'general',
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_receipt_url: uploadedPath,
          receipt_ocr: receiptOcr,
          session_token: sessionToken,
        }),
      })
      const purchaseData = await purchaseResponse.json()

      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || 'No se pudo completar la compra')
      }

      setConfirmedCards(purchaseData.cards ?? [])
      setReceiptUrl(uploadedPath)
      if (purchaseData.status === 'approved') {
        setWallet((current) => ({ total_balance: Math.max(0, current.total_balance - totalAmount) }))
      }
      setShowConfirmation(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const continueAfterConfirmation = () => {
    setShowConfirmation(false)
    onCardsCreated(confirmedCards)
    setConfirmedCards([])
    setReceiptUrl('')
    setQuantity('1')
    setPaymentMethod('')
    setPaymentReference('')
    setPaymentSource('receipt')
    setAcceptedLegal(false)
    setFile(null)
    setOcrStatus(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPreviewType(null)
  }

  return (
    <div className="space-y-6">
      {showConfirmation && (
        <PurchaseConfirmation cards={confirmedCards} raffle={raffle} receiptUrl={receiptUrl} onContinue={continueAfterConfirmation} />
      )}

      <Card className="border-amber-300/25 bg-zinc-950/85 text-zinc-100 shadow-xl shadow-black/25">
        <CardHeader className="border-b border-zinc-800 text-center">
          <CardTitle className="text-2xl text-white">Comprar cartones</CardTitle>
          <CardDescription className="text-zinc-400">
            Tus datos personales salen de tu cuenta. Solo carga el comprobante y la operacion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
            <Summary label="Sorteo" value={raffle.name} />
            <Summary label="Precio" value={cardAmount} />
            <Summary label="Total" value={cardPrice > 0 ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalAmount) : 'Pendiente'} />
          </div>
          <p className="text-center text-xs text-zinc-500">{formatArgentinaDateTime(raffle.draw_date)}</p>

          {jackpotPrize?.amount && (
            <div className="rounded-xl border border-amber-300/30 bg-amber-300 p-4 text-center text-zinc-950">
              <p className="text-xs font-bold uppercase tracking-wide">Premio mayor</p>
              <p className="mt-1 text-2xl font-black">{jackpotPrize.amount}</p>
            </div>
          )}

          <form onSubmit={submitPurchase} className="space-y-5">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="mb-4 flex items-start gap-3">
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-white">Cantidad de cartones</h3>
                  <p className="text-sm text-zinc-300">Cada carton se genera con numeros distintos.</p>
                </div>
              </div>
              <Label htmlFor="quantity">Cartones</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={paymentSource === 'balance' ? Math.max(1, maxAffordableCards) : 10}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-2 border-zinc-700 bg-zinc-900 text-white"
              />
              {paymentSource === 'balance' && (
                <p className="mt-2 text-xs text-emerald-100/65">
                  Tu saldo permite comprar hasta {maxAffordableCards} cartón{maxAffordableCards === 1 ? '' : 'es'} en este sorteo.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Forma de pago</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <PaymentChoice sound="ui.click" active={paymentSource === 'receipt'} onClick={() => setPaymentSource('receipt')} icon={<Banknote className="h-4 w-4" />} label="Transferencia" detail="Requiere aprobación" />
                <PaymentChoice sound="wallet.approved" active={paymentSource === 'balance'} onClick={() => setPaymentSource('balance')} icon={<WalletCards className="h-4 w-4" />} label="Saldo de cuenta" detail={`Disponible: ${formatAccountBalance(wallet.total_balance)}`} />
              </div>
            </div>

            {paymentSource === 'receipt' && <PaymentInstructions amount={totalAmount > 0 ? String(totalAmount) : raffle.amount} account={raffle.payment_account} />}

            {paymentSource === 'receipt' && (
              <>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <h3 className="font-bold text-white">Datos de pago</h3>
                      <p className="text-sm text-zinc-300">Se usan para validar el comprobante y activar tus cartones.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Metodo de pago</Label>
                      <select id="payment_method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400">
                        <option value="">Selecciona una opcion</option>
                        {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_reference">Numero de operacion</Label>
                      <Input id="payment_reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Ej: 1234567890" className="border-zinc-700 bg-zinc-900 text-white" />
                    </div>
                  </div>
                  {ocrStatus && <p className="text-xs text-sky-200">{ocrStatus}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">Comprobante de transferencia</Label>
                  <div data-sound="ui.open" className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${preview ? 'border-emerald-400 bg-emerald-500/10' : 'border-amber-400/40 bg-white/[0.03] hover:border-amber-300'}`} onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} id="receipt" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleFileChange} className="hidden" />
                    {preview ? (
                      <div className="space-y-3">
                        {previewType === 'pdf' ? <FileText className="mx-auto h-10 w-10 text-emerald-300" /> : <img src={preview} alt="Vista previa" className="mx-auto max-h-48 rounded-lg" />}
                        <p className="text-sm font-bold text-emerald-300">Comprobante cargado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="mx-auto h-8 w-8 text-amber-300" />
                        <p className="text-amber-100">Subir comprobante</p>
                        <p className="text-xs text-zinc-500">JPG, PNG, WebP o PDF hasta 8MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-zinc-300">
              <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-amber-300" />
              <span>
                Declaro que leí y acepto los <Link href="/terminos-y-condiciones" target="_blank" className="font-bold text-amber-200 underline">Términos y Condiciones</Link> y la <Link href="/politicas-de-privacidad" target="_blank" className="font-bold text-amber-200 underline">Política de Privacidad</Link>. {paymentSource === 'receipt' ? 'Entiendo que el cartón participa cuando el comprobante sea aprobado.' : 'Entiendo que el saldo se debita al confirmar y el cartón queda activo inmediatamente.'}
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <Button type="submit" data-sound="bingo.purchase" disabled={isLoading} className="h-14 w-full rounded-full bg-amber-300 text-base font-black text-zinc-950 hover:bg-amber-200">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isLoading ? 'Registrando compra...' : paymentSource === 'receipt' ? 'Enviar compra para aprobación' : `Comprar por ${formatAccountBalance(totalAmount)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PaymentChoice({
  active,
  onClick,
  icon,
  label,
  detail,
  sound = 'ui.click',
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  detail: string
  sound?: string
}) {
  return (
    <button
      type="button"
      data-sound={sound}
      onClick={onClick}
      className={`min-h-20 rounded-md border p-3 text-left transition ${active ? 'border-amber-300 bg-amber-300/10 text-white' : 'border-white/10 bg-black/20 text-zinc-300 hover:border-white/20'}`}
    >
      <span className="flex items-center gap-2 font-bold">{icon}{label}</span>
      <span className="mt-1 block text-xs text-zinc-500">{detail}</span>
    </button>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
    </div>
  )
}
