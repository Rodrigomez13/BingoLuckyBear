'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Save, Trophy, UserCircle2, WalletCards } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CUSTOMER_AVATARS, getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { PlayerGamification } from '@/components/customer/player-gamification'
import { FundsPanel } from '@/components/customer/funds-panel'
import { formatAccountBalance } from '@/lib/economy/format'

interface WalletData {
  wallet: {
    general_balance: number
    total_balance: number
  } | null
  transactions: Array<{
    id: string
    wallet_kind: string
    transaction_type: string
    amount: number
    description?: string | null
    created_at: string
  }>
  stats: {
    matches_played: number
    matches_won: number
    matches_lost: number
    ranking_points: number
    bonus_points_won: number
    bonus_points_spent: number
  } | null
  trucoHistory: Array<{
    id: string
    room_code: string
    winner_user_id: string | null
    target_score: number
    player_score: number
    opponent_score: number
    entry_fee_points: number
    prize_points: number
    ranked: boolean
    finished_at: string
  }>
}

interface PlayerData {
  user: { id: string; email?: string | null } | null
  player: { alias?: string | null; avatar_key?: string | null } | null
}

export default function PlayerAccountPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [alias, setAlias] = useState('')
  const [avatarKey, setAvatarKey] = useState('golden_bear')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedAvatar = useMemo(() => getCustomerAvatar(avatarKey), [avatarKey])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [playerRes, walletRes] = await Promise.all([
        fetch('/api/customer/player', { cache: 'no-store' }),
        fetch('/api/customer/wallet', { cache: 'no-store' }),
      ])
      const playerJson = await playerRes.json()
      const walletJson = await walletRes.json()
      setPlayerData(playerJson)
      setWalletData(walletJson)
      setAlias(playerJson.player?.alias ?? '')
      setAvatarKey(playerJson.player?.avatar_key ?? 'golden_bear')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu perfil de jugador')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const response = await fetch('/api/customer/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, avatar_key: avatarKey }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar')
      setMessage('Perfil de jugador actualizado.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const user = playerData?.user
  const wallet = walletData?.wallet
  const stats = walletData?.stats

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="mi-cuenta" kicker="Perfil de jugador" compact />

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-4 rounded-full bg-amber-300 text-zinc-950 hover:bg-amber-300">
              <UserCircle2 className="mr-1 h-3.5 w-3.5" /> Jugador
            </Badge>
            <h1 className="font-mono text-4xl font-black text-white sm:text-6xl">Perfil, saldo y ranking</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Usá tu alias y avatar para competir en Truco. Tu saldo de cuenta sirve para cartones, mesas con pozo, cargas y retiros.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-transparent text-zinc-100">
            <Link href="/mi-cuenta">Volver a mi cuenta</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center text-amber-200">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando jugador...
          </div>
        ) : !user ? (
          <Card className="mx-auto max-w-xl border-white/10 bg-zinc-950/85 text-zinc-100">
            <CardHeader>
              <CardTitle>Necesitás iniciar sesión</CardTitle>
              <CardDescription>Entrá desde Mi Cuenta para activar tu wallet y perfil de jugador.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                <Link href="/mi-cuenta">Iniciar sesión</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <Card className="h-fit border-white/10 bg-zinc-950/85 text-zinc-100">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AvatarPreview avatarKey={selectedAvatar.key} label={selectedAvatar.label} size="lg" />
                  <div>
                    <CardTitle className="text-white">Tu identidad pública</CardTitle>
                    <CardDescription className="text-zinc-400">{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alias público</Label>
                  <Input value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Ej: LuckyRodri" className="border-zinc-700 bg-zinc-900 text-white" />
                </div>

                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CUSTOMER_AVATARS.map((avatar) => (
                      <button
                        key={avatar.key}
                        type="button"
                        onClick={() => setAvatarKey(avatar.key)}
                        className={`rounded-2xl border p-2 text-center transition ${avatarKey === avatar.key ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                      >
                        <AvatarPreview avatarKey={avatar.key} label={avatar.label} />
                        <span className="mt-1 block text-[10px] font-bold text-zinc-300">{avatar.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={save} disabled={saving} className="h-11 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar jugador
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric icon={<WalletCards className="h-5 w-5" />} label="Saldo total" value={formatAccountBalance(wallet?.total_balance ?? 0)} />
                <Metric icon={<Trophy className="h-5 w-5" />} label="Ranking" value={String(stats?.ranking_points ?? 1000)} />
              </div>

              <PlayerGamification
                userId={user?.id ?? null}
                stats={stats}
                matches={walletData?.trucoHistory ?? []}
              />

              <FundsPanel cashBalance={wallet?.total_balance ?? 0} onChanged={load} />

              <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-white">Estadísticas de Truco</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <SmallStat label="Jugadas" value={stats?.matches_played ?? 0} />
                  <SmallStat label="Ganadas" value={stats?.matches_won ?? 0} />
                  <SmallStat label="Perdidas" value={stats?.matches_lost ?? 0} />
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-white">Últimos movimientos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(walletData?.transactions ?? []).length === 0 ? (
                    <p className="text-sm text-zinc-400">Todavía no hay movimientos.</p>
                  ) : (
                    walletData!.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm">
                        <div>
                          <p className="font-semibold text-white">{tx.description ?? tx.transaction_type}</p>
                          <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString('es-AR')}</p>
                        </div>
                        <span className={tx.amount >= 0 ? 'font-mono font-black text-emerald-300' : 'font-mono font-black text-rose-300'}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-white">Historial de Truco</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(walletData?.trucoHistory ?? []).length === 0 ? (
                    <p className="text-sm text-zinc-400">Todavía no hay partidas finalizadas.</p>
                  ) : (
                    walletData!.trucoHistory.map((match) => (
                      <div key={match.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <p className="font-mono font-black text-amber-300">{match.room_code}</p>
                          <p className="text-zinc-400">{match.player_score}-{match.opponent_score}</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">Entrada {match.entry_fee_points} · Premio {match.prize_points} · {new Date(match.finished_at).toLocaleString('es-AR')}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {(message || error) && (
          <div className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border p-4 text-sm font-semibold shadow-2xl backdrop-blur ${error ? 'border-red-400/40 bg-red-950/90 text-red-100' : 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'}`}>
            {error || message}
          </div>
        )}
      </section>
    </main>
  )
}

function AvatarPreview({ avatarKey, label, size = 'sm' }: { avatarKey: string; label: string; size?: 'sm' | 'lg' }) {
  return (
    <span className={`${size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'mx-auto h-12 w-12 rounded-xl'} flex items-center justify-center overflow-hidden border border-amber-300/25 bg-amber-300/10 shadow-lg shadow-black/30`}>
      <img src={getCustomerAvatarImageSrc(avatarKey)} alt={label} className="h-full w-full object-cover" />
    </span>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-xl bg-amber-300 p-2 text-zinc-950">{icon}</div>
        <div>
          <p className="font-mono text-2xl font-black text-white">{value}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="font-mono text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}
