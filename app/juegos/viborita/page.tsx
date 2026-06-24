import type { Metadata } from 'next'
import { ViboritaGame } from '@/components/games/viborita-game'

export const metadata: Metadata = {
  title: 'Viborita LBB | LuckyBingoBear',
  description: 'Demo arcade original tipo viborita dentro de la plataforma LuckyBingoBear.',
}

export default function ViboritaPage() {
  return <ViboritaGame />
}
