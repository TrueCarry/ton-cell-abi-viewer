import type { Address, Cell, Slice } from '@ton/core'
import type { Buffer } from 'buffer'

export type AbiCategory =
  | 'comment'
  | 'jetton'
  | 'nft'
  | 'wallet'
  | 'highload'
  | 'multisig'
  | 'state'
  | 'metadata'
  | 'dns'
  | 'staking'
  | 'block'
  | 'unknown'

export type DecodeConfidence = 'exact' | 'heuristic' | 'fallback'
export type AbiPrimitive = string | number | bigint | boolean | null
export type AbiValue = AbiPrimitive | Address | Cell | Buffer | readonly AbiValue[] | AbiRecord
export type AbiRecord = Readonly<Record<string, unknown>>

export interface CellSummary {
  readonly kind: 'Cell'
  readonly bits: number
  readonly refs: number
  readonly hash: string
  readonly boc: string
}

export interface EitherCell {
  readonly kind: 'inline' | 'ref'
  readonly cell: Cell
  readonly bits: number
  readonly refs: number
}

export interface DecodedAbi {
  readonly kind: 'AbiDecoded'
  readonly category: AbiCategory
  readonly name: string
  readonly decoder: string
  readonly confidence: DecodeConfidence
  readonly opcode?: string
  readonly value: AbiRecord
}

export type OpcodeDecoder = (cell: Cell, slice: Slice, opcode: number) => DecodedAbi | undefined

export interface OpcodeDefinition {
  readonly opcode: number
  readonly name: string
  readonly category: AbiCategory
  readonly decoder: OpcodeDecoder
  readonly description?: string
}

export interface AbiParseOptions {
  readonly includeFallback?: boolean
  readonly includeBlockPresets?: boolean
}
