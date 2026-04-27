import { Cell, Slice } from '@ton/core'
import * as blockTlb from '../../block.tlb'

type BlockTlbLoader = (slice: Slice) => unknown

const blockTlbLoaders = Object.entries(blockTlb)
  .filter(
    ([name, value]) => name.startsWith('load') && typeof value === 'function' && value.length === 1,
  )
  .map(([, value]) => value as BlockTlbLoader)

export function parseUsingBlockTypes(cell: Cell, strict: boolean): unknown | null {
  for (const loader of blockTlbLoaders) {
    try {
      const slice = cell.beginParse()
      const parsed = loader(slice)
      if (strict) {
        slice.endParse()
      }
      if (parsed !== undefined && parsed !== null) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return null
}
