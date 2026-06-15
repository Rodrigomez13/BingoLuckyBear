import { NextResponse } from 'next/server'
import { logAdminAudit } from '@/lib/admin/audit'
import { requireAdminApi, type UserRole } from '@/lib/auth/roles'
import { normalizePhoneNumber } from '@/lib/phone'

function isRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'operator' || value === 'player'
}

function clean(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user: adminUser, access, serviceClient, error } = await requireAdminApi()
  if (error) return error
  if (!adminUser || !access || !serviceClient) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (access.role !== 'admin') return NextResponse.json({ error: 'Solo un administrador puede modificar roles y clientes' }, { status: 403 })

  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const role = body.role
    if (!id || !isRole(role)) return NextResponse.json({ error: 'Usuario o rol inválido' }, { status: 400 })
    if (id === adminUser.id && role !== 'admin') {
      return NextResponse.json({ error: 'No podés quitarte tu propio rol de administrador' }, { status: 409 })
    }

    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(id)
    if (authError || !authUser.user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const [{ data: previousRole }, { data: previousProfile }] = await Promise.all([
      serviceClient.from('lbb_user_roles').select('role, permissions').eq('user_id', id).maybeSingle(),
      serviceClient.from('customer_profiles').select('id, email, full_name, alias, phone, dni').eq('id', id).maybeSingle(),
    ])

    const fullName = clean(body.full_name, 120)
    const alias = clean(body.alias, 24).replace(/[^a-zA-Z0-9_\-.]/g, '')
    const phone = normalizePhoneNumber(clean(body.phone, 40))
    const dni = clean(body.dni, 20)

    const { error: roleError } = await serviceClient.from('lbb_user_roles').upsert({
      user_id: id,
      role,
      permissions: previousRole?.permissions ?? {},
      created_by: adminUser.id,
    }, { onConflict: 'user_id' })
    if (roleError) throw roleError

    const { error: profileError } = await serviceClient.from('customer_profiles').upsert({
      id,
      email: previousProfile?.email ?? authUser.user.email?.toLowerCase() ?? null,
      full_name: fullName || null,
      alias: alias || null,
      phone: phone || null,
      dni: dni || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (profileError) throw profileError

    const afterData = { role, full_name: fullName || null, alias: alias || null, phone: phone || null, dni: dni || null }
    await logAdminAudit(serviceClient, {
      adminUserId: adminUser.id,
      action: 'admin_user_updated',
      entityType: 'user',
      entityId: id,
      beforeData: { role: previousRole?.role ?? 'player', profile: previousProfile },
      afterData,
      reason: clean(body.reason, 180) || 'Actualización desde lista de usuarios',
      metadata: { targetEmail: authUser.user.email },
    })

    return NextResponse.json({ ok: true, user: { id, ...afterData } })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo actualizar el usuario' }, { status: 500 })
  }
}
