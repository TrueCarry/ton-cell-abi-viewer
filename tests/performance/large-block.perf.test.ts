import { performance } from 'node:perf_hooks'
import { describe, expect, it } from 'vitest'
import { parseCellInput } from '../../src/features/parser/cellParser'
import { DEFAULT_PARSER_OPTIONS } from '../../src/features/parser/model'
import { LARGE_BLOCK_BOC_HEX } from '../fixtures/boc-fixtures'

describe('large block parser performance', () => {
  it('attempts parsing for the bundled large BOC within budget', () => {
    const started = performance.now()
    const result = parseCellInput(LARGE_BLOCK_BOC_HEX, {
      ...DEFAULT_PARSER_OPTIONS,
      strict: false,
      maxDepth: 12,
    })
    const elapsed = performance.now() - started

    expect(result.status).not.toBe('error')
    expect(result.cell?.refs ?? 0).toBeGreaterThanOrEqual(0)
    expect(elapsed).toBeLessThan(30_000)
  }, 35_000)
})
