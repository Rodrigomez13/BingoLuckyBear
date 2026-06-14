'use client'

import { UserPlus } from 'lucide-react'

export function LoginModeSwitch({
  mode,
  onModeChange,
}: {
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/85 p-4 text-center text-sm text-zinc-300 shadow-xl shadow-black/20">
      {mode === 'login' ? (
        <>
          <div className="mb-2 flex items-center justify-center gap-2 text-zinc-400">
            <UserPlus className="h-4 w-4 text-amber-300" />
            <span>¿Nuevo en Lucky Bingo Bear?</span>
          </div>
          <button
            type="button"
            onClick={() => onModeChange('register')}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 font-black text-amber-300 transition hover:border-amber-300/35 hover:bg-zinc-800 hover:text-amber-200"
          >
            Crear una cuenta
          </button>
        </>
      ) : (
        <>
          <div className="mb-2 text-zinc-400">¿Ya tenés cuenta?</div>
          <button
            type="button"
            onClick={() => onModeChange('login')}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 font-black text-amber-300 transition hover:border-amber-300/35 hover:bg-zinc-800 hover:text-amber-200"
          >
            Iniciar sesión
          </button>
        </>
      )}
    </div>
  )
}
