import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { categories, tools } from '../tools/definitions'
import type { Category } from '../tools/types'
import ToolCard from './ToolCard'

interface ToolGridProps {
  onSelect: (id: string) => void
}

export default function ToolGrid({ onSelect }: ToolGridProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>('all')

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr')
    return tools.filter((tool) => {
      if (category !== 'all' && tool.category !== category) return false
      if (!needle) return true
      const haystack = `${t(`tool.${tool.id}.title`)} ${t(`tool.${tool.id}.desc`)} ${tool.id} ${tool.accept.join(' ')}`
        .toLocaleLowerCase('tr')
      return haystack.includes(needle)
    })
  }, [category, query, t])

  return (
    <section id="tools" className="scroll-mt-24 border-t border-stone-200/70 py-16 sm:py-20 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t('tools.kicker')}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl dark:text-white">
              {t('tools.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500 sm:text-base dark:text-stone-400">
              {t('tools.subtitle')}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col lg:items-end">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('tools.search')}
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-9 text-sm text-stone-800 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-white/10 dark:hover:text-stone-200"
                  aria-label={t('tools.clearSearch')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="hidden text-xs font-medium text-stone-400 dark:text-stone-500 sm:block">
              {t('tools.count', { n: filtered.length })}
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => {
            const active = category === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={[
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                  active
                    ? 'border-stone-900 bg-stone-900 text-white shadow-md dark:border-white dark:bg-white dark:text-stone-900'
                    : 'border-stone-200 bg-white/70 text-stone-600 hover:border-stone-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {t(item.labelKey)}
              </button>
            )
          })}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/50 px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.02]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-white/5 dark:text-stone-500">
              <Search className="h-5 w-5" />
            </div>
            <p className="mt-4 font-display text-base font-semibold text-stone-800 dark:text-stone-100">
              {t('tools.noResults')}
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('tools.noResultsHint')}</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className="mt-5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
            >
              {t('tools.all')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
