'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BearLogo } from '@/components/bear-logo'

interface Raffle {
  id: string
  name: string
  description: string | null
}

interface BingoCard {
  id: string
  card_number: string
  full_name: string
  created_at: string
  bingo_numbers: number[][]
}

interface ParticipationFormProps {
  raffle: Raffle
  sessionToken: string
  onCardCreated: (card: BingoCard) => void
}

export function ParticipationForm({ raffle, sessionToken, onCardCreated }: ParticipationFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    dni: '',
    address: '',
    phone: '',
    email: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen')
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar 5MB')
        return
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate all fields
      if (!formData.full_name || !formData.dni || !formData.address || !formData.phone || !formData.email) {
        throw new Error('Todos los campos son obligatorios')
      }
      if (!file) {
        throw new Error('Debes subir el comprobante de pago')
      }

      // Upload file first
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        throw new Error(uploadData.error || 'Error al subir el comprobante')
      }

      const { pathname } = await uploadRes.json()

      // Create the card
      const cardRes = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffle_id: raffle.id,
          ...formData,
          payment_receipt_url: pathname,
          session_token: sessionToken,
        }),
      })

      const cardData = await cardRes.json()

      if (!cardRes.ok) {
        if (cardRes.status === 409) {
          // User already has a card
          throw new Error('Ya tienes un carton para este sorteo')
        }
        throw new Error(cardData.error || 'Error al crear el carton')
      }

      // Success - pass the card data to parent
      onCardCreated({
        id: cardData.card_id,
        card_number: cardData.card_number,
        full_name: formData.full_name,
        created_at: new Date().toISOString(),
        bingo_numbers: cardData.bingo_numbers,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Raffle Info Header */}
      <div className="text-center">
        <BearLogo size={80} className="mx-auto mb-4" />
        <h1 
          className="text-3xl md:text-4xl font-bold text-amber-900 mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {raffle.name}
        </h1>
        {raffle.description && (
          <p className="text-amber-700 max-w-lg mx-auto">{raffle.description}</p>
        )}
      </div>

      {/* Form */}
      <Card className="border-amber-200 bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center border-b border-amber-100">
          <CardTitle className="text-2xl text-amber-900" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Solicitar Mi Carton
          </CardTitle>
          <CardDescription className="text-amber-600">
            Completa todos los campos para obtener tu carton de bingo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-amber-800 font-medium">
                  Nombre Completo *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Juan Perez"
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni" className="text-amber-800 font-medium">
                  DNI *
                </Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-amber-800 font-medium">
                Direccion *
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Av. Principal 123, Ciudad"
                required
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-amber-800 font-medium">
                  Numero de Telefono *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+54 11 1234-5678"
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-800 font-medium">
                  Correo Electronico *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt" className="text-amber-800 font-medium">
                Comprobante de Transferencia *
              </Label>
              <p className="text-sm text-amber-600 mb-2">
                Sube una captura de pantalla del comprobante de pago (max 5MB)
              </p>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  preview ? 'border-green-400 bg-green-50' : 'border-amber-300 hover:border-amber-400 bg-amber-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="receipt"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {preview ? (
                  <div className="space-y-3">
                    <img 
                      src={preview} 
                      alt="Vista previa" 
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-green-700 font-medium">
                      Imagen cargada correctamente
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setPreview(null)
                      }}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-amber-700">
                      Haz clic para subir tu comprobante
                    </p>
                    <p className="text-xs text-amber-500">
                      PNG, JPG, JPEG hasta 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg py-6 shadow-lg shadow-amber-500/30 transition-all hover:shadow-xl hover:shadow-amber-500/40"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando tu carton...
                </span>
              ) : (
                'Obtener Mi Carton'
              )}
            </Button>

            <p className="text-xs text-center text-amber-600">
              Al enviar este formulario, aceptas que tus datos sean utilizados 
              unicamente para el registro del sorteo.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
