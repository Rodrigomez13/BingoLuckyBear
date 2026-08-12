import type { Metadata } from 'next'
import { TrucoProfile } from '@/components/truco/truco-profile'

export const metadata: Metadata = { title: 'Mi perfil | Truco', description: 'Perfil, créditos e historial de Truco.' }

export default function TrucoProfilePage() { return <TrucoProfile /> }
