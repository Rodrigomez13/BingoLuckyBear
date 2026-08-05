import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCasinoDemoOrigin } from '@/lib/casino/demo-catalog'

export default async function CasinoDemoPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  if (!/^[a-zA-Z0-9_-]+$/.test(symbol)) notFound()
  const origin = getCasinoDemoOrigin()
  return <main className="min-h-screen bg-black p-3 text-white sm:p-6"><div className="mx-auto max-w-7xl"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Demo externa aislada</p><h1 className="text-xl font-black">{symbol}</h1></div><Link href="/casino" className="rounded-lg border border-white/15 px-3 py-2 text-sm">Volver al catálogo</Link></div>{origin ? <iframe title={`Demo ${symbol}`} src={`${origin}/games/${encodeURIComponent(symbol)}/`} className="h-[calc(100svh-7rem)] min-h-[620px] w-full rounded-2xl border border-white/10 bg-zinc-950" allow="autoplay; fullscreen" /> : <div className="grid min-h-[60svh] place-items-center rounded-2xl border border-dashed border-amber-300/30 bg-zinc-950 p-8 text-center"><div><h2 className="text-2xl font-bold">Servidor demo no configurado</h2><p className="mt-3 max-w-lg text-zinc-400">Iniciá el contenedor Maldivas y configurá CASINO_DEMO_ORIGIN con una URL pública alcanzable por este sitio.</p></div></div>}</div></main>
}
