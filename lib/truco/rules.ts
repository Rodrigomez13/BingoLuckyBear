export type TrucoScoreStyle = 'numeric' | 'traditional'

export interface TrucoRules {
  florEnabled: boolean
  scoreStyle: TrucoScoreStyle
}

export const DEFAULT_TRUCO_RULES: TrucoRules = {
  florEnabled: true,
  scoreStyle: 'numeric',
}

export function normalizeTrucoRules(value?: Partial<TrucoRules> | null): TrucoRules {
  return {
    florEnabled: value?.florEnabled !== false,
    scoreStyle: value?.scoreStyle === 'traditional' ? 'traditional' : 'numeric',
  }
}
