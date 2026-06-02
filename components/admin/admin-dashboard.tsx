'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, BarChart3, ExternalLink, Landmark, Plus, Save, Search, Ticket, Trash2, Trophy, Users, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BearLogo } from '@/components/bear-logo'
import { RaffleParticipants } from './raffle-participants'
import type { User } from '@supabase/supabase-js'
import { formatMoneyAmount, getPrizeAmounts, getPrizeAwards, getPrizeSchedule, normalizePrizeAmounts } from '@/lib/bingo'
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

interface AdminBingoCard {
  id: string
  raffle_id: string
  card_number: string
  full_name: string
  dni: string
  address: string
  phone: string
  email: string
  payment_receipt_url: string
  payment_method?: string | null
  payment_reference?: string | null
  payout_account_kind?: string | null
  payout_account?: string | null
  payout_holder_name?: string | null
  payment_status?: 'pending' | 'approved' | 'rejected' | null
  receipt_amount?: number | null
  receipt_operation_number?: string | null
  receipt_destination_account?: string | null
  receipt_date?: string | null
  receipt_raw_text?: string | null
  receipt_parse_status?: 'not_parsed' | 'parsed' | 'failed' | 'not_configured' | null
  receipt_parse_error?: string | null
  receipt_validation_notes?: string | null
  receipt_parsed_at?: string | null
  created_at: string
  bingo_numbers: number[][] | null
  raffle?: Raffle | null
}

