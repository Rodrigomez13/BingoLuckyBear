import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeQuestionMark,
  Bell,
  CircleDollarSign,
  Clock3,
  Gift,
  Home,
  Menu,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Swords,
  Trophy,
  UsersRound,
} from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { UserMenu } from '@/components/user-menu'
import { formatAccountBalance } from '@/lib/economy/format'
import type { PublicRoomSummary } from '@/lib/truco/server-authority'

type HomeRaffle = {
  name?: string | null
  amount?: string | null
  card_price?: number | null
  draw_date?: string | null
}

type PlayerContext = {
  alias: string
  email?: string | null
  balance: number
  avatarSrc?: string | null
  level: number
  xp: number
  nextLevelXp: number
}

interface LobbyOperativoHomeProps {
  activeRaffle: HomeRaffle | null
  nextRaffle: HomeRaffle | null
  jackpotPrize?: string | null
  rooms: PublicRoomSummary[]
  player: PlayerContext | null
}

const navItems = [
  { href: '/', label: 'Inicio', icon: Home, active: true },
  { href: '/truco', label: 'Truco', icon: Swords },
  { href: '/participar', label: 'Bingo', icon: Radio },
  { href: '/mi-cuenta', label: 'Mis cartones', icon: ShoppingCart },
  { href: '/truco/ranking', label: 'Ranking', icon: Trophy },
  { href: '/mi-cuenta/jugador', label: 'Saldo', icon: CircleDollarSign },
]

