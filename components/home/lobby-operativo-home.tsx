'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  Activity,
  Bot,
  Crown,
  Gamepad2,
  Grid3X3,
  Home,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Ticket,
  Trophy,
  UserCircle2,
  X,
  Zap,
} from 'lucide-react'
import { BearLogo } from '@/components/bear-logo'
import { GameCatalogCard } from '@/components/games/game-catalog-card'
import { UserMenu } from '@/components/user-menu'
import { CONTACT_LINKS } from '@/lib/contact'
import { ACTIVE_PLATFORM_GAMES, type PlatformGameId } from '@/lib/games/registry'
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

type IconType = ComponentType<{ className?: string }>
type HomeNavItem = { href: string; label: string; icon: IconType; active?: boolean }

const studioPillars = [
  { icon: ShieldCheck, title: 'Rondas validadas', text: 'Cada juego con créditos debe resolver saldo y resultado desde backend.' },
  { icon: Zap, title: 'Juegos nativos', text: 'Golden Bear, Truco y arcades propios como motivo central de visita.' },
  { icon: Activity, title: 'Lobby vivo', text: 'Mesas, torneos, últimos eventos y destacados en tiempo real.' },
  { icon: Star, title: 'Retención', text: 'Misiones, niveles, logros y torneos semanales para volver a jugar.' },
]

const gameIcons: Record<PlatformGameId, IconType> = {
  bingo: Ticket,
  truco: Swords,
  truco_anotador: Swords,
  golden_bear: Trophy,
  viborita: Gamepad2,
  future_games: Bot,
}

const navItems: HomeNavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, active: true },
  { href: '/juegos', label: 'Juegos', icon: Grid3X3 },
  ...ACTIVE_PLATFORM_GAMES.map((game) => ({ href: game.href, label: game.shortName, icon: gameIcons[game.id] })),
]

const publicNavItems: HomeNavItem[] = [
  { href: '/', label: 'Inicio', icon: Home, active: true },
  { href: '/juegos', label: 'Juegos', icon: Grid3X3 },
  { href: '/participar', label: 'Promociones', icon: Ticket },
  { href: CONTACT_LINKS.whatsappUrl || '/terminos-y-condiciones', label: 'Ayuda', icon: UserCircle2 },
]

const playerNavItems: HomeNavItem[] = [
  ...navItems,
  { href: '/mi-cuenta/jugador', label: 'Perfil', icon: UserCircle2 },
  { href: '/ganadores', label: 'Historial', icon: Crown },
]

