'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BearLogo } from '@/components/bear-logo'
import { CUSTOMER_AVATARS, getCustomerAvatarImageSrc } from '@/lib/customer/avatars'
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, UserPlus, X } from 'lucide-react'

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onAuthenticated?: () => void
}

export function LoginModal({ open, onClose, onAuthenticated }: LoginModalProps) {
  const [mounted, setMounted] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [playerAlias, setPlayerAlias] = useState('')
  const [avatarKey, setAvatarKey] = useState('golden_bear')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset transient state when reopening
  useEffect(() => {
    if (open) {
      setError(null)
      setMessage(null)
    }
  }, [open])

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
        if (data.requires_email_confirmation) {
          setPassword('')
          setAuthMode('login')
          setMessage(data.message || 'Cuenta creada. Revisá tu correo y confirmá el enlace antes de iniciar sesión.')
          return
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      setPassword('')
      setMessage(authMode === 'register' ? 'Cuenta creada. Ya estás dentro.' : 'Sesión iniciada.')
      router.refresh()

      await wait(250)
      onAuthenticated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo acceder a tu cuenta')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleGoogleAccess = async () => {
    setIsGoogleLoading(true)
    setError(null)
    setMessage(null)

    try {
      const origin = window.location.origin
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/mi-cuenta`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (googleError) throw googleError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google')
      setIsGoogleLoading(false)
    }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 py-[max(1rem,5vh)]" role="dialog" aria-modal="true" aria-label="Acceso de jugador">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="lbb-premium-panel relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/10 text-zinc-100 shadow-2xl shadow-black/50">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-amber-300/30 hover:text-amber-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-7">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center">
              <BearLogo size={64} className="drop-shadow-2xl" />
            </div>
            <h2 className="font-mono text-2xl font-black text-white">
              {authMode === 'login' ? 'Entrar como jugador' : 'Crear cuenta de jugador'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
              {authMode === 'login'
                ? 'Ingresá con correo y contraseña, o continuá con Google.'
                : 'Creá tu usuario, elegí avatar y administrá tu saldo desde una sola cuenta.'}
            </p>
          </div>

          <div className="mt-5">
            <Button
              type="button"
              onClick={handleGoogleAccess}
              disabled={isGoogleLoading || isAuthLoading}
              variant="outline"
              className="mb-4 h-12 w-full rounded-full border-white/15 bg-white text-zinc-950 hover:bg-zinc-100"
            >
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleGlyph />}
              Continuar con Google
            </Button>

            <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>o</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

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
                    <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto pr-1">
                      {CUSTOMER_AVATARS.map((avatar) => (
                        <button
                          key={avatar.key}
                          type="button"
                          onClick={() => setAvatarKey(avatar.key)}
                          className={`rounded-2xl border p-2 text-center transition ${avatarKey === avatar.key ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:border-white/25'}`}
                        >
                          <span className="mx-auto block h-12 w-12 overflow-hidden rounded-xl border border-amber-300/20 bg-amber-300/5">
                            <img src={getCustomerAvatarImageSrc(avatar.key)} alt={avatar.label} className="h-full w-full object-cover" />
                          </span>
                          <span className="mt-1 block text-[10px] font-bold text-zinc-300">{avatar.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-modal-email">Correo electrónico</Label>
                <Input
                  id="login-modal-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-modal-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="login-modal-password"
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

              {error && (
                <p className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-100">{error}</p>
              )}
              {message && (
                <p className="flex items-start gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-2 text-sm text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {message}
                </p>
              )}

              <Button type="submit" disabled={isAuthLoading || isGoogleLoading} className="h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : authMode === 'login' ? <LockKeyhole className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
              Podés comprar como invitado, pero para Truco online, puntos, ranking e historial necesitás cuenta.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function GoogleGlyph() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
