import type { SerializableValue } from '../../lib/serializable'

export type OutputFormat = 'yaml' | 'json' | 'raw' | 'code'
export type ParserResultStatus = 'success' | 'error' | 'partial' | 'unknown'
export type NormalizedInputKind = 'base64' | 'hex' | 'te6cc'
export type NormalizedInputSource = 'raw' | 'explorer-link'
export type ParserEngine =
  | 'custom-tlb'
  | 'known-abi'
  | 'tlb-abi'
  | 'block-tlb'
  | 'comment'
  | 'raw-cell-tree'

export type ParserOptions = {
  /**
   * Root cell index to decode; 0 is the first root.
   */
  rootIndex: number
  /**
   * Reject parses with unread bits or refs.
   */
  strict: boolean
  /**
   * Maximum nested cell depth to parse before raw summaries are used.
   */
  maxDepth: number
  /**
   * Optional TLB schema tried before the built-in parsers.
   */
  customTlb: string
}

export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  rootIndex: 0,
  strict: true,
  maxDepth: 8,
  customTlb: '',
}

export const PARSER_OPTION_DESCRIPTIONS = {
  rootIndex: 'Root cell index to decode; 0 is the first root.',
  strict: 'Reject parses with unread bits or refs.',
  maxDepth: 'Maximum nested cell depth to parse before raw summaries are used.',
  customTlb: 'Optional TLB schema tried before the built-in parsers.',
} satisfies Record<keyof ParserOptions, string>

export type NormalizedInput = {
  original: string
  value: string
  kind: NormalizedInputKind
  source: NormalizedInputSource
}

export type CellSummary = {
  bits: number
  refs: number
  depth: number
  rootIndex: number
  roots: number
  hash: string
}

export type ParserErrorModel = {
  message: string
  cause?: string
}

type ParseResultBase = {
  warnings: string[]
  normalized?: NormalizedInput
  cell?: CellSummary
  disassembly?: string
  raw?: SerializableValue
  provenance?: { parser: string; confidence?: number; bytesConsumed?: number }
}

export type SuccessParseResult = ParseResultBase & {
  status: 'success'
  parser: ParserEngine
  data: SerializableValue
}

export type PartialParseResult = ParseResultBase & {
  status: 'partial'
  parser: ParserEngine
  data: SerializableValue
}

export type UnknownParseResult = ParseResultBase & {
  status: 'unknown'
  data: string
}

export type ErrorParseResult = ParseResultBase & {
  status: 'error'
  error: ParserErrorModel
}

export type CellParseResult =
  | SuccessParseResult
  | PartialParseResult
  | UnknownParseResult
  | ErrorParseResult

export type ParseWorkerRequest = {
  id: number
  input: string
  options: ParserOptions
}

export type ParseWorkerResponse = {
  id: number
  result: CellParseResult
}
