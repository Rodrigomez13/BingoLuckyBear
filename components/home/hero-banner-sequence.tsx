import Image from 'next/image'
import Link from 'next/link'

export function HeroBannerSequence() {
  return (
    <div className="relative h-52 w-full overflow-hidden border-y border-white/10 bg-black">
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

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,16,0.86),rgba(11,11,16,0.24)_42%,rgba(11,11,16,0.78))]" />

      <Image
        src="/brand/banner-logo-corner.png"
        alt=""
        width={900}
        height={900}
        className="animate-banner-corner absolute right-3 top-3 h-16 w-16 object-contain opacity-90 drop-shadow-xl sm:h-20 sm:w-20"
      />

      <div className="absolute inset-y-0 left-3 z-10 flex items-center sm:left-[max(1.25rem,calc(50%-31rem))]">
        <Image
          src="/brand/banner-logo-main.png"
          alt="Lucky Bingo Bear"
          width={900}
          height={900}
          priority
          className="animate-banner-logo h-16 w-16 object-contain drop-shadow-2xl sm:h-32 sm:w-32 md:h-40 md:w-40"
        />
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center px-4 text-center sm:px-6 md:px-8">
        <div className="animate-banner-copy flex min-w-0 max-w-[34rem] flex-col items-center justify-center">
          <p className="font-mono text-balance text-xl font-bold leading-none tracking-normal text-amber-300 drop-shadow-[0_3px_8px_rgba(0,0,0,0.75)] sm:text-3xl md:text-4xl lg:text-5xl">
            ¿Queres ganar $350000?
          </p>
          <p className="mx-auto mt-2 max-w-[34rem] text-balance text-[11px] font-medium text-slate-100/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-base md:text-lg">
            ¡y solo comprando un cartón de $3000!
          </p>
          <Link
            href="/participar"
            aria-label="Participar"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-[linear-gradient(to_right,rgb(37,99,235),rgb(59,130,246),rgb(249,115,22))] px-4 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-black/30 transition duration-200 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            <Image src="/truco/golden-bear-mascot.webp" alt="" width={22} height={22} className="h-5 w-5 object-contain" />
            Participar
          </Link>
        </div>
      </div>

      <div className="absolute inset-y-0 right-14 z-10 hidden items-center sm:right-[max(6rem,calc(50%-30rem))] sm:flex">
        <Image
          src="/brand/banner-logo-lbb.png"
          alt="LBB Lucky Bingo Bear"
          width={900}
          height={900}
          priority
          className="animate-banner-logo-delayed h-20 w-28 object-contain opacity-95 drop-shadow-2xl md:h-28 md:w-40"
        />
      </div>
    </div>
  )
}
