'use client'

import { ParticipationForm } from '@/components/participate/participation-form'

const mockRaffle = {
  id: 'test',
  name: 'Sorteo de Prueba',
  description: 'Sorteo demo',
  prize: '350000',
  additional_prizes: ['150000', '50000'],
  amount: '3000',
  bundle_offers: ['3 cartones x $8000', '5 cartones x $12000'],
  draw_date: new Date(Date.now() + 86400000 * 3).toISOString(),
}

export default function FormTestPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <ParticipationForm raffle={mockRaffle} sessionToken="test" onCardsCreated={() => {}} />
      </div>
    </div>
  )
}
