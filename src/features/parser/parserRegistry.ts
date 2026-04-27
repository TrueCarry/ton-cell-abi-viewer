import type { Cell } from '@ton/core'
import type { ParserEngine, ParserOptions } from './model'

export type ParserAttempt = {
  parser: ParserEngine
  value: unknown
  confidence: number
  bytesConsumed?: number
  warnings?: string[]
}

export type ParserContext = {
  options: ParserOptions
  warnings: string[]
}

export type RegisteredParser = {
  id: ParserEngine
  label: string
  priority: number
  parse: (cell: Cell, context: ParserContext) => ParserAttempt | null
}

const registry = new Map<ParserEngine, RegisteredParser>()

export function registerParser(parser: RegisteredParser): void {
  registry.set(parser.id, parser)
}

export function clearParserRegistry(): void {
  registry.clear()
}

export function listParsers(): RegisteredParser[] {
  return Array.from(registry.values()).sort((a, b) => b.priority - a.priority)
}

export function parseWithRegistry(cell: Cell, context: ParserContext): ParserAttempt | null {
  for (const parser of listParsers()) {
    try {
      const result = parser.parse(cell, context)
      if (result) {
        return result
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      context.warnings.push(`${parser.label} failed: ${message}`)
    }
  }
  return null
}
