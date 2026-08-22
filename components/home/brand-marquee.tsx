import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { winnerExamples } from '@/lib/winner-examples'

export function BrandMarquee() {
  return (
    <section className="border-y border-white/10 bg-black/30 py-5">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">Historias destacadas</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">Ganadores, cartones y pagos publicados como referencia.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 sm:flex">
            <CheckCircle2 className="h-4 w-4" />
            Aviso por WhatsApp
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {winnerExamples.map((story) => (
            <div key={`${story.name}-${story.date}`} className="w-24 shrink-0 snap-start text-center sm:w-28">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-emerald-400 p-[3px] shadow-xl shadow-black/30 sm:h-24 sm:w-24">
                <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-900">
                  <Image
                    src={story.image}
                    alt={`Historia de ${story.name}`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="mt-2 truncate text-xs font-bold text-white">{story.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300">{story.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
