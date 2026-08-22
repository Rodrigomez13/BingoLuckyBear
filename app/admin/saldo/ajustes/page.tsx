import Link from 'next/link'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { AdminEconomyNav } from '@/components/admin/admin-economy-nav'
import { WalletAdjustmentPanel } from '@/components/admin/wallet-adjustment-panel'
import { BearLogo } from '@/components/bear-logo'
import { Button } from '@/components/ui/button'
import { requireAdminPage } from '@/lib/auth/roles'

export default async function AdminWalletAdjustmentsPage() {
  await requireAdminPage()

  return (
    <main className="lbb-page-shell relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="lbb-ambient" />
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BearLogo size={44} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Economía</p>
              <h1 className="font-mono text-2xl font-black text-white sm:text-4xl">Ajustes de saldo</h1>
              <p className="mt-1 text-sm text-zinc-400">Agrega o retira saldo manualmente con motivo y auditoría.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-transparent text-amber-200 hover:bg-amber-300/10">
            <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al admin</Link>
          </Button>
        </header>

        <AdminEconomyNav />
        <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
          <SlidersHorizontal className="h-4 w-4 text-amber-300" />
          Cada cambio genera un movimiento. Los pagos solicitados por jugadores se gestionan en Retiros.
        </div>
        <WalletAdjustmentPanel />
      </section>
    </main>
  )
}
