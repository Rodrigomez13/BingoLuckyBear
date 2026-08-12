import { redirect } from 'next/navigation'

/**
 * Stage 1 public entry point: Truco.
 * Auth, wallet, payments, admin and the other game modules remain available
 * through their existing routes; the public home is intentionally focused on
 * the first product surface being launched.
 */
export default function HomePage() {
  redirect('/truco')
}
