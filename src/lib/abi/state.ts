import { Cell } from '@ton/core'
import { Buffer } from 'buffer'
import { loadStateInit } from '../../block.tlb'
import { decodeMetadataContent } from './metadata'
import { makeDecoded, summarizeCell, tryRead } from './readers'
import type { DecodedAbi } from './types'

const KNOWN_CODE_HASHES_BASE64: readonly (readonly [string, string])[] = [
  ['/rX/aCDi/w2Ug+fg1iyBfYRniftK5YDIeIZtlZ2r1cA=', 'wallet.v4.r2'],
  ['thBBpYp5gLlG6PueGY48kE0keZ/6NldOpCUcQaVm9YE=', 'wallet.v3.r1'],
  ['hNr6RJ+Ypph3ibU4Y5LaiI4YF6yo6L4+VpbWu6Lrcr4=', 'wallet.v3.r2'],
]

export const CODE_HASH_LABELS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    KNOWN_CODE_HASHES_BASE64.map(([hash, label]) => [
      Buffer.from(hash, 'base64').toString('hex'),
      label,
    ]),
  ),
)

function maybeCell(value: unknown): Cell | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const maybe = value as { readonly value?: unknown }
  return maybe.value instanceof Cell ? maybe.value : undefined
}

export function codeHashLabel(hash: string | undefined): string | undefined {
  return hash ? CODE_HASH_LABELS[hash] : undefined
}

export function decodeStateInitCell(cell: Cell): DecodedAbi | undefined {
  const slice = cell.beginParse(true)
  const state = tryRead(() => loadStateInit(slice))
  if (!state) {
    return undefined
  }
  try {
    slice.endParse()
  } catch (_error) {
    return undefined
  }

  const code = maybeCell(state.code)
  const data = maybeCell(state.data)
  const library = maybeCell(state.library)
  if (!code && !data && !library) {
    return undefined
  }

  const codeHash = code?.hash().toString('hex')
  return makeDecoded('state', 'state_init', 'decodeStateInitCell', undefined, {
    state,
    splitDepth: state.split_depth,
    special: state.special,
    code: code ? summarizeCell(code) : undefined,
    codeCell: code,
    codeHash,
    codeLabel: codeHashLabel(codeHash),
    data: data ? summarizeCell(data) : undefined,
    dataCell: data,
    dataContent: data ? decodeMetadataContent(data) : undefined,
    library: library ? summarizeCell(library) : undefined,
    libraryCell: library,
  })
}
