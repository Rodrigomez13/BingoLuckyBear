import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clapperboard } from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { notFound } from 'next/navigation'
import { getCasinoDemoOrigin } from '@/lib/casino/demo-catalog'

export default async function CasinoDemoPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  if (!/^[a-zA-Z0-9_-]+$/.test(symbol)) notFound()
  const origin = getCasinoDemoOrigin()
  const gameName = symbol.replaceAll('_', ' ').replaceAll('-', ' ')

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04130c] px-3 py-3 text-white sm:px-5 sm:py-5">
      <Image src="/lbb/visuals/lbb-universe-hero.webp" alt="" fill priority className="pointer-events-none object-cover opacity-[0.16]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(250,204,21,.24),transparent_26rem),radial-gradient(circle_at_85%_18%,rgba(34,197,94,.18),transparent_29rem),linear-gradient(135deg,rgba(2,8,5,.95),rgba(4,29,17,.82),rgba(2,8,5,.95))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-[#031008]/85 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <BearLogo size={42} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.2em] text-amber-300"><Clapperboard className="h-3.5 w-3.5" /> Demo externa aislada</p>
              <h1 className="mt-1 truncate text-lg font-black capitalize text-white sm:text-xl">{gameName}</h1>
            </div>
          </div>
          <Link href="/casino" className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-white/[0.04] px-3 text-xs font-black uppercase text-amber-100 transition hover:bg-amber-300 hover:text-zinc-950">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[1.5rem] border border-amber-300/20 bg-black/45 p-1.5 shadow-2xl shadow-black/45 backdrop-blur-md sm:p-2">
          <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] border border-white/10" />
          {origin ? (
            <iframe
              title={`Demo ${symbol}`}
              src={`${origin}/games/${encodeURIComponent(symbol)}/`}
              className="relative z-10 h-[calc(100svh-7.9rem)] min-h-[620px] w-full rounded-[1.15rem] border border-white/10 bg-zinc-950"
              allow="autoplay; fullscreen"
            />
          ) : (
            <div className="relative z-10 grid min-h-[60svh] place-items-center rounded-[1.15rem] border border-dashed border-amber-300/30 bg-[#031008]/80 p-8 text-center">
              <div>
                <BearLogo size={72} className="mx-auto" />
                <h2 className="mt-5 text-2xl font-black">Servidor demo no configurado</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/65">Iniciá el contenedor Maldivas y configurá CASINO_DEMO_ORIGIN con una URL pública alcanzable por este sitio.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
