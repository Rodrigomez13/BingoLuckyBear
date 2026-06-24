import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeGoldenBearSettings } from '@/lib/games/golden-bear/config'

export const dynamic = 'force-dynamic'

async function saveGoldenBearSettings(formData: FormData) {
  'use server'

  const serviceClient = await createServiceClient()
  const validStakes = String(formData.get('valid_stakes') || '')
    .split(',')
    .map((value) => Math.trunc(Number(value.trim())))
    .filter((value) => Number.isFinite(value) && value > 0)

  await serviceClient.from('golden_bear_settings').upsert({
    id: 'default',
    enabled: formData.get('enabled') === 'on',
    bonus_buy_enabled: formData.get('bonus_buy_enabled') === 'on',
    bonus_buy_price: Math.max(1, Math.trunc(Number(formData.get('bonus_buy_price') || 100))),
    bonus_buy_spins: Math.max(1, Math.min(50, Math.trunc(Number(formData.get('bonus_buy_spins') || 6)))),
    bonus_buy_label: String(formData.get('bonus_buy_label') || 'Comprar Bonus'),
    bonus_buy_description: String(formData.get('bonus_buy_description') || 'Activá giros gratis del Oso Dorado por un valor fijo.'),
    valid_stakes: validStakes.length ? validStakes : [25, 50, 100, 200, 500, 1000],
    updated_at: new Date().toISOString(),
  })

  revalidatePath('/admin/games/golden-bear')
  revalidatePath('/api/games/golden-bear/config')
}

export default async function GoldenBearAdminPage() {
  const serviceClient = await createServiceClient()
  const { data } = await serviceClient
    .from('golden_bear_settings')
    .select('enabled, bonus_buy_enabled, bonus_buy_price, bonus_buy_spins, bonus_buy_label, bonus_buy_description, valid_stakes')
    .eq('id', 'default')
    .maybeSingle()

  const settings = normalizeGoldenBearSettings(data)

  return (
    <main className="min-h-screen bg-[#050805] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Panel admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Golden Bear Lucky Ways</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Configurá el acceso al juego, el botón de compra de bonus y los montos permitidos sin tocar código.</p>
          </div>
          <Link href="/juegos/golden-bear" className="rounded-full border border-amber-300/30 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/10">
            Ver juego
          </Link>
        </div>

        <form action={saveGoldenBearSettings} className="grid gap-5 rounded-3xl border border-amber-300/20 bg-black/45 p-5 shadow-2xl shadow-black/40 sm:grid-cols-2 sm:p-6">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span><strong className="block">Juego habilitado</strong><small className="text-slate-400">Permite entrar a Golden Bear.</small></span>
            <input name="enabled" type="checkbox" defaultChecked={settings.enabled} className="h-5 w-5 accent-amber-300" />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span><strong className="block">Comprar bonus</strong><small className="text-slate-400">Muestra el botón y habilita la compra.</small></span>
            <input name="bonus_buy_enabled" type="checkbox" defaultChecked={settings.bonusBuyEnabled} className="h-5 w-5 accent-amber-300" />
          </label>

          <Field label="Monto del bonus" name="bonus_buy_price" type="number" defaultValue={settings.bonusBuyPrice} hint="Debe coincidir con una apuesta disponible." />
          <Field label="Giros gratis del bonus" name="bonus_buy_spins" type="number" defaultValue={settings.bonusBuySpins} hint="Cantidad que recibe el jugador al comprar bonus." />
          <Field label="Texto del botón" name="bonus_buy_label" defaultValue={settings.bonusBuyLabel} hint="Ejemplo: Comprar Bonus." />
          <Field label="Descripción" name="bonus_buy_description" defaultValue={settings.bonusBuyDescription} hint="Se usa en UI y configuración pública." />

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-amber-100">Apuestas disponibles</span>
            <input name="valid_stakes" defaultValue={settings.validStakes.join(', ')} className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none ring-amber-300/0 transition focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10" />
            <small className="mt-2 block text-xs text-slate-500">Separá los montos con coma. El monto del bonus debe estar en esta lista.</small>
          </label>

          <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-sm text-amber-50 sm:flex-row sm:items-center sm:justify-between">
            <span>Configuración actual: bonus de <strong>$ {settings.bonusBuyPrice.toLocaleString('es-AR')}</strong> por <strong>{settings.bonusBuySpins}</strong> giros gratis.</span>
            <button type="submit" className="rounded-full bg-amber-300 px-5 py-3 font-black text-zinc-950 shadow-lg shadow-amber-300/20 hover:bg-amber-200">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({ label, hint, ...props }: { label: string; hint?: string; name: string; defaultValue: string | number; type?: string }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-amber-100">{label}</span>
      <input {...props} className="w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none ring-amber-300/0 transition focus:border-amber-300/40 focus:ring-4 focus:ring-amber-300/10" />
      {hint && <small className="mt-2 block text-xs text-slate-500">{hint}</small>}
    </label>
  )
}
