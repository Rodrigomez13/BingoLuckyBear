import Image from 'next/image'
import Link from 'next/link'

export function HeroBannerSequence() {
  return (
    <div className="relative h-48 w-full overflow-hidden border-b border-amber-300/20 bg-black shadow-2xl shadow-black/35">
      <Image
        src="/brand/banner-bg-black.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <Image
        src="/brand/banner-bg-overlay.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="animate-banner-drift object-cover opacity-70"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.3)_42%,rgba(0,0,0,0.72))]" />

      <Image
        src="/brand/banner-logo-corner.png"
        alt=""
        width={900}
        height={900}
        className="animate-banner-corner absolute right-3 top-3 h-16 w-16 object-contain opacity-90 drop-shadow-xl sm:h-20 sm:w-20"
      />

      <div className="absolute inset-0 z-10 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-3 text-center sm:px-5">
        <div className="flex min-w-0 justify-end pr-[30px]">
          <Image
            src="/brand/banner-logo-main.png"
            alt="Lucky Bingo Bear"
            width={900}
            height={900}
            priority
            className="animate-banner-logo h-28 w-28 object-contain drop-shadow-2xl sm:h-36 sm:w-36 md:h-44 md:w-44"
          />
        </div>

        <div className="animate-banner-copy flex min-w-0 flex-col items-center justify-center">
          <p className="text-balance text-2xl font-black leading-[0.95] text-amber-200 drop-shadow-[0_3px_8px_rgba(0,0,0,0.75)] sm:text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-fredoka)' }}>
            ¿Queres ganar $350000?
          </p>
          <p className="mx-auto mt-1.5 max-w-[34rem] text-balance text-xs font-semibold text-zinc-100/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-lg">
            y solo comprando un cartón de $3000!
          </p>
          <Link
            href="/participar"
            aria-label="Participar"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-amber-200/30 bg-gradient-to-r from-amber-300 to-orange-500 px-4 text-xs font-black uppercase tracking-wide text-zinc-950 shadow-lg shadow-black/30 transition hover:scale-[1.02] hover:from-amber-200 hover:to-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            <Image src="/logo-solo.svg" alt="" width={22} height={22} className="h-5 w-5" />
            Participar
          </Link>
        </div>

        <div className="flex min-w-0 justify-start pl-[30px]">
          <Image
            src="/brand/banner-logo-lbb.png"
            alt="LBB Lucky Bingo Bear"
            width={900}
            height={900}
            priority
            className="animate-banner-logo-delayed hidden h-20 w-28 object-contain opacity-95 drop-shadow-2xl sm:block md:h-28 md:w-40"
          />
        </div>
      </div>
    </div>
  )
}
