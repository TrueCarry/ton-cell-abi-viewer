import { describe, expect, it } from 'vitest'
import { parseCellInput } from '../../src/features/parser/cellParser'
import { DEFAULT_PARSER_OPTIONS, PARSER_OPTION_DESCRIPTIONS } from '../../src/features/parser/model'
import { formatOutput } from '../../src/features/output/formatOutput'
import {
  COMMENT_BOC_BASE64,
  COMMENT_BOC_HEX,
  CUSTOM_TLB_FOO_BOC_BASE64,
  CUSTOM_TLB_SCHEMA,
  goldenBocCases,
} from '../fixtures/boc-fixtures'

const options = { ...DEFAULT_PARSER_OPTIONS, strict: false, maxDepth: 16 }

describe('parser option descriptions', () => {
  it('documents every parser option', () => {
    const optionKeys = Object.keys(DEFAULT_PARSER_OPTIONS).sort()
    expect(Object.keys(PARSER_OPTION_DESCRIPTIONS).sort()).toEqual(optionKeys)

    for (const key of optionKeys) {
      expect(
        PARSER_OPTION_DESCRIPTIONS[key as keyof typeof PARSER_OPTION_DESCRIPTIONS].trim().length,
      ).toBeGreaterThan(0)
    }
  })
})

describe('BOC input parsing', () => {
  it.each(goldenBocCases)('parses golden fixture: $name', ({ input, customTlb, parser }) => {
    const result = parseCellInput(input, { ...options, customTlb })

    expect(result.status).not.toBe('error')
    if ('parser' in result) {
      expect(result.parser).toBe(parser)
    }
  })

  it('accepts base64 and hex encodings for the same comment cell', () => {
    const base64 = parseCellInput(COMMENT_BOC_BASE64, options)
    const hex = parseCellInput(COMMENT_BOC_HEX, options)

    expect(base64.status).not.toBe('error')
    expect(hex.status).not.toBe('error')
    expect(base64.cell?.hash).toBe(hex.cell?.hash)
  })

  it.each(['', 'not-a-boc', '0xabc', 'deadbeef', COMMENT_BOC_BASE64.slice(0, -4)])(
    'returns structured errors for invalid or malformed BOC input %#',
    (input) => {
      const result = parseCellInput(input, options)
      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error.message).toBeTruthy()
      }
    },
  )
})

describe('stable parser formatting snapshots', () => {
  it('formats text comment parser output as JSON', () => {
    const result = parseCellInput(COMMENT_BOC_BASE64, options)
    expect(formatOutput(result, 'json')).toMatchSnapshot()
  })

  it('formats text comment parser output as YAML', () => {
    const result = parseCellInput(COMMENT_BOC_BASE64, options)
    expect(formatOutput(result, 'yaml')).toMatchSnapshot()
  })

  it('formats custom TLB parser output as JSON', () => {
    const result = parseCellInput(CUSTOM_TLB_FOO_BOC_BASE64, {
      ...options,
      customTlb: CUSTOM_TLB_SCHEMA,
    })
    expect(formatOutput(result, 'json')).toContain('Foo')
    expect(formatOutput(result, 'json')).toMatchSnapshot()
  })

  it('exposes raw cell tree output', () => {
    const result = parseCellInput(COMMENT_BOC_BASE64, options)
    expect(formatOutput(result, 'raw')).toContain('hashes')
  })
})
