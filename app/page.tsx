import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Crown, ShieldCheck, Sparkles, Trophy, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

const features = [
  { icon: Sparkles, title: 'Partidas rápidas', text: 'Entrá a una mesa y empezá a jugar en segundos.' },
  { icon: Users, title: 'Mesas con amigos', text: 'Creá una sala privada y compartí el código.' },
  { icon: Trophy, title: 'Torneos diarios', text: 'Competí por premios y subí en el ranking.' },
  { icon: ShieldCheck, title: 'Juego seguro', text: 'Reglas claras y partidas sincronizadas.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04130c] text-[#fff4d2]">
      <SiteHeader />
      <section className="relative isolate min-h-[700px] overflow-hidden border-b border-[#dfb23f]/20 bg-[#061c12]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,18,11,.97)_0%,rgba(3,18,11,.78)_38%,rgba(3,18,11,.18)_76%,rgba(3,18,11,.76)_100%),url('/truco/preview-lobby-home.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_45%,rgba(223,178,63,.17),transparent_30%),linear-gradient(180deg,rgba(2,11,7,.25),#04130c_96%)]" />
        <div className="mx-auto flex min-h-[700px] max-w-7xl items-center px-5 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dfb23f]/35 bg-[#061b11]/75 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-[#ffd95a] backdrop-blur">
              <Crown className="size-4" /> Truco argentino 24/7
            </div>
            <h1 className="max-w-xl font-mono text-5xl font-black uppercase leading-[.93] tracking-tight text-[#fff4d2] sm:text-7xl lg:text-8xl">
              La mesa está <span className="text-[#dfb23f]">servida.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#f6efd9]/75 sm:text-xl">
              Jugá Truco online contra el oso, desafiá a tus amigos o encontrá una mesa pública. La próxima mano empieza con vos.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/truco" className="inline-flex items-center gap-3 rounded-lg border border-[#ffd95a] bg-[#dfb23f] px-6 py-4 text-sm font-black uppercase tracking-wide text-[#251a05] shadow-[0_12px_35px_rgba(223,178,63,.25)] transition hover:-translate-y-0.5 hover:bg-[#ffd95a]">
                Jugar al Truco <ArrowRight className="size-4" />
              </Link>
              <Link href="/truco?modo=crear" className="inline-flex items-center rounded-lg border border-[#59cd8c]/40 bg-[#0a452a]/65 px-6 py-4 text-sm font-black uppercase tracking-wide text-[#d9f6e5] transition hover:border-[#dfb23f]/60 hover:bg-[#0d5b35]">
                Crear una mesa
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-wide text-[#f6efd9]/55">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#59cd8c]" /> Salas sincronizadas</span>
              <span className="inline-flex items-center gap-2"><Crown className="size-4 text-[#dfb23f]" /> A 15 o 30 puntos</span>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 right-[-9rem] hidden w-[48rem] lg:block xl:right-[-4rem]">
            <Image src="/truco/golden-bear-mascot.webp" alt="Lucky Bear con su corona, listo para jugar Truco" width={900} height={900} priority className="w-full drop-shadow-[0_25px_45px_rgba(0,0,0,.7)]" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.25em] text-[#dfb23f]">Todo lo que necesitás</p><h2 className="mt-2 font-mono text-3xl font-black uppercase text-[#fff4d2] sm:text-4xl">Jugá a tu manera</h2></div>
          <Link href="/truco" className="hidden text-sm font-bold text-[#ffd95a] hover:text-[#fff4d2] sm:inline-flex sm:items-center sm:gap-2">Ver mesas <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-[#dfb23f]/20 bg-[#071d12] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]"><Icon className="size-7 text-[#dfb23f]" /><h3 className="mt-5 font-mono text-xl font-black text-[#fff4d2]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#f6efd9]/60">{text}</p></article>)}
        </div>
      </section>
    </main>
  )
}
