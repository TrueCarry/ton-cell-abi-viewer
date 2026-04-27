import { Dictionary } from '@ton/core'
import type { Cell } from '@ton/core'
import {
  loadMsgAddress,
  makeDecoded,
  readSnakeStringFromCell,
  sliceRemainder,
  summarizeCell,
  tryRead,
} from './readers'
import type { AbiRecord, DecodedAbi } from './types'

const CONTENT_TAGS: Readonly<Record<number, string>> = {
  0x00: 'onchain',
  0x01: 'offchain',
  0x02: 'semi-chain',
}

const DNS_TAGS: Readonly<Record<number, string>> = {
  0x9fd3: 'dns.wallet',
  0xba93: 'dns.next_resolver',
  0xad01: 'dns.adnl_address',
  0x7473: 'dns.storage_address',
}

function contentEntries(sliceCell: Cell): readonly AbiRecord[] | undefined {
  const slice = sliceCell.beginParse(true)
  const dict = tryRead(() => slice.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()))
  if (!dict) {
    return undefined
  }
  return dict.keys().map((key) => {
    const value = dict.get(key)
    return {
      key: `0x${key.toString(16).padStart(64, '0')}`,
      value,
      valueText: value ? readSnakeStringFromCell(value) : undefined,
    }
  })
}

export function decodeMetadataContent(cell: Cell): AbiRecord | undefined {
  if (cell.bits.length < 8) {
    return undefined
  }

  const slice = cell.beginParse(true)
  const tag = tryRead(() => slice.loadUint(8))
  if (tag === undefined || CONTENT_TAGS[tag] === undefined) {
    return undefined
  }

  if (tag === 0x00) {
    const entries = contentEntries(slice.asCell())
    if (!entries) {
      return undefined
    }
    return {
      layout: CONTENT_TAGS[tag],
      tag: '0x00',
      entries,
      entriesCount: entries.length,
      remainder: sliceRemainder(slice),
    }
  }

  const uri =
    tryRead(() => slice.clone().loadStringTail()) ?? readSnakeStringFromCell(slice.asCell())
  if (uri === undefined) {
    return undefined
  }
  return {
    layout: CONTENT_TAGS[tag],
    tag: `0x${tag.toString(16).padStart(2, '0')}`,
    uri,
    remainder: sliceRemainder(slice),
  }
}

export function decodeMetadataCell(cell: Cell): DecodedAbi | undefined {
  const content = decodeMetadataContent(cell)
  if (!content) {
    return undefined
  }
  return makeDecoded(
    'metadata',
    'metadata.content',
    'decodeMetadataCell',
    undefined,
    {
      content,
      body: summarizeCell(cell),
    },
    'heuristic',
  )
}

export function decodeDnsRecordCell(cell: Cell): DecodedAbi | undefined {
  if (cell.bits.length < 16) {
    return undefined
  }

  const slice = cell.beginParse(true)
  const tag = tryRead(() => slice.loadUint(16))
  if (tag === undefined || DNS_TAGS[tag] === undefined) {
    return undefined
  }

  if (tag === 0x9fd3) {
    return makeDecoded(
      'dns',
      DNS_TAGS[tag],
      'decodeDnsRecordCell',
      undefined,
      {
        recordTag: `0x${tag.toString(16)}`,
        address: tryRead(() => loadMsgAddress(slice)),
        flags: slice.remainingBits >= 8 ? tryRead(() => slice.loadUint(8)) : undefined,
        remainder: sliceRemainder(slice),
      },
      'exact',
    )
  }

  if (tag === 0xba93) {
    return makeDecoded(
      'dns',
      DNS_TAGS[tag],
      'decodeDnsRecordCell',
      undefined,
      {
        recordTag: `0x${tag.toString(16)}`,
        resolver: tryRead(() => loadMsgAddress(slice)),
        remainder: sliceRemainder(slice),
      },
      'exact',
    )
  }

  if (tag === 0xad01 || tag === 0x7473) {
    return makeDecoded(
      'dns',
      DNS_TAGS[tag],
      'decodeDnsRecordCell',
      undefined,
      {
        recordTag: `0x${tag.toString(16)}`,
        value: slice.remainingBits >= 256 ? tryRead(() => slice.loadUintBig(256)) : undefined,
        flags:
          tag === 0xad01 && slice.remainingBits >= 8 ? tryRead(() => slice.loadUint(8)) : undefined,
        remainder: sliceRemainder(slice),
      },
      'exact',
    )
  }

  return undefined
}
