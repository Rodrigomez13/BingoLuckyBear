import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Golden Bear Megaways | Lucky Bingo Bear',
  description: 'Golden Bear Megaways, una experiencia exclusiva de Lucky Bingo Bear.',
}

export default function GoldenBearPage() {
  return (
    <main className="fixed inset-0 z-[100] bg-black">
      <iframe
        title="Golden Bear Megaways"
        src="/games/golden-bear/index.html"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
      />
    </main>
  )
}