export function LobbyOperativoHome({
  activeRaffle,
  nextRaffle,
  jackpotPrize,
  rooms,
  player,
}: LobbyOperativoHomeProps) {
  const [navOpen, setNavOpen] = useState(false)
  const playerName = player?.alias || 'Jugador'
  const raffle = activeRaffle ?? nextRaffle
  const roomRows = rooms.slice(0, 4).length ? rooms.slice(0, 4) : getFallbackRooms()

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#04130c] pb-24 text-white md:pb-0">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,.16),transparent_28rem),linear-gradient(120deg,#020806_0%,#052515_45%,#071109_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.075] [background-image:linear-gradient(rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:44px_44px]" />
      <HomeSideMenu open={navOpen} onClose={() => setNavOpen(false)} items={player ? playerNavItems : publicNavItems} />

      <div className="mx-auto min-h-screen max-w-[1680px]">
        <section className="min-w-0 overflow-x-hidden px-3 pb-8 pt-3 sm:px-5 lg:px-7">
          <header className="sticky top-3 z-40 mb-5 rounded-2xl border border-amber-300/15 bg-[#031008]/88 px-3 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  data-sound="ui.open"
                  onClick={() => setNavOpen(true)}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-amber-100 transition hover:border-amber-300/30 hover:bg-white/[0.07] sm:px-3"
                >
                  <Menu className="h-5 w-5" />
                  <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">Menú</span>
                </button>
                <PlayerBadge player={player} playerName={playerName} />
              </div>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <TopAction href="/juegos" icon={<Grid3X3 className="h-5 w-5" />} label="Juegos" />
                <TopAction href="/juegos/golden-bear" icon={<Trophy className="h-5 w-5" />} label="Originals" />
                <div className="hidden sm:block">
                  <UserMenu />
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-5">
              <HeroLobby jackpotPrize={jackpotPrize} />
              <GamesPlatformGrid />
              <OriginalsShowcase />
              <LiveActivityPanel rooms={roomRows} raffleName={raffle?.name ?? 'Bingo LBB'} jackpotPrize={jackpotPrize} />
            </div>

            <aside className="grid gap-4 md:grid-cols-3 xl:block xl:space-y-4">
              <FeaturedOriginalPanel />
              <TournamentsPanel />
              <StudioRoadmapPanel />
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function HomeSideMenu({ open, onClose, items }: { open: boolean; onClose: () => void; items: HomeNavItem[] }) {
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
        className={`fixed bottom-2 left-2 top-2 z-[80] w-[min(18.5rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-amber-300/20 bg-[#031008]/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-transform duration-300 sm:left-3 sm:top-3 sm:bottom-3 ${
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
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Bear Games</p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Cerrar menu"
            data-sound="ui.close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-100 hover:bg-white/[0.07]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-0.5">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              data-sound="ui.click"
              onClick={onClose}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-black uppercase tracking-wide transition ${
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

        <div className="mt-4 rounded-2xl border border-amber-300/25 bg-emerald-950/50 p-3">
          <Image
            src="/lbb/visuals/slot-game.webp"
            alt="Lucky Bear"
            width={220}
            height={220}
            className="h-28 w-full rounded-xl object-cover"
          />
          <p className="mt-2 font-mono text-lg font-black uppercase text-amber-200">LBB Originals</p>
          <p className="mt-1 text-xs leading-4 text-emerald-50/75">Slots, cartas y arcade listos para jugar.</p>
          <Link
            href="/juegos"
            data-sound="ui.click"
            onClick={onClose}
            className="mt-3 flex h-9 items-center justify-center rounded-xl bg-amber-300 text-xs font-black uppercase text-zinc-950 hover:bg-amber-200"
          >
            Explorar juegos
          </Link>
        </div>
      </aside>
    </>
  )
}

function PlayerBadge({ player, playerName }: { player: PlayerContext | null; playerName: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-300/35 bg-amber-300/10">
        {player?.avatarSrc ? (
          <img src={player.avatarSrc} alt={playerName} className="h-full w-full object-cover" />
        ) : (
          <BearLogo size={52} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-lg font-black text-white">LuckyBingoBear</p>
        <p className="truncate text-sm text-emerald-50/70">Juegos nativos, torneos y experiencias LBB</p>
      </div>
    </div>
  )
}

function TopAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="relative hidden h-12 min-w-14 flex-col items-center justify-center rounded-xl border border-amber-300/15 bg-white/[0.04] px-2.5 text-amber-100 hover:bg-white/[0.07] md:flex">
      {icon}
      <span className="mt-1 text-[10px] font-black uppercase">{label}</span>
    </Link>
  )
}

function HeroLobby({ jackpotPrize }: { jackpotPrize?: string | null }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-300/18 bg-[radial-gradient(circle_at_14%_18%,rgba(250,204,21,.20),transparent_24%),linear-gradient(135deg,rgba(7,29,18,.96),rgba(2,8,5,.78))] p-4 shadow-2xl shadow-black/35 lg:p-5">
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1fr)] xl:items-center">
        <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-[1.5rem] border border-amber-300/20 bg-emerald-950/45 p-4 shadow-2xl shadow-black/35 xl:min-h-[30rem]">
          <Image
            src="/lbb/visuals/lbb-universe-hero.webp"
            alt="Lucky Bingo Bear: universo de juegos"
            width={1600}
            height={900}
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(250,204,21,.10),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.48)),linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,.02),rgba(0,0,0,.35))]" />
          <span className="absolute left-5 top-5 rounded-full border border-amber-300/25 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">LBB Original</span>
          <span className="absolute bottom-5 right-5 rounded-full border border-lime-300/25 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">Cuenta LBB</span>
        </div>
        <div className="relative flex min-w-0 flex-col justify-center py-1">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">LuckyBingoBear Games</p>
          <h1 className="mt-2 max-w-4xl break-words font-mono text-[2.35rem] font-black uppercase leading-[0.94] text-white sm:text-5xl xl:text-6xl">
            Tu plataforma de juegos, una sola cuenta
          </h1>
          <p className="mt-4 max-w-2xl break-words text-base font-semibold leading-7 text-amber-100/90 sm:text-lg">
            Golden Bear, Truco, Bingo y arcade con saldo general, lobby directo y una estética dorada pensada para entrar y jugar.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['LBB Originals', 'Una cuenta', 'Torneos', 'Misiones', 'Ranking'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-50/80">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/juegos/golden-bear" data-sound="slot.spin" className="flex h-12 items-center justify-center rounded-xl bg-amber-300 px-6 font-black text-zinc-950 hover:bg-amber-200">
              Jugar Golden Bear
            </Link>
            <Link href="/juegos" data-sound="ui.click" className="flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 font-black text-white hover:border-amber-300/40 hover:text-amber-200">
              Elegir juego
            </Link>
          </div>
          {jackpotPrize && <p className="mt-4 text-xs font-semibold text-emerald-50/45">Bingo destacado hoy: premio principal {jackpotPrize}</p>}
        </div>
      </div>
    </section>
  )
}

function GamesPlatformGrid() {
  return (
    <section id="juegos" className="rounded-[2rem] border border-amber-300/15 bg-black/20 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Elegí una experiencia</p>
          <h2 className="font-mono text-2xl font-black uppercase text-white">Juegos nativos y destacados</h2>
        </div>
        <Link href="/juegos" className="rounded-xl border border-amber-300/25 px-3 py-2 text-xs font-black uppercase text-amber-100 hover:bg-amber-300/10">
          Catálogo completo
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIVE_PLATFORM_GAMES.map((game) => (
          <GameCatalogCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}

function OriginalsShowcase() {
  return (
    <section className="rounded-[2rem] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(250,204,21,.10),rgba(16,185,129,.05),rgba(0,0,0,.22))] p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Juego destacado</p>
          <h2 className="mt-2 font-mono text-2xl font-black uppercase text-white">Golden Bear como primer LBB Original</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-50/70">
            Slot insignia de LuckyBingoBear con cascadas, bonus dorados y una experiencia pensada para jugar rápido desde cualquier pantalla.
          </p>
          <Link href="/juegos/golden-bear" className="mt-4 inline-flex h-11 items-center rounded-xl bg-amber-300 px-5 text-sm font-black text-zinc-950 hover:bg-amber-200">
            Entrar al slot
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {studioPillars.map((item) => (
            <div key={item.title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
              <item.icon className="mb-3 h-6 w-6 text-amber-300" />
              <p className="font-black text-amber-100">{item.title}</p>
              <p className="mt-1 text-sm leading-5 text-emerald-50/65">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LiveActivityPanel({ rooms, raffleName, jackpotPrize }: { rooms: PublicRoomSummary[]; raffleName: string; jackpotPrize?: string | null }) {
  return (
    <section className="rounded-[2rem] border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Actividad</p>
          <h2 className="font-mono text-2xl font-black text-white">Qué se está jugando</h2>
        </div>
        <Link href="/juegos" className="rounded-xl border border-amber-300/25 px-3 py-2 text-xs font-black uppercase text-amber-100 hover:bg-amber-300/10">
          Entrar al lobby
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-hidden rounded-[1.35rem] border border-amber-300/15">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_0.75fr_0.75fr_5.5rem] border-b border-white/10 bg-emerald-950/45 px-4 py-3 text-xs font-black uppercase tracking-wide text-emerald-50/55 md:grid">
            <span>Mesa</span>
            <span>Juego</span>
            <span>Estado</span>
            <span className="text-right">Ir</span>
          </div>
          <div className="divide-y divide-white/10">
            {rooms.map((room, index) => (
              <ActiveTableRow key={room.roomCode} room={room} index={index} />
            ))}
          </div>
        </div>
        <Link href="/participar" className="rounded-[1.35rem] border border-amber-300/20 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,.18),transparent_40%),rgba(0,0,0,.22)] p-4 transition hover:border-amber-300/45">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Bingo destacado</p>
          <h3 className="mt-2 text-xl font-black text-white">{raffleName}</h3>
          <p className="mt-2 text-sm leading-5 text-emerald-50/65">Sorteo activo dentro del ecosistema de juegos.</p>
          <p className="mt-5 font-mono text-2xl font-black text-lime-300">{jackpotPrize ?? 'A confirmar'}</p>
          <span className="mt-4 flex h-10 items-center justify-center rounded-xl bg-amber-300 text-xs font-black uppercase text-zinc-950">Ver cartones</span>
        </Link>
      </div>
    </section>
  )
}

function ActiveTableRow({ room, index }: { room: PublicRoomSummary; index: number }) {
  const isPlaying = room.status === 'playing'
  const guest = room.guest?.name ?? 'Buscando rival'

  return (
    <div className="grid gap-3 bg-emerald-950/20 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.35fr)_0.75fr_0.75fr_5.5rem] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-300/35 bg-black/35 font-mono font-black text-amber-100">
          T
        </span>
        <div className="min-w-0">
          <p className="truncate font-black text-white">{room.host.name} vs {guest}</p>
          <p className="text-xs text-emerald-50/55">Mesa {index + 1} · a {room.target}</p>
        </div>
      </div>
      <p className="font-bold text-emerald-50/80">Truco</p>
      <p className={`font-bold ${isPlaying ? 'text-lime-200' : 'text-amber-200'}`}>{isPlaying ? 'Jugando' : 'Abierta'}</p>
      <Link href="/truco" className="flex h-10 items-center justify-center rounded-xl border border-amber-300/25 px-4 font-black uppercase text-amber-100 hover:bg-amber-300 hover:text-zinc-950">
        Ver
      </Link>
    </div>
  )
}

function FeaturedOriginalPanel() {
  return (
    <section className="rounded-[1.5rem] border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-300" />
        <h2 className="font-mono text-lg font-black uppercase text-amber-200">LBB Original</h2>
      </div>
      <Image src="/lbb/visuals/slot-game.webp" alt="Golden Bear" width={520} height={320} className="mx-auto h-40 w-full rounded-2xl object-cover shadow-2xl shadow-black/35" />
      <p className="mt-2 text-xl font-black text-white">Golden Bear</p>
      <p className="mt-1 text-sm leading-5 text-emerald-50/65">El slot propio queda como juego insignia de la plataforma.</p>
      <Link href="/juegos/golden-bear" className="mt-4 flex h-11 items-center justify-center rounded-xl bg-amber-300 text-sm font-black text-zinc-950 hover:bg-amber-200">Jugar</Link>
    </section>
  )
}

function TournamentsPanel() {
  const tournaments = [
    { title: 'Copa Truco', subtitle: 'Mesas rápidas', href: '/truco' },
    { title: 'Arcade semanal', subtitle: 'Ranking LBB', href: '/juegos/viborita' },
    { title: 'Bingo destacado', subtitle: 'Sorteo activo', href: '/participar' },
  ]

  return (
    <section className="rounded-[1.5rem] border border-amber-300/15 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-lg font-black uppercase text-amber-200">Eventos</h2>
        <span className="text-xs font-black text-lime-300">Live</span>
      </div>
      <div className="space-y-3">
        {tournaments.map((event) => (
          <Link key={event.title} href={event.href} className="block rounded-2xl border border-amber-300/15 bg-white/[0.035] p-3 hover:border-amber-300/45">
            <p className="text-sm font-black text-white">{event.title}</p>
            <p className="mt-1 text-xs text-emerald-50/60">{event.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function StudioRoadmapPanel() {
  return (
    <section className="rounded-[1.5rem] border border-amber-300/15 bg-black/20 p-4">
      <h2 className="font-mono text-lg font-black uppercase text-amber-200">Más diversión LBB</h2>
      <div className="mt-3 space-y-2 text-sm text-emerald-50/70">
        <p>1. Entrada rápida sin fricción.</p>
        <p>2. Golden Bear con cascadas y bonus.</p>
        <p>3. Historial claro de partidas.</p>
        <p>4. Misiones, ranking y logros.</p>
      </div>
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
