'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SiteHeader } from '@/components/site-header'
import { BingoCardDisplay } from '@/components/participate/bingo-card-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { CUSTOMER_AVATARS } from '@/lib/customer/avatars'
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, LogOut, Save, Ticket, UserCircle2, UserPlus, WalletCards } from 'lucide-react'

interface CustomerProfile {
  full_name?: string | null
  dni?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  payout_account_kind?: string | null
  payout_account?: string | null
  payout_holder_name?: string | null
}

interface CustomerCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  payment_status?: 'pending' | 'approved' | 'rejected' | null
  bingo_numbers: number[][]
  raffle?: {
    id: string
    name: string
    draw_date?: string | null
    draw_status?: 'idle' | 'running' | 'finished' | null
    drawn_numbers?: number[] | null
  } | null
}

const emptyProfile: Required<Record<keyof CustomerProfile, string>> = {
  full_name: '',
  dni: '',
  address: '',
  phone: '',
  email: '',
  payout_account_kind: '',
  payout_account: '',
  payout_holder_name: '',
}

export default function MyAccountPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [playerAlias, setPlayerAlias] = useState('')
  const [avatarKey, setAvatarKey] = useState('golden_bear')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [cards, setCards] = useState<CustomerCard[]>([])

  const supabase = useMemo(() => createClient(), [])

  const approvedCount = cards.filter((card) => card.payment_status === 'approved').length
  const pendingCount = cards.filter((card) => (card.payment_status ?? 'pending') === 'pending').length
  const rejectedCount = cards.filter((card) => card.payment_status === 'rejected').length

  const loadAccount = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [profileRes, cardsRes] = await Promise.all([
        fetch('/api/customer/profile', { cache: 'no-store' }),
        fetch('/api/customer/cards', { cache: 'no-store' }),
      ])
      const profileData = await profileRes.json()
      const cardsData = await cardsRes.json()

      if (profileData.user?.email) {
        setUserEmail(profileData.user.email)
        setEmail(profileData.user.email)
      } else {
        setUserEmail(null)
      }

      if (profileData.profile) {
        setProfile({
          full_name: profileData.profile.full_name ?? '',
          dni: profileData.profile.dni ?? '',
          address: profileData.profile.address ?? '',
          phone: profileData.profile.phone ?? '',
          email: profileData.profile.email ?? profileData.user?.email ?? '',
          payout_account_kind: profileData.profile.payout_account_kind ?? '',
          payout_account: profileData.profile.payout_account ?? '',
          payout_holder_name: profileData.profile.payout_holder_name ?? '',
        })
      } else if (profileData.user?.email) {
        setProfile((current) => ({ ...current, email: profileData.user.email }))
      }

      setCards(cardsData.cards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccount()
    const { data } = supabase.auth.onAuthStateChange(() => {
      loadAccount()
    })

    return () => data.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePasswordAccess = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsAuthLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (authMode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, alias: playerAlias, avatar_key: avatarKey }),
        })
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo crear la cuenta')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      setPassword('')
      setMessage(authMode === 'register' ? 'Cuenta creada. Ya estás dentro.' : 'Sesión iniciada.')
      await loadAccount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo acceder a tu cuenta')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el perfil')

      setMessage('Datos guardados. La proxima compra se va a completar con esta informacion.')
      await loadAccount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    setProfile(emptyProfile)
    setCards([])
    setPassword('')
    setMessage('Sesion cerrada.')
  }

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="mi-cuenta" kicker="Cuenta de jugador" compact />

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <Badge className="mb-4 rounded-full bg-amber-300 text-zinc-950 hover:bg-amber-300">
              <UserCircle2 className="mr-1 h-3.5 w-3.5" />
              Mi cuenta
            </Badge>
            <h1 className="max-w-3xl font-mono text-4xl font-black leading-none text-white sm:text-6xl">
              Tus datos, saldo y cartones en un solo lugar
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Entrá con contraseña, elegí tu avatar, revisá tus cartones y usá tu cuenta para Truco y Bingo.
            </p>
          </div>

          <Card className="lbb-premium-panel border-white/10 text-zinc-100">
            <CardContent className="grid grid-cols-3 gap-2 p-4 text-center">
              <Metric value={String(approvedCount)} label="aprobados" />
              <Metric value={String(pendingCount)} label="pendientes" />
              <Metric value={String(rejectedCount)} label="rechazados" />
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <div className="text-center">
              <BearLogo size={72} className="mx-auto mb-3 animate-bounce" />
              <p className="text-amber-200">Cargando cuenta...</p>
            </div>
          </div>
        ) : !userEmail ? (
          <Card className="mx-auto max-w-xl border-white/10 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-zinc-950">
                {authMode === 'login' ? <LockKeyhole className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
              </div>
              <CardTitle className="text-2xl text-white">{authMode === 'login' ? 'Entrar como jugador' : 'Crear cuenta de jugador'}</CardTitle>
              <CardDescription className="text-zinc-400">
                {authMode === 'login'
                  ? 'Ingresá con correo y contraseña. Sin link por email.'
                  : 'Creá tu usuario, elegí avatar y recibí tus LBB Points iniciales.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/25 p-1.5">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${authMode === 'login' ? 'bg-amber-300 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
                >
                  Ingresar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${authMode === 'register' ? 'bg-amber-300 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
                >
                  Registrarme
                </button>
              </div>

              <form onSubmit={handlePasswordAccess} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <Label>Alias público</Label>
                      <Input
                        value={playerAlias}
                        onChange={(event) => setPlayerAlias(event.target.value)}
                        placeholder="Ej: LuckyRodri"
                        className="border-zinc-700 bg-zinc-900 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Elegí tu avatar</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {CUSTOMER_AVATARS.map((avatar) => (
                          <button
                            key={avatar.key}
                            type="button"
                            onClick={() => setAvatarKey(avatar.key)}
                            className={`rounded-2xl border p-2 text-center transition ${avatarKey === avatar.key ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                          >
                            <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${avatar.gradient} text-2xl`}>{avatar.emoji}</span>
                            <span className="mt-1 block text-[10px] font-bold text-zinc-300">{avatar.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    required
                    className="border-zinc-700 bg-zinc-900 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="border-zinc-700 bg-zinc-900 pr-11 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-200"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isAuthLoading} className="h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                  {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : authMode === 'login' ? <LockKeyhole className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {authMode === 'login' ? 'Entrar' : 'Crear cuenta y entrar'}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                Podés comprar como invitado, pero para Truco online, puntos, ranking e historial necesitás cuenta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="h-fit border-white/10 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/25">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-white">Datos guardados</CardTitle>
                    <CardDescription className="text-zinc-400">Sesión activa: {userEmail}</CardDescription>
                  </div>
                  <Button onClick={logout} variant="outline" size="sm" className="border-red-400/40 bg-transparent text-red-200 hover:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Salir
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveProfile} className="space-y-4">
                  <Field label="Nombre completo" value={profile.full_name} onChange={(value) => setProfile({ ...profile, full_name: value })} />
                  <Field label="DNI" value={profile.dni} onChange={(value) => setProfile({ ...profile, dni: value })} />
                  <Field label="Direccion" value={profile.address} onChange={(value) => setProfile({ ...profile, address: value })} />
                  <Field label="Telefono" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
                  <Field label="Email de contacto" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />

                  <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-100">
                      <WalletCards className="h-4 w-4" />
                      Cuenta para cobrar premios
                    </p>
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                          value={profile.payout_account_kind}
                          onChange={(event) => setProfile({ ...profile, payout_account_kind: event.target.value })}
                          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
                        >
                          <option value="">Selecciona</option>
                          <option value="Alias">Alias</option>
                          <option value="CBU">CBU</option>
                          <option value="CVU">CVU</option>
                        </select>
                      </div>
                      <Field label="Alias / CBU / CVU" value={profile.payout_account} onChange={(value) => setProfile({ ...profile, payout_account: value })} />
                      <Field label="Titular de la cuenta" value={profile.payout_holder_name} onChange={(value) => setProfile({ ...profile, payout_holder_name: value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="submit" disabled={isSaving} className="h-12 rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Guardar datos
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-full border-amber-300/30 bg-transparent text-amber-100 hover:bg-amber-300/10">
                      <Link href="/mi-cuenta/jugador">Ver saldo y avatar</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Mis cartones</h2>
                  <p className="text-sm text-zinc-400">Los cartones aparecen aca cuando compras con la sesion iniciada o con este correo.</p>
                </div>
                <Button asChild className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                  <Link href="/participar">
                    <Ticket className="mr-2 h-4 w-4" />
                    Comprar cartones
                  </Link>
                </Button>
              </div>

              {cards.length === 0 ? (
                <Card className="border-dashed border-white/15 bg-zinc-950/60 text-zinc-100">
                  <CardContent className="p-8 text-center">
                    <Ticket className="mx-auto mb-3 h-10 w-10 text-amber-300" />
                    <h3 className="text-lg font-bold text-white">Todavia no hay cartones vinculados</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                      La proxima vez que compres con esta sesion activa o con este correo, tus cartones van a quedar guardados en esta cuenta.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  {cards.map((card) => (
                    <div key={card.id} className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <p className="text-sm font-bold text-white">{card.raffle?.name ?? 'Sorteo'}</p>
                        <p className="text-xs text-zinc-400">Estado de pago: {getStatusLabel(card.payment_status)}</p>
                      </div>
                      <BingoCardDisplay
                        card={card}
                        raffleName={card.raffle?.name ?? 'Lucky Bingo Bear'}
                        drawnNumbers={card.raffle?.drawn_numbers ?? []}
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(message || error) && (
          <div className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border p-4 text-sm font-semibold shadow-2xl backdrop-blur ${error ? 'border-red-400/40 bg-red-950/90 text-red-100' : 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'}`}>
            <div className="flex items-start gap-2">
              {!error && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{error || message}</span>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
      />
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">{label}</p>
    </div>
  )
}

function getStatusLabel(status?: 'pending' | 'approved' | 'rejected' | null) {
  if (status === 'approved') return 'aprobado'
  if (status === 'rejected') return 'rechazado'
  return 'pendiente'
}
