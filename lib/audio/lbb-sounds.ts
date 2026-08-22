export type LbbSoundDefinition = {
  src: string | readonly string[]
  volume?: number
}

const TRUCO_EFFECTS = '/audio/lbb/truco/mp3/effects'
const TRUCO_VOICES = '/audio/lbb/truco/mp3/voices'
const RECORDED_TRUCO_VOICES = `${TRUCO_VOICES}/recorded`
const BINGO_EFFECTS = '/audio/lbb/bingo/mp3/effects'
const BINGO_VOICES = '/audio/lbb/bingo/mp3/voices'

function recordedTrucoVoice(name: string, femaleExtension = 'mp3') {
  return [
    `${RECORDED_TRUCO_VOICES}/male/${name}.mp3`,
    `${RECORDED_TRUCO_VOICES}/female/${name}.${femaleExtension}`,
  ] as const
}

export const LBB_SOUNDS: Record<string, LbbSoundDefinition> = {
  'ui.click': { src: `${TRUCO_EFFECTS}/click_madera_boton.mp3`, volume: 0.36 },
  'ui.open': { src: `${TRUCO_EFFECTS}/carta_voltear.mp3`, volume: 0.35 },
  'ui.close': { src: `${TRUCO_EFFECTS}/click_madera_boton.mp3`, volume: 0.32 },
  'ui.success': { src: `${TRUCO_EFFECTS}/reto_aceptado.mp3`, volume: 0.46 },
  'ui.error': { src: `${TRUCO_EFFECTS}/movimiento_invalido.mp3`, volume: 0.42 },

  'wallet.approved': { src: `${BINGO_EFFECTS}/pago_confirmado.mp3`, volume: 0.52 },

  'bingo.purchase': { src: `${BINGO_EFFECTS}/pago_confirmado.mp3`, volume: 0.52 },
  'bingo.start': { src: `${BINGO_EFFECTS}/inicio_sorteo.mp3`, volume: 0.54 },
  'bingo.ball': { src: `${BINGO_EFFECTS}/bolilla_saliendo.mp3`, volume: 0.48 },
  'bingo.reveal': { src: `${BINGO_EFFECTS}/numero_revelado.mp3`, volume: 0.48 },
  'bingo.mark': { src: `${BINGO_EFFECTS}/marcar_numero_carton.mp3`, volume: 0.42 },
  'bingo.line': { src: `${BINGO_EFFECTS}/linea_ganada.mp3`, volume: 0.58 },
  'bingo.win': { src: `${BINGO_EFFECTS}/bingo_ganador_fanfarria.mp3`, volume: 0.58 },
  'bingo.jackpot': { src: `${BINGO_EFFECTS}/jackpot_premio.mp3`, volume: 0.58 },
  'bingo.applause': { src: `${BINGO_EFFECTS}/aplausos_corto_sintetico.mp3`, volume: 0.44 },

  'truco.deal': { src: `${TRUCO_EFFECTS}/carta_repartir_01.mp3`, volume: 0.42 },
  'truco.deal.alt': { src: `${TRUCO_EFFECTS}/carta_repartir_02.mp3`, volume: 0.42 },
  'truco.play-card': { src: `${TRUCO_EFFECTS}/carta_tirar_mesa.mp3`, volume: 0.46 },
  'truco.flip-card': { src: `${TRUCO_EFFECTS}/carta_voltear.mp3`, volume: 0.42 },
  'truco.shuffle': { src: `${TRUCO_EFFECTS}/mazo_mezclar_corto.mp3`, volume: 0.4 },
  'truco.turn': { src: `${TRUCO_EFFECTS}/turno_alerta.mp3`, volume: 0.44 },
  'truco.point': { src: `${TRUCO_EFFECTS}/punto_sumado.mp3`, volume: 0.48 },
  'truco.accepted': { src: `${TRUCO_EFFECTS}/reto_aceptado.mp3`, volume: 0.48 },
  'truco.rejected': { src: `${TRUCO_EFFECTS}/reto_rechazado.mp3`, volume: 0.48 },
  'truco.hand-win': { src: `${TRUCO_EFFECTS}/mano_ganada.mp3`, volume: 0.5 },
  'truco.round-win': { src: `${TRUCO_EFFECTS}/ronda_ganada.mp3`, volume: 0.5 },
  'truco.match-win': { src: `${TRUCO_EFFECTS}/partido_ganado.mp3`, volume: 0.56 },
  'truco.invalid': { src: `${TRUCO_EFFECTS}/movimiento_invalido.mp3`, volume: 0.42 },

  'truco.truco': { src: recordedTrucoVoice('truco', 'm4a'), volume: 0.82 },
  'truco.retruco': { src: recordedTrucoVoice('retruco'), volume: 0.82 },
  'truco.vale-cuatro': { src: recordedTrucoVoice('vale_cuatro'), volume: 0.82 },
  'truco.envido': { src: recordedTrucoVoice('envido'), volume: 0.82 },
  'truco.real-envido': { src: recordedTrucoVoice('real_envido'), volume: 0.82 },
  'truco.falta-envido': { src: recordedTrucoVoice('falta_envido'), volume: 0.82 },
  'truco.flor': { src: recordedTrucoVoice('flor'), volume: 0.82 },
  'truco.contra-flor': { src: recordedTrucoVoice('contra_flor'), volume: 0.82 },
  'truco.contra-flor-al-resto': { src: recordedTrucoVoice('contra_flor_al_resto'), volume: 0.82 },
  'truco.quiero': { src: recordedTrucoVoice('quiero'), volume: 0.82 },
  'truco.no-quiero': { src: recordedTrucoVoice('no_quiero'), volume: 0.82 },
  'truco.mazo': { src: recordedTrucoVoice('me_voy_al_mazo'), volume: 0.82 },
  'truco.son-buenas': { src: recordedTrucoVoice('son_buenas'), volume: 0.82 },
  'truco.new-hand': { src: `${TRUCO_VOICES}/nueva_mano.mp3`, volume: 0.64 },
  'truco.cards-ready': { src: `${TRUCO_VOICES}/cartas_repartidas.mp3`, volume: 0.64 },
  'truco.waiting': { src: `${TRUCO_VOICES}/esperando_rival.mp3`, volume: 0.6 },
  'truco.play': { src: `${TRUCO_VOICES}/a_jugar.mp3`, volume: 0.64 },
}

export function resolveLbbSound(sound: string): LbbSoundDefinition | null {
  const explicit = LBB_SOUNDS[sound]
  if (explicit) return explicit

  const envidoValueMatch = sound.match(/^truco\.envido-value\.(2\d|3[0-3])$/)
  if (envidoValueMatch) {
    return {
      src: recordedTrucoVoice(envidoValueMatch[1]),
      volume: 0.82,
    }
  }

  const numberMatch = sound.match(/^bingo\.number\.(\d{1,2})$/)
  if (numberMatch) {
    const value = Number(numberMatch[1])
    if (value >= 1 && value <= 90) {
      return {
        src: `${BINGO_VOICES}/numeros_01_90/numero_${String(value).padStart(2, '0')}.mp3`,
        volume: 0.78,
      }
    }
  }

  return null
}
