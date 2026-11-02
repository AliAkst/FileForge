import { Flame } from 'lucide-react'

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
        <Flame className="h-[18px] w-[18px]" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-300 ring-2 ring-stone-50 dark:ring-stone-950" />
      </span>
      {!compact && (
        <span className="font-display text-[19px] font-bold tracking-tight text-stone-900 dark:text-white">
          File<span className="text-brand-600 dark:text-brand-400">Forge</span>
        </span>
      )}
    </span>
  )
}
