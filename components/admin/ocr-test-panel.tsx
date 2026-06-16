'use client'

import { type FormEvent, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface OcrTestResult {
  ok: boolean
  error?: string
  parsed?: {
    amount: number | null
    operationNumber: string | null
    destinationAccount: string | null
    senderDocument: string | null
    senderName: string | null
    date: string | null
    rawText: string | null
    confidence: number | null
    source: string
    warnings: string[]
  }
  validation?: {
    reviewRecommendation: 'ready_for_review' | 'manual_review' | 'mismatch'
    amountMatches: boolean | null
    operationMatches: boolean | null
    destinationMatches: boolean | null
    senderDocumentMatches: boolean | null
    dateIsPlausible: boolean | null
    warnings: string[]
  }
  expectedDestinationAccounts?: string[]
}

async function readJson(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  throw new Error(text.replace(/\s+/g, ' ').slice(0, 220) || 'El servidor no devolvió JSON')
}

function formatMatch(value: boolean | null | undefined) {
  if (value === true) return 'OK'
  if (value === false) return 'Diferente'
  return 'Sin dato'
}

function statusClass(value: boolean | null | undefined) {
  if (value === true) return 'bg-emerald-500 text-white hover:bg-emerald-500'
  if (value === false) return 'bg-rose-500 text-white hover:bg-rose-500'
  return 'bg-zinc-800 text-zinc-300 hover:bg-zinc-800'
}

export function OcrTestPanel() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [result, setResult] = useState<OcrTestResult | null>(null)
  const [fileName, setFileName] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const file = fileRef.current?.files?.[0]

    if (!file) {
      setResult({ ok: false, error: 'Adjuntá un comprobante.' })
      return
    }

    setIsBusy(true)
    setResult(null)

    try {
      const formData = new FormData(form)
      formData.set('file', file)

      const response = await fetch('/api/admin/ocr-test', {
        method: 'POST',
        body: formData,
      })
      const data = await readJson(response) as OcrTestResult
      if (!response.ok) throw new Error(data.error || 'No se pudo probar el OCR')
      setResult(data)
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'No se pudo probar el OCR' })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-sky-400/20 bg-zinc-950/80 p-4 shadow-xl shadow-black/30">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-200">
              <FileSearch className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">Probador OCR</h2>
              <p className="text-xs text-zinc-500">Prueba aislada, sin acreditar saldos.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ocr-test-file">Comprobante</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  ref={fileRef}
                  id="ocr-test-file"
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff,application/pdf"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
                  className="border-white/10 bg-black/40 text-zinc-100"
                />
                <Button type="submit" disabled={isBusy} className="shrink-0 rounded-full bg-sky-400 text-sky-950 hover:bg-sky-300">
                  {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Probar OCR
                </Button>
              </div>
              {fileName && <p className="text-xs text-zinc-500">{fileName}</p>}
            </div>

            <Field id="ocr-test-amount" name="amount" label="Monto" placeholder="3000" />
            <Field id="ocr-test-operation" name="operation" label="Operación" placeholder="41849820944" />
            <Field id="ocr-test-document" name="document" label="DNI emisor" placeholder="34956772" />
            <div className="space-y-2">
              <Label htmlFor="ocr-test-destinations">Destino</Label>
              <Textarea
                id="ocr-test-destinations"
                name="destinations"
                placeholder="Alias, CBU o CVU"
                className="min-h-9 border-white/10 bg-black/40 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          {!result && (
            <div className="flex h-full min-h-48 items-center justify-center text-center text-sm text-zinc-500">
              El resultado aparece acá.
            </div>
          )}

          {result && !result.ok && (
            <div className="space-y-3">
              <Badge className="bg-rose-500 text-white hover:bg-rose-500">
                <AlertTriangle className="mr-1 h-3 w-3" /> Falló
              </Badge>
              <p className="text-sm font-semibold text-rose-100">{result.error}</p>
            </div>
          )}

          {result?.ok && result.parsed && result.validation && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={result.validation.reviewRecommendation === 'mismatch' ? 'bg-rose-500 text-white hover:bg-rose-500' : result.validation.reviewRecommendation === 'ready_for_review' ? 'bg-emerald-500 text-white hover:bg-emerald-500' : 'bg-amber-300 text-amber-950 hover:bg-amber-300'}>
                  <CheckCircle2 className="mr-1 h-3 w-3" /> {result.validation.reviewRecommendation === 'ready_for_review' ? 'Coincidencias OK' : result.validation.reviewRecommendation === 'mismatch' ? 'Hay diferencias' : 'Revisión manual'}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {result.parsed.source} {typeof result.parsed.confidence === 'number' ? `· ${Math.round(result.parsed.confidence * 100)}%` : ''}
                </span>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <ResultItem label="Monto" value={result.parsed.amount === null ? 'Sin dato' : `$ ${result.parsed.amount.toLocaleString('es-AR')}`} />
                <ResultItem label="Operación" value={result.parsed.operationNumber ?? 'Sin dato'} />
                <ResultItem label="Destino" value={result.parsed.destinationAccount ?? 'Sin dato'} />
                <ResultItem label="Documento" value={result.parsed.senderDocument ?? 'Sin dato'} />
              </dl>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusClass(result.validation.amountMatches)}>Monto {formatMatch(result.validation.amountMatches)}</Badge>
                <Badge className={statusClass(result.validation.operationMatches)}>Op. {formatMatch(result.validation.operationMatches)}</Badge>
                <Badge className={statusClass(result.validation.destinationMatches)}>Destino {formatMatch(result.validation.destinationMatches)}</Badge>
                <Badge className={statusClass(result.validation.senderDocumentMatches)}>DNI {formatMatch(result.validation.senderDocumentMatches)}</Badge>
              </div>

              {result.validation.warnings.length > 0 && (
                <ul className="space-y-1 text-xs text-amber-100">
                  {result.validation.warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              )}

              {result.parsed.rawText && (
                <details className="text-xs text-zinc-500">
                  <summary className="cursor-pointer font-semibold text-zinc-300">Texto leído</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/45 p-3">{result.parsed.rawText.slice(0, 4000)}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </form>
    </section>
  )
}

function Field({ id, name, label, placeholder }: { id: string; name: string; label: string; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} className="border-white/10 bg-black/40 text-zinc-100 placeholder:text-zinc-600" />
    </div>
  )
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/60 p-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
    </div>
  )
}
