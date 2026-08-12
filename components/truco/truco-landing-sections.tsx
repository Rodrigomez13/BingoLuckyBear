import Image from 'next/image'
import Link from 'next/link'
import { Apple, ArrowRight, Globe, LayoutGrid, ShieldCheck, Smartphone, Table2, Trophy, UserPlus, Users, Wallet } from 'lucide-react'

const benefits = [
  { icon: Table2, title: 'Mesas para jugar', text: 'Elegí una sala pública o creá una privada con la entrada que prefieras.' },
  { icon: Wallet, title: 'Créditos en una sola cuenta', text: 'Tu saldo disponible se usa directamente para entrar a la mesa.' },
  { icon: ShieldCheck, title: 'Flujo protegido', text: 'Las cargas, retiros y liquidaciones siguen el circuito actual de LBB.' },
  { icon: Users, title: 'Partidas online', text: 'Jugá contra el oso o conectate a una mesa con otro jugador.' },
]

const steps = [
  { icon: UserPlus, title: 'Ingresá a tu cuenta', text: 'Tu perfil de Lucky Bingo Bear es el mismo para jugar Truco.' },
  { icon: Wallet, title: 'Cargá créditos', text: 'Enviá tu comprobante y esperá la aprobación del flujo vigente.' },
  { icon: LayoutGrid, title: 'Elegí una mesa', text: 'Sumate a una disponible o creá una sala privada.' },
  { icon: Trophy, title: 'Jugá la partida', text: 'El resultado se liquida y registra en tu wallet e historial.' },
]

