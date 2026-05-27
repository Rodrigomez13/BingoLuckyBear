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
import { useState } from 'react'
import { BearLogo } from '@/components/bear-logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
      router.push('/admin')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] p-4 text-zinc-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-8 top-20 h-24 w-24 rounded-full border-8 border-amber-400/25" />
        <div className="absolute bottom-24 right-12 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/20">
          21
        </div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 border-zinc-800 bg-zinc-950/85 text-zinc-100 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <BearLogo size={80} />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Panel Administrador
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Ingresa tus credenciales para gestionar los sorteos
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
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
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
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 focus:ring-amber-400"
              />
            </div>
            {error && (
              <p className="text-sm text-red-100 bg-red-500/10 border border-red-400/30 p-2 rounded-md">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
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
