import { Logo } from './logo'

const columns = [
  {
    title: 'Juego',
    links: ['Truco', 'Cómo jugar', 'Reglas'],
  },
  {
    title: 'Cuenta',
    links: ['Registrarse', 'Iniciar sesión', 'Mi perfil'],
  },
  {
    title: 'Ayuda',
    links: ['Centro de ayuda', 'Contacto', 'Términos y condiciones'],
  },
]

const socials = [
  { short: 'f', label: 'Facebook' },
  { short: 'ig', label: 'Instagram' },
  { short: 'x', label: 'Twitter' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-popover">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(4,1fr)] lg:px-8">
        <div>
          <Logo />
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
            Síguenos
          </h3>
          <div className="mt-4 flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs font-semibold lowercase text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span aria-hidden="true">{s.short}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          © 2024 Lucky Bingo Bear. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
