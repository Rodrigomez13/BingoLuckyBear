import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck, Ticket, Trophy, UserCircle2, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BearLogo } from '@/components/bear-logo'
import { requireAdminPage } from '@/lib/auth/roles'
import { getCustomerAvatar, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  alias: string | null
  avatar_key: string | null
  phone: string | null
  dni: string | null
  created_at?: string | null
}

interface WalletRow {
  user_id: string
  bonus_points_balance: number | null
  cash_credits_balance: number | null
}

interface RoleRow {
  user_id: string
  role: 'admin' | 'operator' | 'player'
}

interface StatsRow {
  user_id: string
  matches_played: number | null
  matches_won: number | null
  matches_lost: number | null
  ranking_points: number | null
}

interface CardCountRow {
  user_id: string | null
  email: string | null
  payment_status: string | null
}

export default async function AdminUsersPage() {
  const { serviceClient } = await requireAdminPage()

  const { data: authUsersData, error: authUsersError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authUsersError) throw authUsersError

  const authUsers = authUsersData.users ?? []
  const userIds = authUsers.map((user) => user.id)
  const emails = authUsers.map((user) => user.email?.toLowerCase()).filter(Boolean) as string[]

  const [profilesResult, walletsResult, rolesResult, statsResult, cardsResult] = await Promise.allSettled([
    userIds.length
      ? serviceClient.from('customer_profiles').select('id, email, full_name, alias, avatar_key, phone, dni, created_at').in('id', userIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    userIds.length
      ? serviceClient.from('lbb_wallets').select('user_id, bonus_points_balance, cash_credits_balance').in('user_id', userIds)
      : Promise.resolve({ data: [] as WalletRow[] }),
    userIds.length
      ? serviceClient.from('lbb_user_roles').select('user_id, role').in('user_id', userIds)
      : Promise.resolve({ data: [] as RoleRow[] }),
    userIds.length
      ? serviceClient.from('truco_player_stats').select('user_id, matches_played, matches_won, matches_lost, ranking_points').in('user_id', userIds)
      : Promise.resolve({ data: [] as StatsRow[] }),
    emails.length
      ? serviceClient.from('bingo_cards').select('user_id, email, payment_status').or(`user_id.in.(${userIds.join(',')}),email.in.(${emails.join(',')})`)
      : Promise.resolve({ data: [] as CardCountRow[] }),
  ])

  const profiles = resultData<ProfileRow>(profilesResult)
  const wallets = resultData<WalletRow>(walletsResult)
  const roles = resultData<RoleRow>(rolesResult)
  const stats = resultData<StatsRow>(statsResult)
  const cards = resultData<CardCountRow>(cardsResult)

  const profileById = new Map(profiles.map((row) => [row.id, row]))
  const walletById = new Map(wallets.map((row) => [row.user_id, row]))
  const roleById = new Map(roles.map((row) => [row.user_id, row.role]))
  const statsById = new Map(stats.map((row) => [row.user_id, row]))

  const cardsByUser = new Map<string, { total: number; approved: number; pending: number; rejected: number }>()
  for (const card of cards) {
    const key = card.user_id || authUsers.find((user) => user.email?.toLowerCase() === card.email?.toLowerCase())?.id
    if (!key) continue
    const current = cardsByUser.get(key) ?? { total: 0, approved: 0, pending: 0, rejected: 0 }
    current.total += 1
    if (card.payment_status === 'approved') current.approved += 1
    else if (card.payment_status === 'rejected') current.rejected += 1
    else current.pending += 1
    cardsByUser.set(key, current)
  }

  const rows = authUsers
    .map((user) => {
      const profile = profileById.get(user.id)
      const wallet = walletById.get(user.id)
      const role = roleById.get(user.id) ?? 'player'
      const playerStats = statsById.get(user.id)
      const avatar = getCustomerAvatar(profile?.avatar_key)
      const cardCount = cardsByUser.get(user.id) ?? { total: 0, approved: 0, pending: 0, rejected: 0 }
      const alias = profile?.alias || profile?.full_name || user.email?.split('@')[0] || 'Usuario'

      return {
        id: user.id,
        email: user.email ?? profile?.email ?? 'sin-email',
        alias,
        fullName: profile?.full_name ?? '',
        role,
        avatar,
        emailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        bonus: Number(wallet?.bonus_points_balance ?? 0),
        cash: Number(wallet?.cash_credits_balance ?? 0),
        cards: cardCount,
        matchesPlayed: Number(playerStats?.matches_played ?? 0),
        matchesWon: Number(playerStats?.matches_won ?? 0),
        matchesLost: Number(playerStats?.matches_lost ?? 0),
        rankingPoints: Number(playerStats?.ranking_points ?? 1000),
      }
    })
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())

  const totalUsers = rows.length
  const adminUsers = rows.filter((row) => row.role === 'admin' || row.role === 'operator').length
  const verifiedUsers = rows.filter((row) => row.emailConfirmed).length
  const totalBonus = rows.reduce((sum, row) => sum + row.bonus, 0)

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Panel Admin</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Usuarios</h1>
              <p className="mt-1 text-sm text-zinc-400">Listado operativo de cuentas, roles, saldos, cartones y actividad de Truco.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
              <Link href="/admin/saldo"><WalletCards className="mr-2 h-4 w-4" /> Saldos</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
              <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<UserCircle2 className="h-5 w-5" />} label="Usuarios totales" value={String(totalUsers)} detail="auth.users" />
          <Metric icon={<ShieldCheck className="h-5 w-5" />} label="Admins / operadores" value={String(adminUsers)} detail="roles activos" />
          <Metric icon={<Mail className="h-5 w-5" />} label="Emails verificados" value={String(verifiedUsers)} detail={`${totalUsers - verifiedUsers} sin verificar`} />
          <Metric icon={<WalletCards className="h-5 w-5" />} label="LBB Points" value={`${totalBonus}`} detail="saldo total visible" />
        </div>

        <Card className="border-white/10 bg-zinc-950/85 text-zinc-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCircle2 className="h-5 w-5 text-amber-300" /> Lista de usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-zinc-400">
                No hay usuarios registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Rol</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                      <th className="px-3 py-2 text-center">Cartones</th>
                      <th className="px-3 py-2 text-center">Truco</th>
                      <th className="px-3 py-2">Alta</th>
                      <th className="px-3 py-2">Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="rounded-2xl bg-black/25 align-middle">
                        <td className="rounded-l-2xl border-y border-l border-white/10 px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-300/25 bg-amber-300/10">
                              <img src={getCustomerAvatarImageSrc(row.avatar.key)} alt={row.avatar.label} className="h-full w-full object-cover" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-white">{row.alias}</p>
                              <p className="truncate text-xs text-zinc-500">{row.email}</p>
                              <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">{row.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-y border-white/10 px-3 py-3">
                          <RoleBadge role={row.role} />
                        </td>
                        <td className="border-y border-white/10 px-3 py-3">
                          <Badge className={row.emailConfirmed ? 'bg-emerald-500 text-white hover:bg-emerald-500' : 'bg-rose-500 text-white hover:bg-rose-500'}>
                            {row.emailConfirmed ? 'Verificado' : 'Sin verificar'}
                          </Badge>
                        </td>
                        <td className="border-y border-white/10 px-3 py-3 text-right">
                          <p className="font-mono font-black text-amber-300">{row.bonus} LBB</p>
                          <p className="text-xs text-zinc-500">Cash {row.cash}</p>
                        </td>
                        <td className="border-y border-white/10 px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5">
                            <Ticket className="h-4 w-4 text-amber-300" />
                            <span className="font-black text-white">{row.cards.total}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-zinc-500">{row.cards.approved} ok · {row.cards.pending} pend.</p>
                        </td>
                        <td className="border-y border-white/10 px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5">
                            <Trophy className="h-4 w-4 text-emerald-300" />
                            <span className="font-black text-white">{row.matchesWon}/{row.matchesPlayed}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-zinc-500">{row.rankingPoints} pts</p>
                        </td>
                        <td className="border-y border-white/10 px-3 py-3 text-xs text-zinc-400">{formatDate(row.createdAt)}</td>
                        <td className="rounded-r-2xl border-y border-r border-white/10 px-3 py-3 text-xs text-zinc-400">{formatDate(row.lastSignInAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function resultData<T>(result: PromiseSettledResult<{ data: T[] | null }>) {
  if (result.status !== 'fulfilled') return []
  return result.value.data ?? []
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-zinc-950/80 p-4 shadow-xl shadow-black/30">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{detail}</p>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return <Badge className="bg-amber-300 text-zinc-950 hover:bg-amber-300">Admin</Badge>
  if (role === 'operator') return <Badge className="bg-sky-400 text-zinc-950 hover:bg-sky-400">Operador</Badge>
  return <Badge className="bg-zinc-700 text-zinc-100 hover:bg-zinc-700">Jugador</Badge>
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
