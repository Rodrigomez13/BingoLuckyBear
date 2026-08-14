export function Scoreboard({ human, bot }: { human: number; bot: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jugador</p>
          <div className="text-2xl font-bold">{human}</div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oso</p>
          <div className="text-2xl font-bold">{bot}</div>
        </div>
      </div>
    </div>
  )
}
