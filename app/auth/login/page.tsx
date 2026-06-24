'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BearLogo } from '@/components/bear-logo'
import { SiteHeader } from '@/components/site-header'
import { normalizeInternalPath } from '@/lib/site-url'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [nextPath, setNextPath] = useState('/mi-cuenta/jugador')
  const router = useRouter()
  const isAdminAccess = nextPath.startsWith('/admin')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(normalizeInternalPath(params.get('next') ?? '/mi-cuenta/jugador'))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push(nextPath)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="lbb-page-shell relative flex min-h-screen items-center justify-center p-4 pt-24 text-zinc-100">
      <div className="lbb-ambient" />
      <SiteHeader kicker={isAdminAccess ? 'Acceso privado' : 'Acceso jugador'} compact />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="lbb-float absolute left-8 top-28 h-24 w-24 rounded-full border-8 border-amber-400/25" />
        <div className="lbb-float absolute bottom-24 right-12 flex h-16 w-16 items-center justify-center rounded-full bg-amber-300 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20">
          21
        </div>
      </div>
      
      <Card className="lbb-premium-panel lbb-fade-up relative z-10 w-full max-w-md overflow-hidden rounded-[1.5rem] border-white/10 text-zinc-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(251,191,36,.18),transparent)]" />
        <div className="relative mx-5 mt-5 overflow-hidden rounded-[1.25rem] border border-amber-300/20 bg-black/35">
          <img
            src="/lbb/visuals/profile-avatar.webp"
            alt="Lucky Bingo Bear"
            className="h-36 w-full object-cover object-[50%_18%] opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-3 rounded-full border border-amber-300/25 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
            Una cuenta, múltiples juegos
          </div>
        </div>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <BearLogo size={92} className="drop-shadow-2xl" />
          </div>
          <CardTitle className="font-mono text-3xl font-bold text-white">
            {isAdminAccess ? 'Panel Administrador' : 'Acceso de jugador'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isAdminAccess
              ? 'Ingresá tus credenciales para gestionar la operación.'
              : 'Ingresá para jugar con tu saldo general LBB.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@luckybingobear.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Contrasena</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
              />
            </div>
            {error && (
              <p className="text-sm text-red-100 bg-red-500/10 border border-red-400/30 p-2 rounded-md">{error}</p>
            )}
            <Button 
              type="submit" 
              className="h-11 w-full rounded-full bg-amber-300 font-bold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-200"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-amber-200 hover:text-white underline underline-offset-4"
            >
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
