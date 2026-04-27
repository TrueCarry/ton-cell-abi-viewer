import { Address, Cell, Dictionary } from '@ton/core'
import { Buffer } from 'buffer'

export type SerializablePrimitive = string | number | boolean | null
export type SerializableObject = { [key: string]: SerializableValue }
export type SerializableValue = SerializablePrimitive | SerializableObject | SerializableValue[]

type DictionaryLike = {
  keys: () => unknown[]
  get: (key: unknown) => unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function toSerializable(value: unknown): SerializableValue {
  return serializeValue(value, new WeakSet<object>()) ?? null
}

function serializeValue(value: unknown, seen: WeakSet<object>): SerializableValue | undefined {
  if (value === null) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value)
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  if (!isRecord(value)) {
    return String(value)
  }

  if (seen.has(value)) {
    return '[Circular]'
  }

  seen.add(value)

  try {
    if (value instanceof Cell) {
      return value.toBoc().toString('hex')
    }

    if (value instanceof Address) {
      return value.toString()
    }

    if (Buffer.isBuffer(value)) {
      return value.toString('hex')
    }

    if (value instanceof Uint8Array) {
      return Buffer.from(value).toString('hex')
    }

    if (value instanceof Dictionary) {
      const dictionary = value as unknown as DictionaryLike
      const result: SerializableObject = {}
      for (const key of dictionary.keys()) {
        const serialized = serializeValue(dictionary.get(key), seen)
        if (serialized !== undefined) {
          result[String(key)] = serialized
        }
      }
      return result
    }

    if (Array.isArray(value)) {
      return value.map((item) => serializeValue(item, seen) ?? null)
    }

    const result: SerializableObject = {}
    for (const [key, entry] of Object.entries(value)) {
      const serialized = serializeValue(entry, seen)
      if (serialized !== undefined) {
        result[key] = serialized
      }
    }

    return result
  } finally {
    seen.delete(value)
  }
}
