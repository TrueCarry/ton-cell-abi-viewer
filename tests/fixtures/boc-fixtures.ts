import { ExampleCell } from '../../src/Example'

export const COMMENT_TEXT = 'hello ton'
export const COMMENT_BOC_HEX = 'b5ee9c7241010101000f00001a0000000068656c6c6f20746f6ea5d717ee'
export const COMMENT_BOC_BASE64 = 'te6cckEBAQEADwAAGgAAAABoZWxsbyB0b26l1xfu'
export const CUSTOM_TLB_SCHEMA = '_ x:# = Foo;'
export const CUSTOM_TLB_FOO_BOC_BASE64 = 'te6cckEBAQEABgAACAAAACoFpvBE'
export const LARGE_BLOCK_BOC_HEX = ExampleCell

export const goldenBocCases = [
  {
    name: 'text comment base64 payload',
    input: COMMENT_BOC_BASE64,
    customTlb: '',
    parser: 'known-abi',
  },
  { name: 'text comment hex payload', input: COMMENT_BOC_HEX, customTlb: '', parser: 'known-abi' },
  {
    name: 'custom TLB Foo payload',
    input: CUSTOM_TLB_FOO_BOC_BASE64,
    customTlb: CUSTOM_TLB_SCHEMA,
    parser: 'custom-tlb',
  },
] as const
