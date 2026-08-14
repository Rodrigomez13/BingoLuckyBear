"use client"

import { useMemo, useState } from 'react'
import { createGame, playCard, callTruco, callEnvido, respond, foldHand, nextHand, initialHandOf } from './engine'
import type { GameState } from './engine'
import type { Difficulty } from './ai'

export function useTruco(difficulty: Difficulty) {
  const [state, setState] = useState<GameState>(() => createGame('human'))

  function play(cardId: string) {
    setState((s) => {
      const copy = structuredClone(s)
      return playCard(copy, 'human', cardId)
    })
  }

  function truco() {
    setState((s) => {
      const copy = structuredClone(s)
      return callTruco(copy, 'human')
    })
  }

  function envido(call: any) {
    setState((s) => {
      const copy = structuredClone(s)
      return callEnvido(copy, 'human', call)
    })
  }

  function respondTo(action: any) {
    setState((s) => {
      const copy = structuredClone(s)
      return respond(copy, 'human', action)
    })
  }

  function fold() {
    setState((s) => {
      const copy = structuredClone(s)
      return foldHand(copy)
    })
  }

  function next() {
    setState((s) => {
      const copy = structuredClone(s)
      return nextHand(copy)
    })
  }

  function reset(first: 'human' | 'bot' = 'human') {
    setState(() => createGame(first))
  }

  return { state, play, truco, envido, respondTo, fold, next, reset }
}