export function TrucoLandingSections() {
  return (
    <>
      <section id="inicio" className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[#03170b]/85 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="pointer-events-none absolute right-0 top-0 h-[34rem] w-[34rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative grid items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_.94fr] lg:px-10 lg:py-12 2xl:px-14 2xl:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-amber-200"><Table2 className="h-3.5 w-3.5" /> Truco Lucky Bingo Bear</p>
            <h1 className="mt-5 font-mono text-4xl font-black uppercase leading-[.9] text-white sm:text-6xl 2xl:text-7xl"><span className="block">El mejor</span><span className="block text-amber-300">Truco online</span><span className="block">te espera</span></h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">Mesas reales, salas privadas y créditos conectados a la wallet que ya usás en Lucky Bingo Bear.</p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
              {benefits.slice(0, 3).map((benefit) => <div key={benefit.title} className="rounded-2xl border border-emerald-100/10 bg-black/20 p-3"><benefit.icon className="h-5 w-5 text-amber-300" /><p className="mt-2 text-xs font-black text-amber-100">{benefit.title}</p><p className="mt-1 text-[11px] leading-4 text-emerald-50/55">{benefit.text}</p></div>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3"><a href="#lobby-truco" className="inline-flex h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-[#12200d] transition hover:bg-amber-200">Jugar ahora <ArrowRight className="h-4 w-4" /></a><Link href="/truco/perfil#creditos" className="inline-flex h-12 items-center rounded-xl border border-amber-300/40 px-5 text-sm font-black text-amber-100 transition hover:bg-amber-300/10">Cargar créditos</Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-[38rem] overflow-hidden rounded-[1.75rem] border border-amber-300/25 bg-[#07120a] shadow-2xl shadow-black/50"><Image src="/truco/landing-bear-mascot.png" alt="Oso mascota de Lucky Bingo Bear con corona y cartas de Truco" width={1017} height={1017} priority className="w-full object-cover" /></div>
        </div>
      </section>

      <section id="beneficios" className="py-14 sm:py-18 2xl:py-20">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Por qué jugar</p><h2 className="mt-3 font-mono text-3xl font-black uppercase sm:text-4xl">Todo Truco, una sola cuenta</h2><p className="mt-3 text-sm text-emerald-50/60">La experiencia visual de mesas se integra con el login, wallet e historial existentes.</p></div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{benefits.map((benefit) => <article key={benefit.title} className="rounded-2xl border border-amber-300/18 bg-[#07180d]/85 p-5 transition hover:border-amber-300/45"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><benefit.icon className="h-5 w-5" /></span><h3 className="mt-4 text-sm font-black text-amber-100">{benefit.title}</h3><p className="mt-2 text-sm leading-5 text-emerald-50/60">{benefit.text}</p></article>)}</div>
      </section>

      <section id="como-jugar" className="py-6 sm:py-10 2xl:py-14">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Cómo jugar</p><h2 className="mt-3 font-mono text-3xl font-black uppercase sm:text-4xl">Es fácil, rápido y directo</h2></div>
        <ol className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step, index) => <li key={step.title} className="relative rounded-2xl border border-amber-300/18 bg-[#07180d]/85 p-5 text-center"><span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-emerald-400 text-xs font-black text-[#07200e]">{index + 1}</span><span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><step.icon className="h-6 w-6" /></span><h3 className="mt-4 text-sm font-black text-amber-100">{step.title}</h3><p className="mt-2 text-sm leading-5 text-emerald-50/60">{step.text}</p></li>)}</ol>
        <div className="relative mt-10 overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-r from-[#07180d] via-[#0b2513] to-[#47380c]/60"><div className="grid items-center gap-4 p-6 md:grid-cols-[180px_1fr_240px] md:p-8"><Image src="/truco/landing-bear-mascot.png" alt="" width={1017} height={1017} className="mx-auto hidden w-36 md:block" /><div className="text-center md:text-left"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Tu cuenta de siempre</p><h3 className="mt-2 font-mono text-3xl font-black uppercase">Créditos listos para Truco</h3><p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/65">Depositá o solicitá un retiro desde tu perfil. Las operaciones siguen el proceso de aprobación vigente y quedan registradas en tu historial.</p><Link href="/truco/perfil#creditos" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-[#12200d]">Ir a mi wallet <ArrowRight className="h-4 w-4" /></Link></div><Image src="/truco/landing-spanish-cards.png" alt="Cartas españolas para Truco" width={1027} height={1027} className="mx-auto hidden w-48 lg:block" /></div></div>
      </section>

      <section className="grid items-center gap-10 py-14 lg:grid-cols-2 2xl:py-20"><div><h2 className="font-mono text-4xl font-black uppercase leading-[.9] sm:text-5xl"><span className="block">Jugá Truco</span><span className="block text-amber-300">donde quieras</span></h2><p className="mt-5 max-w-md text-sm leading-6 text-emerald-50/65">La misma mesa se adapta a celular, tablet y escritorio. Tu cuenta y movimientos permanecen centralizados.</p><div className="mt-7 flex gap-3">{[{ icon: Smartphone, label: 'Android' }, { icon: Apple, label: 'iOS' }, { icon: Globe, label: 'Web' }].map((platform) => <div key={platform.label} className="flex flex-col items-center gap-2 rounded-2xl border border-amber-300/20 bg-[#07180d] px-5 py-4 text-amber-300"><platform.icon className="h-5 w-5" /><span className="text-[10px] font-black text-emerald-50/65">{platform.label}</span></div>)}</div><a href="#lobby-truco" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-[#12200d]">Elegir mesa <ArrowRight className="h-4 w-4" /></a></div><div className="relative mx-auto w-full max-w-xl"><div className="rounded-t-2xl border-4 border-[#34452d] bg-[#09170d] p-4"><div className="mb-3 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><div className="grid h-56 place-items-center rounded-[999px] border-4 border-amber-300/35 bg-[radial-gradient(ellipse_at_center,#196a35,#05200d)]"><Image src="/truco/landing-spanish-cards.png" alt="Mesa de Truco" width={1027} height={1027} className="w-44 rotate-[-8deg] drop-shadow-2xl" /></div></div><div className="h-4 rounded-b-xl bg-[#34452d]" /><div className="absolute -bottom-7 left-2 w-28 rounded-[1.4rem] border-4 border-[#34452d] bg-[#07180d] p-2 shadow-2xl sm:w-36"><p className="text-center text-[10px] font-black text-amber-100">Mesa de Truco</p><div className="mt-2 grid h-20 place-items-center rounded-full border-2 border-amber-300/30 bg-emerald-950"><Image src="/truco/landing-spanish-cards.png" alt="" width={1027} height={1027} className="w-16" /></div></div></div></section>

      <footer className="mt-4 border-t border-amber-300/20 py-10 text-emerald-50/60 sm:py-12"><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]"><div><p className="font-mono text-xl font-black uppercase text-amber-200">Truco LBB</p><p className="mt-2 max-w-xs text-sm leading-5">Mesas, partidas y créditos gestionados desde tu cuenta de Lucky Bingo Bear.</p></div><FooterColumn title="Juego" links={[['Lobby', '#lobby-truco'], ['Cómo jugar', '#como-jugar'], ['Ranking', '/truco/ranking']]} /><FooterColumn title="Cuenta" links={[['Mi perfil', '/truco/perfil'], ['Depositar o retirar', '/truco/perfil#creditos'], ['Iniciar sesión', '/auth/login?next=/truco']]} /><FooterColumn title="Ayuda" links={[['Reglas', '#lobby-truco'], ['Términos y condiciones', '/terminos-y-condiciones'], ['Privacidad', '/politicas-de-privacidad']]} /></div><p className="mt-10 border-t border-white/10 pt-5 text-center text-xs">© Lucky Bingo Bear. Todos los derechos reservados.</p></footer>
    </>
  )
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return <div><h3 className="text-xs font-black uppercase tracking-[.16em] text-amber-300">{title}</h3><ul className="mt-4 space-y-2.5">{links.map(([label, href]) => <li key={label}>{href.startsWith('#') ? <a href={href} className="text-sm transition hover:text-amber-200">{label}</a> : <Link href={href} className="text-sm transition hover:text-amber-200">{label}</Link>}</li>)}</ul></div>
}
