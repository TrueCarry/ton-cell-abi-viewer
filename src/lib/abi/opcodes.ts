import type { Cell, Slice } from '@ton/core'
import { decodeCommentOpcode, ENCRYPTED_COMMENT_OPCODE, TEXT_COMMENT_OPCODE } from './comments'
import {
  loadEitherCell,
  loadMsgAddress,
  makeDecoded,
  plausibleUnixTime,
  sliceRemainder,
  tryRead,
} from './readers'
import type { AbiCategory, AbiRecord, DecodedAbi, OpcodeDecoder, OpcodeDefinition } from './types'

function queryId(slice: Slice): bigint | undefined {
  return slice.remainingBits >= 64 ? tryRead(() => slice.loadUintBig(64)) : undefined
}

function genericQueryDecoder(category: AbiCategory, name: string, decoder: string): OpcodeDecoder {
  return (_cell, slice, opcode) =>
    makeDecoded(
      category,
      name,
      decoder,
      opcode,
      {
        queryId: queryId(slice),
        remainder: sliceRemainder(slice),
      },
      'heuristic',
    )
}

function decodeJettonTransfer(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('jetton', 'jetton.transfer', 'decodeJettonTransfer', opcode, {
    queryId: slice.loadUintBig(64),
    amount: slice.loadCoins(),
    destination: loadMsgAddress(slice),
    responseDestination: loadMsgAddress(slice),
    customPayload: slice.loadMaybeRef(),
    forwardTonAmount: slice.loadCoins(),
    forwardPayload: loadEitherCell(slice),
  })
}

function decodeJettonInternalTransfer(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('jetton', 'jetton.internal_transfer', 'decodeJettonInternalTransfer', opcode, {
    queryId: slice.loadUintBig(64),
    amount: slice.loadCoins(),
    from: loadMsgAddress(slice),
    responseAddress: loadMsgAddress(slice),
    forwardTonAmount: slice.loadCoins(),
    forwardPayload: loadEitherCell(slice),
  })
}

function decodeJettonTransferNotification(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded(
    'jetton',
    'jetton.transfer_notification',
    'decodeJettonTransferNotification',
    opcode,
    {
      queryId: slice.loadUintBig(64),
      amount: slice.loadCoins(),
      sender: loadMsgAddress(slice),
      forwardPayload: loadEitherCell(slice),
    },
  )
}

function decodeJettonBurn(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('jetton', 'jetton.burn', 'decodeJettonBurn', opcode, {
    queryId: slice.loadUintBig(64),
    amount: slice.loadCoins(),
    responseDestination: loadMsgAddress(slice),
    customPayload: slice.loadMaybeRef(),
  })
}

function decodeJettonBurnNotification(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('jetton', 'jetton.burn_notification', 'decodeJettonBurnNotification', opcode, {
    queryId: slice.loadUintBig(64),
    amount: slice.loadCoins(),
    sender: loadMsgAddress(slice),
    responseDestination: loadMsgAddress(slice),
  })
}

function decodeNftTransfer(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('nft', 'nft.transfer', 'decodeNftTransfer', opcode, {
    queryId: slice.loadUintBig(64),
    newOwner: loadMsgAddress(slice),
    responseDestination: loadMsgAddress(slice),
    customPayload: slice.loadMaybeRef(),
    forwardAmount: slice.loadCoins(),
    forwardPayload: loadEitherCell(slice),
  })
}

function decodeNftOwnershipAssigned(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('nft', 'nft.ownership_assigned', 'decodeNftOwnershipAssigned', opcode, {
    queryId: slice.loadUintBig(64),
    previousOwner: loadMsgAddress(slice),
    forwardPayload: loadEitherCell(slice),
  })
}

function decodeNftReportStaticData(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('nft', 'nft.report_static_data', 'decodeNftReportStaticData', opcode, {
    queryId: slice.loadUintBig(64),
    index: slice.loadUintBig(256),
    collection: loadMsgAddress(slice),
  })
}

