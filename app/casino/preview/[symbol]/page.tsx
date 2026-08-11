import { notFound } from 'next/navigation'
import { ImportedGamePreview } from '@/components/casino/imported-game-preview'
import { CASINO_DEMO_FALLBACK, getCasinoDemoThumbnail } from '@/lib/casino/demo-catalog'

export default async function CasinoPreviewPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const game = CASINO_DEMO_FALLBACK.find((entry) => entry.symbol === symbol)
  if (!game || !getCasinoDemoThumbnail(symbol)) notFound()

  return <ImportedGamePreview game={game} />
}
