import type { Cell, Slice } from '@ton/core'
import { loadBlock, loadMessageAny, loadTransaction } from '../../block.tlb'
import { makeDecoded, tryRead } from './readers'
import type { DecodedAbi } from './types'

type PresetLoader = (slice: Slice) => unknown

interface BlockPreset {
  readonly name: string
  readonly decoder: string
  readonly load: PresetLoader
}

const BLOCK_PRESETS: readonly BlockPreset[] = [
  { name: 'block.full', decoder: 'loadBlock', load: loadBlock as PresetLoader },
  { name: 'transaction.full', decoder: 'loadTransaction', load: loadTransaction as PresetLoader },
  { name: 'message.any', decoder: 'loadMessageAny', load: loadMessageAny as PresetLoader },
]

export function listBlockPresets(): readonly string[] {
  return BLOCK_PRESETS.map((preset) => preset.name)
}

export function parseBlockPresetCell(cell: Cell): DecodedAbi | undefined {
  for (const preset of BLOCK_PRESETS) {
    const slice = cell.beginParse(true)
    const parsed = tryRead(() => preset.load(slice))
    if (!parsed) {
      continue
    }
    try {
      slice.endParse()
    } catch (_error) {
      continue
    }
    return makeDecoded('block', preset.name, preset.decoder, undefined, { parsed }, 'exact')
  }
  return undefined
}