function readWalletActions(slice: Slice, limit = 4): readonly AbiRecord[] {
  const actions: AbiRecord[] = []
  while (slice.remainingBits >= 8 && slice.remainingRefs > 0 && actions.length < limit) {
    actions.push({ sendMode: slice.loadUint(8), message: slice.loadRef() })
  }
  return actions
}

function readSignedRequestFields(slice: Slice): AbiRecord {
  const signature = slice.remainingBits >= 512 ? tryRead(() => slice.loadBuffer(64)) : undefined
  const walletId = slice.remainingBits >= 32 ? tryRead(() => slice.loadInt(32)) : undefined
  const validUntil = slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined
  const seqno = slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined
  return {
    signature,
    walletId,
    validUntil,
    validUntilPlausible: typeof validUntil === 'number' ? plausibleUnixTime(validUntil) : undefined,
    seqno,
    actions: readWalletActions(slice, 255),
    remainder: sliceRemainder(slice),
  }
}

function decodeWalletV5ExternalSigned(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded(
    'wallet',
    'wallet.v5.external_signed',
    'decodeWalletV5ExternalSigned',
    opcode,
    readSignedRequestFields(slice),
    'heuristic',
  )
}

function decodeWalletV5InternalSigned(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded(
    'wallet',
    'wallet.v5.internal_signed',
    'decodeWalletV5InternalSigned',
    opcode,
    readSignedRequestFields(slice),
    'heuristic',
  )
}

function decodeHighloadV3(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded(
    'highload',
    'highload.v3.request',
    'decodeHighloadV3',
    opcode,
    {
      queryId: queryId(slice),
      createdAt: slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined,
      timeout: slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined,
      sendMode: slice.remainingBits >= 8 ? tryRead(() => slice.loadUint(8)) : undefined,
      message: slice.remainingRefs > 0 ? tryRead(() => slice.loadRef()) : undefined,
      remainder: sliceRemainder(slice),
    },
    'heuristic',
  )
}

function decodeElectorNewStake(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded('staking', 'staking.elector.new_stake', 'decodeElectorNewStake', opcode, {
    queryId: slice.loadUintBig(64),
    validatorPublicKey:
      slice.remainingBits >= 256 ? tryRead(() => slice.loadUintBig(256)) : undefined,
    stakeAt: slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined,
    maxFactor: slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined,
    adnlAddress: slice.remainingBits >= 256 ? tryRead(() => slice.loadUintBig(256)) : undefined,
    signature: slice.remainingBits >= 512 ? tryRead(() => slice.loadBuffer(64)) : undefined,
    remainder: sliceRemainder(slice),
  })
}

function decodeMultisigEnvelope(_cell: Cell, slice: Slice, opcode: number): DecodedAbi {
  return makeDecoded(
    'multisig',
    'multisig.order_or_proposal',
    'decodeMultisigEnvelope',
    opcode,
    {
      queryId: queryId(slice),
      expiresAt: slice.remainingBits >= 32 ? tryRead(() => slice.loadUint(32)) : undefined,
      order: slice.remainingRefs > 0 ? tryRead(() => slice.loadRef()) : undefined,
      approvalsMask:
        slice.remainingBits >= 32
          ? tryRead(() => slice.loadUintBig(Math.min(slice.remainingBits, 256)))
          : undefined,
      remainder: sliceRemainder(slice),
    },
    'heuristic',
  )
}

function knownOpcodeFallback(
  definition: OpcodeDefinition,
  slice: Slice,
  opcode: number,
): DecodedAbi {
  return makeDecoded(
    definition.category,
    definition.name,
    definition.decoder.name || 'knownOpcodeFallback',
    opcode,
    {
      queryId: queryId(slice),
      remainder: sliceRemainder(slice),
    },
    'heuristic',
  )
}

