import type { NormalizedInput, NormalizedInputSource } from './model'

type NormalizeCellInputResult =
  | { ok: true; input: NormalizedInput }
  | { ok: false; message: string }

const HEX_BOC_PREFIX = 'b5ee9c72'
const WHITESPACE = /\s+/g
const HEX_BOC = /b5ee9c72[0-9a-fA-F]{12,}/g
const BASE64_BOC = /te6cc[A-Za-z0-9+/_=-]{12,}/gi
const EXPLORER_KEYS = [
  'boc',
  'cell',
  'data',
  'payload',
  'message',
  'msg',
  'state',
  'proof',
  'value',
]

export function normalizeCellInput(rawInput: string): NormalizeCellInputResult {
  const original = rawInput
  const trimmed = rawInput.trim()

  if (!trimmed) {
    return { ok: false, message: 'Please enter a cell to parse' }
  }

  const direct = normalizeCandidate(trimmed, original, 'raw')
  if (direct) {
    return { ok: true, input: direct }
  }

  const decoded = decodeSafely(trimmed)
  for (const candidate of collectExplorerCandidates(decoded)) {
    const normalized = normalizeCandidate(candidate, original, 'explorer-link')
    if (normalized) {
      return { ok: true, input: normalized }
    }
  }

  return {
    ok: false,
    message:
      'Invalid cell format. Provide a BOC as base64/te6cc, hex, or an explorer link containing one.',
  }
}

export function canonicalizeBase64(value: string): string {
  const withoutWhitespace = value.replace(WHITESPACE, '')
  const normalized = withoutWhitespace.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4
  return padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`
}

function normalizeCandidate(
  candidate: string,
  original: string,
  source: NormalizedInputSource,
): NormalizedInput | undefined {
  const cleaned = cleanCandidate(candidate)
  const hex = cleaned.replace(/^0x/i, '')

  if (
    hex.length >= HEX_BOC_PREFIX.length &&
    hex.length % 2 === 0 &&
    hex.toLowerCase().startsWith(HEX_BOC_PREFIX) &&
    /^[0-9a-f]+$/i.test(hex)
  ) {
    return {
      original,
      value: hex.toLowerCase(),
      kind: 'hex',
      source,
    }
  }

  if (looksLikeBase64Boc(cleaned)) {
    return {
      original,
      value: cleaned,
      kind: cleaned.toLowerCase().startsWith('te6cc') ? 'te6cc' : 'base64',
      source,
    }
  }

  return undefined
}

function cleanCandidate(candidate: string): string {
  return decodeSafely(candidate)
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/^ton:\/\/(?:cell|boc)\//i, '')
    .replace(/^cell:\/\//i, '')
    .replace(/^boc:/i, '')
    .replace(WHITESPACE, '')
}

function looksLikeBase64Boc(value: string): boolean {
  if (!value.toLowerCase().startsWith('te6cc')) {
    return false
  }

  return /^[A-Za-z0-9+/_=-]+$/.test(value)
}

function collectExplorerCandidates(input: string): string[] {
  const candidates: string[] = []

  try {
    const url = new URL(input)
    for (const key of EXPLORER_KEYS) {
      const value = url.searchParams.get(key)
      if (value) {
        candidates.push(value)
      }
    }

    for (const value of url.searchParams.values()) {
      candidates.push(value)
    }

    for (const segment of url.pathname.split('/')) {
      if (segment) {
        candidates.push(segment)
      }
    }
  } catch {
    // Not a URL; regex extraction below handles pasted explorer fragments.
  }

  candidates.push(...(input.match(HEX_BOC) ?? []))
  candidates.push(...(input.match(BASE64_BOC) ?? []))

  return candidates
}

function decodeSafely(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
