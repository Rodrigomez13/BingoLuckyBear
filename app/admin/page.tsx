import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { requireAdminPage } from '@/lib/auth/roles'

export default async function AdminPage() {
  const { user, serviceClient } = await requireAdminPage()

  const { data: raffles } = await serviceClient
    .from('raffles')
    .select('*, bingo_cards(count)')
    .order('created_at', { ascending: false })

  const raffleRows = raffles || []
  const raffleIds = raffleRows.map((raffle) => raffle.id)
  const { data: cards } = raffleIds.length
    ? await serviceClient
        .from('bingo_cards')
        .select('id, raffle_id, card_number, full_name, dni, address, phone, email, payment_receipt_url, payment_method, payment_reference, payout_account_kind, payout_account, payout_holder_name, payment_status, receipt_amount, receipt_operation_number, receipt_destination_account, receipt_date, receipt_raw_text, receipt_parse_status, receipt_parse_error, receipt_validation_notes, receipt_parsed_at, created_at, bingo_numbers')
        .in('raffle_id', raffleIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const raffleById = new Map(raffleRows.map((raffle) => [raffle.id, raffle]))
  const cardsWithRaffle = (cards || [])
    .map((card) => ({
      ...card,
      raffle: raffleById.get(card.raffle_id) ?? null,
    }))
    .filter((card) => card.raffle)

  const { data: paymentAccounts } = await serviceClient
    .from('payment_accounts')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <AdminDashboard
      user={user}
      initialRaffles={raffleRows}
      initialPaymentAccounts={paymentAccounts || []}
      initialCards={cardsWithRaffle}
    />
  )
}
