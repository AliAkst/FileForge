import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import type { ToolDef } from '../tools/types'

interface ToolCardProps {
  tool: ToolDef
  onSelect: (id: string) => void
  compact?: boolean
}

export default function ToolCard({ tool, onSelect, compact = false }: ToolCardProps) {
  const { t } = useI18n()
  const Icon = tool.icon
  const title = t(`tool.${tool.id}.title`)
  const description = t(`tool.${tool.id}.desc`)

  return (
    <button
      type="button"
      onClick={() => onSelect(tool.id)}
      data-tool={tool.id}
      aria-label={`${t('tools.open')}: ${title}`}
      className={[
        'group relative flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white text-left shadow-sm transition-all duration-200',
        'hover:-translate-y-1 hover:border-stone-300 hover:shadow-lift',
        'dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-white/20 dark:hover:bg-white/[0.06]',
        compact ? 'p-4' : 'p-5',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/0 to-transparent dark:from-white/[0.015]" />

      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-3deg] ${tool.gradient} ${
            compact ? 'h-10 w-10' : 'h-12 w-12'
          }`}
        >
          <Icon className={compact ? 'h-5 w-5' : 'h-[22px] w-[22px]'} strokeWidth={2.1} />
        </span>

        <span className="flex items-center gap-1.5">
          {tool.popular && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-inset ring-brand-200/70 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
              <Sparkles className="h-2.5 w-2.5" />
              {t('tools.popular')}
            </span>
          )}
          <ArrowUpRight className="h-4 w-4 translate-y-0.5 text-stone-300 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:text-stone-500 group-hover:opacity-100 dark:text-stone-600 dark:group-hover:text-stone-300" />
        </span>
      </div>

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <h3 className={`font-display font-semibold tracking-tight text-stone-900 dark:text-white ${compact ? 'text-[15px]' : 'text-base'}`}>
          {title}
        </h3>
        <p className={`mt-1 text-stone-500 dark:text-stone-400 ${compact ? 'text-xs leading-relaxed' : 'text-[13px] leading-relaxed'}`}>
          {description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {tool.accept.slice(0, 4).map((extension) => (
          <span
            key={extension}
            className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-stone-500 dark:bg-white/5 dark:text-stone-400"
          >
            {extension}
          </span>
        ))}
        {tool.multiple && (
          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-white/5 dark:text-stone-400">
            {t('tools.multiple')}
          </span>
        )}
      </div>
    </button>
  )
}
