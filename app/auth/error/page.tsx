import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34rem),linear-gradient(135deg,#09090b,#18181b_45%,#111827)] p-4">
      <div className="text-center space-y-6">
        <BearLogo size={100} sad />
        <h1 className="text-3xl font-bold text-white">
          Error de Autenticacion
        </h1>
        <p className="text-zinc-300 max-w-md">
          Hubo un problema al verificar tu sesion. Por favor, intenta nuevamente.
        </p>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Link href="/auth/login">Volver al inicio de sesion</Link>
        </Button>
      </div>
    </div>
  )
}
