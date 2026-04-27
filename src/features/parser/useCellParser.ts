import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import type { CellParseResult, ParserOptions, ParseWorkerResponse } from './model'
import { DEFAULT_PARSER_OPTIONS } from './model'

export type CellParserStatus = 'idle' | 'debouncing' | 'parsing' | 'settled'

export type UseCellParserOptions = {
  initialInput?: string
  initialOptions?: Partial<ParserOptions>
  debounceMs?: number
}

export type CellParserStore = {
  input: Accessor<string>
  setInput: Setter<string>
  options: Accessor<ParserOptions>
  setOptions: (patch: Partial<ParserOptions>) => void
  result: Accessor<CellParseResult | null>
  status: Accessor<CellParserStatus>
  isParsing: Accessor<boolean>
  parseNow: () => void
  cancel: () => void
}

export function useCellParser(config: UseCellParserOptions = {}): CellParserStore {
  const debounceMs = config.debounceMs ?? 300
  const [input, setInput] = createSignal(config.initialInput ?? '')
  const [options, setOptionsSignal] = createSignal<ParserOptions>({
    ...DEFAULT_PARSER_OPTIONS,
    ...config.initialOptions,
  })
  const [result, setResult] = createSignal<CellParseResult | null>(null)
  const [status, setStatus] = createSignal<CellParserStatus>('idle')

  let timer: ReturnType<typeof setTimeout> | undefined
  let worker: Worker | undefined
  let requestId = 0

  const isParsing = createMemo(() => status() === 'debouncing' || status() === 'parsing')

  const setOptions = (patch: Partial<ParserOptions>) => {
    setOptionsSignal((current) => ({ ...current, ...patch }))
  }

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const terminateWorker = () => {
    if (worker) {
      worker.terminate()
      worker = undefined
    }
  }

  const cancel = () => {
    requestId += 1
    clearTimer()
    terminateWorker()
    setStatus(input().trim() ? 'settled' : 'idle')
  }

  const startParse = (rawInput: string, parserOptions: ParserOptions) => {
    const id = requestId + 1
    requestId = id
    clearTimer()
    terminateWorker()

    if (!rawInput.trim()) {
      setResult(null)
      setStatus('idle')
      return
    }

    setStatus('parsing')
    worker = new Worker(new URL('../../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (event: MessageEvent<ParseWorkerResponse>) => {
      if (event.data.id !== id || id !== requestId) {
        return
      }

      setResult(event.data.result)
      setStatus('settled')
      terminateWorker()
    }

    worker.onerror = (event) => {
      if (id !== requestId) {
        return
      }

      setResult({
        status: 'error',
        error: {
          message: event.message || 'Parser worker failed',
        },
        warnings: [],
      })
      setStatus('settled')
      terminateWorker()
    }

    worker.postMessage({ id, input: rawInput, options: parserOptions })
  }

  const scheduleParse = () => {
    const rawInput = input()
    const parserOptions = options()
    cancel()

    if (!rawInput.trim()) {
      setResult(null)
      setStatus('idle')
      return
    }

    setStatus('debouncing')
    timer = setTimeout(() => startParse(rawInput, parserOptions), debounceMs)
  }

  const parseNow = () => startParse(input(), options())

  createEffect(on([input, options], scheduleParse))
  onCleanup(cancel)

  return {
    input,
    setInput,
    options,
    setOptions,
    result,
    status,
    isParsing,
    parseNow,
    cancel,
  }
}
