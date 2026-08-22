'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Save, UserRoundPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhoneInput } from '@/lib/phone'

type Role = 'admin' | 'operator' | 'player'

export function UserAdminEditor({
  user,
  trigger = 'button',
}: {
  user: {
    id: string
    email: string
    role: Role
    fullName: string
    alias: string
    phone: string
    dni: string
  }
  trigger?: 'button' | 'menu'
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    role: user.role,
    full_name: user.fullName,
    alias: user.alias,
    phone: user.phone,
    dni: user.dni,
  })

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reason: 'Edición administrativa de cliente' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el usuario')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {trigger === 'menu' ? (
        <DropdownMenuItem
          onSelect={() => window.setTimeout(() => setOpen(true), 0)}
          className="text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <UserRoundPen className="h-4 w-4" />
          Editar datos y rol
        </DropdownMenuItem>
      ) : (
        <Button type="button" size="icon" variant="outline" onClick={() => setOpen(true)} title="Editar usuario" className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/10">
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(94vw,720px)] max-w-none border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription className="text-zinc-400">Actualiza el rol y los datos operativos de esta cuenta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Email</Label><Input value={user.email} disabled className="border-zinc-800 bg-zinc-900 text-zinc-500" /></div>
            <div className="space-y-2"><Label>Rol</Label><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"><option value="player">Jugador</option><option value="operator">Operador</option><option value="admin">Administrador</option></select></div>
            <div className="space-y-2"><Label>Alias</Label><Input value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} className="border-zinc-700 bg-zinc-900 text-white" /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Nombre completo</Label><Input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} className="border-zinc-700 bg-zinc-900 text-white" /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input type="tel" inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} onBlur={() => setForm((current) => ({ ...current, phone: formatPhoneInput(current.phone) }))} placeholder="+54 9 11 1234-5678" className="border-zinc-700 bg-zinc-900 text-white" /></div>
            <div className="space-y-2"><Label>DNI</Label><Input value={form.dni} onChange={(event) => setForm((current) => ({ ...current, dni: event.target.value }))} className="border-zinc-700 bg-zinc-900 text-white" /></div>
            {error && <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100 sm:col-span-2">{error}</p>}
            <Button disabled={busy} className="bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200 sm:col-span-2">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar cambios</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
