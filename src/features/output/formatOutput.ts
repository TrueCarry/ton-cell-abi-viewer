import { stringify } from 'yaml'
import type { SerializableValue } from '../../lib/serializable'
import type { CellParseResult, OutputFormat } from '../parser/model'

export const OUTPUT_FORMATS: readonly { value: OutputFormat; label: string }[] = [
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'Raw cell' },
  { value: 'code', label: 'TVM code' },
]

export function formatOutput(result: CellParseResult, format: OutputFormat): string {
  if (format === 'code') {
    return result.disassembly ?? 'Disassembly unavailable for this cell.'
  }

  const value =
    format === 'raw' ? (result.raw ?? getJsonHeroContent(result)) : getJsonHeroContent(result)

  if (format === 'json' || format === 'raw') {
    return JSON.stringify(value, null, 2)
  }

  return stringify(value)
}

export function getJsonHeroContent(result: CellParseResult): SerializableValue {
  switch (result.status) {
    case 'success':
    case 'partial':
      return {
        status: result.status,
        parser: result.parser,
        provenance: result.provenance ?? null,
        cell: result.cell ?? null,
        data: result.data,
        warnings: result.warnings,
      }
    case 'unknown':
      return {
        status: result.status,
        cell: result.cell ?? null,
        data: result.data,
        raw: result.raw ?? null,
        warnings: result.warnings,
      }
    case 'error':
      return {
        status: result.status,
        error: result.error.message,
        cause: result.error.cause ?? null,
        warnings: result.warnings,
      }
  }
}

export function getRenderedContent(
  result: CellParseResult,
  format: OutputFormat,
): SerializableValue {
  if (format === 'raw') {
    return result.raw ?? getJsonHeroContent(result)
  }
  return getJsonHeroContent(result)
}
