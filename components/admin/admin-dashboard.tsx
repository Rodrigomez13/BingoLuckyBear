'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Clock, ExternalLink, Radio, Ticket, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { RaffleParticipants } from './raffle-participants'
import type { User } from '@supabase/supabase-js'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  admin_id: string
  draw_status?: 'idle' | 'running' | 'finished' | null
  countdown_seconds?: number | null
  draw_started_at?: string | null
  drawn_numbers?: number[] | null
  bingo_cards?: { count: number }[]
}

interface AdminDashboardProps {
  user: User
  initialRaffles: Raffle[]
}

export function AdminDashboard({ user, initialRaffles }: AdminDashboardProps) {
  const [raffles, setRaffles] = useState<Raffle[]>(initialRaffles)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const activeRaffle = raffles.find((raffle) => raffle.is_active)
  const finishedCount = raffles.filter((raffle) => raffle.draw_status === 'finished').length
  const liveCount = raffles.filter((raffle) => raffle.draw_status === 'running').length
  const totalCards = raffles.reduce((total, raffle) => total + (raffle.bingo_cards?.[0]?.count ?? 0), 0)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('raffles')
        .insert({
          name,
          description: description || null,
          admin_id: user.id,
          is_active: false,
        })
        .select()
        .single()

      if (error) throw error

      setRaffles([data, ...raffles])
      setName('')
      setDescription('')
      setShowForm(false)
    } catch (error) {
      console.error('Error creating raffle:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRaffleStatus = async (raffle: Raffle) => {
    try {
      // If activating, deactivate all other raffles first
      if (!raffle.is_active) {
        await supabase
          .from('raffles')
          .update({ is_active: false })
          .eq('admin_id', user.id)
      }

      const { error } = await supabase
        .from('raffles')
        .update({ is_active: !raffle.is_active })
        .eq('id', raffle.id)

      if (error) throw error

      setRaffles(raffles.map(r => ({
        ...r,
        is_active: r.id === raffle.id ? !r.is_active : false
      })))
    } catch (error) {
      console.error('Error updating raffle:', error)
    }
  }

  const deleteRaffle = async (raffleId: string) => {
    if (!confirm('Estas seguro de eliminar este sorteo? Se eliminaran todos los cartones asociados.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', raffleId)

      if (error) throw error

      setRaffles(raffles.filter(r => r.id !== raffleId))
      if (selectedRaffle?.id === raffleId) {
        setSelectedRaffle(null)
      }
    } catch (error) {
      console.error('Error deleting raffle:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-amber-400/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BearLogo size={40} />
              <div>
                <span className="font-bold text-xl text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  Panel Admin
                </span>
                <p className="text-xs text-zinc-400">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              Cerrar Sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetric
            icon={<Ticket className="h-5 w-5" />}
            label="Cartones emitidos"
            value={String(totalCards)}
            detail="Todos los sorteos"
          />
          <AdminMetric
            icon={<Radio className="h-5 w-5" />}
            label="Sorteo activo"
            value={activeRaffle ? '1' : '0'}
            detail={activeRaffle?.name ?? 'Ninguno activo'}
          />
          <AdminMetric
            icon={<Clock className="h-5 w-5" />}
            label="En vivo"
            value={String(liveCount)}
            detail="Sorteos corriendo"
          />
          <AdminMetric
            icon={<Trophy className="h-5 w-5" />}
            label="Finalizados"
            value={String(finishedCount)}
            detail="Con resultados"
          />
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-amber-400/20 bg-zinc-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-bold text-white">
              <BarChart3 className="h-5 w-5 text-amber-300" />
              Accesos publicos del sorteo
            </p>
            <p className="mt-1 text-sm text-zinc-400">Usalos para compartir participacion, proyectar el vivo o mostrar resultados.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10">
              <Link href="/participar" target="_blank">
                Participar
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-400/40 bg-transparent text-emerald-200 hover:bg-emerald-400/10">
              <Link href="/en-vivo" target="_blank">
                En Vivo
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-zinc-600 bg-transparent text-zinc-200 hover:bg-white/10">
              <Link href="/ganadores" target="_blank">
                Ganadores
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          {/* Left Column - Raffles List */}
          <div className="min-w-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Mis Sorteos
              </h2>
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {showForm ? 'Cancelar' : 'Nuevo Sorteo'}
              </Button>
            </div>

            {/* Create Raffle Form */}
            {showForm && (
              <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100">
                <CardHeader>
                  <CardTitle className="text-white">Crear Nuevo Sorteo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRaffle} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-zinc-300">Nombre del Sorteo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Sorteo Navidad 2024"
                        required
                        className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-zinc-300">Descripcion (opcional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe el sorteo..."
                        className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      {isLoading ? 'Creando...' : 'Crear Sorteo'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Raffles List */}
            <div className="space-y-4">
              {raffles.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-950/70">
                  <CardContent className="py-8 text-center">
                    <BearLogo size={60} sad className="mx-auto mb-4 opacity-50" />
                    <p className="text-zinc-300">No tienes sorteos creados aun.</p>
                    <p className="text-sm text-zinc-500">Crea tu primer sorteo para comenzar.</p>
                  </CardContent>
                </Card>
              ) : (
                raffles.map((raffle) => (
                  <Card 
                    key={raffle.id} 
                    className={`cursor-pointer border-zinc-800 transition-all hover:border-amber-400/50 hover:shadow-md ${
                      selectedRaffle?.id === raffle.id ? 'ring-2 ring-amber-400 bg-amber-400/10' : 'bg-zinc-950/80'
                    }`}
                    onClick={() => setSelectedRaffle(raffle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {raffle.name}
                            </h3>
                            <Badge 
                              variant={raffle.is_active ? 'default' : 'secondary'}
                              className={raffle.is_active 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-gray-400'
                              }
                            >
                              {raffle.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          {raffle.description && (
                            <p className="text-sm text-zinc-400 truncate">{raffle.description}</p>
                          )}
                          <p className="text-xs text-zinc-500 mt-1">
                            Creado: {new Date(raffle.created_at).toLocaleDateString('es-ES')}
                          </p>
                          <p className="mt-1 text-xs font-medium text-amber-200">
                            {raffle.bingo_cards?.[0]?.count ?? 0} carton{(raffle.bingo_cards?.[0]?.count ?? 0) !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant={raffle.is_active ? 'destructive' : 'default'}
                            onClick={() => toggleRaffleStatus(raffle)}
                            className={!raffle.is_active 
                              ? 'bg-green-500 hover:bg-green-600 text-xs' 
                              : 'text-xs'
                            }
                          >
                            {raffle.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRaffle(raffle.id)}
                            className="border-red-400/40 bg-transparent text-red-300 hover:bg-red-500/10 text-xs"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Participants */}
          <div className="min-w-0">
            {selectedRaffle ? (
              <RaffleParticipants
                raffle={selectedRaffle}
                onRaffleUpdated={(updatedRaffle) => {
                  setSelectedRaffle(updatedRaffle as Raffle)
                  setRaffles((current) =>
                    current.map((raffle) => (raffle.id === updatedRaffle.id ? { ...raffle, ...updatedRaffle } : raffle))
                  )
                }}
              />
            ) : (
              <Card className="border-zinc-800 bg-zinc-950/70 h-full min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-16">
                  <BearLogo size={80} className="mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Selecciona un Sorteo
                  </h3>
                  <p className="text-zinc-400 text-center max-w-md">
                    Haz clic en uno de tus sorteos para ver los participantes y sus cartones.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function AdminMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100 shadow-lg shadow-black/15">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
            <p className="mt-1 truncate text-xs text-amber-200">{detail}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-amber-200">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
