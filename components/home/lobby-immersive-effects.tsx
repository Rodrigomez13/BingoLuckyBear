import { Gamepad2, Grid3X3, Sparkles, Ticket, Trophy, WalletCards } from 'lucide-react'

const orbitBadges = [
  { label: 'BINGO', className: 'left-[5%] top-[17%] border-amber-300/30 text-amber-100 delay-0' },
  { label: 'TRUCO', className: 'right-[7%] top-[23%] border-emerald-300/30 text-emerald-100 [animation-delay:650ms]' },
  { label: 'SLOTS', className: 'left-[9%] bottom-[24%] border-orange-300/30 text-orange-100 [animation-delay:1200ms]' },
  { label: 'ARCADE', className: 'right-[9%] bottom-[28%] border-lime-300/30 text-lime-100 [animation-delay:1800ms]' },
]

const gameConstellation = [
  { icon: Ticket, label: 'Bingo', x: '14%', y: '36%', color: 'text-amber-200' },
  { icon: Gamepad2, label: 'Truco', x: '78%', y: '40%', color: 'text-emerald-200' },
  { icon: Trophy, label: 'Golden', x: '61%', y: '68%', color: 'text-orange-200' },
  { icon: Grid3X3, label: 'Lobby', x: '34%', y: '66%', color: 'text-lime-200' },
  { icon: WalletCards, label: 'Wallet', x: '48%', y: '22%', color: 'text-sky-200' },
]

export function LobbyImmersiveEffects() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden mix-blend-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,.22),transparent_23rem),radial-gradient(circle_at_13%_26%,rgba(16,185,129,.16),transparent_20rem),radial-gradient(circle_at_86%_35%,rgba(245,158,11,.16),transparent_22rem),radial-gradient(circle_at_50%_110%,rgba(132,204,22,.13),transparent_24rem)] opacity-70" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,transparent_0%,rgba(255,255,255,.65)_50%,transparent_100%)] [background-size:240px_100%]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-300/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-lime-400/12 to-transparent" />

      <div className="absolute left-1/2 top-[42%] hidden aspect-square w-[min(58vw,46rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/12 md:block">
        <div className="absolute inset-[13%] rounded-full border border-emerald-300/10" />
        <div className="absolute inset-[27%] rounded-full border border-lime-300/10" />
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/80 shadow-[0_0_70px_rgba(250,204,21,.65)]" />
        {gameConstellation.map((item) => {
          const Icon = item.icon
          return (
            <span
              key={item.label}
              className={`absolute grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-black/35 shadow-[0_0_36px_rgba(255,255,255,.09)] backdrop-blur-sm ${item.color}`}
              style={{ left: item.x, top: item.y }}
            >
              <Icon className="h-6 w-6" />
              <span className="absolute -bottom-5 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.18em] text-white/55">{item.label}</span>
            </span>
          )
        })}
      </div>

      {orbitBadges.map((badge) => (
        <span
          key={badge.label}
          className={`absolute hidden rounded-full border bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] shadow-2xl shadow-black/30 backdrop-blur-sm animate-bounce md:inline-flex ${badge.className}`}
        >
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          {badge.label}
        </span>
      ))}

      <div className="absolute left-1/2 top-[8%] h-40 w-[44rem] -translate-x-1/2 rounded-full bg-amber-300/8 blur-3xl animate-pulse" />
      <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl animate-pulse" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,.06)_50%,transparent_51%)] bg-[length:100%_6px] opacity-[0.08]" />
    </div>
  )
}
