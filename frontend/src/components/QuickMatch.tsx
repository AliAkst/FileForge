import { FileSearch, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { compatibleTools } from '../tools/definitions'
import { formatBytes } from '../lib/files'
import ToolCard from './ToolCard'

interface QuickMatchProps {
  files: File[]
  onSelect: (id: string) => void
  onClear: () => void
}

export default function QuickMatch({ files, onSelect, onClear }: QuickMatchProps) {
  const { t } = useI18n()
  const matches = compatibleTools(files.map((file) => file.name))

  return (
    <section className="scroll-mt-24 pb-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-up rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50/80 to-white p-5 shadow-soft sm:p-6 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-white/[0.02]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-semibold text-stone-900 dark:text-white">{t('quick.title')}</p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {t('quick.subtitle', { n: files.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
              {t('quick.clear')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-stone-200/80 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
              >
                <FileSearch className="h-3.5 w-3.5 text-brand-500" />
                <span className="max-w-[16rem] truncate">{file.name}</span>
                <span className="text-stone-400">{formatBytes(file.size)}</span>
              </span>
            ))}
          </div>

          {matches.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onSelect={onSelect} compact />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <FileSearch className="h-4 w-4 shrink-0" />
              {t('quick.noMatch')}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
