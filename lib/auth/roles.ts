import type { SupabaseClient, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'operator' | 'player'

export interface UserAccess {
  role: UserRole
  permissions: Record<string, unknown>
  isAdmin: boolean
  isOperator: boolean
  dashboardPath: '/admin' | '/mi-cuenta'
  source: 'role_table' | 'env_email' | 'resource_owner' | 'default'
}

interface RoleRow {
  role?: string | null
  permissions?: Record<string, unknown> | null
}

function normalizeRole(value?: string | null): UserRole {
  if (value === 'admin' || value === 'operator') return value
  return 'player'
}

function adminEmails() {
  return String(process.env.LBB_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function buildAccess(role: UserRole, permissions: Record<string, unknown> = {}, source: UserAccess['source'] = 'default'): UserAccess {
  const isAdmin = role === 'admin' || role === 'operator'
  return {
    role,
    permissions,
    isAdmin,
    isOperator: role === 'operator',
    dashboardPath: isAdmin ? '/admin' : '/mi-cuenta',
    source,
  }
}

async function ownsAdminResource(serviceClient: SupabaseClient, userId: string) {
  const [{ data: raffles }, { data: accounts }] = await Promise.all([
    serviceClient.from('raffles').select('id').eq('admin_id', userId).limit(1),
    serviceClient.from('payment_accounts').select('id').eq('admin_id', userId).limit(1),
  ])

  return Boolean((raffles && raffles.length > 0) || (accounts && accounts.length > 0))
}

export async function getUserAccess(user: Pick<User, 'id' | 'email'> | null | undefined): Promise<UserAccess> {
  if (!user) return buildAccess('player')

  const serviceClient = await createServiceClient()

  const { data: roleRow, error: roleError } = await serviceClient
    .from('lbb_user_roles')
    .select('role, permissions')
    .eq('user_id', user.id)
    .maybeSingle<RoleRow>()

  if (!roleError && roleRow?.role) {
    return buildAccess(normalizeRole(roleRow.role), roleRow.permissions ?? {}, 'role_table')
  }

  const email = user.email?.toLowerCase() ?? ''
  if (email && adminEmails().includes(email)) {
    return buildAccess('admin', {}, 'env_email')
  }

  try {
    if (await ownsAdminResource(serviceClient, user.id)) {
      return buildAccess('admin', {}, 'resource_owner')
    }
  } catch {
    // Keep auth resilient while migrations are being applied.
  }

  return buildAccess('player')
}

export async function requireAdminPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) redirect('/mi-cuenta')

  const access = await getUserAccess(user)
  if (!access.isAdmin) redirect('/mi-cuenta')

  const serviceClient = await createServiceClient()
  return { user, access, serviceClient }
}

export async function requireAdminApi() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return { user: null, access: null, serviceClient: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const access = await getUserAccess(user)
  if (!access.isAdmin) {
    return { user, access, serviceClient: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  const serviceClient = await createServiceClient()
  return { user, access, serviceClient, error: null }
}
