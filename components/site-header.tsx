'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Swords, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BearLogo } from '@/components/bear-logo'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/truco', label: 'Jugar Truco', icon: Swords },
  { href: '/truco/ranking', label: 'Ranking', icon: Trophy },
  { href: '/truco/clubes', label: 'Clubes', icon: Users },
]

export function SiteHeader(_props: { firstPrize?: string | null; activePath?: string; kicker?: string; compact?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dfb23f]/20 bg-[#03130c]/85 shadow-lg shadow-black/20 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12"><Link href="/" className="flex items-center gap-3" aria-label="Ir al inicio de Lucky Bingo Bear"><BearLogo size={46} /><span className="hidden font-mono text-lg font-black uppercase tracking-tight text-[#fff4d2] sm:block">Lucky <span className="text-[#dfb23f]">Bear</span><small className="block text-[9px] tracking-[.22em] text-[#59cd8c]">TRUCO ARGENTINO</small></span></Link><nav className="hidden items-center gap-1 md:flex">{navLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn('inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition hover:bg-[#dfb23f]/10 hover:text-[#ffd95a]', isActive(href) ? 'text-[#ffd95a]' : 'text-[#f6efd9]/70')}><Icon className="size-4" />{label}</Link>)}<Button asChild className="ml-3 bg-[#dfb23f] font-black text-[#251a05] hover:bg-[#ffd95a]"><Link href="/auth/login">Ingresar</Link></Button></nav><div className="flex items-center gap-2 md:hidden"><Button asChild size="sm" className="bg-[#dfb23f] font-black text-[#251a05] hover:bg-[#ffd95a]"><Link href="/truco">Jugar</Link></Button><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="text-[#ffd95a]" aria-label="Abrir menú"><Menu className="size-5" /></Button></SheetTrigger><SheetContent side="right" className="border-[#dfb23f]/20 bg-[#03130c] text-[#fff4d2]"><SheetTitle className="sr-only">Navegación Lucky Bear</SheetTitle><Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3"><BearLogo size={40} /><span className="font-mono text-lg font-black uppercase">Lucky Bear</span></Link><nav className="mt-8 flex flex-col gap-2">{navLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-md px-3 py-3 font-bold', isActive(href) ? 'bg-[#dfb23f]/10 text-[#ffd95a]' : 'text-[#f6efd9]/70')}><Icon className="size-4" />{label}</Link>)}<Link href="/auth/login" onClick={() => setOpen(false)} className="mt-3 rounded-md px-3 py-3 font-bold text-[#dfb23f]">Ingresar</Link></nav></SheetContent></Sheet></div></div></header>
}
