import {
  AlignLeft,
  Combine,
  FileDown,
  FileImage,
  FileOutput,
  FileSpreadsheet,
  FileText,
  FileType,
  Image,
  Images,
  Minimize2,
  RotateCw,
  Scissors,
  Sheet,
  Table2,
} from 'lucide-react'
import type { Category, ToolDef } from './types'

export const categories: { id: 'all' | Category; labelKey: string }[] = [
  { id: 'all', labelKey: 'tools.all' },
  { id: 'pdf', labelKey: 'tools.pdf' },
  { id: 'document', labelKey: 'tools.document' },
  { id: 'image', labelKey: 'tools.image' },
  { id: 'table', labelKey: 'tools.table' },
]

const pageRangeOption = {
  id: 'pageRange',
  type: 'text' as const,
  labelKey: 'opt.pageRange',
  placeholderKey: 'opt.pageRange.placeholder',
  helpKey: 'opt.pageRange.help',
  defaultValue: '',
}

export const tools: ToolDef[] = [
  {
    id: 'pdf-to-word',
    category: 'pdf',
    icon: FileText,
    gradient: 'from-blue-600 to-indigo-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    popular: true,
    options: [
      pageRangeOption,
      {
        id: 'preserveLayout',
        type: 'toggle',
        labelKey: 'opt.preserveLayout',
        helpKey: 'opt.preserveLayout.help',
        defaultValue: true,
      },
      {
        id: 'detectHeadings',
        type: 'toggle',
        labelKey: 'opt.detectHeadings',
        helpKey: 'opt.detectHeadings.help',
        defaultValue: true,
        showWhen: { id: 'preserveLayout', equals: false },
      },
    ],
  },
  {
    id: 'word-to-pdf',
    category: 'document',
    icon: FileType,
    gradient: 'from-sky-500 to-blue-600',
    accept: ['docx'],
    multiple: false,
    minFiles: 1,
    options: [
      {
        id: 'orientation',
        type: 'select',
        labelKey: 'opt.orientation',
        defaultValue: 'portrait',
        choices: [
          { value: 'portrait', labelKey: 'opt.orientation.portrait' },
          { value: 'landscape', labelKey: 'opt.orientation.landscape' },
        ],
      },
    ],
  },
  {
    id: 'pdf-to-jpg',
    category: 'pdf',
    icon: Image,
    gradient: 'from-amber-500 to-orange-500',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    popular: true,
    options: [
      pageRangeOption,
      {
        id: 'quality',
        type: 'select',
        labelKey: 'opt.quality',
        defaultValue: 'high',
        choices: [
          { value: 'high', labelKey: 'opt.quality.high' },
          { value: 'medium', labelKey: 'opt.quality.medium' },
          { value: 'low', labelKey: 'opt.quality.low' },
        ],
      },
      {
        id: 'scale',
        type: 'select',
        labelKey: 'opt.scale',
        defaultValue: '2',
        choices: [
          { value: '1', labelKey: 'opt.scale.1' },
          { value: '1.5', labelKey: 'opt.scale.1.5' },
          { value: '2', labelKey: 'opt.scale.2' },
          { value: '3', labelKey: 'opt.scale.3' },
        ],
      },
    ],
  },
  {
    id: 'pdf-to-png',
    category: 'pdf',
    icon: Images,
    gradient: 'from-emerald-500 to-teal-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    options: [
      pageRangeOption,
      {
        id: 'scale',
        type: 'select',
        labelKey: 'opt.scale',
        defaultValue: '2',
        choices: [
          { value: '1', labelKey: 'opt.scale.1' },
          { value: '2', labelKey: 'opt.scale.2' },
          { value: '3', labelKey: 'opt.scale.3' },
        ],
      },
    ],
  },
  {
    id: 'images-to-pdf',
    category: 'image',
    icon: FileImage,
    gradient: 'from-fuchsia-500 to-pink-500',
    accept: ['jpg', 'jpeg', 'png', 'webp'],
    multiple: true,
    minFiles: 1,
    popular: true,
    options: [
      {
        id: 'pageSize',
        type: 'select',
        labelKey: 'opt.pageSize',
        defaultValue: 'a4',
        choices: [
          { value: 'a4', labelKey: 'opt.pageSize.a4' },
          { value: 'letter', labelKey: 'opt.pageSize.letter' },
          { value: 'auto', labelKey: 'opt.pageSize.auto' },
        ],
      },
      {
        id: 'orientation',
        type: 'select',
        labelKey: 'opt.orientation',
        defaultValue: 'auto',
        choices: [
          { value: 'auto', labelKey: 'opt.orientation.auto' },
          { value: 'portrait', labelKey: 'opt.orientation.portrait' },
          { value: 'landscape', labelKey: 'opt.orientation.landscape' },
        ],
      },
      {
        id: 'margin',
        type: 'select',
        labelKey: 'opt.margin',
        defaultValue: 'small',
        choices: [
          { value: 'small', labelKey: 'opt.margin.small' },
          { value: 'normal', labelKey: 'opt.margin.normal' },
          { value: 'none', labelKey: 'opt.margin.none' },
        ],
      },
    ],
  },
  {
    id: 'merge-pdf',
    category: 'pdf',
    icon: Combine,
    gradient: 'from-violet-500 to-purple-600',
    accept: ['pdf'],
    multiple: true,
    minFiles: 2,
    popular: true,
    options: [],
  },
  {
    id: 'split-pdf',
    category: 'pdf',
    icon: Scissors,
    gradient: 'from-cyan-500 to-sky-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    options: [
      {
        id: 'splitMode',
        type: 'select',
        labelKey: 'opt.splitMode',
        defaultValue: 'each',
        choices: [
          { value: 'each', labelKey: 'opt.splitMode.each' },
          { value: 'range', labelKey: 'opt.splitMode.range' },
        ],
      },
      {
        ...pageRangeOption,
        showWhen: { id: 'splitMode', equals: 'range' },
      },
    ],
  },
  {
    id: 'rotate-pdf',
    category: 'pdf',
    icon: RotateCw,
    gradient: 'from-lime-500 to-green-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    options: [
      {
        id: 'angle',
        type: 'select',
        labelKey: 'opt.angle',
        defaultValue: '90',
        choices: [
          { value: '90', labelKey: 'opt.angle.90' },
          { value: '180', labelKey: 'opt.angle.180' },
          { value: '270', labelKey: 'opt.angle.270' },
        ],
      },
      pageRangeOption,
    ],
  },
  {
    id: 'compress-pdf',
    category: 'pdf',
    icon: Minimize2,
    gradient: 'from-orange-500 to-red-500',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    popular: true,
    options: [
      {
        id: 'quality',
        type: 'select',
        labelKey: 'opt.quality',
        defaultValue: 'ebook',
        choices: [
          { value: 'screen', labelKey: 'opt.quality.screen' },
          { value: 'ebook', labelKey: 'opt.quality.ebook' },
          { value: 'print', labelKey: 'opt.quality.print' },
        ],
      },
    ],
  },
  {
    id: 'pdf-to-text',
    category: 'pdf',
    icon: AlignLeft,
    gradient: 'from-slate-500 to-gray-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    options: [
      pageRangeOption,
      {
        id: 'includeMarkers',
        type: 'toggle',
        labelKey: 'opt.includeMarkers',
        helpKey: 'opt.includeMarkers.help',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'pdf-to-excel',
    category: 'pdf',
    icon: Table2,
    gradient: 'from-green-600 to-emerald-600',
    accept: ['pdf'],
    multiple: false,
    minFiles: 1,
    options: [
      pageRangeOption,
      {
        id: 'splitColumns',
        type: 'toggle',
        labelKey: 'opt.splitColumns',
        helpKey: 'opt.splitColumns.help',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'excel-to-csv',
    category: 'table',
    icon: FileSpreadsheet,
    gradient: 'from-teal-500 to-cyan-600',
    accept: ['xlsx', 'xls'],
    multiple: true,
    minFiles: 1,
    options: [
      {
        id: 'allSheets',
        type: 'toggle',
        labelKey: 'opt.allSheets',
        helpKey: 'opt.allSheets.help',
        defaultValue: true,
      },
      {
        id: 'delimiter',
        type: 'select',
        labelKey: 'opt.delimiter',
        defaultValue: 'comma',
        choices: [
          { value: 'comma', labelKey: 'opt.delimiter.comma' },
          { value: 'semicolon', labelKey: 'opt.delimiter.semicolon' },
          { value: 'tab', labelKey: 'opt.delimiter.tab' },
        ],
      },
    ],
  },
  {
    id: 'csv-to-excel',
    category: 'table',
    icon: Sheet,
    gradient: 'from-emerald-500 to-green-600',
    accept: ['csv', 'tsv'],
    multiple: true,
    minFiles: 1,
    options: [
      {
        id: 'delimiter',
        type: 'select',
        labelKey: 'opt.delimiter',
        defaultValue: 'auto',
        choices: [
          { value: 'auto', labelKey: 'opt.delimiter.auto' },
          { value: 'comma', labelKey: 'opt.delimiter.comma' },
          { value: 'semicolon', labelKey: 'opt.delimiter.semicolon' },
          { value: 'tab', labelKey: 'opt.delimiter.tab' },
        ],
      },
    ],
  },
  {
    id: 'excel-to-pdf',
    category: 'table',
    icon: FileOutput,
    gradient: 'from-indigo-500 to-violet-600',
    accept: ['xlsx', 'xls'],
    multiple: true,
    minFiles: 1,
    options: [
      {
        id: 'orientation',
        type: 'select',
        labelKey: 'opt.orientation',
        defaultValue: 'landscape',
        choices: [
          { value: 'landscape', labelKey: 'opt.orientation.landscape' },
          { value: 'portrait', labelKey: 'opt.orientation.portrait' },
        ],
      },
    ],
  },
  {
    id: 'text-to-pdf',
    category: 'document',
    icon: FileDown,
    gradient: 'from-stone-500 to-neutral-600',
    accept: ['txt', 'md', 'log'],
    multiple: false,
    minFiles: 1,
    options: [
      {
        id: 'fontSize',
        type: 'select',
        labelKey: 'opt.fontSize',
        defaultValue: '11',
        choices: [
          { value: '10', labelKey: '10 pt' },
          { value: '11', labelKey: '11 pt' },
          { value: '12', labelKey: '12 pt' },
          { value: '14', labelKey: '14 pt' },
        ],
      },
      {
        id: 'pageSize',
        type: 'select',
        labelKey: 'opt.paper',
        defaultValue: 'a4',
        choices: [
          { value: 'a4', labelKey: 'opt.pageSize.a4' },
          { value: 'letter', labelKey: 'opt.pageSize.letter' },
        ],
      },
    ],
  },
]

export function getTool(id: string): ToolDef | undefined {
  return tools.find((tool) => tool.id === id)
}

export function compatibleTools(fileNames: string[]): ToolDef[] {
  if (fileNames.length === 0) return []
  const extensions = fileNames.map((name) => name.split('.').pop()?.toLowerCase() ?? '')
  return tools.filter((tool) => extensions.every((extension) => tool.accept.includes(extension)))
}
