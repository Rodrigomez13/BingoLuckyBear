/**
 * Helpers to detect whether the Supabase environment variables are present.
 *
 * The app should never crash with a 500 just because Supabase has not been
 * configured yet. These helpers let server components, middleware and API
 * routes degrade gracefully (showing empty states) instead of throwing.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
