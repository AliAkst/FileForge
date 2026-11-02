import { ArrowRight, Check, FileText, Infinity as InfinityIcon, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import Dropzone from './Dropzone'

interface HeroProps {
  onQuickFiles: (files: File[]) => void
  onOpenTool: (id: string) => void
}

export default function Hero({ onQuickFiles, onOpenTool }: HeroProps) {
  const { t } = useI18n()

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-70 dark:opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute -right-40 top-24 h-[30rem] w-[30rem] rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm shadow-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t('hero.badge')}
            </span>

            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.06] tracking-tight text-stone-950 sm:text-5xl lg:text-[3.6rem] dark:text-white">
              {t('hero.titleA')}{' '}
              <span className="text-gradient">{t('hero.titleB')}</span>{' '}
              {t('hero.titleC')}
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-600 sm:text-base dark:text-stone-300">
              {t('hero.subtitle')}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenTool('pdf-to-word')}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-stone-900/15 transition-all hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-xl dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
              >
                <FileText className="h-4 w-4" />
                {t('hero.ctaPrimary')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white/70 px-5 py-3.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10"
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                {t('hero.trust1')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                {t('hero.trust2')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                {t('hero.trust3')}
              </span>
            </div>

            <div className="mt-9 grid max-w-lg grid-cols-3 divide-x divide-stone-200 dark:divide-white/10">
              {[
                { value: '15+', label: t('hero.statTools') },
                { value: '0', label: t('hero.statUploads') },
                { value: '∞', label: t('hero.statFree') },
              ].map((stat) => (
                <div key={stat.label} className="px-4 first:pl-0 last:pr-0">
                  <p className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="relative rounded-[1.75rem] border border-stone-200/80 bg-white/75 p-3.5 shadow-lift backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('tools.popular')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-500 dark:bg-white/5 dark:text-stone-400">
                  <ShieldCheck className="h-3 w-3" />
                  100% local
                </span>
              </div>

              <Dropzone
                variant="hero"
                onFiles={onQuickFiles}
                title={t('hero.dropTitle')}
                subtitle={t('hero.dropSubtitle')}
                hint={t('hero.dropHint')}
              />

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: t('tool.pdf-to-word.title'), tool: 'pdf-to-word', icon: '📄' },
                  { label: t('tool.merge-pdf.title'), tool: 'merge-pdf', icon: '🧩' },
                  { label: t('tool.compress-pdf.title'), tool: 'compress-pdf', icon: '🗜️' },
                ].map((item) => (
                  <button
                    key={item.tool}
                    type="button"
                    onClick={() => onOpenTool(item.tool)}
                    className="group flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-stone-400 dark:text-stone-500">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                <Zap className="h-3 w-3 text-amber-500" />
                {t('footer.local')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                <InfinityIcon className="h-3 w-3 text-brand-500" />
                {t('hero.trust3')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/60 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                {t('hero.trust1')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