export const OPCODE_REGISTRY: readonly OpcodeDefinition[] = [
  {
    opcode: TEXT_COMMENT_OPCODE,
    name: 'comment.text',
    category: 'comment',
    decoder: decodeCommentOpcode,
  },
  {
    opcode: ENCRYPTED_COMMENT_OPCODE,
    name: 'comment.encrypted',
    category: 'comment',
    decoder: decodeCommentOpcode,
  },
  {
    opcode: 0x0f8a7ea5,
    name: 'jetton.transfer',
    category: 'jetton',
    decoder: decodeJettonTransfer,
  },
  {
    opcode: 0x178d4519,
    name: 'jetton.internal_transfer',
    category: 'jetton',
    decoder: decodeJettonInternalTransfer,
  },
  {
    opcode: 0x7362d09c,
    name: 'jetton.transfer_notification',
    category: 'jetton',
    decoder: decodeJettonTransferNotification,
  },
  {
    opcode: 0xd53276db,
    name: 'jetton.excesses',
    category: 'jetton',
    decoder: genericQueryDecoder('jetton', 'jetton.excesses', 'decodeJettonExcesses'),
  },
  { opcode: 0x595f07bc, name: 'jetton.burn', category: 'jetton', decoder: decodeJettonBurn },
  {
    opcode: 0x7bdd97de,
    name: 'jetton.burn_notification',
    category: 'jetton',
    decoder: decodeJettonBurnNotification,
  },
  { opcode: 0x5fcc3d14, name: 'nft.transfer', category: 'nft', decoder: decodeNftTransfer },
  {
    opcode: 0x05138d91,
    name: 'nft.ownership_assigned',
    category: 'nft',
    decoder: decodeNftOwnershipAssigned,
  },
  {
    opcode: 0x2fcb26a2,
    name: 'nft.get_static_data',
    category: 'nft',
    decoder: genericQueryDecoder('nft', 'nft.get_static_data', 'decodeNftGetStaticData'),
  },
  {
    opcode: 0x8b771735,
    name: 'nft.report_static_data',
    category: 'nft',
    decoder: decodeNftReportStaticData,
  },
  {
    opcode: 0x7369676e,
    name: 'wallet.v5.external_signed',
    category: 'wallet',
    decoder: decodeWalletV5ExternalSigned,
  },
  {
    opcode: 0x73696e74,
    name: 'wallet.v5.internal_signed',
    category: 'wallet',
    decoder: decodeWalletV5InternalSigned,
  },
  {
    opcode: 0xae42e5a4,
    name: 'highload.v3.request',
    category: 'highload',
    decoder: decodeHighloadV3,
  },
  {
    opcode: 0xf718510f,
    name: 'multisig.new_order',
    category: 'multisig',
    decoder: decodeMultisigEnvelope,
  },
  {
    opcode: 0x75097f5d,
    name: 'multisig.order.execute',
    category: 'multisig',
    decoder: decodeMultisigEnvelope,
  },
  {
    opcode: 0x4d534947,
    name: 'multisig.order.magic',
    category: 'multisig',
    decoder: decodeMultisigEnvelope,
  },
  {
    opcode: 0x50524f50,
    name: 'multisig.proposal.magic',
    category: 'multisig',
    decoder: decodeMultisigEnvelope,
  },
  {
    opcode: 0x4e73744b,
    name: 'staking.elector.new_stake',
    category: 'staking',
    decoder: decodeElectorNewStake,
  },
  {
    opcode: 0x47657424,
    name: 'staking.elector.recover_stake',
    category: 'staking',
    decoder: genericQueryDecoder(
      'staking',
      'staking.elector.recover_stake',
      'decodeElectorRecoverStake',
    ),
  },
  {
    opcode: 0x7bcd1fef,
    name: 'staking.nominator.deposit',
    category: 'staking',
    decoder: genericQueryDecoder('staking', 'staking.nominator.deposit', 'decodeNominatorDeposit'),
  },
  {
    opcode: 0x4eb1f0f9,
    name: 'dns.balance_release',
    category: 'dns',
    decoder: genericQueryDecoder('dns', 'dns.balance_release', 'decodeDnsBalanceRelease'),
  },
  {
    opcode: 0x370fec51,
    name: 'dns.balance_withdraw',
    category: 'dns',
    decoder: genericQueryDecoder('dns', 'dns.balance_withdraw', 'decodeDnsBalanceWithdraw'),
  },
]

