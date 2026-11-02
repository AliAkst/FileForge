import { useEffect, useState } from 'react'
import { Languages, Moon, Sun } from 'lucide-react'
import { useI18n } from '../i18n'
import Logo from './Logo'

export default function Header() {
  const { t, lang, setLang } = useI18n()
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('fileforge.theme', dark ? 'dark' : 'light')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#0c0a09' : '#fafaf9')
  }, [dark])

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="rounded-xl" aria-label="FileForge">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="#tools"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {t('nav.tools')}
          </a>
          <a
            href="#how"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {t('nav.how')}
          </a>
          <a
            href="#privacy"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            {t('nav.privacy')}
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white/70 px-2.5 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10"
            aria-label={t('nav.lang')}
            title={t('nav.lang')}
          >
            <Languages className="h-4 w-4 text-stone-500 dark:text-stone-400" />
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white/70 text-stone-600 transition-colors hover:border-stone-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
            aria-label={t('nav.theme')}
            title={t('nav.theme')}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