export function LobbyOperativoHome({
  activeRaffle,
  nextRaffle,
  jackpotPrize,
  rooms,
  player,
}: LobbyOperativoHomeProps) {
  const visibleRooms = rooms.slice(0, 4)
  const playerName = player?.alias || 'Jugador'
  const balance = player?.balance ?? 0
  const xpPercent = player ? Math.min(100, Math.round((player.xp / player.nextLevelXp) * 100)) : 0
  const raffle = activeRaffle ?? nextRaffle
  const raffleName = raffle?.name ?? 'Gran Bingo Lucky Bear'
  const roomCount = rooms.filter((room) => room.status === 'playing').length

  return (
    <main className="min-h-screen bg-[#04130c] text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(120deg,#03100a_0%,#052515_46%,#0a170f_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-amber-300/15 bg-black/20 p-4 lg:block">
          <Link href="/" className="mb-7 flex items-center gap-3">
            <BearLogo size={66} />
            <div>
              <p className="font-mono text-2xl font-black uppercase leading-6 text-amber-300">Lucky</p>
              <p className="font-mono text-2xl font-black uppercase leading-6 text-white">Bingo</p>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Bear</p>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-black uppercase tracking-wide transition ${
                  item.active
                    ? 'bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/30'
                    : 'text-emerald-50/80 hover:bg-white/[0.06] hover:text-amber-200'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-amber-300/25 bg-emerald-950/50 p-4">
            <Image
              src="/truco/golden-bear-mascot.png"
              alt="Lucky Bear"
              width={220}
              height={220}
              className="mx-auto h-32 w-32 object-contain"
            />
            <p className="mt-3 font-mono text-xl font-black uppercase text-amber-200">Jugá y ganá</p>
            <p className="mt-1 text-sm leading-5 text-emerald-50/75">Entrá a una mesa, comprá cartones o mirá partidas activas.</p>
            <Link href="/participar" className="mt-4 flex h-11 items-center justify-center rounded-md bg-amber-300 text-sm font-black uppercase text-zinc-950 hover:bg-amber-200">
              Ver sorteos
            </Link>
          </div>
        </aside>

        <section className="min-w-0 px-3 pb-8 pt-3 sm:px-5 lg:px-7">
          <header className="sticky top-3 z-40 mb-5 rounded-lg border border-amber-300/15 bg-[#031008]/88 px-3 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <BearLogo size={48} />
                </div>
                <PlayerBadge player={player} playerName={playerName} xpPercent={xpPercent} />
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link href="/mi-cuenta/jugador" className="hidden min-w-[13rem] rounded-lg border border-amber-300/20 bg-white/[0.04] px-4 py-2 sm:block">
                  <span className="block text-xs font-semibold text-emerald-50/75">Saldo disponible</span>
                  <span className="font-mono text-2xl font-black text-amber-100">{formatAccountBalance(balance)}</span>
                </Link>
                <Link href="/mi-cuenta/jugador" aria-label="Cargar saldo" className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-300 text-zinc-950 hover:bg-amber-200">
                  <Plus className="h-6 w-6" />
                </Link>
                <TopAction href="/mi-cuenta/premios" icon={<Gift className="h-6 w-6" />} label="Bonos" badge="3" />
                <div className="hidden sm:block">
                  <UserMenu />
                </div>
                <button type="button" aria-label="Abrir menu" className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-amber-100 lg:hidden">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0 space-y-5">
              <HeroLobby raffleName={raffleName} jackpotPrize={jackpotPrize} />

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Mesas activas</p>
                    <h2 className="font-mono text-2xl font-black text-white">Truco en vivo</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-200">
                      {roomCount || visibleRooms.length} mesas en juego
                    </span>
                    <Link href="/truco" className="flex h-10 items-center gap-2 rounded-md border border-amber-300/25 px-3 text-sm font-black text-amber-100 hover:bg-amber-300/10">
                      <RefreshCw className="h-4 w-4" />
                      Ver lobby
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {(visibleRooms.length ? visibleRooms : getFallbackRooms()).map((room, index) => (
                    <RoomCard key={room.roomCode} room={room} tone={index} />
                  ))}
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-mono text-xl font-black text-amber-200">Pendientes de rival</h2>
                    <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-zinc-950">3</span>
                  </div>
                  <div className="space-y-2">
                    {['Mesa amistosa', 'Mesa familiar', 'Mesa divertida'].map((name, index) => (
                      <div key={name} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <div>
                          <p className="font-bold text-white">{name}</p>
                          <p className="text-sm text-emerald-50/60">Esperando rival para empezar</p>
                        </div>
                        <p className="font-mono text-lg font-black text-lime-300">{formatAccountBalance([50000, 80000, 100000][index])}</p>
                        <Link href="/truco" className="flex h-10 items-center justify-center rounded-md bg-amber-300 px-4 text-sm font-black text-zinc-950 hover:bg-amber-200">
                          Invitar
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/truco" className="relative overflow-hidden rounded-lg border border-amber-300/20 bg-[#071d12] p-4">
                  <Image src="/truco/preview-lobby-home.webp" alt="Cartas Lucky Bear" width={320} height={190} className="mx-auto h-36 w-full object-contain opacity-80" />
                  <p className="mt-4 font-mono text-2xl font-black text-amber-200">Apostá desde afuera</p>
                  <p className="mt-1 text-sm leading-5 text-emerald-50/70">Elegí tu favorito durante la ventana inicial y jugá contra la casa.</p>
                  <span className="mt-4 inline-flex h-10 items-center rounded-md border border-lime-300/40 px-4 text-sm font-black uppercase text-lime-200">
                    Ver mesas
                  </span>
                </Link>
              </section>
            </div>

            <aside className="space-y-4">
              <QuickPanel raffle={raffle} jackpotPrize={jackpotPrize} />
              <WinnersPanel />
              <TrustPanel />
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function PlayerBadge({ player, playerName, xpPercent }: { player: PlayerContext | null; playerName: string; xpPercent: number }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-300/35 bg-amber-300/10">
        {player?.avatarSrc ? (
          <img src={player.avatarSrc} alt={playerName} className="h-full w-full object-cover" />
        ) : (
          <BearLogo size={52} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-lg font-black text-white">¡Hola, {playerName}!</p>
        <p className="truncate text-sm text-emerald-50/70">Bienvenido a Lucky Bingo Bear</p>
        <div className="mt-1 hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-lime-300/30 px-2 py-0.5 text-[10px] font-black text-lime-200">NIVEL {player?.level ?? 1}</span>
          <span className="h-2 w-28 overflow-hidden rounded-full bg-black/40">
            <span className="block h-full rounded-full bg-lime-400" style={{ width: `${xpPercent || 18}%` }} />
          </span>
          <span className="text-[11px] font-semibold text-emerald-50/70">{player?.xp ?? 900} / {player?.nextLevelXp ?? 5000} XP</span>
        </div>
      </div>
    </div>
  )
}

function TopAction({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <Link href={href} className="relative hidden h-14 min-w-16 flex-col items-center justify-center rounded-lg border border-amber-300/15 bg-white/[0.04] px-3 text-amber-100 hover:bg-white/[0.07] md:flex">
      {badge && <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-xs font-black text-zinc-950">{badge}</span>}
      {icon}
      <span className="mt-1 text-[10px] font-black uppercase">{label}</span>
    </Link>
  )
}

function HeroLobby({ raffleName, jackpotPrize }: { raffleName: string; jackpotPrize?: string | null }) {
  return (
    <section className="grid gap-4 rounded-lg border border-amber-300/15 bg-black/20 p-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-5">
      <div className="grid gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="rounded-lg bg-[#071d12] p-3">
          <Image src="/truco/golden-bear-mascot.png" alt="Lucky Bear" width={280} height={280} className="mx-auto h-48 w-full object-contain" priority />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Lobby general</p>
          <h1 className="mt-2 max-w-2xl font-mono text-4xl font-black leading-tight text-white sm:text-5xl">
            Jugá, ganá y seguí todo desde un solo lugar.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-50/75">
            Mesas de Truco, sorteos de Bingo, saldo y premios disponibles desde tu cuenta Lucky Bear.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/truco" className="flex h-12 items-center justify-center rounded-md bg-amber-300 px-6 font-black text-zinc-950 hover:bg-amber-200">
              Jugar ahora
            </Link>
            <Link href="/participar" className="flex h-12 items-center justify-center rounded-md border border-white/15 px-6 font-black text-white hover:border-amber-300/40 hover:text-amber-200">
              Comprar cartones
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-300/15 bg-[#071d12] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Sorteo destacado</p>
        <h2 className="mt-2 font-mono text-2xl font-black text-white">{raffleName}</h2>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-emerald-50/60">Premio principal</p>
          <p className="font-mono text-3xl font-black text-lime-300">{jackpotPrize ?? 'A confirmar'}</p>
        </div>
        <Link href="/en-vivo" className="mt-4 flex h-11 items-center justify-center rounded-md border border-amber-300/30 text-sm font-black uppercase text-amber-100 hover:bg-amber-300/10">
          Ver en vivo
        </Link>
      </div>
    </section>
  )
}

function RoomCard({ room, tone }: { room: PublicRoomSummary; tone: number }) {
  const tones = [
    'border-amber-300/65 bg-emerald-950/65',
    'border-red-300/45 bg-red-950/35',
    'border-lime-300/45 bg-green-950/50',
    'border-fuchsia-300/45 bg-purple-950/45',
  ]
  const isPlaying = room.status === 'playing'
  const guest = room.guest?.name ?? 'Buscando rival'
  const canBet = isPlaying && room.bettingOpen && room.sideBetMaxPoints > 0

  return (
    <article className={`rounded-lg border p-4 shadow-xl shadow-black/25 ${tones[tone % tones.length]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-mono text-lg font-black uppercase text-amber-100">
            <Trophy className="h-5 w-5 text-amber-300" />
            Mesa {tone + 1}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{room.host.name} vs {guest}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${isPlaying ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-300 text-zinc-950'}`}>
          {isPlaying ? 'Jugando' : 'Disponible'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="Partida" value={`A ${room.target}`} />
        <MiniMetric label="Pozo" value={formatAccountBalance(room.prizePoolPoints)} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-emerald-50/65">
          {canBet ? `Apuestas hasta ${formatAccountBalance(room.sideBetMaxPoints)}` : isPlaying ? 'Mesa en curso' : 'Entrá como rival'}
        </p>
        <Link href="/truco" className={`flex h-11 min-w-28 items-center justify-center rounded-md px-3 text-sm font-black uppercase ${
          canBet ? 'bg-amber-300 text-zinc-950 hover:bg-amber-200' : 'border border-amber-300/25 text-amber-100 hover:bg-amber-300/10'
        }`}>
          {canBet ? 'Apostar' : room.canJoin ? 'Entrar' : 'Ver'}
        </Link>
      </div>
    </article>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-center">
      <p className="font-mono text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-50/55">{label}</p>
    </div>
  )
}

function QuickPanel({ raffle, jackpotPrize }: { raffle: HomeRaffle | null; jackpotPrize?: string | null }) {
  return (
    <section className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xl font-black text-amber-200">Bingo activo</h2>
        <BadgeQuestionMark className="h-5 w-5 text-amber-300" />
      </div>
      <p className="mt-3 font-bold text-white">{raffle?.name ?? 'Próximo sorteo Lucky Bear'}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="Premio" value={jackpotPrize ?? 'Pronto'} />
        <MiniMetric label="Cartón" value={raffle?.card_price ? formatAccountBalance(raffle.card_price) : 'A definir'} />
      </div>
      <Link href="/participar" className="mt-4 flex h-12 items-center justify-center rounded-md bg-amber-300 font-black text-zinc-950 hover:bg-amber-200">
        Comprar cartones
      </Link>
    </section>
  )
}

function WinnersPanel() {
  return (
    <section className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-300" />
        <h2 className="font-mono text-xl font-black text-amber-200">Ganadores recientes</h2>
      </div>
      {['María G.', 'Carlos M.', 'Sofía R.'].map((name, index) => (
        <div key={name} className="flex items-center justify-between border-t border-white/10 py-3 first:border-t-0">
          <div>
            <p className="font-bold text-white">{name}</p>
            <p className="text-xs text-emerald-50/55">{['Bingo suerte', 'Truco real', 'Mesa dorada'][index]}</p>
          </div>
          <p className="font-mono font-black text-lime-300">{formatAccountBalance([300000, 200000, 150000][index])}</p>
        </div>
      ))}
    </section>
  )
}

function TrustPanel() {
  const items = [
    { icon: ShieldCheck, title: 'Juego limpio', text: 'Acciones validadas' },
    { icon: Bell, title: 'Avisos claros', text: 'Estados en tiempo real' },
    { icon: UsersRound, title: 'Comunidad', text: 'Mesas y sorteos activos' },
    { icon: Clock3, title: 'Rápido', text: 'Entrá y jugá' },
  ]

  return (
    <section className="grid gap-2 rounded-lg border border-amber-300/15 bg-black/20 p-4 sm:grid-cols-2 xl:grid-cols-1">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 rounded-md bg-white/[0.035] p-3">
          <item.icon className="h-5 w-5 text-lime-300" />
          <div>
            <p className="font-bold text-white">{item.title}</p>
            <p className="text-xs text-emerald-50/60">{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function getFallbackRooms(): PublicRoomSummary[] {
  return [
    makeFallbackRoom('Mesa dorada', 'Sofía R.', 30, 150000, true),
    makeFallbackRoom('Mesa real', 'Carlos M.', 30, 200000, true),
    makeFallbackRoom('Mesa suerte', 'María G.', 15, 100000, false),
    makeFallbackRoom('Mesa premium', 'Diego A.', 30, 300000, false),
  ]
}

function makeFallbackRoom(roomCode: string, hostName: string, target: 15 | 30, prize: number, playing: boolean): PublicRoomSummary {
  return {
    roomCode,
    target,
    status: playing ? 'playing' : 'waiting',
    scores: { player: 0, opponent: 0 },
    currentTrick: 0,
    hand: 'player',
    version: 1,
    entryFeePoints: Math.floor(prize / 2),
    prizePoolPoints: prize,
    houseFeeRate: 0.1,
    houseFeePoints: Math.floor(prize * 0.1),
    prizeAwardedPoints: Math.floor(prize * 0.9),
    ranked: true,
    rules: { florEnabled: true, scoreStyle: 'numeric' },
    host: { name: hostName, avatarKey: 'golden_bear' },
    guest: playing ? { name: 'Rival', avatarKey: 'golden_bear' } : null,
    bettingOpen: playing,
    sideBetMaxPoints: playing ? Math.floor(prize * 0.25) : 0,
    canJoin: !playing,
  }
}