interface AdminDashboardProps {
  user: User
  initialRaffles: Raffle[]
  initialPaymentAccounts: PaymentAccount[]
  initialCards: AdminBingoCard[]
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

export function AdminDashboard({ user, initialRaffles, initialPaymentAccounts, initialCards }: AdminDashboardProps) {
  const [raffles, setRaffles] = useState<Raffle[]>(initialRaffles)
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(initialPaymentAccounts)
  const [cards] = useState<AdminBingoCard[]>(initialCards)
  const [activeSection, setActiveSection] = useState<'overview' | 'clients' | 'sales' | 'raffles' | 'payments'>('overview')
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
  const [clientsPage, setClientsPage] = useState(1)
  const [salesPage, setSalesPage] = useState(1)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientDni, setSelectedClientDni] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const finishedCount = raffles.filter((raffle) => raffle.draw_status === 'finished').length
  const totalCards = cards.length || raffles.reduce((total, raffle) => total + (raffle.bingo_cards?.[0]?.count ?? 0), 0)
  const raffleById = useMemo(() => new Map(raffles.map((raffle) => [raffle.id, raffle])), [raffles])
  const defaultPaymentAccountId = paymentAccounts.find((account) => account.is_default)?.id ?? null
  const awardLabelsByCardId = useMemo(() => {
    const awardsMap = new Map<string, string[]>()

    for (const raffle of raffles) {
      const raffleCards = cards.filter((card) => card.raffle_id === raffle.id)
      if (!raffleCards.length) continue

      const awards = getPrizeAwards(
        raffleCards,
        Array.isArray(raffle.drawn_numbers) ? raffle.drawn_numbers : [],
        getPrizeAmounts(raffle.prize, raffle.additional_prizes)
      )

      for (const award of awards) {
        for (const winner of award.winners) {
          const current = awardsMap.get(winner.id) ?? []
          current.push(`${award.label}${award.amount ? ` (${award.amount})` : ''}`)
          awardsMap.set(winner.id, current)
        }
      }
    }

    return awardsMap
  }, [cards, raffles])
  const clientSummaries = useMemo(() => {
    const byDni = new Map<string, {
      dni: string
      fullName: string
      phone: string
      email: string
      address: string
      cards: AdminBingoCard[]
      raffleNames: Set<string>
      awards: string[]
      estimatedAmount: number
      firstPurchase: string
      lastPurchase: string
    }>()

    for (const card of cards) {
      const normalizedDni = normalizeDni(card.dni)
      const key = normalizedDni || `sin-dni:${card.dni || card.full_name || card.id}`
      const raffle = raffleById.get(card.raffle_id) ?? card.raffle ?? null
      const current = byDni.get(key) ?? {
        dni: card.dni || 'Sin DNI',
        fullName: card.full_name,
        phone: card.phone,
        email: card.email,
        address: card.address,
        cards: [],
        raffleNames: new Set<string>(),
        awards: [],
        estimatedAmount: 0,
        firstPurchase: card.created_at,
        lastPurchase: card.created_at,
      }

      current.cards.push(card)
      if (raffle?.name) current.raffleNames.add(raffle.name)
      current.estimatedAmount += card.receipt_amount ?? parseMoneyAmount(raffle?.amount)
      current.firstPurchase = minIsoDate(current.firstPurchase, card.created_at)
      current.lastPurchase = maxIsoDate(current.lastPurchase, card.created_at)
      current.awards.push(...(awardLabelsByCardId.get(card.id) ?? []))
      byDni.set(key, current)
    }

    return [...byDni.entries()]
      .map(([key, summary]) => ({ key, ...summary }))
      .sort((a, b) => new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime())
  }, [awardLabelsByCardId, cards, raffleById])
  const filteredClientSummaries = useMemo(() => {
    const normalized = clientSearch.trim().toLowerCase()
    if (!normalized) return clientSummaries

    return clientSummaries.filter((client) =>
      [client.dni, client.fullName, client.phone, client.email, client.address, ...Array.from(client.raffleNames)]
        .some((value) => value.toLowerCase().includes(normalized))
    )
  }, [clientSearch, clientSummaries])
  const walletSalesSummaries = useMemo(() => {
    const byAccount = new Map<string, {
      accountId: string | null
      name: string
      holder: string
      alias: string
      cardsCount: number
      estimatedAmount: number
      raffles: Set<string>
      methods: Set<string>
      lastSale: string | null
    }>()

    for (const card of cards) {
      const raffle = raffleById.get(card.raffle_id) ?? card.raffle ?? null
      const accountId = raffle?.payment_account_id || defaultPaymentAccountId
      const account = paymentAccounts.find((item) => item.id === accountId)
      const key = accountId || 'unassigned'
      const current = byAccount.get(key) ?? {
        accountId,
        name: account?.name ?? 'Sin cuenta asignada',
        holder: account?.holder ?? 'Cuenta por defecto/env',
        alias: account?.alias || account?.cbu || 'Sin alias/CBU',
        cardsCount: 0,
        estimatedAmount: 0,
        raffles: new Set<string>(),
        methods: new Set<string>(),
        lastSale: null,
      }

      current.cardsCount += 1
      current.estimatedAmount += card.receipt_amount ?? parseMoneyAmount(raffle?.amount)
      if (raffle?.name) current.raffles.add(raffle.name)
      if (card.payment_method) current.methods.add(card.payment_method)
      current.lastSale = current.lastSale ? maxIsoDate(current.lastSale, card.created_at) : card.created_at
      byAccount.set(key, current)
    }

    return [...byAccount.values()].sort((a, b) => b.cardsCount - a.cardsCount)
  }, [cards, defaultPaymentAccountId, paymentAccounts, raffleById])
  const totalEstimatedIncome = cards.reduce((total, card) => {
    const raffle = raffleById.get(card.raffle_id) ?? card.raffle ?? null
    return total + (card.receipt_amount ?? parseMoneyAmount(raffle?.amount))
  }, 0)
  const selectedClient = selectedClientDni ? clientSummaries.find((client) => client.key === selectedClientDni) ?? null : null
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
  const clientsPerPage = 10
  const salesPerPage = 8
  const rafflesPageCount = Math.max(1, Math.ceil(sortedRaffles.length / rafflesPerPage))
  const paymentsPageCount = Math.max(1, Math.ceil(paymentAccounts.length / paymentsPerPage))
  const clientsPageCount = Math.max(1, Math.ceil(filteredClientSummaries.length / clientsPerPage))
  const salesPageCount = Math.max(1, Math.ceil(walletSalesSummaries.length / salesPerPage))
  const visibleRaffles = sortedRaffles.slice((rafflesPage - 1) * rafflesPerPage, rafflesPage * rafflesPerPage)
  const visiblePaymentAccounts = paymentAccounts.slice((paymentsPage - 1) * paymentsPerPage, paymentsPage * paymentsPerPage)
  const visibleClients = filteredClientSummaries.slice((clientsPage - 1) * clientsPerPage, clientsPage * clientsPerPage)
  const visibleWalletSales = walletSalesSummaries.slice((salesPage - 1) * salesPerPage, salesPage * salesPerPage)

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

