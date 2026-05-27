import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { CONTACT_LINKS } from '@/lib/contact'

export function FloatingWhatsApp() {
  if (!CONTACT_LINKS.whatsappUrl) {
    return null
  }

  return (
    <Link
      href={CONTACT_LINKS.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Unirse al WhatsApp de Lucky Bingo Bear"
      className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-950/40 transition hover:scale-105 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-lg sm:px-4 sm:py-3"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden text-sm font-bold sm:inline">WhatsApp</span>
    </Link>
  )
}
