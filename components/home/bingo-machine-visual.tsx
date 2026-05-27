const balls = [
  { number: 7, className: 'left-[18%] top-[18%] bg-red-500' },
  { number: 21, className: 'left-[58%] top-[14%] bg-amber-400 text-zinc-950' },
  { number: 35, className: 'left-[36%] top-[42%] bg-emerald-500' },
  { number: 48, className: 'left-[68%] top-[50%] bg-blue-500' },
  { number: 63, className: 'left-[22%] top-[60%] bg-orange-500' },
]

export function BingoMachineVisual() {
  return (
    <div className="mx-auto mt-8 w-full max-w-md" aria-hidden="true">
      <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
        <div className="absolute left-1/2 top-4 h-52 w-52 -translate-x-1/2 rounded-full border-8 border-amber-300/80 bg-zinc-950/60 shadow-2xl shadow-amber-500/20 backdrop-blur">
          <div className="absolute inset-4 rounded-full border border-white/10 bg-black/30" />
          {balls.map((ball) => (
            <div
              key={ball.number}
              className={`absolute flex h-12 w-12 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ${ball.className}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-950">
                {ball.number}
              </span>
            </div>
          ))}
          <div className="absolute bottom-7 left-1/2 h-10 w-24 -translate-x-1/2 rounded-full border border-white/10 bg-white/10" />
        </div>

        <div className="absolute bottom-14 left-1/2 h-16 w-48 -translate-x-1/2 rounded-t-lg border border-amber-300/40 bg-gradient-to-b from-zinc-800 to-zinc-950" />
        <div className="absolute bottom-7 left-1/2 h-10 w-64 -translate-x-1/2 rounded-md border border-amber-300/40 bg-amber-400 shadow-lg shadow-amber-500/20" />
        <div className="absolute bottom-0 left-1/2 h-8 w-40 -translate-x-1/2 rounded-b-lg bg-zinc-900" />

        <div className="absolute right-1 top-36 h-4 w-20 rotate-[-18deg] rounded-full bg-amber-300" />
        <div className="absolute right-3 top-28 h-12 w-12 rounded-full border-4 border-amber-300 bg-zinc-950" />
      </div>
    </div>
  )
}
