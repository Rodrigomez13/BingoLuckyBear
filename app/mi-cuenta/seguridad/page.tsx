'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function SecurityPage() {
  const supabase = useMemo(() => createClient(), [])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)
      setLoading(false)
    }
    void load()
  }, [supabase])

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
      if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.')

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      setPassword('')
      setConfirmPassword('')
      setMessage('Contraseña actualizada correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader activePath="mi-cuenta" kicker="Seguridad" compact />

      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-[104px] sm:px-6 lg:px-8">
        <Badge className="mb-4 rounded-full bg-amber-300 text-zinc-950 hover:bg-amber-300">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Seguridad
        </Badge>
        <h1 className="font-mono text-4xl font-black text-white sm:text-5xl">Cambiar contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Mantené tu cuenta segura. Tu sesión queda recordada en este dispositivo hasta que cierres sesión.
        </p>

        <Card className="mt-8 border-white/10 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/30">
          <CardHeader>
            <CardTitle className="text-white">Nueva contraseña</CardTitle>
            <CardDescription className="text-zinc-400">
              {loading ? 'Verificando sesión...' : userEmail ? `Sesión activa: ${userEmail}` : 'Necesitás iniciar sesión para cambiar tu contraseña.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!loading && !userEmail ? (
              <Button asChild className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
                <Link href="/mi-cuenta">Iniciar sesión</Link>
              </Button>
            ) : (
              <form onSubmit={updatePassword} className="space-y-4">
                <PasswordField
                  label="Nueva contraseña"
                  value={password}
                  show={showPassword}
                  onShow={() => setShowPassword((value) => !value)}
                  onChange={setPassword}
                />
                <PasswordField
                  label="Repetir contraseña"
                  value={confirmPassword}
                  show={showConfirmPassword}
                  onShow={() => setShowConfirmPassword((value) => !value)}
                  onChange={setConfirmPassword}
                />
                <Button disabled={saving || loading} className="h-11 w-full rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200 disabled:opacity-50">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Guardar contraseña
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {(message || error) && (
          <div className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-red-400/40 bg-red-950/80 text-red-100' : 'border-emerald-400/40 bg-emerald-950/80 text-emerald-100'}`}>
            {error || message}
          </div>
        )}
      </section>
    </main>
  )
}

function PasswordField({ label, value, show, onShow, onChange }: { label: string; value: string; show: boolean; onShow: () => void; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={6}
          required
          className="border-zinc-700 bg-zinc-900 pr-11 text-white focus:border-amber-400 focus:ring-amber-400"
        />
        <button
          type="button"
          onClick={onShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-200"
          aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
