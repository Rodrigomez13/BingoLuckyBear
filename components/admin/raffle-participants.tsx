'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Raffle {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  dni: string
  address: string
  phone: string
  email: string
  payment_receipt_url: string
  created_at: string
}

interface RaffleParticipantsProps {
  raffle: Raffle
}

export function RaffleParticipants({ raffle }: RaffleParticipantsProps) {
  const [cards, setCards] = useState<BingoCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<BingoCard | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCards()
  }, [raffle.id])

  const fetchCards = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('bingo_cards')
        .select('*')
        .eq('raffle_id', raffle.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (cards.length === 0) return

    const headers = ['Numero Carton', 'Nombre Completo', 'DNI', 'Direccion', 'Telefono', 'Email', 'Fecha Registro']
    const rows = cards.map(card => [
      card.card_number,
      card.full_name,
      card.dni,
      card.address,
      card.phone,
      card.email,
      new Date(card.created_at).toLocaleString('es-ES')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${raffle.name.replace(/\s+/g, '_')}_participantes.csv`
    link.click()
  }

  return (
    <Card className="border-amber-200 bg-white/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              {raffle.name}
              <Badge 
                variant={raffle.is_active ? 'default' : 'secondary'}
                className={raffle.is_active ? 'bg-green-500' : 'bg-gray-400'}
              >
                {raffle.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-amber-600 mt-1">
              {cards.length} participante{cards.length !== 1 ? 's' : ''} registrado{cards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={exportToCSV}
            disabled={cards.length === 0}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-amber-700">No hay participantes registrados aun.</p>
            {raffle.is_active && (
              <p className="text-sm text-amber-600 mt-2">
                Comparte el link del sorteo para que las personas puedan participar.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-amber-800">Carton</TableHead>
                  <TableHead className="text-amber-800">Nombre</TableHead>
                  <TableHead className="text-amber-800">DNI</TableHead>
                  <TableHead className="text-amber-800">Telefono</TableHead>
                  <TableHead className="text-amber-800">Fecha</TableHead>
                  <TableHead className="text-amber-800">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id} className="hover:bg-amber-50">
                    <TableCell className="font-mono font-bold text-amber-700">
                      {card.card_number}
                    </TableCell>
                    <TableCell>{card.full_name}</TableCell>
                    <TableCell>{card.dni}</TableCell>
                    <TableCell>{card.phone}</TableCell>
                    <TableCell className="text-sm text-amber-600">
                      {new Date(card.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCard(card)}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-900">
              Detalles del Participante
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-lg text-center">
                <p className="text-sm text-amber-700">Numero de Carton</p>
                <p className="text-2xl font-bold font-mono text-amber-900">
                  {selectedCard.card_number}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-amber-600">Nombre Completo</p>
                  <p className="font-medium text-amber-900">{selectedCard.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-600">DNI</p>
                  <p className="font-medium text-amber-900">{selectedCard.dni}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-600">Telefono</p>
                  <p className="font-medium text-amber-900">{selectedCard.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-600">Email</p>
                  <p className="font-medium text-amber-900">{selectedCard.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-amber-600">Direccion</p>
                  <p className="font-medium text-amber-900">{selectedCard.address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-amber-600">Fecha de Registro</p>
                  <p className="font-medium text-amber-900">
                    {new Date(selectedCard.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-amber-600 mb-2">Comprobante de Pago</p>
                <div className="border border-amber-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={`/api/file?pathname=${encodeURIComponent(selectedCard.payment_receipt_url)}`}
                    alt="Comprobante de pago"
                    className="max-w-full max-h-96 mx-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