  const downloadCsv = (filename: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportClientsCsv = () => {
    downloadCsv(
      'clientes_lucky_bingo_bear.csv',
      ['DNI', 'Nombre', 'Telefono', 'Email', 'Direccion', 'Cartones', 'Sorteos', 'Monto', 'Premios', 'Primera compra', 'Ultima compra'],
      filteredClientSummaries.map((client) => [
        client.dni,
        client.fullName,
        client.phone,
        client.email,
        client.address,
        client.cards.length,
        Array.from(client.raffleNames).join(' | '),
        client.estimatedAmount,
        client.awards.join(' | '),
        formatDateTime(client.firstPurchase),
        formatDateTime(client.lastPurchase),
      ])
    )
  }

  const exportSalesCsv = () => {
    downloadCsv(
      'ventas_por_billetera_lucky_bingo_bear.csv',
      ['Billetera', 'Titular', 'Alias/CBU', 'Cartones', 'Monto', 'Sorteos', 'Metodos', 'Ultima venta'],
      walletSalesSummaries.map((sale) => [
        sale.name,
        sale.holder,
        sale.alias,
        sale.cardsCount,
        sale.estimatedAmount,
        Array.from(sale.raffles).join(' | '),
        Array.from(sale.methods).join(' | '),
        formatDateTime(sale.lastSale),
      ])
    )
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
            <AdminNavButton active={activeSection === 'clients'} onClick={() => setActiveSection('clients')} icon={<Users className="h-4 w-4" />} label="Clientes" />
            <AdminNavButton active={activeSection === 'sales'} onClick={() => setActiveSection('sales')} icon={<WalletCards className="h-4 w-4" />} label="Ventas" />
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
            icon={<Users className="h-5 w-5" />}
            label="Clientes"
            value={String(clientSummaries.length)}
            detail="Agrupados por DNI"
          />
          <AdminMetric
            icon={<WalletCards className="h-5 w-5" />}
            label="Ingresos estimados"
            value={formatARS(totalEstimatedIncome)}
            detail="Segun monto por carton"
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

        {activeSection === 'clients' && (
        <Card className="lbb-premium-panel mb-8 rounded-[1.35rem] border-white/10 text-zinc-100">
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-amber-300" />
                  Clientes
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-400">DNI como referencia para agrupar cartones, compras y premios.</p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:max-w-2xl">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={clientSearch}
                    onChange={(event) => {
                      setClientSearch(event.target.value)
                      setClientsPage(1)
                    }}
                    placeholder="Buscar por DNI, nombre, telefono o sorteo"
                    className="border-zinc-700 bg-zinc-900 pl-9 text-white focus:border-amber-400"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportClientsCsv}
                  disabled={filteredClientSummaries.length === 0}
                  className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
                >
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <SummaryBox label="Clientes" value={String(clientSummaries.length)} />
              <SummaryBox label="Cartones" value={String(totalCards)} />
              <SummaryBox label="Con premios" value={String(clientSummaries.filter((client) => client.awards.length > 0).length)} />
              <SummaryBox label="Ingreso estimado" value={formatARS(totalEstimatedIncome)} />
            </div>
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
              {visibleClients.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400">
                  Todavia no hay clientes para mostrar.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  <div className="hidden grid-cols-[0.8fr_1.15fr_0.9fr_0.75fr_0.85fr_0.9fr_110px] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 xl:grid">
                    <span>DNI</span>
                    <span>Cliente</span>
                    <span>Contacto</span>
                    <span>Cartones</span>
                    <span>Compras</span>
                    <span>Premios</span>
                    <span className="text-right">Detalles</span>
                  </div>
                  {visibleClients.map((client) => (
                    <div key={client.key} className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[0.8fr_1.15fr_0.9fr_0.75fr_0.85fr_0.9fr_110px] xl:items-center">
                      <div>
                        <p className="font-mono font-bold text-amber-200">{client.dni}</p>
                        <p className="mt-1 text-xs text-zinc-500 xl:hidden">DNI</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{client.fullName}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">{Array.from(client.raffleNames).join(', ') || 'Sin sorteo'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-300">{client.phone}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">{client.email}</p>
                      </div>
                      <div>
                        <p className="font-bold text-white">{client.cards.length}</p>
                        <p className="mt-1 text-xs text-zinc-500">carton{client.cards.length !== 1 ? 'es' : ''}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200">{formatARS(client.estimatedAmount)}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDateTime(client.lastPurchase)}</p>
                      </div>
                      <div>
                        {client.awards.length > 0 ? (
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">{client.awards.length} premio{client.awards.length !== 1 ? 's' : ''}</Badge>
                        ) : (
                          <span className="text-zinc-500">Sin premios</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClientDni(client.key)}
                        className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10 xl:justify-self-end"
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                  {filteredClientSummaries.length > clientsPerPage && (
                    <div className="px-4 py-3">
                      <AdminPagination
                        page={clientsPage}
                        pageCount={clientsPageCount}
                        total={filteredClientSummaries.length}
                        onPrevious={() => setClientsPage((page) => Math.max(1, page - 1))}
                        onNext={() => setClientsPage((page) => Math.min(clientsPageCount, page + 1))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {activeSection === 'sales' && (
        <Card className="lbb-premium-panel mb-8 rounded-[1.35rem] border-white/10 text-zinc-100">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <WalletCards className="h-5 w-5 text-amber-300" />
                Ventas por billetera
              </CardTitle>
              <p className="mt-1 text-sm text-zinc-400">Cantidad de cartones e ingreso estimado agrupado por cuenta de cobro asignada.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={exportSalesCsv}
              disabled={walletSalesSummaries.length === 0}
              className="mt-4 border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10"
            >
              Exportar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <SummaryBox label="Cuentas con ventas" value={String(walletSalesSummaries.length)} />
              <SummaryBox label="Cartones vendidos" value={String(totalCards)} />
              <SummaryBox label="Monto ingresado estimado" value={formatARS(totalEstimatedIncome)} />
            </div>
            <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
              {visibleWalletSales.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400">
                  Todavia no hay ventas registradas.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  <div className="hidden grid-cols-[1fr_1fr_0.7fr_0.85fr_1fr_0.85fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 xl:grid">
                    <span>Billetera</span>
                    <span>Alias / titular</span>
                    <span>Cartones</span>
                    <span>Monto</span>
                    <span>Sorteos</span>
                    <span>Ultima venta</span>
                  </div>
                  {visibleWalletSales.map((sale) => (
                    <div key={sale.accountId ?? 'unassigned'} className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1fr_1fr_0.7fr_0.85fr_1fr_0.85fr] xl:items-center">
                      <div>
                        <p className="font-bold text-white">{sale.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{Array.from(sale.methods).join(', ') || 'Sin metodo informado'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="break-all font-semibold text-amber-200">{sale.alias}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">{sale.holder}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{sale.cardsCount}</p>
                        <p className="text-xs text-zinc-500">carton{sale.cardsCount !== 1 ? 'es' : ''}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-200">{formatARS(sale.estimatedAmount)}</p>
                        <p className="mt-1 text-xs text-zinc-500">estimado</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-300">{Array.from(sale.raffles).join(', ') || 'Sin sorteo'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-300">{formatDateTime(sale.lastSale)}</p>
                      </div>
                    </div>
                  ))}
                  {walletSalesSummaries.length > salesPerPage && (
                    <div className="px-4 py-3">
                      <AdminPagination
                        page={salesPage}
                        pageCount={salesPageCount}
                        total={walletSalesSummaries.length}
                        onPrevious={() => setSalesPage((page) => Math.max(1, page - 1))}
                        onNext={() => setSalesPage((page) => Math.min(salesPageCount, page + 1))}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-50">
              El monto es estimado porque el sistema todavia no guarda el importe real detectado en cada comprobante. Para promos, conviene agregar una columna de importe pagado o extraerlo del comprobante.
            </p>
          </CardContent>
        </Card>
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
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-2rem)] w-[min(98vw,1480px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nuevo Sorteo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRaffle} className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
              <div className="space-y-2 xl:row-span-2">
                <Label htmlFor="description" className="text-zinc-300">Descripcion (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el sorteo..."
                  className="min-h-28 border-zinc-700 bg-zinc-900 text-white focus:border-amber-400 xl:min-h-full"
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
              <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 xl:col-span-2">
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
              <div className="xl:col-span-2">
              <DynamicTextList
                title="Promos por cantidad"
                emptyText="Opcional: agrega ofertas como 3 cartones por $5.000."
                addLabel="Agregar promo"
                placeholder="Ej: 3 cartones por $5.000"
                items={bundleOffers}
                onChange={setBundleOffers}
              />
              </div>
              {createError && (
                <div className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100 xl:col-span-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 xl:col-span-2"
              >
                {isLoading ? 'Creando...' : 'Crear Sorteo'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-2rem)] w-[min(96vw,860px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white">{paymentForm.id ? 'Editar cuenta' : 'Agregar cuenta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={savePaymentAccount} className="grid gap-3 sm:grid-cols-2">
              <Input value={paymentForm.name} onChange={(event) => setPaymentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre interno, ej: Mercado Pago" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.holder} onChange={(event) => setPaymentForm((current) => ({ ...current, holder: event.target.value }))} placeholder="Titular de la cuenta" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.alias} onChange={(event) => setPaymentForm((current) => ({ ...current, alias: event.target.value }))} placeholder="Alias" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.cbu} onChange={(event) => setPaymentForm((current) => ({ ...current, cbu: event.target.value }))} placeholder="CBU/CVU" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.bank} onChange={(event) => setPaymentForm((current) => ({ ...current, bank: event.target.value }))} placeholder="Banco o billetera" className="border-zinc-700 bg-zinc-900 text-white" />
              <Input value={paymentForm.concept} onChange={(event) => setPaymentForm((current) => ({ ...current, concept: event.target.value }))} placeholder="Concepto sugerido" className="border-zinc-700 bg-zinc-900 text-white" />
              <Textarea value={paymentForm.note} onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))} placeholder="Nota para el comprobante" className="border-zinc-700 bg-zinc-900 text-white sm:col-span-2" />
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={paymentForm.is_default}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, is_default: event.target.checked }))}
                  className="h-4 w-4 accent-amber-400"
                />
                Usar como cuenta predeterminada
              </label>
              {paymentError && <p className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-100 sm:col-span-2">{paymentError}</p>}
              <Button type="submit" disabled={isSavingPayment} className="w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300 sm:col-span-2">
                <Save className="mr-2 h-4 w-4" />
                {isSavingPayment ? 'Guardando' : 'Guardar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRaffle} onOpenChange={(open) => !open && setSelectedRaffle(null)}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-1.5rem)] w-[min(99vw,2100px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 p-4 text-zinc-100 sm:p-6">
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

        <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClientDni(null)}>
          <DialogContent className="lbb-scrollbar lbb-premium-panel max-h-[calc(100dvh-1.5rem)] w-[min(98vw,1280px)] max-w-none overflow-y-auto rounded-[1.5rem] border-white/10 text-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedClient?.fullName ?? 'Cliente'}</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <SummaryBox label="DNI" value={selectedClient.dni} />
                  <SummaryBox label="Cartones" value={String(selectedClient.cards.length)} />
                  <SummaryBox label="Compras estimadas" value={formatARS(selectedClient.estimatedAmount)} />
                  <SummaryBox label="Premios" value={String(selectedClient.awards.length)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPanel label="Telefono" value={selectedClient.phone} />
                  <InfoPanel label="Email" value={selectedClient.email} />
                  <InfoPanel label="Direccion" value={selectedClient.address} />
                  <InfoPanel label="Primera / ultima compra" value={`${formatDateTime(selectedClient.firstPurchase)} - ${formatDateTime(selectedClient.lastPurchase)}`} />
                </div>
                {selectedClient.awards.length > 0 && (
                  <div className="rounded-md border border-emerald-400/25 bg-emerald-500/10 p-4">
                    <p className="mb-2 text-sm font-bold uppercase text-emerald-100">Premios adjudicados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedClient.awards.map((award, index) => (
                        <Badge key={`${award}-${index}`} className="bg-emerald-500 text-white hover:bg-emerald-500">{award}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="overflow-hidden rounded-md border border-white/10 bg-black/20">
                  <div className="hidden grid-cols-[0.85fr_1fr_0.85fr_0.9fr_0.9fr_90px] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 lg:grid">
                    <span>Carton</span>
                    <span>Sorteo</span>
                    <span>Fecha</span>
                    <span>Pago</span>
                    <span>Cuenta premio</span>
                    <span className="text-right">Archivo</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {selectedClient.cards.map((card) => {
                      const raffle = raffleById.get(card.raffle_id) ?? card.raffle ?? null
                      const fileUrl = `/api/file?pathname=${encodeURIComponent(card.payment_receipt_url)}`

                      return (
                        <div key={card.id} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[0.85fr_1fr_0.85fr_0.9fr_0.9fr_90px] lg:items-center">
                          <div>
                            <p className="break-all font-mono font-bold text-amber-200">{card.card_number}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{raffle?.name ?? 'Sorteo eliminado'}</p>
                            <p className="mt-1 text-xs text-zinc-500">{formatMoneyAmount(raffle?.amount, 'Sin monto')}</p>
                          </div>
                          <div>
                            <p className="text-zinc-300">{formatDateTime(card.created_at)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-zinc-300">{card.payment_method ?? 'Sin metodo'}</p>
                            <p className="mt-1 truncate text-xs text-zinc-500">{card.payment_reference ?? 'Sin operacion'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-zinc-300">{card.payout_account_kind ?? 'Sin tipo'}</p>
                            <p className="mt-1 truncate text-xs text-zinc-500">{card.payout_account ?? 'Sin cuenta'}</p>
                          </div>
                          <Button asChild size="sm" variant="outline" className="border-amber-400/40 bg-transparent text-amber-200 hover:bg-amber-400/10 lg:justify-self-end">
                            <a href={fileUrl} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function normalizeDni(value?: string | null) {
  return (value ?? '').replace(/\D/g, '')
}

function parseMoneyAmount(value?: string | null) {
  const normalized = (value ?? '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const amount = Number(normalized)

  return Number.isFinite(amount) ? amount : 0
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

function minIsoDate(current: string, candidate: string) {
  return new Date(candidate).getTime() < new Date(current).getTime() ? candidate : current
}

function maxIsoDate(current: string, candidate: string) {
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-200">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-white">{value}</p>
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
