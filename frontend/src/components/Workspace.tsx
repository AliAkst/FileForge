import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { isAppError } from '../lib/errors'
import {
  baseName,
  downloadBlob,
  extensionOf,
  formatBytes,
  MAX_FILE_SIZE,
  sanitizeFilename,
  zipOutputs,
  type OutputFile,
} from '../lib/files'
import { runTool } from '../tools/runTool'
import { defaultOptions, isVisibleOption, type OptionValues, type ToolDef, type ToolOption } from '../tools/types'
import Dropzone from './Dropzone'

interface WorkspaceProps {
  tool: ToolDef
  initialFiles: File[]
  onClose: () => void
}

type Phase = 'idle' | 'working' | 'done' | 'error'

function FileIcon({ name }: { name: string }) {
  const extension = extensionOf(name)
  if (extension === 'pdf') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <FileText className="h-4 w-4" />
      </span>
    )
  }
  if (['doc', 'docx'].includes(extension)) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <FileText className="h-4 w-4" />
      </span>
    )
  }
  if (['xls', 'xlsx', 'csv', 'tsv'].includes(extension)) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <FileSpreadsheet className="h-4 w-4" />
      </span>
    )
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400">
        <ImageIcon className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-400">
      <FileText className="h-4 w-4" />
    </span>
  )
}