const OPCODES = new Map(OPCODE_REGISTRY.map((definition) => [definition.opcode, definition]))

export function getOpcodeDefinition(opcode: number): OpcodeDefinition | undefined {
  return OPCODES.get(opcode)
}

export function listOpcodeRegistry(): readonly OpcodeDefinition[] {
  return OPCODE_REGISTRY
}

export function decodeOpcodeCell(cell: Cell): DecodedAbi | undefined {
  if (cell.bits.length < 32) {
    return undefined
  }

  const slice = cell.beginParse(true)
  const opcode = tryRead(() => slice.loadUint(32))
  if (opcode === undefined) {
    return undefined
  }

  const definition = getOpcodeDefinition(opcode)
  if (!definition) {
    return undefined
  }

  return (
    tryRead(() => definition.decoder(cell, slice, opcode)) ??
    knownOpcodeFallback(definition, slice, opcode)
  )
}

function walletV3V4Candidate(cell: Cell): AbiRecord | undefined {
  const slice = cell.beginParse(true)
  if (slice.remainingBits < 608) {
    return undefined
  }
  const signature = tryRead(() => slice.loadBuffer(64))
  const subwalletId = tryRead(() => slice.loadUint(32))
  const validUntil = tryRead(() => slice.loadUint(32))
  const seqno = tryRead(() => slice.loadUint(32))
  if (
    signature === undefined ||
    subwalletId === undefined ||
    validUntil === undefined ||
    seqno === undefined
  ) {
    return undefined
  }
  const actions = readWalletActions(slice)
  if (actions.length === 0 && !plausibleUnixTime(validUntil)) {
    return undefined
  }
  return {
    type: 'wallet.v3/v4.external_signed',
    signature,
    subwalletId,
    validUntil,
    validUntilPlausible: plausibleUnixTime(validUntil),
    seqno,
    actions,
    remainder: sliceRemainder(slice),
  }
}

function highloadV2Candidate(cell: Cell): AbiRecord | undefined {
  const slice = cell.beginParse(true)
  if (slice.remainingBits < 616 || slice.remainingRefs === 0) {
    return undefined
  }
  const signature = tryRead(() => slice.loadBuffer(64))
  const subwalletId = tryRead(() => slice.loadUint(32))
  const query = tryRead(() => slice.loadUintBig(64))
  const sendMode = tryRead(() => slice.loadUint(8))
  const message = slice.remainingRefs > 0 ? tryRead(() => slice.loadRef()) : undefined
  if (
    !signature ||
    subwalletId === undefined ||
    query === undefined ||
    sendMode === undefined ||
    !message
  ) {
    return undefined
  }
  return {
    type: 'highload.v2.external_signed',
    signature,
    subwalletId,
    queryId: query,
    sendMode,
    message,
    remainder: sliceRemainder(slice),
  }
}

export function decodeSignedRequestHeuristics(cell: Cell): DecodedAbi | undefined {
  const candidates = [walletV3V4Candidate(cell), highloadV2Candidate(cell)].filter(
    (item): item is AbiRecord => item !== undefined,
  )
  if (candidates.length === 0) {
    return undefined
  }
  return makeDecoded(
    'wallet',
    'signed_request.heuristics',
    'decodeSignedRequestHeuristics',
    undefined,
    { candidates },
    'heuristic',
  )
}
