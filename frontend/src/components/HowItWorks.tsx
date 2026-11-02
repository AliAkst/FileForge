import { Download, MousePointerClick, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../i18n'

const steps = [
  { key: '1', icon: MousePointerClick, title: 'how.step1Title', text: 'how.step1Text' },
  { key: '2', icon: SlidersHorizontal, title: 'how.step2Title', text: 'how.step2Text' },
  { key: '3', icon: Download, title: 'how.step3Title', text: 'how.step3Text' },
]

export default function HowItWorks() {
  const { t } = useI18n()

  return (
    <section id="how" className="scroll-mt-24 border-t border-stone-200/70 py-16 sm:py-20 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            {t('how.kicker')}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl dark:text-white">
            {t('how.title')}
          </h2>
          <p className="mt-3 text-sm text-stone-500 sm:text-base dark:text-stone-400">{t('how.subtitle')}</p>
        </div>

        <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-[2.35rem] hidden border-t border-dashed border-stone-300 sm:block dark:border-white/15" />
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.key}
                className="relative rounded-2xl border border-stone-200/80 bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-stone-200">
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-sm">
                    {step.key}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-stone-900 dark:text-white">
                  {t(step.title)}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
                  {t(step.text)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
