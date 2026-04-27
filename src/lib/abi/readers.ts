import type { Address, Cell, Slice } from '@ton/core'
import { Buffer } from 'buffer'
import type {
  AbiCategory,
  AbiRecord,
  CellSummary,
  DecodedAbi,
  DecodeConfidence,
  EitherCell,
} from './types'

export function opcodeHex(opcode: number): string {
  return `0x${opcode.toString(16).padStart(8, '0')}`
}

export function makeDecoded(
  category: AbiCategory,
  name: string,
  decoder: string,
  opcode: number | undefined,
  value: AbiRecord,
  confidence: DecodeConfidence = 'exact',
): DecodedAbi {
  return {
    kind: 'AbiDecoded',
    category,
    name,
    decoder,
    confidence,
    opcode: opcode === undefined ? undefined : opcodeHex(opcode),
    value,
  }
}

export function tryRead<T>(reader: () => T): T | undefined {
  try {
    return reader()
  } catch (_error) {
    return undefined
  }
}

export function summarizeCell(cell: Cell): CellSummary {
  return {
    kind: 'Cell',
    bits: cell.bits.length,
    refs: cell.refs.length,
    hash: cell.hash().toString('hex'),
    boc: cell.toBoc().toString('hex'),
  }
}

export function loadMsgAddress(slice: Slice): Address | null {
  return slice.loadMaybeAddress()
}

export function loadEitherCell(slice: Slice): EitherCell {
  const isRef = slice.loadBit()
  if (isRef) {
    const cell = slice.loadRef()
    return { kind: 'ref', cell, bits: cell.bits.length, refs: cell.refs.length }
  }
  const cell = slice.asCell()
  return { kind: 'inline', cell, bits: slice.remainingBits, refs: slice.remainingRefs }
}

export function readRemainingBytes(slice: Slice): Buffer | undefined {
  if (slice.remainingBits % 8 !== 0) {
    return undefined
  }
  return slice.loadBuffer(slice.remainingBits / 8)
}

export function sliceRemainder(slice: Slice): AbiRecord {
  return {
    bits: slice.remainingBits,
    refs: slice.remainingRefs,
    cell: summarizeCell(slice.asCell()),
  }
}

export function readSnakeBytesFromCell(cell: Cell, maxCells = 32): Buffer {
  const chunks: Buffer[] = []
  const seen = new Set<string>()
  let current: Cell | undefined = cell
  let reads = 0

  while (current && reads < maxCells) {
    const hash = current.hash().toString('hex')
    if (seen.has(hash)) {
      break
    }
    seen.add(hash)
    reads += 1

    const slice = current.beginParse(true)
    const bytes = Math.floor(slice.remainingBits / 8)
    if (bytes > 0) {
      chunks.push(slice.loadBuffer(bytes))
    }
    current = slice.remainingRefs > 0 ? slice.loadRef() : undefined
  }

  return Buffer.concat(chunks)
}

export function readSnakeStringFromCell(cell: Cell): string | undefined {
  const bytes = readSnakeBytesFromCell(cell)
  if (bytes.length === 0) {
    return ''
  }
  const text = bytes.toString('utf8')
  return text.includes('\u0000') ? undefined : text
}

export function plausibleUnixTime(value: number): boolean {
  return value === 0 || (value >= 1_500_000_000 && value <= 4_200_000_000)
}
