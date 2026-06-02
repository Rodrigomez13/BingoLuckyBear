const highlights = [
  '🎉 Primer BINGO',
  '🎱 Bolillas en vivo',
  '🃏 Carton digital',
  '👑 Corona de ganador',
  '🐻 Lucky Bear',
  '💸 Pago coordinado',
  '📲 Aviso por WhatsApp',
]

export function BrandMarquee() {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-black/20 py-4">
      <div className="lbb-marquee flex w-max gap-3">
        {[...highlights, ...highlights].map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 shadow-lg shadow-black/15"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
