'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CONTACT_LINKS } from '@/lib/contact'

const QUIET_PREFIXES = ['/truco', '/juegos/golden-bear']

export function FloatingWhatsApp() {
  const pathname = usePathname()

  if (!CONTACT_LINKS.whatsappUrl || QUIET_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null
  }

  return (
    <Link
      href={CONTACT_LINKS.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="WhatsApp"
      className="fixed bottom-[6.25rem] right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/30 ring-1 ring-black/10 transition hover:scale-105 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#04f77c] md:bottom-5 md:right-5"
    >
      <WhatsAppLogo className="h-7 w-7" />
    </Link>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.02 3.2A12.63 12.63 0 0 0 5.33 22.54L4 29l6.62-1.3A12.6 12.6 0 1 0 16.02 3.2Zm0 22.95a10.3 10.3 0 0 1-5.25-1.44l-.38-.23-3.92.77.79-3.82-.25-.39A10.33 10.33 0 1 1 16.02 26.15Zm5.66-7.72c-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1 1.22-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.54-.92-.82-1.55-1.84-1.73-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.72-.97-2.35-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.64s1.13 3.06 1.29 3.27c.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.45.2 1.99.12.61-.09 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.08-.13-.29-.21-.6-.37Z" />
    </svg>
  )
}
