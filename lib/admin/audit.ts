import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAdminAudit(
  serviceClient: SupabaseClient,
  input: {
    adminUserId: string
    action: string
    entityType?: string
    entityId?: string
    beforeData?: unknown
    afterData?: unknown
    reason?: string
    metadata?: Record<string, unknown>
  },
) {
  try {
    await serviceClient.from('lbb_admin_audit_logs').insert({
      admin_user_id: input.adminUserId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      before_data: input.beforeData ?? null,
      after_data: input.afterData ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
    })
  } catch {
    // Audit table may not exist until the migration is applied. Never block the action.
  }
}
