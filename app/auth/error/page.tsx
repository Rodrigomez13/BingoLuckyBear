import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'
import { SiteHeader } from '@/components/site-header'

export default function AuthErrorPage() {
  return (
    <div className="lbb-page-shell relative flex min-h-screen items-center justify-center p-4 pt-24">
      <div className="lbb-ambient" />
      <SiteHeader kicker="Acceso privado" compact />
      <div className="lbb-premium-panel lbb-fade-up relative z-10 space-y-6 rounded-[1.5rem] p-8 text-center">
        <BearLogo size={100} sad />
        <h1 className="text-3xl font-bold text-white">
          Error de Autenticacion
        </h1>
        <p className="text-zinc-300 max-w-md">
          Hubo un problema al verificar tu sesion. Por favor, intenta nuevamente.
        </p>
        <Button asChild className="rounded-full bg-amber-300 font-bold text-zinc-950 hover:bg-amber-200">
          <Link href="/auth/login">Volver al inicio de sesion</Link>
        </Button>
      </div>
    </div>
  )
}
