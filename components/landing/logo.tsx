import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 leading-none', className)}>
      <div className="relative flex flex-col items-center">
        <Crown
          className="mb-0.5 h-4 w-4 text-yellow-500"
          fill="currentColor"
          aria-hidden="true"
        />
        <span className="font-display text-lg font-bold uppercase tracking-tight">
          <span className="text-yellow-500">Lucky</span>{' '}
          <span className="text-emerald-400">Bear</span>
        </span>
      </div>
      <span className="sr-only">Lucky Bear</span>
    </div>
  )
}
