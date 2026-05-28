'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, BarChart3, CalendarDays, Clock, DollarSign, ExternalLink, Gift, Plus, Radio, Ticket, Trash2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { RaffleParticipants } from './raffle-participants'
import type { User } from '@supabase/supabase-js'
import { formatMoneyAmount, getPrizeAmounts, normalizePrizeAmounts } from '@/lib/bingo'

interface Raffle {
  id: string
  name: string
  description: string | null
  prize?: string | null
  additional_prizes?: string[] | null
  amount?: string | null
  bundle_offers?: string[] | null
  draw_date?: string | null
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
  const [prize, setPrize] = useState('')
  const [additionalPrizes, setAdditionalPrizes] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [bundleOffers, setBundleOffers] = useState<string[]>([])
  const [drawDate, setDrawDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const activeRaffle = raffles.find((raffle) => raffle.is_active)
  const finishedCount = raffles.filter((raffle) => raffle.draw_status === 'finished').length
  const liveCount = raffles.filter((raffle) => raffle.draw_status === 'running').length
  const totalCards = raffles.reduce((total, raffle) => total + (raffle.bingo_cards?.[0]?.count ?? 0), 0)

  const cleanTextItems = (items: string[]) => items.map((item) => item.trim()).filter(Boolean)
  const prizeInputValues = [prize, additionalPrizes[0] ?? '', additionalPrizes[1] ?? '']

  const updatePrizeInput = (index: number, value: string) => {
    if (index === 0) {
      setPrize(value)
      return
    }

    setAdditionalPrizes((current) => {
      const next = [current[0] ?? '', current[1] ?? '']
      next[index - 1] = value
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCreateError(null)

    try {
      const sortedPrizes = normalizePrizeAmounts(prizeInputValues)

      if (sortedPrizes.length !== 3) {
        setCreateError('Carga los 3 montos de premios antes de crear el sorteo.')
        return
      }

      const response = await fetch('/api/raffles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          prizes: sortedPrizes,
          amount,
          bundle_offers: cleanTextItems(bundleOffers),
          draw_date: drawDate || null,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el sorteo')
      }

      setRaffles([data.raffle, ...raffles])
      setName('')
      setDescription('')
      setPrize('')
      setAdditionalPrizes([])
      setAmount('')
      setBundleOffers([])
      setDrawDate('')
      setCreateError(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error creating raffle:', error)
      const message = error instanceof Error ? error.message : 'No se pudo crear el sorteo.'
      const isMissingColumn = /schema cache|column|additional_prizes|bundle_offers|draw_date|prize|amount/i.test(message)

      setCreateError(
        isMissingColumn
          ? 'Supabase rechazo el guardado. Revisa que hayas aplicado supabase-raffle-details-migration.sql en tu proyecto y vuelve a intentar.'
          : message
      )
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
            <div className="flex min-w-0 items-center gap-3">
              <BearLogo size={40} />
              <div className="min-w-0">
                <span className="block truncate text-lg font-semibold tracking-tight text-white">
                  Panel Admin
                </span>
                <p className="max-w-[160px] truncate text-xs text-zinc-400 sm:max-w-none">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="shrink-0 border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              <span className="hidden sm:inline">Cerrar Sesion</span>
              <span className="sm:hidden">Salir</span>
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
          <div className="grid gap-2 sm:grid-cols-3">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-white">
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-zinc-300">Monto del carton</Label>
                        <Input
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Ej: $2.000"
                          className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                      <div>
                        <Label className="text-zinc-200">Premios por fila</Label>
                        <p className="mt-1 text-sm text-zinc-400">
                          Carga tres montos. Se ordenan de mayor a menor: premio 1, premio 2 y premio 3.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {prizeInputValues.map((value, index) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`prize-${index}`} className="text-zinc-300">
                              Monto de premio {index + 1}
                            </Label>
                            <Input
                              id={`prize-${index}`}
                              value={value}
                              onChange={(event) => updatePrizeInput(index, event.target.value)}
                              placeholder={index === 0 ? 'Ej: $100.000' : index === 1 ? 'Ej: $50.000' : 'Ej: $25.000'}
                              required
                              className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="drawDate" className="text-zinc-300">Fecha del sorteo</Label>
                      <Input
                        id="drawDate"
                        type="datetime-local"
                        value={drawDate}
                        onChange={(e) => setDrawDate(e.target.value)}
                        className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                      />
                    </div>
                    <DynamicTextList
                      title="Promos por cantidad"
                      emptyText="Opcional: agrega ofertas como 3 cartones por $5.000."
                      addLabel="Agregar promo"
                      placeholder="Ej: 3 cartones por $5.000"
                      items={bundleOffers}
                      onChange={setBundleOffers}
                    />
                    {createError && (
                      <div className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{createError}</span>
                      </div>
                    )}
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
                          <div className="mt-3 grid gap-2 text-xs text-zinc-300">
                            {getPrizeAmounts(raffle.prize, raffle.additional_prizes).length > 0 ? (
                              getPrizeAmounts(raffle.prize, raffle.additional_prizes).map((item, index) => (
                                <RaffleMeta key={`${item}-${index}`} icon={index === 0 ? <Gift className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />} value={`Premio ${index + 1}: ${item}`} />
                              ))
                            ) : (
                              <RaffleMeta icon={<Gift className="h-3.5 w-3.5" />} value="Premios sin cargar" />
                            )}
                            <RaffleMeta icon={<DollarSign className="h-3.5 w-3.5" />} value={formatMoneyAmount(raffle.amount, 'Monto sin cargar')} />
                            <RaffleMeta
                              icon={<Ticket className="h-3.5 w-3.5" />}
                              value={
                                raffle.bundle_offers?.length
                                  ? `${raffle.bundle_offers.length} promo${raffle.bundle_offers.length !== 1 ? 's' : ''} por cantidad`
                                  : 'Sin promos por cantidad'
                              }
                            />
                            <RaffleMeta
                              icon={<CalendarDays className="h-3.5 w-3.5" />}
                              value={raffle.draw_date ? new Date(raffle.draw_date).toLocaleString('es-ES') : 'Fecha sin cargar'}
                            />
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            Creado: {new Date(raffle.created_at).toLocaleDateString('es-ES')}
                          </p>
                          <p className="mt-1 text-xs font-medium text-amber-200">
                            {raffle.bingo_cards?.[0]?.count ?? 0} carton{(raffle.bingo_cards?.[0]?.count ?? 0) !== 1 ? 'es' : ''}
                          </p>
                        </div>
                        <div className="grid shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
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
              <Card className="h-full min-h-96 border-zinc-800 bg-zinc-950/70">
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
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
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

function RaffleMeta({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
      <span className="shrink-0 text-amber-200">{icon}</span>
      <span className="truncate">{value}</span>
    </p>
  )
}

function DynamicTextList({
  title,
  emptyText,
  addLabel,
  placeholder,
  items,
  onChange,
}: {
  title: string
  emptyText: string
  addLabel: string
  placeholder: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-zinc-300">{title}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...items, ''])}
          className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={item}
                onChange={(event) =>
                  onChange(items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)))
                }
                placeholder={placeholder}
                className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                className="border-red-400/40 bg-transparent text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
