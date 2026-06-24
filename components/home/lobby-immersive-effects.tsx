export function LobbyImmersiveEffects() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,.18),transparent_24rem),radial-gradient(circle_at_13%_26%,rgba(16,185,129,.12),transparent_21rem),radial-gradient(circle_at_86%_35%,rgba(245,158,11,.12),transparent_22rem),radial-gradient(circle_at_50%_110%,rgba(132,204,22,.09),transparent_24rem)] opacity-60" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,transparent_0%,rgba(255,255,255,.55)_50%,transparent_100%)] [background-size:280px_100%]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-300/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-lime-400/8 to-transparent" />

      <div className="absolute left-1/2 top-[38%] hidden aspect-square w-[min(56vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/8 md:block">
        <div className="absolute inset-[16%] rounded-full border border-emerald-300/8" />
        <div className="absolute inset-[31%] rounded-full border border-lime-300/8" />
        <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/55 shadow-[0_0_58px_rgba(250,204,21,.48)]" />
        <span className="absolute left-[14%] top-[38%] h-4 w-4 rounded-full bg-amber-200/45 shadow-[0_0_32px_rgba(250,204,21,.45)]" />
        <span className="absolute left-[78%] top-[41%] h-4 w-4 rounded-full bg-emerald-200/45 shadow-[0_0_32px_rgba(16,185,129,.45)]" />
        <span className="absolute left-[61%] top-[68%] h-4 w-4 rounded-full bg-orange-200/45 shadow-[0_0_32px_rgba(251,146,60,.45)]" />
        <span className="absolute left-[34%] top-[66%] h-4 w-4 rounded-full bg-lime-200/45 shadow-[0_0_32px_rgba(190,242,100,.45)]" />
      </div>

      <div className="absolute left-1/2 top-[8%] h-40 w-[44rem] -translate-x-1/2 rounded-full bg-amber-300/6 blur-3xl animate-pulse" />
      <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-emerald-400/8 blur-3xl animate-pulse" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-orange-400/8 blur-3xl animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,.04)_50%,transparent_51%)] bg-[length:100%_7px] opacity-[0.05]" />
    </div>
  )
}
