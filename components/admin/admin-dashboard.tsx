'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, BarChart3, Clock, ExternalLink, Landmark, Plus, Radio, Save, Ticket, Trash2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { RaffleParticipants } from './raffle-participants'
import type { User } from '@supabase/supabase-js'
import { formatMoneyAmount, getPrizeAmounts, getPrizeSchedule, normalizePrizeAmounts } from '@/lib/bingo'
import { formatArgentinaDateTime } from '@/lib/date'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  payment_account_id?: string | null
  bingo_cards?: { count: number }[]
}

interface PaymentAccount {
  id: string
  name: string
  holder: string
  alias?: string | null
  cbu?: string | null
  bank?: string | null
  concept?: string | null
  note?: string | null
  is_default: boolean
}

interface AdminDashboardProps {
  user: User
  initialRaffles: Raffle[]
  initialPaymentAccounts: PaymentAccount[]
}

const emptyPaymentForm = {
  id: '',
  name: '',
  holder: '',
  alias: '',
  cbu: '',
  bank: '',
  concept: '',
  note: '',
  is_default: false,
}

export function AdminDashboard({ user, initialRaffles, initialPaymentAccounts }: AdminDashboardProps) {
  const [raffles, setRaffles] = useState<Raffle[]>(initialRaffles)
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(initialPaymentAccounts)
  const [activeSection, setActiveSection] = useState<'overview' | 'raffles' | 'payments'>('overview')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prize, setPrize] = useState('')
  const [additionalPrizes, setAdditionalPrizes] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [paymentAccountId, setPaymentAccountId] = useState(initialPaymentAccounts.find((account) => account.is_default)?.id ?? initialPaymentAccounts[0]?.id ?? '')
  const [bundleOffers, setBundleOffers] = useState<string[]>([])
  const [drawDate, setDrawDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null)
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [rafflesPage, setRafflesPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const router = useRouter()
  const supabase = createClient()
  const activeRaffle = raffles.find((raffle) => raffle.is_active)
  const finishedCount = raffles.filter((raffle) => raffle.draw_status === 'finished').length
  const liveCount = raffles.filter((raffle) => raffle.draw_status === 'running').length
  const totalCards = raffles.reduce((total, raffle) => total + (raffle.bingo_cards?.[0]?.count ?? 0), 0)
  const sortedRaffles = [...raffles].sort((a, b) => {
    const statusWeight = (raffle: Raffle) => {
      if (raffle.draw_status === 'running') return 0
      if (raffle.is_active) return 1
      if (raffle.draw_status === 'finished') return 3
      return 2
    }

    const weightDiff = statusWeight(a) - statusWeight(b)
    if (weightDiff !== 0) return weightDiff

    const aDate = a.draw_date ? new Date(a.draw_date).getTime() : new Date(a.created_at).getTime()
    const bDate = b.draw_date ? new Date(b.draw_date).getTime() : new Date(b.created_at).getTime()
    return bDate - aDate
  })

  const cleanTextItems = (items: string[]) => items.map((item) => item.trim()).filter(Boolean)
  const prizeInputValues = [prize, additionalPrizes[0] ?? '', additionalPrizes[1] ?? '', additionalPrizes[2] ?? '']
  const prizeTargets = getPrizeSchedule(prizeInputValues)
  const rafflesPerPage = 9
  const paymentsPerPage = 8
  const rafflesPageCount = Math.max(1, Math.ceil(sortedRaffles.length / rafflesPerPage))
  const paymentsPageCount = Math.max(1, Math.ceil(paymentAccounts.length / paymentsPerPage))
  const visibleRaffles = sortedRaffles.slice((rafflesPage - 1) * rafflesPerPage, rafflesPage * rafflesPerPage)
  const visiblePaymentAccounts = paymentAccounts.slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage)

  const updatePrizeInput = (index: number, value: string) => {
    if (index === 0) {
      setPrize(value)
      return
    }

    setAdditionalPrizes((current) => {
      const next = [current[0] ?? '', current[1] ?? '', current[2] ?? '']
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

      if (sortedPrizes.length !== 4) {
        setCreateError('Carga los 4 montos de premios antes de crear el sorteo.')
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
          payment_account_id: paymentAccountId || null,
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
      setPaymentAccountId(paymentAccounts.find((account) => account.is_default)?.id ?? paymentAccounts[0]?.id ?? '')
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
    if (raffle.draw_status === 'finished') {
      return
    }

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

  const getRaffleBadge = (raffle: Raffle) => {
    if (raffle.draw_status === 'finished') {
      return { label: 'Cerrado', className: 'bg-zinc-600 text-white hover:bg-zinc-600' }
    }

    if (raffle.draw_status === 'running') {
      return { label: 'En vivo', className: 'bg-red-500 text-white hover:bg-red-500' }
    }

    if (raffle.is_active) {
      return { label: 'Disponible', className: 'bg-green-500 text-white hover:bg-green-500' }
    }

    return { label: 'Pausado', className: 'bg-gray-400 text-zinc-950 hover:bg-gray-400' }
  }

  const getPaymentAccountLabel = (accountId?: string | null) => {
    const account = paymentAccounts.find((item) => item.id === accountId)
    return account?.name ?? 'Sin cuenta asignada'
  }

  const getRafflePrizeSummary = (raffle: Raffle) => {
    const prizes = getPrizeSchedule(getPrizeAmounts(raffle.prize, raffle.additional_prizes)).filter((target) => target.amount)
    const jackpot = prizes.find((target) => target.prizeNumber === 4)
    return jackpot ? jackpot.amount : 'Premios sin cargar'
  }

  const formatDateTime = (date?: string | null) => formatArgentinaDateTime(date, 'Sin fecha')

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

  const savePaymentAccount = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingPayment(true)
    setPaymentError(null)

    try {
      const isEditing = Boolean(paymentForm.id)
      const response = await fetch(isEditing ? `/api/payment-accounts/${paymentForm.id}` : '/api/payment-accounts', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar la cuenta')
      }

      setPaymentAccounts((current) => {
        const next = data.account.is_default ? current.map((account) => ({ ...account, is_default: false })) : current
        return isEditing
          ? next.map((account) => (account.id === data.account.id ? data.account : account))
          : [data.account, ...next]
      })
      setPaymentForm(emptyPaymentForm)
      setIsPaymentModalOpen(false)
      if (!paymentAccountId || data.account.is_default) {
        setPaymentAccountId(data.account.id)
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'No se pudo guardar la cuenta')
    } finally {
      setIsSavingPayment(false)
    }
  }

  const editPaymentAccount = (account: PaymentAccount) => {
    setPaymentForm({
      id: account.id,
      name: account.name,
      holder: account.holder,
      alias: account.alias ?? '',
      cbu: account.cbu ?? '',
      bank: account.bank ?? '',
      concept: account.concept ?? '',
      note: account.note ?? '',
      is_default: account.is_default,
    })
    setIsPaymentModalOpen(true)
  }

  const deletePaymentAccount = async (accountId: string) => {
    if (!confirm('Eliminar esta cuenta de cobro? Los sorteos que la usaban quedaran sin cuenta asignada.')) {
      return
    }

    const response = await fetch(`/api/payment-accounts/${accountId}`, { method: 'DELETE' })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setPaymentError(data?.error ?? 'No se pudo eliminar la cuenta')
      return
    }

    setPaymentAccounts((current) => current.filter((account) => account.id !== accountId))
    if (paymentAccountId === accountId) {
      setPaymentAccountId('')
    }
    if (paymentForm.id === accountId) {
      setPaymentForm(emptyPaymentForm)
    }
  }

  return (
    <div className="lbb-page-shell relative min-h-screen text-zinc-100">
      <div className="lbb-ambient" />
      {/* Header */}
      <header className="sticky top-3 z-50 px-3 sm:top-5">
        <div className="mx-auto max-w-[1800px] rounded-2xl border border-white/10 bg-black/72 px-4 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:px-6 lg:px-8 2xl:px-10">
          <div className="flex h-16 items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <BearLogo size={40} />
              <div className="min-w-0">
                <span className="block truncate font-mono text-base font-bold tracking-tight text-white">
                  Panel Admin
                </span>
                <p className="max-w-[160px] truncate text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300 sm:max-w-none">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="shrink-0 rounded-full border-white/15 bg-transparent text-amber-200 hover:border-amber-300 hover:bg-amber-300/10"
            >
              <span className="hidden sm:inline">Cerrar Sesion</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1800px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8 2xl:px-10">
        <aside className="lbb-premium-panel h-fit rounded-[1.35rem] p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Panel</p>
          <nav className="grid gap-2">
            <AdminNavButton active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} icon={<BarChart3 className="h-4 w-4" />} label="Resumen" />
            <AdminNavButton active={activeSection === 'raffles'} onClick={() => setActiveSection('raffles')} icon={<Ticket className="h-4 w-4" />} label="Sorteos" />
            <AdminNavButton active={activeSection === 'payments'} onClick={() => setActiveSection('payments')} icon={<Landmark className="h-4 w-4" />} label="Cuentas" />
          </nav>
        </aside>

        <div className="min-w-0">
        {activeSection === 'overview' && (
        <>
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
        </>
        )}

        {activeSection === 'payments' && (
        <Card className="lbb-premium-panel mb-8 rounded-[1.35rem] border-white/10 text-zinc-100">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Landmark className="h-5 w-5 text-amber-300" />
                Cuentas para recibir pagos
              </CardTitle>
              <Button
                onClick={() => {
                  setPaymentForm(emptyPaymentForm)
                  setIsPaymentModalOpen(true)
                }}
                className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva cuenta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 overflow-hidden rounded-md border border-white/10 bg-black/20">
              {paymentAccounts.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-700 p-5 text-sm text-zinc-400">
                  Guarda una cuenta para mostrarla automaticamente al comprador cuando cree su carton.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  <div className="hidden grid-cols-[1.1fr_1fr_1.15fr_0.9fr_0.75fr_96px] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 lg:grid">
                    <span>Cuenta</span>
                    <span>Titular</span>
                    <span>Alias / CBU</span>
                    <span>Banco</span>
                    <span>Estado</span>
                    <span className="text-right">Acciones</span>
                  </div>
                  {visiblePaymentAccounts.map((account) => (
                    <div key={account.id} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1fr_1.15fr_0.9fr_0.75fr_96px] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{account.name}</p>
                        <p className="mt-1 text-xs text-zinc-500 lg:hidden">Cuenta</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-300">{account.holder}</p>
                        <p className="mt-1 text-xs text-zinc-500 lg:hidden">Titular</p>
                      </div>
                      <div className="min-w-0">
                        <p className="break-all font-semibold text-amber-200">{account.alias || account.cbu || 'Sin alias/CBU'}</p>
                        <p className="mt-1 text-xs text-zinc-500 lg:hidden">Alias / CBU</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-300">{account.bank || 'Sin banco'}</p>
                        <p className="mt-1 text-xs text-zinc-500 lg:hidden">Banco</p>
                      </div>
                      <div>
                        {account.is_default ? (
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Predeterminada</Badge>
                        ) : (
                          <span className="text-zinc-500">Disponible</span>
                        )}
                      </div>
                      <div className="flex justify-start gap-2 lg:justify-end">
                        <Button type="button" size="sm" variant="outline" onClick={() => editPaymentAccount(account)} className="h-8 border-amber-400/40 bg-transparent px-3 text-amber-200 hover:bg-amber-400/10">
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => deletePaymentAccount(account.id)} className="h-8 border-red-400/40 bg-transparent px-2 text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {paymentAccounts.length > paymentsPerPage && (
                    <div className="px-4 py-3">
                      <AdminPagination
                        page={paymentsPage}
                        pageCount={paymentsPageCount}
                        total={paymentAccounts.length}
                        onPrevious={() => setPaymentsPage((page) => Math.max(1, page - 1))}
                        onNext={() => setPaymentsPage((page) => Math.min(paymentsPageCount, page + 1))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {activeSection === 'raffles' && (
        <div className="grid gap-6">
          {/* Left Column - Raffles List */}
          <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Mis Sorteos
              </h2>
              <Button 
                onClick={() => setShowForm(true)}
                className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200"
              >
                Nuevo Sorteo
              </Button>
            </div>

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
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80">
                  <div className="hidden grid-cols-[0.85fr_minmax(150px,1.2fr)_1fr_0.8fr_0.85fr_0.75fr_118px] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 xl:grid">
                    <span>Estado</span>
                    <span>Sorteo</span>
                    <span>Fecha</span>
                    <span>Carton</span>
                    <span>Premio mayor</span>
                    <span>Cartones</span>
                    <span className="text-right">Acciones</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {visibleRaffles.map((raffle) => {
                      const badge = getRaffleBadge(raffle)
                      const cardsCount = raffle.bingo_cards?.[0]?.count ?? 0

                      return (
                        <div
                          key={raffle.id}
                          onClick={() => setSelectedRaffle(raffle)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedRaffle(raffle)
                            }
                          }}
                          className={`grid w-full cursor-pointer gap-3 px-4 py-4 text-left text-sm transition hover:bg-amber-400/5 xl:grid-cols-[0.85fr_minmax(150px,1.2fr)_1fr_0.8fr_0.85fr_0.75fr_118px] xl:items-center ${
                            selectedRaffle?.id === raffle.id ? 'bg-amber-400/10 ring-1 ring-inset ring-amber-400/50' : ''
                          }`}
                        >
                          <div>
                            <Badge className={badge.className}>{badge.label}</Badge>
                            <p className="mt-1 text-xs text-zinc-500 xl:hidden">Estado</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{raffle.name}</p>
                            <p className="mt-1 truncate text-xs text-zinc-500">
                              {raffle.description || getPaymentAccountLabel(raffle.payment_account_id)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-zinc-300">{formatDateTime(raffle.draw_date)}</p>
                            <p className="mt-1 text-xs text-zinc-500 xl:hidden">Fecha</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-zinc-300">{formatMoneyAmount(raffle.amount, 'Sin monto')}</p>
                            <p className="mt-1 text-xs text-zinc-500 xl:hidden">Carton</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-amber-200">{getRafflePrizeSummary(raffle)}</p>
                            <p className="mt-1 text-xs text-zinc-500 xl:hidden">Premio mayor</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-zinc-300">
                              {cardsCount} carton{cardsCount !== 1 ? 'es' : ''}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500 xl:hidden">Vendidos</p>
                          </div>
                          <div className="flex justify-start gap-2 xl:justify-end" onClick={(event) => event.stopPropagation()}>
                            <Button
                              size="sm"
                              variant={raffle.is_active ? 'destructive' : 'default'}
                              onClick={() => toggleRaffleStatus(raffle)}
                              disabled={raffle.draw_status === 'finished'}
                              className={!raffle.is_active ? 'h-8 bg-green-500 px-3 text-xs hover:bg-green-600' : 'h-8 px-3 text-xs'}
                            >
                              {raffle.draw_status === 'finished' ? 'Cerrado' : raffle.is_active ? 'Pausar' : 'Habilitar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRaffle(raffle.id)}
                              className="h-8 border-red-400/40 bg-transparent px-3 text-xs text-red-300 hover:bg-red-500/10"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    {sortedRaffles.length > rafflesPerPage && (
                      <div className="px-4 py-3">
                        <AdminPagination
                          page={rafflesPage}
                          pageCount={rafflesPageCount}
                          total={sortedRaffles.length}
                          onPrevious={() => setRafflesPage((page) => Math.max(1, page - 1))}
                          onNext={() => setRafflesPage((page) => Math.min(rafflesPageCount, page + 1))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
        )}
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-2rem)] w-[min(96vw,1120px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Sorteo</DialogTitle>
            </DialogHeader>
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
                <div className="space-y-2">
                  <Label htmlFor="paymentAccount" className="text-zinc-300">Cuenta de cobro</Label>
                  <select
                    id="paymentAccount"
                    value={paymentAccountId}
                    onChange={(event) => setPaymentAccountId(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">Usar datos por defecto</option>
                    {paymentAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}{account.is_default ? ' - predeterminada' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                <div>
                  <Label className="text-zinc-200">Premios por fila</Label>
                  <p className="mt-1 text-sm text-zinc-400">
                    Carga cuatro montos: menor por fila 3, intermedio por fila 2, grande por fila 1 y mayor por carton completo.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {prizeInputValues.map((value, index) => {
                    const target = prizeTargets[index]

                    return (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`prize-${index}`} className="text-zinc-300">
                          {target?.label ?? `Premio ${index + 1}`} ({target?.conditionLabel ?? 'Condicion'})
                        </Label>
                        <Input
                          id={`prize-${index}`}
                          value={value}
                          onChange={(event) => updatePrizeInput(index, event.target.value)}
                          placeholder={index === 0 ? 'Ej: $25.000' : index === 1 ? 'Ej: $50.000' : index === 2 ? 'Ej: $100.000' : 'Ej: $250.000'}
                          required
                          className="border-zinc-700 bg-zinc-900 text-white focus:border-amber-400"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawDate" className="text-zinc-300">Fecha y hora del sorteo (Argentina)</Label>
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
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-2rem)] w-[min(96vw,640px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white">{paymentForm.id ? 'Editar cuenta' : 'Agregar cuenta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={savePaymentAccount} className="space-y-3">
              <Input value={paymentForm.name} onChange={(event) => setPaymentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre interno, ej: Mercado Pago" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.holder} onChange={(event) => setPaymentForm((current) => ({ ...current, holder: event.target.value }))} placeholder="Titular de la cuenta" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.alias} onChange={(event) => setPaymentForm((current) => ({ ...current, alias: event.target.value }))} placeholder="Alias" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.cbu} onChange={(event) => setPaymentForm((current) => ({ ...current, cbu: event.target.value }))} placeholder="CBU/CVU" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.bank} onChange={(event) => setPaymentForm((current) => ({ ...current, bank: event.target.value }))} placeholder="Banco o billetera" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.concept} onChange={(event) => setPaymentForm((current) => ({ ...current, concept: event.target.value }))} placeholder="Concepto sugerido" className="border-zinc-700 bg-zinc-900 text-white" />
              <Textarea value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))} placeholder="Nota para el comprobante" className="border-zinc-700 bg-zinc-900 text-white" />
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={paymentForm.is_default}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, is_default: event.target.checked }))}
                  className="h-4 w-4 accent-amber-400"
                />
                Usar como cuenta predeterminada
              </label>
              {paymentError && <p className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-100">{paymentError}</p>}
              <Button type="submit" disabled={isSavingPayment} className="w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300">
                <Save className="mr-2 h-4 w-4" />
                {isSavingPayment ? 'Guardando' : 'Guardar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRaffle} onOpenChange={(open) => !open && setSelectedRaffle(null)}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-1.5rem)] w-[min(98vw,1900px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 p-4 text-zinc-100 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedRaffle?.name ?? 'Sorteo'}</DialogTitle>
            </DialogHeader>
            {selectedRaffle && (
              <RaffleParticipants
                raffle={selectedRaffle}
                paymentAccounts={paymentAccounts}
                onRaffleUpdated={(updatedRaffle) => {
                  setSelectedRaffle(updatedRaffle as Raffle)
                  setRaffles((current) =>
                    current.map((raffle) => (raffle.id === updatedRaffle.id ? { ...raffle, ...updatedRaffle } : raffle))
                  )
                }}
              />
            )}
          </DialogContent>
        </Dialog>
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
    <Card className="rounded-[1.2rem] border-white/10 bg-white/[0.045] text-zinc-100 shadow-xl shadow-black/15">
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

function AdminNavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
        active
          ? 'bg-amber-300 text-zinc-950 shadow-lg shadow-amber-950/25'
          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function AdminPagination({
  page,
  pageCount,
  total,
  onPrevious,
  onNext,
}: {
  page: number
  pageCount: number
  total: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-400">
        {total} registro{total !== 1 ? 's' : ''} - pagina {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={page <= 1}
          className="border-zinc-600 bg-transparent text-zinc-200 hover:bg-white/10"
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={page >= pageCount}
          className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
        >
          Siguiente
        </Button>
      </div>
    </div>
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
