import Link from 'next/link'
import { Logo } from './logo'

const columns = [
  {
    title: 'Juego',
    links: [
      { label: 'Truco', href: '/truco' },
      { label: 'Cómo jugar', href: '/#como-jugar' },
      { label: 'Reglas', href: '#' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Registrarse', href: '/auth/signup' },
      { label: 'Iniciar sesión', href: '/auth/login' },
      { label: 'Mi perfil', href: '/mi-cuenta' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Centro de ayuda', href: '#' },
      { label: 'Contacto', href: '#' },
      { label: 'Términos y condiciones', href: '/terminos-y-condiciones' },
    ],
  },
]

const socials = [
  { short: 'f', label: 'Facebook', href: '#' },
  { short: 'ig', label: 'Instagram', href: '#' },
  { short: 'x', label: 'Twitter', href: '#' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-900/60 bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)] lg:px-8">
        <div>
          <Logo />
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-500">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-emerald-100/70 transition-colors hover:text-emerald-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-500">
            Síguenos
          </h3>
          <div className="mt-4 flex gap-3">
            {socials.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-700/50 text-xs font-semibold lowercase text-emerald-100/70 transition-colors hover:border-yellow-500/50 hover:text-yellow-500"
              >
                <span aria-hidden="true">{s.short}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-900/60">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-emerald-100/60 sm:px-6 lg:px-8">
          © 2026 Lucky Bear. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
