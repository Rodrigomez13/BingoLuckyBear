export interface PlaceholderRaffle {
  name: string
  dateLabel: string
  prize: string
  status: string
  detail: string
}

export const PLACEHOLDER_RAFFLES: PlaceholderRaffle[] = [
  {
    name: 'Gran Bingo Lucky Bear',
    dateLabel: 'Próxima fecha',
    prize: '$350.000',
    status: 'Preventa cerrada',
    detail: 'Sorteo de referencia mientras se habilita la próxima sala oficial.',
  },
  {
    name: 'Bingo Relámpago',
    dateLabel: 'Muy pronto',
    prize: '$150.000',
    status: 'En preparación',
    detail: 'Mesa visual para mantener la cartelera activa.',
  },
  {
    name: 'Especial Comunidad',
    dateLabel: 'A confirmar',
    prize: '$200.000',
    status: 'No comprable',
    detail: 'La compra se habilita únicamente cuando el admin active un sorteo real.',
  },
]
