import { Address, beginCell, type Cell } from '@ton/core'
import { ExampleCell } from '../../Example'
import type { OutputFormat } from './model'

export type ExampleItem = {
  id: string
  title: string
  description: string
  category: string
  cell: string
  mode: OutputFormat
  tags: string[]
  tlb?: string
}

const sampleAddress = Address.parseRaw(`0:${'0'.repeat(64)}`)
const asHex = (cell: Cell) => cell.toBoc().toString('hex')

const commentCell = asHex(
  beginCell()
    .storeUint(0, 32)
    .storeStringTail('gm from TrueCarry - human-readable TON comment payload')
    .endCell(),
)

const jettonTransferCell = asHex(
  beginCell()
    .storeUint(0x0f8a7ea5, 32)
    .storeUint(42, 64)
    .storeCoins(1250000000n)
    .storeAddress(sampleAddress)
    .storeAddress(sampleAddress)
    .storeBit(0)
    .storeCoins(100000000n)
    .storeBit(0)
    .storeUint(0, 32)
    .storeStringTail('jetton invoice #42')
    .endCell(),
)

const nftTransferCell = asHex(
  beginCell()
    .storeUint(0x5fcc3d14, 32)
    .storeUint(7, 64)
    .storeAddress(sampleAddress)
    .storeAddress(sampleAddress)
    .storeBit(0)
    .storeCoins(50000000n)
    .storeBit(0)
    .storeUint(0, 32)
    .storeStringTail('NFT handoff memo')
    .endCell(),
)

const stateInitCell = asHex(
  beginCell()
    .storeBit(0)
    .storeBit(0)
    .storeBit(1)
    .storeRef(beginCell().storeUint(0, 8).endCell())
    .storeBit(1)
    .storeRef(beginCell().storeUint(1, 8).endCell())
    .storeBit(0)
    .endCell(),
)

export const EXAMPLE_GALLERY: ExampleItem[] = [
  {
    id: 'comment',
    title: 'Comment payload',
    description: 'Plain TON text comment with op 0x00000000.',
    category: 'Message body',
    cell: commentCell,
    mode: 'json',
    tags: ['comment', 'text'],
  },
  {
    id: 'jetton-transfer',
    title: 'Jetton transfer',
    description: 'Transfer body with amount, destination, response and forward payload.',
    category: 'Token',
    cell: jettonTransferCell,
    mode: 'json',
    tags: ['jetton', 'op 0x0f8a7ea5'],
  },
  {
    id: 'nft-transfer',
    title: 'NFT transfer',
    description: 'NFT ownership transfer with forward TON and memo payload.',
    category: 'NFT',
    cell: nftTransferCell,
    mode: 'json',
    tags: ['nft', 'op 0x5fcc3d14'],
  },
  {
    id: 'transaction',
    title: 'Transaction sample',
    description: 'Complex chain data sample for transaction-style parser fallback coverage.',
    category: 'Chain data',
    cell: ExampleCell,
    mode: 'yaml',
    tags: ['tx', 'fallback'],
  },
  {
    id: 'block',
    title: 'Block sample',
    description: 'Large BOC sample for block TLB loader and raw cell inspection.',
    category: 'Chain data',
    cell: ExampleCell,
    mode: 'raw',
    tags: ['block', 'tlb'],
  },
  {
    id: 'state-init',
    title: 'State init',
    description: 'Minimal StateInit layout with code and data references.',
    category: 'Contract',
    cell: stateInitCell,
    mode: 'json',
    tags: ['state init', 'refs'],
  },
]
