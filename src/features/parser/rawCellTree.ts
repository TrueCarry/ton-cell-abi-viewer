import { Cell, CellType } from '@ton/core'
import { Buffer } from 'buffer'

export type RawCellTree = {
  kind: 'cell' | 'cell-ref' | 'truncated-cell'
  type: string
  exotic: boolean
  exoticType?: string
  bits?: { length: number; value: string; truncated: boolean }
  refs: { count: number; items: RawCellTree[] }
  hashes: Record<string, string>
  depths: Record<string, number>
  level: number
  levelMask: { value: number; level: number; hashIndex: number; hashCount: number }
  bocHex?: string
  path: string
  reason?: string
}

type WalkLimits = { maxDepth: number; maxNodes: number }

type WalkState = {
  depth: number
  path: string
  nodes: { count: number }
  seen: WeakSet<Cell>
}

export function cellTypeName(type: CellType): string {
  switch (type) {
    case CellType.Ordinary:
      return 'ordinary'
    case CellType.PrunedBranch:
      return 'pruned-branch'
    case CellType.Library:
      return 'library'
    case CellType.MerkleProof:
      return 'merkle-proof'
    case CellType.MerkleUpdate:
      return 'merkle-update'
    default:
      return `unknown-${String(type)}`
  }
}

function previewBits(cell: Cell, maxChars: number) {
  const value = cell.bits.toString()
  return {
    length: cell.bits.length,
    value: value.length > maxChars ? `${value.slice(0, maxChars)}...` : value,
    truncated: value.length > maxChars,
  }
}

function collectHashes(cell: Cell): Record<string, string> {
  const hashes: Record<string, string> = {}
  for (let level = 0; level <= 3; level += 1) {
    try {
      hashes[`level${level}`] = Buffer.from(cell.hash(level)).toString('hex')
    } catch {
      hashes[`level${level}`] = 'unavailable'
    }
  }
  return hashes
}

function collectDepths(cell: Cell): Record<string, number> {
  const depths: Record<string, number> = {}
  for (let level = 0; level <= 3; level += 1) {
    try {
      depths[`level${level}`] = cell.depth(level)
    } catch {
      depths[`level${level}`] = -1
    }
  }
  return depths
}

function baseNode(cell: Cell, path: string) {
  const type = cellTypeName(cell.type)
  return {
    type,
    exotic: cell.isExotic,
    exoticType: cell.isExotic ? type : undefined,
    refs: { count: cell.refs.length, items: [] as RawCellTree[] },
    hashes: collectHashes(cell),
    depths: collectDepths(cell),
    level: cell.level(),
    levelMask: {
      value: cell.mask.value,
      level: cell.mask.level,
      hashIndex: cell.mask.hashIndex,
      hashCount: cell.mask.hashCount,
    },
    path,
  }
}

function shallowNode(cell: Cell, path: string, reason: string): RawCellTree {
  return {
    ...baseNode(cell, path),
    kind: reason === 'duplicate' ? 'cell-ref' : 'truncated-cell',
    reason,
  }
}

function walkCell(cell: Cell, limits: WalkLimits, state: WalkState): RawCellTree {
  if (state.depth > limits.maxDepth) {
    return shallowNode(cell, state.path, `max depth ${limits.maxDepth} reached`)
  }
  if (state.nodes.count >= limits.maxNodes) {
    return shallowNode(cell, state.path, `max nodes ${limits.maxNodes} reached`)
  }
  if (state.seen.has(cell)) {
    return shallowNode(cell, state.path, 'duplicate')
  }

  state.seen.add(cell)
  state.nodes.count += 1

  const refs = cell.refs.map((ref, index) =>
    walkCell(ref, limits, {
      depth: state.depth + 1,
      path: `${state.path}.refs[${index}]`,
      nodes: state.nodes,
      seen: state.seen,
    }),
  )

  return {
    ...baseNode(cell, state.path),
    kind: 'cell',
    bits: previewBits(cell, 512),
    refs: { count: cell.refs.length, items: refs },
    bocHex: cell.toBoc().toString('hex'),
  }
}

export function describeCellTree(cell: Cell, limits: Partial<WalkLimits> = {}): RawCellTree {
  return walkCell(
    cell,
    { maxDepth: limits.maxDepth ?? 32, maxNodes: limits.maxNodes ?? 2000 },
    { depth: 0, path: '$', nodes: { count: 0 }, seen: new WeakSet<Cell>() },
  )
}
