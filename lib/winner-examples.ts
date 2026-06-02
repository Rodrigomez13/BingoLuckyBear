export const winnerExamples = [
  {
    name: 'Valentina G.',
    date: 'Mayo 2026',
    prize: '$200.000',
    label: 'Premio mayor',
    image: '/winners/examples/winner-01.webp',
    quote: 'El aviso llego por WhatsApp y el premio quedo publicado. Todo muy claro.',
  },
  {
    name: 'Rodrigo M.',
    date: 'Abril 2026',
    prize: '$90.000',
    label: 'Premio grande',
    image: '/winners/examples/winner-02.jpg',
    quote: 'Compre mi carton, espere el sorteo y despues pude ver el resultado.',
  },
  {
    name: 'Luciana P.',
    date: 'Abril 2026',
    prize: '$50.000',
    label: 'Premio intermedio',
    image: '/winners/examples/winner-03.jpg',
    quote: 'Me gusto que el carton se marque solo y que quede todo registrado.',
  },
  {
    name: 'Brian L.',
    date: 'Marzo 2026',
    prize: '$25.000',
    label: 'Premio menor',
    image: '/winners/examples/winner-04.jpg',
    quote: 'La experiencia fue simple. Participe y recibi el aviso al finalizar.',
  },
  {
    name: 'Camila R.',
    date: 'Marzo 2026',
    prize: '$120.000',
    label: 'Carton completo',
    image: '/winners/examples/winner-05.jpg',
    quote: 'Se ve el ganador, el monto y el sorteo cerrado como referencia.',
  },
  {
    name: 'Martin S.',
    date: 'Febrero 2026',
    prize: '$75.000',
    label: 'Premio grande',
    image: '/winners/examples/winner-06.jpg',
    quote: 'Ideal para jugar sin estar pendiente de cada bolilla.',
  },
]

export function getWinnerExample(index: number) {
  return winnerExamples[index % winnerExamples.length]
}
