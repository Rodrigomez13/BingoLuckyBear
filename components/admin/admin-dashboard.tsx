'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BearLogo size={40} />
              <div>
                <span className="font-bold text-xl text-amber-900" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  Panel Admin
                </span>
                <p className="text-xs text-amber-600">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Cerrar Sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Raffles List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-fredoka)' }}>
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
              <Card className="border-amber-200 bg-white/80">
                <CardHeader>
                  <CardTitle className="text-amber-900">Crear Nuevo Sorteo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateRaffle} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-amber-800">Nombre del Sorteo</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Sorteo Navidad 2024"
                        required
                        className="border-amber-200 focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-amber-800">Descripcion (opcional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe el sorteo..."
                        className="border-amber-200 focus:border-amber-400"
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
                <Card className="border-amber-200 bg-white/60">
                  <CardContent className="py-8 text-center">
                    <BearLogo size={60} sad className="mx-auto mb-4 opacity-50" />
                    <p className="text-amber-700">No tienes sorteos creados aun.</p>
                    <p className="text-sm text-amber-600">Crea tu primer sorteo para comenzar.</p>
                  </CardContent>
                </Card>
              ) : (
                raffles.map((raffle) => (
                  <Card 
                    key={raffle.id} 
                    className={`border-amber-200 cursor-pointer transition-all hover:shadow-md ${
                      selectedRaffle?.id === raffle.id ? 'ring-2 ring-amber-400 bg-amber-50' : 'bg-white/80'
                    }`}
                    onClick={() => setSelectedRaffle(raffle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-amber-900 truncate">
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
                            <p className="text-sm text-amber-600 truncate">{raffle.description}</p>
                          )}
                          <p className="text-xs text-amber-500 mt-1">
                            Creado: {new Date(raffle.created_at).toLocaleDateString('es-ES')}
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
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
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
          <div className="lg:col-span-2">
            {selectedRaffle ? (
              <RaffleParticipants raffle={selectedRaffle} />
            ) : (
              <Card className="border-amber-200 bg-white/60 h-full min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-16">
                  <BearLogo size={80} className="mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">
                    Selecciona un Sorteo
                  </h3>
                  <p className="text-amber-600 text-center max-w-md">
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
