import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { useI18n } from '../i18n'

interface DropzoneProps {
  onFiles: (files: File[]) => void
  title: string
  subtitle: string
  hint?: string
  variant?: 'hero' | 'compact'
  disabled?: boolean
}

export default function Dropzone({
  onFiles,
  title,
  subtitle,
  hint,
  variant = 'compact',
  disabled = false,
}: DropzoneProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    onFiles(Array.from(fileList))
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPicker()
    }
  }

  const hero = variant === 'hero'

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (event.currentTarget.contains(event.relatedTarget as Node)) return
        setDragging(false)
      }}
      onDrop={handleDrop}
      aria-label={title}
      className={[
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed text-left transition-all duration-200',
        hero ? 'p-7 sm:p-9' : 'p-6',
        dragging
          ? 'scale-[1.01] border-brand-500 bg-brand-50/80 shadow-lg shadow-brand-500/10 dark:bg-brand-500/10'
          : 'border-stone-300 bg-white/70 hover:border-brand-400 hover:bg-white dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-brand-500/60 dark:hover:bg-white/[0.06]',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-400/15 to-amber-300/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className={`relative flex ${hero ? 'flex-col items-center text-center sm:flex-row sm:text-left' : 'items-center'} gap-4`}>
        <span
          className={[
            'flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-lg shadow-brand-500/25 transition-transform duration-200 group-hover:scale-105',
            hero ? 'h-14 w-14' : 'h-11 w-11',
          ].join(' ')}
        >
          <UploadCloud className={hero ? 'h-7 w-7' : 'h-5 w-5'} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className={`font-display font-semibold text-stone-900 dark:text-white ${hero ? 'text-lg sm:text-xl' : 'text-[15px]'}`}>
            {dragging ? t('workspace.dropActive') : title}
          </p>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>
          {hint && (
            <p className="mt-2 text-xs font-medium text-stone-400 dark:text-stone-500">{hint}</p>
          )}
        </div>
      </div>
    </div>
  )
}
