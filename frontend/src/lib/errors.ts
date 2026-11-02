export type ErrorCode =
  | 'noText'
  | 'noTextFound'
  | 'encrypted'
  | 'invalidPdf'
  | 'noSheets'
  | 'unsupported'
  | 'fileTooLarge'
  | 'emptyFile'
  | 'imageLoad'
  | 'docxLoad'
  | 'generic'
  | 'render'
  | 'noFiles'

export class AppError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, detail?: string) {
    super(detail ?? code)
    this.name = 'AppError'
    this.code = code
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
