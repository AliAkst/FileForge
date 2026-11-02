declare module 'mammoth' {
  export interface MammothMessage {
    type: string
    message: string
  }

  export interface MammothResult {
    value: string
    messages: MammothMessage[]
  }

  export interface MammothInput {
    arrayBuffer: ArrayBuffer
  }

  export function convertToHtml(
    input: MammothInput,
    options?: Record<string, unknown>,
  ): Promise<MammothResult>

  const mammoth: {
    convertToHtml: typeof convertToHtml
  }

  export default mammoth
}
