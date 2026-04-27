import { Address, Cell, Dictionary, type Slice } from '@ton/core'
import { decompileAll, AssemblerWriter } from '@scaleton/tvm-disassembler'
import { parseWithPayloads } from '@truecarry/tlb-abi'
import { Buffer } from 'buffer'
import { parseKnownAbiCell } from '../../lib/abi'
import { toSerializable } from '../../lib/serializable'
import type { SerializableValue } from '../../lib/serializable'
import { canonicalizeBase64, normalizeCellInput } from './inputNormalization'
import type { CellParseResult, CellSummary, NormalizedInput, ParserOptions } from './model'
import { parseUsingBlockTypes } from './blockParser'
import { describeCellTree } from './rawCellTree'
import { getCachedTlbRuntime } from './tlbRuntimeCache'
import {
  clearParserRegistry,
  parseWithRegistry,
  registerParser,
  type ParserAttempt,
} from './parserRegistry'

type ReplaceResult = {
  data: unknown
  hasChanges: boolean
}

type DictionaryLike = {
  keys: () => unknown[]
  get: (key: unknown) => unknown
}

type RuntimeTlbResult = {
  success: boolean
  value?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

let defaultsRegistered = false

export function parseCellInput(input: string, options: ParserOptions): CellParseResult {
  const warnings: string[] = []
  let normalized: NormalizedInput | undefined

  try {
    const normalizedResult = normalizeCellInput(input)
    if (!normalizedResult.ok) {
      return toErrorResult(normalizedResult.message, warnings)
    }

    normalized = normalizedResult.input
    const { cell, roots } = decodeCell(normalized, options)
    const raw = toSerializable(describeCellTree(cell, { maxDepth: options.maxDepth }))
    const parsed = parseCell(cell, options, warnings)
    const cellSummary = summarizeCell(cell, options.rootIndex, roots)
    const disassembly = disassembleCell(cell)

    if (!parsed) {
      return {
        status: 'unknown',
        normalized,
        cell: cellSummary,
        data: cell.toString(),
        raw,
        disassembly,
        warnings,
        provenance: { parser: 'raw-cell-tree', confidence: 0.3 },
      }
    }

    const expanded = replaceCellPayload(parsed.value, options, warnings, 0).data
    const data = toSerializable(expanded)
    const base = {
      normalized,
      cell: cellSummary,
      data,
      raw,
      disassembly,
      parser: parsed.parser,
      provenance: {
        parser: parsed.parser,
        confidence: parsed.confidence,
        bytesConsumed: parsed.bytesConsumed,
      },
      warnings: mergeWarnings(warnings, parsed.warnings ?? []),
    }

    return base.warnings.length > 0
      ? { status: 'partial', ...base }
      : { status: 'success', ...base }
  } catch (error) {
    return toErrorResult(getErrorMessage(error), warnings, normalized, getErrorCause(error))
  }
}

function decodeCell(
  normalized: NormalizedInput,
  options: ParserOptions,
): { cell: Cell; roots: number } {
  const bytes =
    normalized.kind === 'hex'
      ? Buffer.from(normalized.value, 'hex')
      : Buffer.from(canonicalizeBase64(normalized.value), 'base64')
  const roots = Cell.fromBoc(bytes)
  const rootIndex = Math.max(0, Math.trunc(options.rootIndex))

  if (roots.length === 0) {
    throw new Error('BOC does not contain any root cells')
  }

  const cell = roots[rootIndex]
  if (!cell) {
    throw new Error(
      `Root index ${rootIndex} is out of range. BOC has ${roots.length} root cell(s).`,
    )
  }

  return { cell, roots: roots.length }
}

function summarizeCell(cell: Cell, rootIndex: number, roots: number): CellSummary {
  return {
    bits: cell.bits.length,
    refs: cell.refs.length,
    depth: getCellDepth(cell),
    rootIndex,
    roots,
    hash: Buffer.from(cell.hash()).toString('hex'),
  }
}

function ensureDefaultParsers(): void {
  if (defaultsRegistered) {
    return
  }

  clearParserRegistry()
  registerParser({
    id: 'custom-tlb',
    label: 'Custom TLB runtime',
    priority: 100,
    parse: (cell, context) => parseRuntimeTlb(cell, context.options.customTlb, context.warnings),
  })
  registerParser({
    id: 'known-abi',
    label: 'Known ABI opcode registry',
    priority: 90,
    parse: (cell) => {
      const decoded = parseKnownAbiCell(cell, { includeBlockPresets: false })
      return decoded
        ? {
            parser: 'known-abi',
            value: decoded,
            confidence: decoded.confidence === 'exact' ? 0.95 : 0.72,
          }
        : null
    },
  })
  registerParser({
    id: 'tlb-abi',
    label: '@truecarry/tlb-abi payload parser',
    priority: 80,
    parse: (cell, context) => parseTlbAbi(cell, context.options.strict),
  })
  registerParser({
    id: 'block-tlb',
    label: 'Generated block.tlb parser',
    priority: 40,
    parse: (cell, context) => {
      const parsed = parseUsingBlockTypes(cell, context.options.strict)
      return parsed ? { parser: 'block-tlb', value: parsed, confidence: 0.62 } : null
    },
  })

  defaultsRegistered = true
}

function parseCell(cell: Cell, options: ParserOptions, warnings: string[]): ParserAttempt | null {
  ensureDefaultParsers()
  return parseWithRegistry(cell, { options, warnings })
}

function parseRuntimeTlb(cell: Cell, tlb: string, warnings: string[]): ParserAttempt | null {
  const trimmedTlb = tlb.trim()
  if (!trimmedTlb) {
    return null
  }

  try {
    const runtime = getCachedTlbRuntime(trimmedTlb)
    const unpack = runtime.deserialize(cell) as RuntimeTlbResult
    if (unpack.success) {
      return { parser: 'custom-tlb', value: unpack.value ?? unpack, confidence: 0.98 }
    }

    pushWarning(warnings, 'Custom TLB did not match this cell.')
  } catch (error) {
    pushWarning(warnings, `Custom TLB failed: ${getErrorMessage(error)}`)
  }

  return null
}

function parseTlbAbi(cell: Cell, strict: boolean): ParserAttempt | null {
  const slice = cell.beginParse()
  const parsed = parseWithPayloads(slice) as unknown
  if (!parsed) {
    return null
  }

  const warnings = consumptionWarnings('tlb-abi', cell, slice, strict)
  if (strict && warnings.length > 0) {
    return null
  }

  if (isTextCommentPayload(parsed)) {
    const comment = parseTextComment(cell)
    if (comment) {
      return { parser: 'comment', value: comment, confidence: 1, warnings }
    }
  }

  return { parser: 'tlb-abi', value: parsed, confidence: warnings.length ? 0.72 : 0.86, warnings }
}

function parseTextComment(cell: Cell): { kind: 'Comment'; text: string } | undefined {
  if (cell.bits.length <= 32) {
    return undefined
  }

  const slice = cell.beginParse()
  const op = slice.loadUint(32)
  if (op !== 0) {
    return undefined
  }

  return { kind: 'Comment', text: slice.loadStringTail() }
}

function isTextCommentPayload(value: unknown): value is { data: { kind: 'TextComment' } } {
  return isRecord(value) && isRecord(value.data) && value.data.kind === 'TextComment'
}

function consumptionWarnings(parser: string, cell: Cell, slice: Slice, strict: boolean): string[] {
  const remainingBits = slice.remainingBits
  const remainingRefs = slice.remainingRefs
  if (remainingBits === 0 && remainingRefs === 0) {
    return []
  }

  const bitsConsumed = cell.bits.length - remainingBits
  const refsConsumed = cell.refs.length - remainingRefs
  return [
    `${parser} ${strict ? 'rejected' : 'partially parsed'} cell: consumed ${bitsConsumed} bits/${refsConsumed} refs, left ${remainingBits} bits/${remainingRefs} refs`,
  ]
}

function replaceCellPayload(
  value: unknown,
  options: ParserOptions,
  warnings: string[],
  depth: number,
): ReplaceResult {
  if (value === null || value === undefined) {
    return { data: value, hasChanges: false }
  }

  if (value instanceof Dictionary) {
    const dictionary = value as unknown as DictionaryLike
    const result: Record<string, unknown> = {}
    for (const key of dictionary.keys()) {
      result[String(key)] = replaceCellPayload(dictionary.get(key), options, warnings, depth).data
    }
    return { data: result, hasChanges: true }
  }

  if (value instanceof Map) {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of value.entries()) {
      result[String(key)] = replaceCellPayload(entry, options, warnings, depth).data
    }
    return { data: result, hasChanges: true }
  }

  if (value instanceof Cell) {
    if (depth >= options.maxDepth) {
      pushWarning(warnings, `Nested cell parsing stopped at max depth ${options.maxDepth}.`)
      return { data: describeCellTree(value, { maxDepth: 0 }), hasChanges: true }
    }

    const parsed = parseCell(value, options, warnings)
    if (!parsed) {
      return { data: describeCellTree(value, { maxDepth: 2 }), hasChanges: true }
    }

    const replaced = replaceCellPayload(parsed.value, options, warnings, depth + 1)
    return {
      data: {
        bocHex: value.toBoc().toString('hex'),
        parser: parsed.parser,
        parsed: replaced.data,
      },
      hasChanges: true,
    }
  }

  if (value instanceof Address || value instanceof Uint8Array) {
    return { data: value, hasChanges: false }
  }

  if (Array.isArray(value)) {
    const replaced = value.map((item) => replaceCellPayload(item, options, warnings, depth))
    const hasChanges = replaced.some((item) => item.hasChanges)
    return { data: hasChanges ? replaced.map((item) => item.data) : value, hasChanges }
  }

  if (isRecord(value)) {
    let hasChanges = false
    const result: Record<string, unknown> = { ...value }
    for (const [key, entry] of Object.entries(value)) {
      const replaced = replaceCellPayload(entry, options, warnings, depth)
      if (replaced.hasChanges) {
        hasChanges = true
        result[key] = replaced.data
      }
    }
    return { data: hasChanges ? result : value, hasChanges }
  }

  return { data: value, hasChanges: false }
}

function disassembleCell(cell: Cell): string | undefined {
  try {
    const ast = decompileAll({ src: cell })
    return AssemblerWriter.write(ast)
  } catch {
    return undefined
  }
}

function getCellDepth(cell: Cell, seen = new WeakSet<Cell>()): number {
  if (seen.has(cell) || cell.refs.length === 0) {
    return 0
  }
  seen.add(cell)
  return 1 + Math.max(...cell.refs.map((ref) => getCellDepth(ref, seen)))
}

function toErrorResult(
  message: string,
  warnings: string[],
  normalized?: NormalizedInput,
  cause?: string,
): CellParseResult {
  return {
    status: 'error',
    normalized,
    error: { message, cause },
    warnings,
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to parse cell'
}

function getErrorCause(error: unknown): string | undefined {
  if (isRecord(error) && 'cause' in error && error.cause) {
    return String(error.cause)
  }
  return undefined
}

function pushWarning(warnings: string[], warning: string): void {
  if (!warnings.includes(warning)) {
    warnings.push(warning)
  }
}

function mergeWarnings(left: string[], right: string[]): string[] {
  return Array.from(new Set([...left, ...right]))
}

export type { SerializableValue }
