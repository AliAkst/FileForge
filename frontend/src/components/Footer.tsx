import { Github, ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n'
import { getTool } from '../tools/definitions'
import Logo from './Logo'

interface FooterProps {
  onOpenTool: (id: string) => void
}

const toolLinks = ['pdf-to-word', 'merge-pdf', 'compress-pdf', 'images-to-pdf', 'pdf-to-excel', 'excel-to-pdf']

export default function Footer({ onOpenTool }: FooterProps) {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-200/70 bg-white/40 dark:border-white/10 dark:bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
              {t('footer.tagline')}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              {t('footer.local')}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
              {t('footer.tools')}
            </h3>
            <ul className="mt-3 space-y-2">
              {toolLinks.map((id) => {
                const tool = getTool(id)
                if (!tool) return null
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onOpenTool(id)}
                      className="text-[13px] text-stone-600 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400"
                    >
                      {t(`tool.${id}.title`)}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
              {t('footer.about')}
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="#tools" className="text-[13px] text-stone-600 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400">
                  {t('nav.tools')}
                </a>
              </li>
              <li>
                <a href="#how" className="text-[13px] text-stone-600 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400">
                  {t('nav.how')}
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-[13px] text-stone-600 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-[13px] text-stone-600 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400">
                  {t('footer.faq')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-stone-200/70 pt-6 text-[11px] text-stone-400 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-stone-500">
          <p>
            © {year} FileForge. {t('footer.rights')}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            {t('footer.made')} · {t('footer.license')}
          </p>
        </div>
      </div>
    </footer>
  )
}
