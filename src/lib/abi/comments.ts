import type { Cell, Slice } from '@ton/core'
import { makeDecoded, readRemainingBytes, sliceRemainder, summarizeCell, tryRead } from './readers'
import type { DecodedAbi } from './types'

export const TEXT_COMMENT_OPCODE = 0x00000000
export const ENCRYPTED_COMMENT_OPCODE = 0x2167da4b

export function decodeTextComment(cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  const text = tryRead(() => slice.clone().loadStringTail())
  const bytes = text === undefined ? readRemainingBytes(slice.clone()) : undefined
  return makeDecoded('comment', 'comment.text', 'decodeTextComment', opcode, {
    text,
    bytes,
    body: summarizeCell(cell),
    remainder: sliceRemainder(slice),
  })
}

export function decodeEncryptedComment(cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('comment', 'comment.encrypted', 'decodeEncryptedComment', opcode, {
    encrypted: true,
    payloadBytes: readRemainingBytes(slice.clone()),
    payload: sliceRemainder(slice),
    body: summarizeCell(cell),
  })
}

export function decodeCommentOpcode(
  cell: Cell,
  slice: Slice,
  opcode: number,
): DecodedAbi | undefined {
  if (opcode === TEXT_COMMENT_OPCODE) {
    return decodeTextComment(cell, slice, opcode)
  }
  if (opcode === ENCRYPTED_COMMENT_OPCODE) {
    return decodeEncryptedComment(cell, slice, opcode)
  }
  return undefined
}

export function decodeBinaryFallback(cell: Cell): DecodedAbi {
  const slice = cell.beginParse(true)
  const opcode = slice.remainingBits >= 32 ? tryRead(() => slice.clone().loadUint(32)) : undefined
  return makeDecoded(
    'unknown',
    'binary.fallback',
    'decodeBinaryFallback',
    opcode,
    {
      body: summarizeCell(cell),
      remainingBits: cell.bits.length,
      remainingRefs: cell.refs.length,
    },
    'fallback',
  )
}
