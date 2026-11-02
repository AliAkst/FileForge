import { Lock, Plus, ShieldCheck, UserX } from 'lucide-react'
import { useI18n } from '../i18n'

const points = [
  { icon: ShieldCheck, title: 'privacy.point1Title', text: 'privacy.point1Text' },
  { icon: UserX, title: 'privacy.point2Title', text: 'privacy.point2Text' },
  { icon: Lock, title: 'privacy.point3Title', text: 'privacy.point3Text' },
]

const faqs = [
  { question: 'privacy.faq1Q', answer: 'privacy.faq1A' },
  { question: 'privacy.faq2Q', answer: 'privacy.faq2A' },
  { question: 'privacy.faq3Q', answer: 'privacy.faq3A' },
  { question: 'privacy.faq4Q', answer: 'privacy.faq4A' },
]

export default function PrivacySection() {
  const { t } = useI18n()

  return (
    <section id="privacy" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-stone-900 px-6 py-10 text-stone-100 shadow-2xl shadow-stone-950/20 sm:px-10 sm:py-14 dark:border dark:border-white/10 dark:bg-stone-900/80">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-400">{t('privacy.kicker')}</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('privacy.title')}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-300">{t('privacy.text')}</p>

            <div className="mt-8 space-y-5">
              {points.map((point) => {
                const Icon = point.icon
                return (
                  <div key={point.title} className="flex gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-brand-300 ring-1 ring-inset ring-white/10">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t(point.title)}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-stone-400">{t(point.text)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-[11px] font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('privacy.badge')}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-white">{t('privacy.faqTitle')}</h3>
            <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
              {faqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[13px] font-semibold text-stone-200 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                    {t(faq.question)}
                    <Plus className="h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-45 group-open:text-brand-400" />
                  </summary>
                  <p className="-mt-1 pb-4 pr-8 text-[12px] leading-relaxed text-stone-400">{t(faq.answer)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