function OptionControl({
  option,
  value,
  onChange,
}: {
  option: ToolOption
  value: string | boolean
  onChange: (value: string | boolean) => void
}) {
  const { t } = useI18n()
  const label = t(option.labelKey)
  const help = option.helpKey ? t(option.helpKey) : null

  if (option.type === 'toggle') {
    const enabled = Boolean(value)
    return (
      <div className="flex items-start justify-between gap-3 py-2.5">
        <div>
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{label}</p>
          {help && <p className="mt-0.5 text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">{help}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          onClick={() => onChange(!enabled)}
          className={`relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-brand-500' : 'bg-stone-300 dark:bg-white/15'
          }`}
        >
          <span
            className={`inline-block h-[1.1rem] w-[1.1rem] transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-[1.15rem]' : 'translate-x-1'
            }`}
            style={{ height: '1.1rem', width: '1.1rem' }}
          />
        </button>
      </div>
    )
  }

  if (option.type === 'select') {
    return (
      <div className="py-2.5">
        <label className="text-[13px] font-semibold text-stone-800 dark:text-stone-100" htmlFor={`option-${option.id}`}>
          {label}
        </label>
        <div className="relative mt-1.5">
          <select
            id={`option-${option.id}`}
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-stone-200 bg-white pl-3 pr-9 text-[13px] font-medium text-stone-700 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-stone-200"
          >
            {option.choices?.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {t(choice.labelKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
        {help && <p className="mt-1 text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">{help}</p>}
      </div>
    )
  }

  return (
    <div className="py-2.5">
      <label className="text-[13px] font-semibold text-stone-800 dark:text-stone-100" htmlFor={`option-${option.id}`}>
        {label}
      </label>
      <input
        id={`option-${option.id}`}
        type="text"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={option.placeholderKey ? t(option.placeholderKey) : undefined}
        className="mt-1.5 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-[13px] text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:placeholder:text-stone-500"
      />
      {help && <p className="mt-1 text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">{help}</p>}
    </div>
  )
}

export default function Workspace({ tool, initialFiles, onClose }: WorkspaceProps) {
  const { t, lang } = useI18n()
  const Icon = tool.icon
  const [files, setFiles] = useState<File[]>(() =>
    tool.multiple ? initialFiles : initialFiles.slice(0, 1),
  )
  const [options, setOptions] = useState<OptionValues>(() => defaultOptions(tool))
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [outputs, setOutputs] = useState<OutputFile[]>([])
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files])
  const canConvert = files.length >= tool.minFiles && phase !== 'working'

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 7000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const resetResult = () => {
    setPhase('idle')
    setOutputs([])
    setError(null)
    setProgress(0)
  }

  const validate = (incoming: File[]) => {
    const valid: File[] = []
    const errors: string[] = []
    for (const file of incoming) {
      const extension = extensionOf(file.name)
      if (!tool.accept.includes(extension)) {
        errors.push(t('workspace.invalid', { ext: extension ? `.${extension}` : '?' }))
        continue
      }
      if (file.size === 0) {
        errors.push(t('workspace.empty'))
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(t('workspace.tooLarge'))
        continue
      }
      valid.push(file)
    }
    return { valid, errors }
  }

  const handleFiles = (incoming: File[]) => {
    const { valid, errors } = validate(incoming)
    if (errors.length > 0) {
      setNotice(errors[0])
    } else if (!tool.multiple && incoming.length > 1) {
      setNotice(t('workspace.singleHint'))
    } else {
      setNotice(null)
    }
    if (valid.length === 0) return

    setFiles((previous) => (tool.multiple ? [...previous, ...valid] : [valid[0]]))
    resetResult()
  }

  const removeFile = (index: number) => {
    setFiles((previous) => previous.filter((_, position) => position !== index))
    resetResult()
  }

  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((previous) => {
      const target = index + direction
      if (target < 0 || target >= previous.length) return previous
      const next = [...previous]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    resetResult()
  }

  const clearFiles = () => {
    setFiles([])
    setNotice(null)
    resetResult()
  }

  const updateOption = (id: string, value: string | boolean) => {
    setOptions((previous) => ({ ...previous, [id]: value }))
    resetResult()
  }

  const handleConvert = async () => {
    if (!canConvert) {
      if (files.length < tool.minFiles) {
        setNotice(t('workspace.minFiles', { n: tool.minFiles }))
      }
      return
    }

    setNotice(null)
    setError(null)
    setOutputs([])
    setPhase('working')
    setProgress(2)

    try {
      const result = await runTool(tool.id, files, options, (percent) => {
        setProgress((previous) => Math.max(previous, Math.min(99, Math.round(percent))))
      }, lang)
      setOutputs(result)
      setProgress(100)
      setPhase('done')
    } catch (caught) {
      const message = isAppError(caught) ? t(`errors.${caught.code}`) : t('errors.generic')
      const detail =
        caught instanceof Error && !isAppError(caught) && caught.message !== message
          ? caught.message
          : undefined
      setError({ message, detail })
      setPhase('error')
    }
  }

  const handleDownloadAll = async () => {
    if (outputs.length === 0) return
    setZipping(true)
    try {
      const name = `${sanitizeFilename(baseName(files[0]?.name ?? 'fileforge'))}-fileforge.zip`
      const zipped = await zipOutputs(outputs, name)
      downloadBlob(zipped.blob, zipped.name)
    } finally {
      setZipping(false)
    }
  }

  const visibleOptions = tool.options.filter((option) => isVisibleOption(option, options))
  const outputCountLabel =
    outputs.length > 1 ? t('workspace.outputCount', { n: outputs.length }) : null

  return (
    <section id="workspace" className="scroll-mt-24 pb-16 pt-4 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-up overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white/85 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]">
          <div className="border-b border-stone-200/70 bg-gradient-to-r from-white/60 to-stone-50/60 px-5 py-5 sm:px-7 dark:border-white/10 dark:from-white/[0.02] dark:to-white/[0.01]">
            <button
              type="button"
              onClick={onClose}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('workspace.back')}
            </button>
            <div className="flex items-start gap-3.5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${tool.gradient}`}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                  {t('workspace.kicker')}
                </p>
                <h2 className="mt-0.5 font-display text-xl font-bold tracking-tight text-stone-950 sm:text-2xl dark:text-white">
                  {t(`tool.${tool.id}.title`)}
                </h2>
                <p className="mt-1 text-[13px] text-stone-500 dark:text-stone-400">
                  {t(`tool.${tool.id}.desc`)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
            <div className="min-w-0">
              <Dropzone
                onFiles={handleFiles}
                title={t('workspace.dropTitle')}
                subtitle={t('workspace.dropSubtitle')}
                hint={t('workspace.supported', {
                  types: tool.accept.map((extension) => `.${extension.toUpperCase()}`).join(', '),
                })}
                disabled={phase === 'working'}
              />

              <p className="mt-2 px-1 text-[11px] text-stone-400 dark:text-stone-500">
                {tool.multiple ? t('workspace.multiHint') : t('workspace.singleHint')}
              </p>

              {notice && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{notice}</span>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                    aria-label={t('workspace.closeNotice')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
                        {t('workspace.files')}
                      </h3>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-white/5 dark:text-stone-400">
                        {files.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={clearFiles}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                        {t('workspace.clear')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="group flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-2 transition-colors hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                      >
                        <FileIcon name={file.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-stone-800 dark:text-stone-100">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        {tool.multiple && files.length > 1 && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveFile(index, -1)}
                              disabled={index === 0}
                              className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
                              aria-label={t('workspace.moveUp')}
                              title={t('workspace.moveUp')}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveFile(index, 1)}
                              disabled={index === files.length - 1}
                              className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/10 dark:hover:text-white"
                              aria-label={t('workspace.moveDown')}
                              title={t('workspace.moveDown')}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          aria-label={t('workspace.remove')}
                          title={t('workspace.remove')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
                    <span>{t('workspace.total', { n: files.length, size: formatBytes(totalSize) })}</span>
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      {t('workspace.addMore')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 sm:p-5 lg:sticky lg:top-24 dark:border-white/10 dark:bg-white/[0.025]">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-stone-400" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                    {t('workspace.options')}
                  </h3>
                </div>

                <div className="mt-1 divide-y divide-stone-200/70 dark:divide-white/10">
                  {visibleOptions.length > 0 ? (
                    visibleOptions.map((option) => (
                      <OptionControl
                        key={option.id}
                        option={option}
                        value={options[option.id]}
                        onChange={(value) => updateOption(option.id, value)}
                      />
                    ))
                  ) : (
                    <div className="flex items-center gap-2 py-4 text-[12px] text-stone-400 dark:text-stone-500">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      {t('workspace.privacy')}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={!canConvert}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    {phase === 'working' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('workspace.converting')}
                      </>
                    ) : (
                      <>
                        <Icon className="h-4 w-4" />
                        {t('workspace.convert')}
                      </>
                    )}
                  </button>

                  {phase === 'working' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        <span>{t('workspace.progress', { n: progress })}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500 transition-[width] duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-stone-400 dark:text-stone-500">
                        {t('workspace.processingNote')}
                      </p>
                    </div>
                  )}

                  {phase !== 'working' && files.length < tool.minFiles && (
                    <p className="mt-2 text-center text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      {t('workspace.minFiles', { n: tool.minFiles })}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-800 dark:border-emerald-500/15 dark:bg-emerald-500/[0.07] dark:text-emerald-200">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t('workspace.privacy')}
                </div>
              </div>
            </div>
          </div>

          {(phase === 'done' || phase === 'error') && (
            <div className="border-t border-stone-200/70 p-5 sm:p-7 dark:border-white/10">
              {phase === 'done' ? (
                <div className="animate-fade-up rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-emerald-950 dark:text-emerald-50">
                          {t('workspace.successTitle')}
                        </h3>
                        {outputCountLabel && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {outputCountLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-emerald-800/80 dark:text-emerald-200/80">
                        {t('workspace.successText')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {outputs.map((output) => (
                      <div
                        key={output.name}
                        className="flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-white/85 px-3 py-2.5 dark:border-emerald-500/15 dark:bg-white/[0.04]"
                      >
                        <FileIcon name={output.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-stone-800 dark:text-stone-100">
                            {output.name}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500">
                            {formatBytes(output.blob.size)}
                            {output.note ? ` · ${output.note}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadBlob(output.blob, output.name)}
                          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3 text-[11px] font-bold text-white transition-colors hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t('workspace.download')}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {outputs.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        disabled={zipping}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {zipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {t('workspace.downloadAll')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFiles([])
                        resetResult()
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white/70 px-3.5 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-white dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-200 dark:hover:bg-white/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t('workspace.another')}
                    </button>
                    <p className="text-[10px] text-emerald-700/60 dark:text-emerald-300/60">{t('workspace.resultNote')}</p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-up rounded-2xl border border-red-200 bg-red-50/70 p-4 sm:p-5 dark:border-red-500/20 dark:bg-red-500/[0.07]">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-md shadow-red-500/25">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-bold text-red-950 dark:text-red-50">
                        {t('workspace.errorTitle')}
                      </h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-red-800 dark:text-red-200">
                        {error?.message}
                      </p>
                      {error?.detail && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] font-semibold text-red-500 dark:text-red-300">
                            {t('workspace.technicalDetails')}
                          </summary>
                          <p className="mt-1 break-words rounded-lg bg-red-100/60 p-2 font-mono text-[10px] text-red-700 dark:bg-red-500/10 dark:text-red-200">
                            {error.detail}
                          </p>
                        </details>
                      )}
                      <button
                        type="button"
                        onClick={handleConvert}
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-red-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t('workspace.retry')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
