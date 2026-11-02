import type { LucideIcon } from 'lucide-react'

export type Category = 'pdf' | 'document' | 'image' | 'table'

export interface ToolOptionChoice {
  value: string
  labelKey: string
}

export interface ToolOption {
  id: string
  type: 'select' | 'toggle' | 'text'
  labelKey: string
  defaultValue: string | boolean
  choices?: ToolOptionChoice[]
  placeholderKey?: string
  helpKey?: string
  showWhen?: {
    id: string
    equals: string | boolean
  }
}

export interface ToolDef {
  id: string
  category: Category
  icon: LucideIcon
  gradient: string
  accept: string[]
  multiple: boolean
  minFiles: number
  options: ToolOption[]
  popular?: boolean
}

export type OptionValues = Record<string, string | boolean>

export function defaultOptions(tool: ToolDef): OptionValues {
  const values: OptionValues = {}
  tool.options.forEach((option) => {
    values[option.id] = option.defaultValue
  })
  return values
}

export function isVisibleOption(option: ToolOption, values: OptionValues): boolean {
  if (!option.showWhen) return true
  return values[option.showWhen.id] === option.showWhen.equals
}
