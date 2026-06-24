'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'

const SIZE = 18
const INITIAL_SNAKE = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
]
const INITIAL_FOOD = { x: 12, y: 9 }

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'

export function ViboritaGame() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Point>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('right')
  const [nextDirection, setNextDirection] = useState<Direction>('right')
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const nextDirectionRef = useRef<Direction>('right')

  const occupied = useMemo(() => new Set(snake.map((part) => `${part.x}:${part.y}`)), [snake])

  const reset = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('right')
    setNextDirection('right')
    nextDirectionRef.current = 'right'
    setRunning(false)
    setGameOver(false)
    setScore(0)
  }, [])

  const setDir = useCallback((dir: Direction) => {
    const current = nextDirectionRef.current
    if ((current === 'up' && dir === 'down') || (current === 'down' && dir === 'up') || (current === 'left' && dir === 'right') || (current === 'right' && dir === 'left')) return
    nextDirectionRef.current = dir
    setNextDirection(dir)
    setRunning(true)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') setDir('up')
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') setDir('down')
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') setDir('left')
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') setDir('right')
      if (event.key === ' ') setRunning((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDir])

  useEffect(() => {
    if (!running || gameOver) return
    const id = window.setInterval(() => {
      setSnake((current) => {
        const dir = nextDirectionRef.current
        setDirection(dir)
        const head = current[0]
        const next = move(head, dir)
        const hitWall = next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE
        const hitSelf = current.some((part, index) => index > 0 && part.x === next.x && part.y === next.y)
        if (hitWall || hitSelf) {
          setGameOver(true)
          setRunning(false)
          return current
        }

        const eats = next.x === food.x && next.y === food.y
        const body = eats ? [next, ...current] : [next, ...current.slice(0, -1)]
        if (eats) {
          setScore((value) => value + 10)
          setFood(spawnFood(body))
        }
        return body
      })
    }, Math.max(88, 155 - Math.floor(score / 40) * 7))
    return () => window.clearInterval(id)
  }, [food, gameOver, running, score])

  return (
    <main className="min-h-screen overflow-hidden bg-[#04130c] px-3 py-4 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-5xl flex-col gap-4">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/15 bg-black/45 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <Link href="/juegos" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-black text-amber-100 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" />
            Juegos
          </Link>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Arcade LBB</p>
            <h1 className="font-mono text-xl font-black uppercase text-white">Viborita LBB</h1>
          </div>
          <button onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-3 text-sm font-black text-zinc-950 hover:bg-amber-200">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </header>

        <section className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-[1.5rem] border border-amber-300/15 bg-[radial-gradient(circle_at_50%_20%,rgba(250,204,21,.12),transparent_32%),linear-gradient(180deg,rgba(4,28,17,.95),rgba(1,6,4,.96))] p-3 shadow-2xl shadow-black/40">
            <div className="grid aspect-square w-full grid-cols-[repeat(18,minmax(0,1fr))] overflow-hidden rounded-2xl border border-emerald-300/20 bg-black/35">
              {Array.from({ length: SIZE * SIZE }).map((_, index) => {
                const x = index % SIZE
                const y = Math.floor(index / SIZE)
                const isHead = snake[0]?.x === x && snake[0]?.y === y
                const isSnake = occupied.has(`${x}:${y}`)
                const isFood = food.x === x && food.y === y
                return (
                  <div key={index} className="relative border border-white/[0.025]">
                    {isSnake && <span className={`absolute inset-[10%] rounded-md ${isHead ? 'bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,.75)]' : 'bg-emerald-400'}`} />}
                    {isFood && <span className="absolute inset-[18%] rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,.85)]" />}
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-amber-300/15 bg-black/40 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Puntaje</p>
            <p className="mt-2 font-mono text-5xl font-black text-white">{score}</p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/65">Arcade propio inspirado en juegos clásicos. Preparado para conectar desafíos, créditos LBB y rankings.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <span />
              <Control onClick={() => setDir('up')}>↑</Control>
              <span />
              <Control onClick={() => setDir('left')}>←</Control>
              <Control onClick={() => setRunning((value) => !value)}>{running ? 'Ⅱ' : '▶'}</Control>
              <Control onClick={() => setDir('right')}>→</Control>
              <span />
              <Control onClick={() => setDir('down')}>↓</Control>
              <span />
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs text-emerald-50/65">
              Dirección actual: <strong className="text-amber-200">{direction}</strong>. Próxima: <strong className="text-lime-200">{nextDirection}</strong>.
            </div>
            {gameOver && <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm font-black text-red-100">Fin de la partida. Reiniciá para volver a jugar.</div>}
          </aside>
        </section>
      </div>
    </main>
  )
}

function Control({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-12 rounded-xl border border-amber-300/20 bg-white/[0.04] font-mono text-lg font-black text-amber-100 shadow-lg shadow-black/20 hover:bg-amber-300 hover:text-zinc-950">
      {children}
    </button>
  )
}

function move(point: Point, direction: Direction): Point {
  if (direction === 'up') return { x: point.x, y: point.y - 1 }
  if (direction === 'down') return { x: point.x, y: point.y + 1 }
  if (direction === 'left') return { x: point.x - 1, y: point.y }
  return { x: point.x + 1, y: point.y }
}

function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((part) => `${part.x}:${part.y}`))
  const available: Point[] = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!occupied.has(`${x}:${y}`)) available.push({ x, y })
    }
  }
  return available[Math.floor(Math.random() * available.length)] ?? INITIAL_FOOD
}
