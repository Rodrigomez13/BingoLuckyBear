import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Spade,
  Gamepad2,
  LayoutGrid,
  History,
  Trophy,
  Users,
  ShoppingBag,
  Megaphone,
  Gift,
  HelpCircle,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** When true the route does not exist yet and is shown as "Próximamente". */
  comingSoon?: boolean
  /** Optional match keys for highlighting the active item. */
  match?: string[]
}

export const PRIMARY_NAV: NavItem[] = [
  { label: 'Inicio', href: '/inicio', icon: Home, match: ['/inicio'] },
  { label: 'Truco', href: '/truco', icon: Spade, match: ['/truco'] },
  { label: 'Bingo', href: '/en-vivo', icon: Gamepad2, match: ['/en-vivo'] },
  { label: 'Mis mesas', href: '/inicio', icon: LayoutGrid, comingSoon: true },
  { label: 'Historial', href: '/mi-cuenta/jugador', icon: History, match: ['/mi-cuenta/jugador'] },
  { label: 'Ranking', href: '/truco/ranking', icon: Trophy, match: ['/truco/ranking'] },
  { label: 'Amigos', href: '/inicio', icon: Users, comingSoon: true },
  { label: 'Tienda', href: '/participar', icon: ShoppingBag, match: ['/participar'] },
  { label: 'Promociones', href: '/inicio', icon: Megaphone, comingSoon: true },
  { label: 'Bonos', href: '/inicio', icon: Gift, comingSoon: true },
  { label: 'Ayuda', href: '/inicio', icon: HelpCircle, comingSoon: true },
]
