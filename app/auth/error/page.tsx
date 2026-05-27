import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BearLogo } from '@/components/bear-logo'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-4">
      <div className="text-center space-y-6">
        <BearLogo size={100} sad />
        <h1 className="text-3xl font-bold text-amber-900">
          Error de Autenticacion
        </h1>
        <p className="text-amber-700 max-w-md">
          Hubo un problema al verificar tu sesion. Por favor, intenta nuevamente.
        </p>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Link href="/auth/login">Volver al inicio de sesion</Link>
        </Button>
      </div>
    </div>
  )
}
