import type { Cell } from '@ton/core'
import { decodeBinaryFallback } from './comments'
import { decodeDnsRecordCell, decodeMetadataCell } from './metadata'
import { decodeOpcodeCell, decodeSignedRequestHeuristics } from './opcodes'
import { parseBlockPresetCell } from './presets'
import { decodeStateInitCell } from './state'
import type { AbiParseOptions, DecodedAbi } from './types'

export type {
  AbiCategory,
  AbiParseOptions,
  AbiRecord,
  CellSummary,
  DecodedAbi,
  DecodeConfidence,
  EitherCell,
  OpcodeDefinition,
} from './types'
export { decodeBinaryFallback } from './comments'
export { decodeDnsRecordCell, decodeMetadataCell, decodeMetadataContent } from './metadata'
export {
  decodeOpcodeCell,
  decodeSignedRequestHeuristics,
  getOpcodeDefinition,
  listOpcodeRegistry,
  OPCODE_REGISTRY,
} from './opcodes'
export { listBlockPresets, parseBlockPresetCell } from './presets'
export { CODE_HASH_LABELS, codeHashLabel, decodeStateInitCell } from './state'

export function parseKnownAbiCell(
  cell: Cell,
  options: AbiParseOptions = {},
): DecodedAbi | undefined {
  const opcode = decodeOpcodeCell(cell)
  if (opcode) {
    return opcode
  }

  const signedRequest = decodeSignedRequestHeuristics(cell)
  if (signedRequest) {
    return signedRequest
  }

  const stateInit = decodeStateInitCell(cell)
  if (stateInit) {
    return stateInit
  }

  const metadata = decodeMetadataCell(cell)
  if (metadata) {
    return metadata
  }

  const dns = decodeDnsRecordCell(cell)
  if (dns) {
    return dns
  }

  if (options.includeBlockPresets) {
    const blockPreset = parseBlockPresetCell(cell)
    if (blockPreset) {
      return blockPreset
    }
  }

  return options.includeFallback ? decodeBinaryFallback(cell) : undefined
}
