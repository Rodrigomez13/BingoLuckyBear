'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  WalletCards,
  X,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { BearLogo } from '@/components/bear-logo'

type GameShellContextValue = {
  isFullscreen: boolean
  enterFullscreen: () => void
  exitFullscreen: () => void
  toggleFullscreen: () => void
}

const GameShellContext = createContext<GameShellContextValue | null>(null)

type GameCssVars = CSSProperties & {
  '--lbb-game-aspect'?: string
  '--lbb-game-ratio'?: number
  '--lbb-game-mobile-aspect'?: string
  '--lbb-game-mobile-ratio'?: number
  '--lbb-game-max-height'?: string
}

function parseAspectRatio(value: string) {
  const [rawWidth, rawHeight] = value.split('/').map((part) => Number(part.trim()))
  if (!Number.isFinite(rawWidth) || !Number.isFinite(rawHeight) || rawWidth <= 0 || rawHeight <= 0) return 16 / 9
  return rawWidth / rawHeight
}

function useGameShell() {
  const context = useContext(GameShellContext)
  if (!context) throw new Error('GameShell components must be rendered inside GameShell')
  return context
}

export function GameShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && document.fullscreenElement === rootRef.current))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const enterFullscreen = useCallback(() => {
    void rootRef.current?.requestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) exitFullscreen()
    else enterFullscreen()
  }, [enterFullscreen, exitFullscreen])

  const value = useMemo(
    () => ({ isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen }),
    [enterFullscreen, exitFullscreen, isFullscreen, toggleFullscreen],
  )

  return (
    <GameShellContext.Provider value={value}>
      <div
        ref={rootRef}
        data-fullscreen={isFullscreen ? 'true' : 'false'}
        className={`lbb-game-shell relative min-h-[100svh] overflow-hidden bg-[var(--lbb-bg)] text-[var(--lbb-text-warm)] ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(221,175,55,0.18),transparent_30rem),radial-gradient(circle_at_82%_12%,rgba(26,199,103,0.14),transparent_28rem),linear-gradient(135deg,var(--lbb-bg),var(--lbb-green-dark)_54%,var(--lbb-panel))]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative z-10 flex min-h-[100svh] flex-col overflow-hidden px-2 py-2 sm:px-4">
          {children}
        </div>
      </div>
    </GameShellContext.Provider>
  )
}

export function GameHeaderCompact({
  gameName,
  balanceLabel,
  exitHref,
  exitLabel = 'Salir',
}: {
  gameName: string
  balanceLabel?: string | null
  exitHref: string
  exitLabel?: string
}) {
  const { isFullscreen, toggleFullscreen } = useGameShell()

  return (
    <header
      className={`mx-auto mb-2 flex w-full max-w-[96rem] items-center justify-between gap-2 rounded-xl border border-[color:rgba(221,175,55,.22)] bg-black/45 px-2 shadow-2xl shadow-black/35 backdrop-blur-xl transition-all sm:px-3 ${
        isFullscreen ? 'min-h-10 py-1' : 'min-h-14 py-2'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={exitHref}
          aria-label={exitLabel}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--lbb-gold-bright)] transition hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <BearLogo size={isFullscreen ? 30 : 36} className="shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black uppercase leading-tight text-white sm:text-base">{gameName}</p>
          {!isFullscreen && <p className="hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--lbb-text-muted)] sm:block">LuckyBingoBear Games</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {balanceLabel && (
          <span className="hidden h-9 items-center gap-2 rounded-lg border border-[color:rgba(26,199,103,.24)] bg-[color:rgba(11,46,26,.72)] px-3 text-xs font-black text-[var(--lbb-green-glow)] sm:inline-flex">
            <WalletCards className="h-4 w-4" />
            {balanceLabel}
          </span>
        )}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[color:rgba(221,175,55,.26)] bg-[color:rgba(221,175,55,.10)] text-[var(--lbb-gold-bright)] transition hover:bg-[color:rgba(221,175,55,.18)]"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <Link
          href={exitHref}
          aria-label={exitLabel}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          title={exitLabel}
        >
          <X className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}

export function GameViewport({
  children,
  aspectRatio = '16 / 9',
  mobileAspectRatio,
  maxHeight = 'calc(100svh - clamp(7.25rem, 14svh, 9.5rem))',
  frameClassName = '',
}: {
  children: ReactNode
  aspectRatio?: string
  mobileAspectRatio?: string
  maxHeight?: string
  frameClassName?: string
}) {
  const style: GameCssVars = {
    '--lbb-game-aspect': aspectRatio,
    '--lbb-game-ratio': parseAspectRatio(aspectRatio),
    '--lbb-game-mobile-aspect': mobileAspectRatio ?? aspectRatio,
    '--lbb-game-mobile-ratio': parseAspectRatio(mobileAspectRatio ?? aspectRatio),
    '--lbb-game-max-height': maxHeight,
  }

  return (
    <section className="lbb-game-viewport flex min-h-0 flex-1 items-center justify-center overflow-hidden" style={style}>
      <div
        data-mobile-aspect={mobileAspectRatio ? 'true' : 'false'}
        className={`lbb-game-viewport-frame relative min-h-0 overflow-hidden rounded-xl border border-[color:rgba(221,175,55,.22)] bg-black/55 shadow-2xl shadow-black/45 backdrop-blur-xl ${frameClassName}`}
      >
        <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden">{children}</div>
      </div>
    </section>
  )
}

export function OrientationHint({
  message = 'Para jugar mejor, gira el telefono en horizontal.',
}: {
  message?: string
}) {
  return (
    <div className="mx-auto mb-2 hidden w-full max-w-[96rem] rounded-lg border border-[color:rgba(221,175,55,.24)] bg-[color:rgba(58,36,8,.72)] px-3 py-2 text-center text-xs font-bold text-[var(--lbb-text)] shadow-lg shadow-black/20 max-[760px]:portrait:block">
      {message}
    </div>
  )
}
