'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeQuestionMark,
  Bell,
  CircleDollarSign,
  Clock3,
  Crown,
  Filter,
  Gift,
  Home,
  Menu,
  Plus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Star,
  ShoppingCart,
  Swords,
  Trophy,
  UsersRound,
  X,
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
  { href: '/mi-cuenta', label: 'Mis mesas', icon: ShoppingCart },
  { href: '/truco', label: 'Torneos', icon: Trophy },
  { href: '/truco/ranking', label: 'Ranking', icon: Trophy },
  { href: '/mi-cuenta/jugador', label: 'Saldo', icon: CircleDollarSign },
  { href: '/mi-cuenta/premios', label: 'Bonos', icon: Gift },
]

export function LobbyOperativoHome({
  activeRaffle,
  nextRaffle,
  jackpotPrize,
  rooms,
  player,
}: LobbyOperativoHomeProps) {
  const [navOpen, setNavOpen] = useState(false)
  const visibleRooms = rooms.slice(0, 4)
  const playerName = player?.alias || 'Jugador'
  const balance = player?.balance ?? 0
  const xpPercent = player ? Math.min(100, Math.round((player.xp / player.nextLevelXp) * 100)) : 0
  const raffle = activeRaffle ?? nextRaffle
  const raffleName = raffle?.name ?? 'Gran Bingo Lucky Bear'
  const roomCount = rooms.filter((room) => room.status === 'playing').length
  const activeRows = visibleRooms.length ? visibleRooms : getFallbackRooms()

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04130c] pb-24 text-white md:pb-0">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(120deg,#03100a_0%,#052515_46%,#0a170f_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.09] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:42px_42px]" />
      <HomeSideMenu open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="mx-auto min-h-screen max-w-[1680px]">
        <section className="min-w-0 overflow-x-hidden px-3 pb-8 pt-3 sm:px-5 lg:px-7">
          <header className="sticky top-3 z-40 mb-5 rounded-lg border border-amber-300/15 bg-[#031008]/88 px-3 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  data-sound="ui.open"
                  onClick={() => setNavOpen(true)}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-amber-100 transition hover:border-amber-300/30 hover:bg-white/[0.07] sm:px-3"
                >
                  <Menu className="h-5 w-5" />
                  <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">Menú</span>
                </button>
                <div className="hidden sm:block lg:hidden">
                  <BearLogo size={48} />
                </div>
                <PlayerBadge player={player} playerName={playerName} xpPercent={xpPercent} />
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link href="/mi-cuenta/jugador" className="hidden min-w-[12rem] rounded-lg border border-amber-300/20 bg-white/[0.04] px-3 py-1.5 sm:block">
                  <span className="block text-xs font-semibold text-emerald-50/75">Saldo disponible</span>
                  <span className="font-mono text-xl font-black text-amber-100">{formatAccountBalance(balance)}</span>
                </Link>
                <Link href="/mi-cuenta/jugador" aria-label="Cargar saldo" data-sound="wallet.approved" className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-300 text-zinc-950 hover:bg-amber-200">
                  <Plus className="h-5 w-5" />
                </Link>
                <TopAction href="/mi-cuenta/premios" icon={<Gift className="h-5 w-5" />} label="Bonos" badge="3" />
                <div className="hidden sm:block">
                  <UserMenu />
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-5">
              <HeroLobby raffleName={raffleName} jackpotPrize={jackpotPrize} />
              <HowItWorks />

              <ActiveTablesPanel rooms={activeRows} roomCount={roomCount || activeRows.length} />
              <TrustStrip />
            </div>

            <aside className="grid gap-4 md:grid-cols-3 xl:block xl:space-y-4">
              <TournamentsPanel />
              <QuickPanel raffle={raffle} jackpotPrize={jackpotPrize} />
              <WinnersPanel />
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function HomeSideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menu"
          data-sound="ui.close"
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        />
      )}
      <aside
        className={`fixed bottom-2 left-2 top-2 z-[80] w-[min(18.5rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-amber-300/20 bg-[#031008]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-transform duration-300 sm:left-3 sm:top-3 sm:bottom-3 ${
          open ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
        }`}
        aria-hidden={!open}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <BearLogo size={50} />
            <div>
              <p className="font-mono text-base font-black uppercase leading-4 text-amber-300">Lucky</p>
              <p className="font-mono text-base font-black uppercase leading-4 text-white">Bingo</p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Bear</p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Cerrar menu"
            data-sound="ui.close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-amber-100 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              data-sound="ui.click"
              onClick={onClose}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-xs font-black uppercase tracking-wide transition ${
                item.active
                  ? 'bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/30'
                  : 'text-emerald-50/80 hover:bg-white/[0.06] hover:text-amber-200'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-4 rounded-lg border border-amber-300/25 bg-emerald-950/50 p-3">
          <Image
            src="/truco/golden-bear-mascot.webp"
            alt="Lucky Bear"
            width={220}
            height={220}
            className="mx-auto h-24 w-24 object-contain"
          />
          <p className="mt-2 font-mono text-lg font-black uppercase text-amber-200">Invitá amigos</p>
          <p className="mt-1 text-xs leading-4 text-emerald-50/75">Compartí Lucky Bear y sumá beneficios para jugar.</p>
          <Link
            href="/participar"
            data-sound="bingo.purchase"
            onClick={onClose}
            className="mt-3 flex h-9 items-center justify-center rounded-md bg-amber-300 text-xs font-black uppercase text-zinc-950 hover:bg-amber-200"
          >
            Ver sorteos
          </Link>
        </div>
      </aside>
    </>
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
    <Link href={href} className="relative hidden h-12 min-w-14 flex-col items-center justify-center rounded-md border border-amber-300/15 bg-white/[0.04] px-2.5 text-amber-100 hover:bg-white/[0.07] md:flex">
      {badge && <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-xs font-black text-zinc-950">{badge}</span>}
      {icon}
      <span className="mt-1 text-[10px] font-black uppercase">{label}</span>
    </Link>
  )
}

function HeroLobby({ raffleName, jackpotPrize }: { raffleName: string; jackpotPrize?: string | null }) {
  return (
    <section className="overflow-hidden rounded-lg border border-amber-300/15 bg-[radial-gradient(circle_at_12%_18%,rgba(250,204,21,.17),transparent_25%),linear-gradient(135deg,rgba(7,29,18,.94),rgba(2,8,5,.7))] p-4 lg:p-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(17rem,0.86fr)_minmax(0,1fr)] xl:items-center">
        <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-amber-300/10 bg-emerald-950/45 p-4">
          <span className="absolute left-5 top-5 h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_26px_rgba(251,191,36,.8)]" />
          <span className="absolute bottom-8 right-8 h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_20px_rgba(190,242,100,.75)]" />
          <Image src="/truco/golden-bear-mascot.webp" alt="Lucky Bear" width={320} height={480} className="relative z-10 h-56 w-full object-contain drop-shadow-2xl xl:h-72" priority />
        </div>
        <div className="flex min-w-0 flex-col justify-center py-1">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Lobby general</p>
          <h1 className="mt-2 max-w-[18rem] break-words font-mono text-[1.8rem] font-black uppercase leading-tight text-white sm:max-w-4xl sm:text-4xl xl:text-5xl">
            Jugá, ganá y disfrutá
          </h1>
          <p className="mt-3 max-w-[19rem] break-words text-base font-bold leading-7 text-amber-100 sm:max-w-2xl sm:text-lg">
            Mesas todos los días con premios disponibles desde tu cuenta Lucky Bear.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-50/55">Sorteo destacado</p>
              <p className="mt-1 truncate font-mono text-xl font-black text-white">{raffleName}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-50/55">Premio principal</p>
              <p className="mt-1 truncate font-mono text-xl font-black text-lime-300">{jackpotPrize ?? 'A confirmar'}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/truco" data-sound="truco.play" className="flex h-12 items-center justify-center rounded-md bg-amber-300 px-6 font-black text-zinc-950 hover:bg-amber-200">
              Jugar ahora
            </Link>
            <Link href="/participar" data-sound="bingo.purchase" className="flex h-12 items-center justify-center rounded-md border border-white/15 px-6 font-black text-white hover:border-amber-300/40 hover:text-amber-200">
              Comprar cartones
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Swords, title: 'Elegí tu juego', text: 'Truco o Bingo' },
    { icon: UsersRound, title: 'Entrá a una mesa', text: 'o creá la tuya' },
    { icon: Star, title: 'Jugá y ganá', text: 'premios disponibles' },
    { icon: CircleDollarSign, title: 'Usá tu saldo', text: 'desde una cuenta' },
  ]

  return (
    <section className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
      <p className="mb-4 font-mono text-lg font-black uppercase text-amber-200">Cómo funciona</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-lg border border-white/10 bg-white/[0.035] p-4">
            {index < steps.length - 1 && <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-amber-300/40 xl:block" />}
            <step.icon className="mb-3 h-7 w-7 text-amber-300" />
            <p className="font-black text-amber-100">{step.title}</p>
            <p className="mt-1 text-sm text-emerald-50/65">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ActiveTablesPanel({ rooms, roomCount }: { rooms: PublicRoomSummary[]; roomCount: number }) {
  const bingoRows = [
    { name: 'Bingo Premium', detail: '90 bolas', amount: 500000, action: 'Ver' },
    { name: 'Bingo Suerte', detail: '75 bolas', amount: 200000, action: 'Ver' },
  ]

  return (
    <section className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Mesas activas</p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-2xl font-black text-white">Lobby en vivo</h2>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold text-lime-200">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              {roomCount} mesas en juego
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="hidden h-10 items-center gap-2 rounded-md border border-amber-300/25 px-3 text-sm font-black text-amber-100 md:flex">
            Todas
          </button>
          <Link href="/truco" className="flex h-10 items-center gap-2 rounded-md border border-amber-300/25 px-3 text-sm font-black text-amber-100 hover:bg-amber-300/10">
            <Filter className="h-4 w-4" />
            Filtrar
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-amber-300/15">
        <div className="hidden grid-cols-[minmax(0,1.25fr)_0.8fr_0.7fr_0.8fr_6rem] border-b border-white/10 bg-emerald-950/45 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-50/55 md:grid">
          <span>Mesa</span>
          <span>Juego</span>
          <span>Rival</span>
          <span>Pozo</span>
          <span className="text-right">Ver</span>
        </div>
        <div className="divide-y divide-white/10">
          {rooms.map((room, index) => (
            <ActiveTableRow key={room.roomCode} room={room} index={index} />
          ))}
          {bingoRows.map((row, index) => (
            <div key={row.name} className="grid gap-3 bg-emerald-950/20 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.25fr)_0.8fr_0.7fr_0.8fr_6rem] md:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/40 bg-black/35 font-mono font-black text-amber-200">{index ? 25 : 10}</span>
                <div>
                  <p className="font-black text-white">{row.name}</p>
                  <p className="text-xs text-emerald-50/60">{row.detail}</p>
                </div>
              </div>
              <p className="font-bold text-emerald-50/80">Bingo</p>
              <p className="font-bold text-emerald-50/75">{index ? '56' : '78'} cartones</p>
              <p className="font-mono font-black text-amber-100">{formatAccountBalance(row.amount)}</p>
              <Link href="/participar" className="flex h-10 items-center justify-center rounded-md bg-amber-300 px-4 font-black uppercase text-zinc-950 hover:bg-amber-200">
                {row.action}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Link href="/truco" className="mx-auto mt-4 flex h-11 max-w-xs items-center justify-center rounded-md border border-amber-300/30 text-sm font-black uppercase text-amber-100 hover:bg-amber-300/10">
        Ver todas las mesas
      </Link>
    </section>
  )
}

function ActiveTableRow({ room, index }: { room: PublicRoomSummary; index: number }) {
  const isPlaying = room.status === 'playing'
  const guest = room.guest?.name ?? 'Buscando rival'
  const canBet = isPlaying && room.bettingOpen && room.sideBetMaxPoints > 0

  return (
    <div className="grid gap-3 bg-emerald-950/20 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.25fr)_0.8fr_0.7fr_0.8fr_6rem] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/35 bg-black/35">
          <BearLogo size={34} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-black text-white">{room.host.name} vs {guest}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${isPlaying ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-300 text-zinc-950'}`}>
              {isPlaying ? 'Jugando' : 'Disponible'}
            </span>
            <span className="text-xs text-emerald-50/55">Mesa {index + 1}</span>
          </div>
        </div>
      </div>
      <p className="font-bold text-emerald-50/80">Truco</p>
      <p className="font-bold text-emerald-50/75">A {room.target}</p>
      <p className="font-mono font-black text-amber-100">{formatAccountBalance(room.prizePoolPoints)}</p>
      <Link href="/truco" className={`flex h-10 items-center justify-center rounded-md px-4 font-black uppercase ${
        canBet ? 'bg-amber-300 text-zinc-950 hover:bg-amber-200' : 'border border-amber-300/25 text-amber-100 hover:bg-amber-300/10'
      }`}>
        {canBet ? 'Apostar' : 'Ver'}
      </Link>
    </div>
  )
}

function TournamentsPanel() {
  const tournaments = [
    { title: 'Torneo de Truco', subtitle: 'Copa de Oro', prize: 10000000, accent: 'from-amber-500/15 to-amber-950/20' },
    { title: 'Bingo Millonario', subtitle: 'Bolsa acumulada', prize: 5000000, accent: 'from-fuchsia-500/15 to-fuchsia-950/20' },
  ]

  return (
    <section className="rounded-lg border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-lg font-black uppercase text-amber-200">Torneos destacados</h2>
        <Link href="/truco" className="text-xs font-black text-amber-300">Ver todos</Link>
      </div>
      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <Link key={tournament.title} href="/truco" className={`block rounded-lg border border-amber-300/20 bg-gradient-to-br ${tournament.accent} p-3 hover:border-amber-300/45`}>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-black/25">
                <Crown className="h-6 w-6 text-amber-300" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-amber-300">{tournament.title}</p>
                <p className="text-sm font-bold text-white">{tournament.subtitle}</p>
                <p className="mt-1 font-mono text-lg font-black text-amber-100">{formatAccountBalance(tournament.prize)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, title: 'Juego limpio', text: 'Sistema anti-trampas' },
    { icon: Bell, title: 'Avisos claros', text: 'Estados en tiempo real' },
    { icon: Clock3, title: 'Atención rápida', text: 'Soporte disponible' },
    { icon: UsersRound, title: 'Comunidad', text: 'Mesas y sorteos activos' },
  ]

  return (
    <section className="grid gap-3 rounded-lg border border-amber-300/15 bg-black/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 rounded-lg bg-white/[0.035] p-3">
          <item.icon className="h-7 w-7 text-amber-300" />
          <div>
            <p className="font-black text-amber-100">{item.title}</p>
            <p className="text-xs text-emerald-50/60">{item.text}</p>
          </div>
        </div>
      ))}
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
      <Link href="/participar" data-sound="bingo.purchase" className="mt-4 flex h-12 items-center justify-center rounded-md bg-amber-300 font-black text-zinc-950 hover:bg-amber-200">
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
